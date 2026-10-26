import { createHash } from 'node:crypto';
import type { Kysely } from 'kysely';
import type { Server, Socket } from 'socket.io';
import { groupClasses, maxMessageSize, shapeClasses, socketEvents } from '@free-drawing/protocol';
import { type Auth, type User, getUser } from './auth';
import type { Database } from './db';

type SocketData = {
  /** Logged in user (session cookie of handshake) */
  account: User | null;
  room?: string;
  name: string;
  userId: string;
  invitedBy?: string;
  /** Gave the secret of the room owner: gives rights, changes settings */
  owner?: boolean;
  /** Messages allowed now by event (token bucket, see `rates`) and time they were counted */
  buckets?: Record<string, { tokens: number; at: number }>;
  /** Rooms created by this connection (`limits.newRooms`) */
  newRooms?: number;
};

type RoomData = {
  /** Drawing: shapes JSON by id (encrypted room: encrypted JSON), in stacking order */
  shapes: Map<string, string>;
  /** Image files of the drawing by id (data URLs, encrypted in an encrypted room), kept with it */
  files: Map<string, string>;
  /** Size of the drawing: length of its shapes JSON and of its image files */
  size: number;
  /** Background color of the drawing (encrypted in an encrypted room), none until a user sends it (dropped with the drawing) */
  background?: string;
  /**
   * Proof of the key of an encrypted room (SHA-256 of the key, given by the user creating it): users giving another one
   * are refused; none for a room in clear. The key itself never reaches the server (`#` of links)
   */
  keyCheck?: string;
  /** Users without right to draw */
  viewers: Set<string>;
  /** Names of users who came, for who invited who */
  names: Map<string, string>;
  /** Hash of the secret given when the room was created (`hashKey`), its user is owner */
  ownerKey?: string;
  ownerId?: string;
  /** Ids of logged in users who came: never taken by anonymous users */
  accounts: Set<string>;
  /** Users coming for the first time can draw (owner setting), else they view only */
  newUsersCanEdit: boolean;
  /** Area shown by the owner presenting the drawing (encrypted in an encrypted room), sent to users joining meanwhile, not saved */
  view: ViewArea | EncryptedData | null;
  /** Viewers who asked for the right to draw, waiting for the answer of the owner (sent to it when it joins), not saved */
  requests: Set<string>;
  /** Last use (ms): user joining or leaving, rights or settings changed */
  usedAt: number;
};

/** Area of the drawing shown by a presenting owner, in drawing coordinates */
type ViewArea = { x: number; y: number; width: number; height: number };

/** Pointer position or view of an encrypted room, relayed as it is */
type EncryptedData = { data: string };

/** State of a room kept in database while it is empty and after a restart: everything but its drawing */
type SavedRoom = {
  ownerKey?: string;
  ownerId?: string;
  viewers: string[];
  names: [string, string][];
  accounts: string[];
  newUsersCanEdit: boolean;
  keyCheck?: string;
};

type CollaborationSocket = Socket<any, any, any, SocketData>;

/** Messages of clients, checked on reception */
type JoinMessage = {
  room?: unknown;
  name?: unknown;
  userId?: unknown;
  ownerKey?: unknown;
  invitedBy?: unknown;
  keyCheck?: unknown;
};
type RightsMessage = { userId?: unknown; canEdit?: unknown };
type RoomMessage = { newUsersCanEdit?: unknown };
type PointerMessage = { x?: unknown; y?: unknown; laser?: unknown; data?: unknown } | null;
type RequestMessage = { userId?: unknown; accepted?: unknown };

/** Node state of a shape in a change (konva `toObject`), not trusted */
type ShapeJson = { attrs?: { id?: unknown } | null; className?: unknown; children?: unknown };

/** Change of drawing checked as a whole: only its checked fields, shapes JSON by id (encrypted room: encrypted JSON) */
type CheckedChange = {
  upsert: Map<string, string>;
  /** Image files sent with the shapes using them */
  files: Map<string, string>;
  remove: string[];
  order?: string[];
  live: boolean;
  background?: string;
};

/** Limits of rooms, protecting the memory of the server and other users from a client (tests lower them) */
export const limits = {
  /** Shapes of the drawing of a room */
  shapes: 10_000,
  /** Size of the drawing of a room: length of its shapes JSON and image files (as drawing files, 20 MB) */
  drawingSize: 20_000_000,
  /** Size of the drawings of all rooms */
  totalSize: 500_000_000,
  /** Users connected to a room at once */
  users: 50,
  /** Different users a room remembers (names, rights) */
  knownUsers: 1_000,
  /** Rooms created by a connection */
  newRooms: 10,
};

/** Messages a client may send by event: per second and at once (burst), more are ignored (unknown events too) */
const rates: Record<string, [perSecond: number, burst: number]> = {
  [socketEvents.JOIN]: [1, 5],
  [socketEvents.NAME]: [2, 10],
  [socketEvents.RIGHTS]: [10, 20],
  [socketEvents.ROOM]: [2, 10],
  // live previews every 50 ms, final changes, undo repeated
  [socketEvents.CHANGE]: [40, 100],
  [socketEvents.POINTER]: [30, 60],
  // view of a presenting owner every 50 ms at most
  [socketEvents.VIEW]: [30, 60],
  [socketEvents.REQUEST]: [1, 5],
};

const userName = (name: unknown) =>
  String(name ?? '')
    .trim()
    .slice(0, 40);
const isId = (id: unknown): id is string => typeof id === 'string' && /^[\w-]{1,64}$/.test(id);
// ids of shapes: also of files made by other apps
const isShapeId = (id: unknown): id is string => typeof id === 'string' && id.length > 0 && id.length <= 200;

/** Id of an image file */
const isFileId = (id: unknown): id is string => typeof id === 'string' && /^[\w-]{1,64}$/.test(id);

/**
 * Encrypted data of an encrypted room (base64url of `RoomCipher.encrypt` of the library), not read
 * @param data Data of a message (not trusted)
 * @param max Length at most
 * @returns true for base64url text of this length at most
 */
const isEncrypted = (data: unknown, max: number): data is string =>
  typeof data === 'string' && data.length > 0 && data.length <= max && /^[\w-]+$/.test(data);

/** Proof of the key of an encrypted room: SHA-256 in base64url */
const isKeyCheck = (check: unknown): check is string => typeof check === 'string' && /^[\w-]{43}$/.test(check);

/** Data URL of an image file: PNG, JPEG, WebP or GIF, 8 MB at most (as `isImageData` of the library) */
const isImageData = (data: unknown): data is string =>
  typeof data === 'string' &&
  data.length <= 8_000_000 &&
  /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/.test(data);

/**
 * Drawing shape, or group of them (nested up to 50 levels), as the library creates them from files
 * @param state Parsed JSON of a shape (not trusted)
 * @param depth Level of the shape in groups
 * @returns true for a drawing shape class, or a group class whose children are drawing shapes
 */
const isShape = (state: ShapeJson, depth = 0): boolean => {
  if (typeof state?.attrs !== 'object' || state.attrs === null || typeof state.className !== 'string') return false;
  if (!groupClasses.includes(state.className)) {
    return shapeClasses.includes(state.className) && state.children === undefined;
  }

  return (
    depth < 50 &&
    (state.children === undefined ||
      (Array.isArray(state.children) && state.children.every((child: ShapeJson) => isShape(child, depth + 1))))
  );
};

/**
 * Change of a client checked as a whole before it is applied: ids, and JSON of drawing shapes with an id; in an
 * encrypted room, ids and encrypted data (shapes, files, background are not read)
 * @param change Message of the client (not trusted)
 * @param encrypted Change of an encrypted room
 * @returns Checked change, null when anything is invalid (nothing applied nor relayed)
 */
const checkChange = (change: unknown, encrypted: boolean): CheckedChange | null => {
  if (typeof change !== 'object' || change === null) return null;

  const { upsert, remove, order, live, background, files } = change as Record<string, unknown>;

  if (!Array.isArray(upsert) || !Array.isArray(remove) || !remove.every(isShapeId)) return null;
  if (order !== undefined && (!Array.isArray(order) || !order.every(isShapeId))) return null;
  // color of the background, as in drawing files
  if (
    background !== undefined &&
    (encrypted
      ? !isEncrypted(background, 1000)
      : typeof background !== 'string' || !background || background.length > 100)
  ) {
    return null;
  }

  // image files by id
  if (files !== undefined && (typeof files !== 'object' || files === null || Array.isArray(files))) return null;

  const checkedFiles = new Map<string, string>();

  for (const [id, data] of Object.entries(files ?? {})) {
    if (!isFileId(id) || !(encrypted ? isEncrypted(data, 12_000_000) : isImageData(data))) return null;
    checkedFiles.set(id, data);
  }

  const shapes = new Map<string, string>();

  for (const json of upsert) {
    // encrypted room: `{ id, data }`
    if (encrypted) {
      const { id, data } = (typeof json === 'object' && json !== null ? json : {}) as Record<string, unknown>;

      if (!isShapeId(id) || !isEncrypted(data, maxMessageSize)) return null;
      shapes.set(id, data);
      continue;
    }

    let state: ShapeJson;

    try {
      state = typeof json === 'string' ? JSON.parse(json) : null;
    } catch {
      return null;
    }
    if (!isShape(state) || !isShapeId(state.attrs?.id)) return null;
    shapes.set(state.attrs.id, json);
  }

  return {
    upsert: shapes,
    files: checkedFiles,
    remove,
    order: order as string[] | undefined,
    live: live === true,
    background: background as string | undefined,
  };
};

/**
 * Shapes of a change or of a drawing as sent to clients: JSON, or `{ id, data }` in an encrypted room
 * @param shapes Shapes JSON (encrypted room: encrypted JSON) by id
 * @param encrypted Shapes of an encrypted room
 * @returns `upsert` of a change
 */
const toUpsert = (shapes: Map<string, string>, encrypted: boolean) =>
  encrypted ? [...shapes].map(([id, data]) => ({ id, data })) : [...shapes.values()];

/**
 * View of an owner presenting it in an encrypted room, checked
 * @param view Message of the owner (not trusted): encrypted area, or null when the presentation stops
 * @returns Encrypted area, null, or undefined when invalid (ignored)
 */
const checkEncryptedView = (view: unknown): EncryptedData | null | undefined => {
  if (view === null) return null;

  const { data } = (typeof view === 'object' ? view : {}) as Record<string, unknown>;

  return isEncrypted(data, 1000) ? { data } : undefined;
};

/**
 * Area shown by a presenting owner, checked
 * @param view Message of the owner (not trusted): area, or null when the presentation stops
 * @returns Area with finite coordinates and a positive size, null, or undefined when invalid (ignored)
 */
const checkView = (view: unknown): ViewArea | null | undefined => {
  if (view === null) return null;

  const { x, y, width, height } = (typeof view === 'object' ? view : {}) as Record<string, unknown>;

  if (![x, y, width, height].every(Number.isFinite) || (width as number) <= 0 || (height as number) <= 0) return;

  return { x, y, width, height } as ViewArea;
};

/**
 * Rate of messages of a client, by event (token bucket of `rates`)
 * @param socket Socket of the client
 * @param event Event of the message
 * @returns true when the message is handled, false when the client sends too many (or an unknown event)
 */
const allow = (socket: CollaborationSocket, event: string) => {
  const rate = rates[event];

  if (!rate) return false;

  const [perSecond, burst] = rate;
  const now = Date.now();
  const buckets = socket.data.buckets ?? {};
  const bucket = buckets[event] ?? { tokens: burst, at: now };

  socket.data.buckets = buckets;
  buckets[event] = bucket;

  bucket.tokens = Math.min(burst, bucket.tokens + ((now - bucket.at) / 1000) * perSecond);
  bucket.at = now;
  if (bucket.tokens < 1) return false;
  bucket.tokens -= 1;

  return true;
};

/** Rooms unused for this time (ms) are forgotten: their id is free again */
export const roomLifetime = 30 * 24 * 60 * 60 * 1000;

/**
 * Hash of the secret of a room owner: the secret itself is never kept
 * @param key Secret given by the user who created the room
 * @returns SHA-256 of the secret, in base64url
 */
const hashKey = (key: string) => createHash('sha256').update(key).digest('base64url');

/**
 * Room without users nor drawing yet
 * @param keyCheck Proof of the key of an encrypted room, none for a room in clear
 * @returns Data of a new room: new users view only, the owner gives them the right to draw
 */
const newRoom = (keyCheck?: string): RoomData => ({
  keyCheck,
  shapes: new Map(),
  files: new Map(),
  size: 0,
  viewers: new Set(),
  names: new Map(),
  accounts: new Set(),
  newUsersCanEdit: false,
  view: null,
  requests: new Set(),
  usedAt: Date.now(),
});

/**
 * Live collaboration rooms: drawing kept for users joining later, owner gives or removes the right to draw.
 * Logged in users are identified by their account (id given by client ignored), others by the id of their browser,
 * which can't be the one of an account or of the owner: owner is the user who gives the secret of the room.
 * Owner, rights and settings of rooms are saved in database (not drawings): kept while a room is empty and after a
 * restart, so nobody takes an empty room over; rooms unused for `roomLifetime` are forgotten.
 * Messages are checked as a whole and limited (`rates`, `limits`): a change making a drawing too big or a join of a
 * full room is refused (`REJECTED` sent to the client), only checked fields are relayed.
 * Encrypted rooms (end to end, created with the proof of a key: `keyCheck`) are joined with the same proof only: their
 * shapes, image files, background, pointers and views are kept and relayed encrypted, never read (ids, sizes checked).
 * @param io Socket.io server
 * @param auth Accounts, to identify logged in users by their session cookie
 * @param db Database of the app, rooms of previous runs are read from it first
 * @returns `close`, to stop forgetting old rooms and wait for writes of rooms (before closing the database)
 */
export async function attachCollaboration(io: Server, auth: Auth, db: Kysely<Database>) {
  const rooms = new Map<string, RoomData>();
  // size of the drawings of all rooms
  let totalSize = 0;
  // writes of rooms one after the other (database closed after them)
  let writes = Promise.resolve();

  const write = (query: () => Promise<unknown>) => {
    writes = writes.then(query).then(
      () => undefined,
      (error) => console.warn(`Rooms not saved: ${(error as Error).message}`)
    );
  };

  // owner, rights and settings of a room saved, room used now
  const saveRoom = (room: string, data: RoomData) => {
    const saved: SavedRoom = {
      ownerKey: data.ownerKey,
      ownerId: data.ownerId,
      viewers: [...data.viewers],
      names: [...data.names],
      accounts: [...data.accounts],
      newUsersCanEdit: data.newUsersCanEdit,
      keyCheck: data.keyCheck,
    };
    const content = JSON.stringify(saved);

    data.usedAt = Date.now();
    const updatedAt = new Date(data.usedAt).toISOString();

    write(() =>
      db
        .insertInto('room')
        .values({ id: room, content, updatedAt })
        .onConflict((oc) => oc.column('id').doUpdateSet({ content, updatedAt }))
        .execute()
    );
  };

  // rooms unused for too long forgotten (not the ones with users)
  const forgetOldRooms = () => {
    const before = Date.now() - roomLifetime;

    for (const [room, data] of rooms) {
      if (data.usedAt < before && !io.sockets.adapter.rooms.get(room)?.size) rooms.delete(room);
    }
    write(() => db.deleteFrom('room').where('updatedAt', '<', new Date(before).toISOString()).execute());
  };

  // rooms of previous runs, without drawing (users send theirs when they join again)
  for (const { id, content, updatedAt } of await db.selectFrom('room').selectAll().execute()) {
    try {
      const saved = JSON.parse(content) as SavedRoom;

      rooms.set(id, {
        shapes: new Map(),
        files: new Map(),
        size: 0,
        ownerKey: typeof saved.ownerKey === 'string' ? saved.ownerKey : undefined,
        ownerId: isId(saved.ownerId) ? saved.ownerId : undefined,
        viewers: new Set(saved.viewers),
        names: new Map(saved.names),
        accounts: new Set(saved.accounts),
        newUsersCanEdit: saved.newUsersCanEdit !== false,
        keyCheck: isKeyCheck(saved.keyCheck) ? saved.keyCheck : undefined,
        view: null,
        requests: new Set(),
        usedAt: Date.parse(updatedAt),
      });
    } catch {
      console.warn(`Invalid saved room: ${id}`);
    }
  }
  forgetOldRooms();
  const forgetTimer = setInterval(forgetOldRooms, 24 * 60 * 60 * 1000);

  // does not keep the process running
  forgetTimer.unref();

  // users of a room with their rights, sent to them when someone joins, leaves, changes name or rights
  const sendUsers = (room: string) => {
    const data = rooms.get(room);
    const users = [...(io.sockets.adapter.rooms.get(room) ?? [])]
      .map((id) => (io.sockets.sockets.get(id) as CollaborationSocket | undefined)?.data)
      .filter((data): data is SocketData => !!data)
      .map(({ userId, name, invitedBy }) => ({
        id: userId,
        name,
        owner: !!userId && userId === data?.ownerId,
        canEdit: !data?.viewers.has(userId),
        // user who shared the link (name as now)
        invitedBy: invitedBy && (data?.names.get(invitedBy) ?? 'unknown user'),
      }));

    io.to(room).emit(socketEvents.USERS, users);
  };

  // ids of the sockets of a room whose data match (owner, a user)
  const socketsOf = (room: string, match: (data: SocketData) => boolean) =>
    [...(io.sockets.adapter.rooms.get(room) ?? [])].filter((id) => {
      const data = (io.sockets.sockets.get(id) as CollaborationSocket | undefined)?.data;

      return !!data && match(data);
    });

  // message to some sockets (none: nobody, `io.to([])` would send it to every socket of the server)
  const emitTo = (ids: string[], event: string, message: unknown) => {
    if (ids.length) io.to(ids).emit(event, message);
  };

  const leaveRoom = (socket: CollaborationSocket) => {
    const { room, owner, userId } = socket.data;

    if (!room) return;
    socket.leave(room);
    socket.data.room = undefined;
    // cursor removed
    io.to(room).emit(socketEvents.LEAVE, socket.id);

    const data = rooms.get(room);

    if (data) {
      // owner gone (no other connection of theirs): presentation stopped for everyone
      if (owner && data.view && !socketsOf(room, (other) => !!other.owner).length) {
        data.view = null;
        io.to(room).emit(socketEvents.VIEW, null);
      }
      // user gone: their request forgotten
      if (!socketsOf(room, (other) => other.userId === userId).length) data.requests.delete(userId);
    }
    if (io.sockets.adapter.rooms.get(room)?.size) {
      sendUsers(room);
      return;
    }

    // last user gone: drawing removed (users send theirs when they join again), owner, rights and settings kept
    if (data) {
      totalSize -= data.size;
      data.shapes = new Map();
      data.files = new Map();
      data.size = 0;
      data.background = undefined;
      saveRoom(room, data);
    }
  };

  // account of session cookie, anonymous without it (or if session can't be read)
  io.use(async (socket: CollaborationSocket, next) => {
    try {
      socket.data.account = await getUser(auth, socket.request.headers);
    } catch {
      socket.data.account = null;
    }
    next();
  });

  io.on('connection', (socket: CollaborationSocket) => {
    // messages of a client limited by event, more are ignored
    socket.use(([event], next) => {
      if (allow(socket, event)) next();
    });

    // join refused: room full, too many rooms created
    const refuseJoin = () => socket.emit(socketEvents.REJECTED, { event: socketEvents.JOIN, reason: 'full' });

    socket.on(socketEvents.JOIN, ({ room, name, userId, ownerKey, invitedBy, keyCheck }: JoinMessage = {}) => {
      if (!isId(room)) return;

      const { account } = socket.data;
      const check = isKeyCheck(keyCheck) ? keyCheck : undefined;

      leaveRoom(socket);
      if ((io.sockets.adapter.rooms.get(room)?.size ?? 0) >= limits.users) return refuseJoin();
      if (!rooms.has(room)) {
        if ((socket.data.newRooms ?? 0) >= limits.newRooms) return refuseJoin();
        socket.data.newRooms = (socket.data.newRooms ?? 0) + 1;
        // encrypted by the user creating it (key of its links)
        rooms.set(room, newRoom(check));
      }

      const data = rooms.get(room)!;

      // encrypted room: users without its key (link cut, changed) refused, also a key for a room in clear
      if (data.keyCheck !== check) {
        return socket.emit(socketEvents.REJECTED, { event: socketEvents.JOIN, reason: 'key' });
      }
      const key = typeof ownerKey === 'string' && ownerKey ? hashKey(ownerKey) : undefined;

      // first secret given (room creation) makes its user owner, also when the room is empty later
      if (key) data.ownerKey ??= key;

      const owner = !!key && data.ownerKey === key;
      // id of browser, unless it is the one of an account or of the owner (secret not given)
      const free = isId(userId) && !data.accounts.has(userId) && (owner || userId !== data.ownerId);
      const id = account?.id ?? (free ? userId : socket.id);

      // a new user remembered by a full room
      if (!data.names.has(id) && data.names.size >= limits.knownUsers) return refuseJoin();

      socket.data.room = room;
      socket.data.owner = owner;
      socket.data.name = userName(name) || account?.name || 'Anonymous';
      socket.data.userId = id;
      socket.data.invitedBy = isId(invitedBy) && invitedBy !== socket.data.userId ? invitedBy : undefined;
      socket.join(room);
      if (account) data.accounts.add(account.id);

      if (owner) {
        data.ownerId = socket.data.userId;
        data.viewers.delete(data.ownerId);
      } else if (!data.names.has(socket.data.userId) && !data.newUsersCanEdit) {
        // first time in the room: view only when the owner chose so (new ids of viewers too)
        data.viewers.add(socket.data.userId);
      }
      data.names.set(socket.data.userId, socket.data.name);
      saveRoom(room, data);
      // user recognizes itself in users of the room (owner, rights), settings of the room
      socket.emit(socketEvents.JOINED, { userId: socket.data.userId });
      socket.emit(socketEvents.ROOM, { newUsersCanEdit: data.newUsersCanEdit, encrypted: !!data.keyCheck });

      // whole drawing of the room, also empty: a user joining again merges it with its changes made meanwhile
      socket.emit(socketEvents.CHANGE, {
        upsert: toUpsert(data.shapes, !!data.keyCheck),
        remove: [],
        order: [...data.shapes.keys()],
        full: true,
        ...(data.background && { background: data.background }),
        ...(data.files.size > 0 && { files: Object.fromEntries(data.files) }),
      });
      sendUsers(room);
      // presentation going on: view of the owner followed at once
      if (data.view) socket.emit(socketEvents.VIEW, data.view);
      // owner: requests waiting for an answer
      if (owner) {
        for (const id of data.requests) socket.emit(socketEvents.REQUEST, { userId: id, name: data.names.get(id) });
      }
    });

    socket.on(socketEvents.NAME, (name: unknown) => {
      socket.data.name = userName(name) || socket.data.account?.name || 'Anonymous';
      const { room } = socket.data;
      const data = room ? rooms.get(room) : undefined;

      if (room && data) {
        data.names.set(socket.data.userId, socket.data.name);
        saveRoom(room, data);
        sendUsers(room);
      }
    });

    // owner gives or removes the right to draw
    socket.on(socketEvents.RIGHTS, ({ userId, canEdit }: RightsMessage = {}) => {
      const { room } = socket.data;
      const data = room ? rooms.get(room) : undefined;

      // users who came only (bounded)
      if (!room || !data || !socket.data.owner || !isId(userId) || userId === data.ownerId) return;
      if (!data.names.has(userId)) return;

      if (canEdit) {
        data.viewers.delete(userId);
        // request answered by the right
        data.requests.delete(userId);
      } else {
        data.viewers.add(userId);
      }
      saveRoom(room, data);
      sendUsers(room);
    });

    // viewer asks for the right to draw (told to the owner, also when it joins later), the owner answers it
    socket.on(socketEvents.REQUEST, ({ userId, accepted }: RequestMessage = {}) => {
      const { room } = socket.data;
      const data = room ? rooms.get(room) : undefined;

      if (!room || !data) return;
      if (!socket.data.owner) {
        const id = socket.data.userId;

        // viewers only, once until answered
        if (!data.viewers.has(id) || data.requests.has(id)) return;
        data.requests.add(id);
        emitTo(
          socketsOf(room, (other) => !!other.owner),
          socketEvents.REQUEST,
          { userId: id, name: socket.data.name }
        );
        return;
      }
      if (!isId(userId) || !data.requests.delete(userId)) return;
      if (accepted === true) {
        data.viewers.delete(userId);
        saveRoom(room, data);
        sendUsers(room);
      } else {
        emitTo(
          socketsOf(room, (other) => other.userId === userId),
          socketEvents.REQUEST,
          { accepted: false }
        );
      }
    });

    // owner presenting: area of the drawing it shows (null: presentation stopped), followed by the other users
    socket.on(socketEvents.VIEW, (message: unknown) => {
      const { room } = socket.data;
      const data = room ? rooms.get(room) : undefined;
      const view = data?.keyCheck ? checkEncryptedView(message) : checkView(message);

      if (!room || !data || !socket.data.owner || view === undefined) return;

      data.view = view;
      socket.to(room).emit(socketEvents.VIEW, view);
    });

    // owner changes the settings of the room: right to draw of users coming for the first time
    socket.on(socketEvents.ROOM, ({ newUsersCanEdit }: RoomMessage = {}) => {
      const { room } = socket.data;
      const data = room ? rooms.get(room) : undefined;

      if (!room || !data || !socket.data.owner || typeof newUsersCanEdit !== 'boolean') return;

      data.newUsersCanEdit = newUsersCanEdit;
      saveRoom(room, data);
      io.to(room).emit(socketEvents.ROOM, { newUsersCanEdit, encrypted: !!data.keyCheck });
    });

    // { upsert: shapes JSON (encrypted room: { id, data }), remove: ids, order: ids from bottom to top when stacking
    // order changed, live }
    socket.on(socketEvents.CHANGE, (message: unknown) => {
      const { room } = socket.data;
      const data = room ? rooms.get(room) : undefined;

      // users without right to draw: ignored
      if (!room || !data || data.viewers.has(socket.data.userId)) return;

      const change = checkChange(message, !!data.keyCheck);

      if (!change) {
        console.warn(`Invalid change (id: ${socket.id})`);
        return;
      }

      // drawing once changed: removed shapes (not upserted again), then added or updated ones
      const { shapes } = data;
      const removed = change.remove.filter((id) => shapes.has(id) && !change.upsert.has(id));
      let size = data.size - removed.reduce((sum, id) => sum + shapes.get(id)!.length, 0);
      let count = shapes.size - removed.length;

      for (const [id, json] of change.upsert) {
        const old = shapes.get(id);

        size += json.length - (old?.length ?? 0);
        if (old === undefined) count++;
      }
      // files the room does not have yet
      const newFiles = [...change.files].filter(([id]) => !data.files.has(id));

      for (const [, file] of newFiles) size += file.length;
      // a bigger drawing over the limits refused (smaller changes still allowed)
      if (
        (count > limits.shapes && count > shapes.size) ||
        (size > data.size && (size > limits.drawingSize || totalSize + size - data.size > limits.totalSize))
      ) {
        if (!change.live) socket.emit(socketEvents.REJECTED, { event: socketEvents.CHANGE, reason: 'too-big' });
        return;
      }

      for (const id of change.remove) shapes.delete(id);
      for (const [id, json] of change.upsert) shapes.set(id, json);
      for (const [id, file] of newFiles) data.files.set(id, file);
      totalSize += size - data.size;
      data.size = size;
      if (change.background && !change.live) data.background = change.background;
      // drawing kept in stacking order (sent so to joining users), unknown shapes after
      if (change.order) {
        const ordered = new Map(change.order.filter((id) => shapes.has(id)).map((id) => [id, shapes.get(id)!]));

        for (const [id, json] of shapes) ordered.set(id, json);
        data.shapes = ordered;
      }

      // checked fields only, to other users of the room: author already has it (live preview: dropped rather than
      // delayed)
      const relayed = {
        upsert: toUpsert(change.upsert, !!data.keyCheck),
        remove: change.remove,
        ...(change.order && { order: change.order }),
        ...(change.live && { live: true }),
        ...(change.background && !change.live && { background: change.background }),
        ...(change.files.size > 0 && { files: Object.fromEntries(change.files) }),
      };

      (change.live ? socket.to(room).volatile : socket.to(room)).emit(socketEvents.CHANGE, relayed);
    });

    // pointer position in drawing (null out of drawer, laser while pressed), not kept; encrypted in an encrypted room
    socket.on(socketEvents.POINTER, (pointer: PointerMessage) => {
      const { room, name } = socket.data;

      if (room && rooms.get(room)?.keyCheck) {
        if (isEncrypted(pointer?.data, 1000)) {
          socket.to(room).volatile.emit(socketEvents.POINTER, { id: socket.id, name, data: pointer.data });
        }
        return;
      }

      const { x, y, laser } = pointer ?? {};
      const position =
        Number.isFinite(x) && Number.isFinite(y)
          ? { x: x as number, y: y as number, ...(laser === true && { laser }) }
          : null;

      if (room) socket.to(room).volatile.emit(socketEvents.POINTER, { id: socket.id, name, position });
    });

    socket.on('disconnect', () => leaveRoom(socket));
  });

  return {
    /** Stop forgetting old rooms, wait for writes of rooms (before closing the database) */
    async close() {
      clearInterval(forgetTimer);
      await writes;
    },
  };
}
