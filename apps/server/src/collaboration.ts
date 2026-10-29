import { createHash, createHmac } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { Kysely } from 'kysely';
import type { Server, Socket } from 'socket.io';
import { groupClasses, maxMessageSize, shapeClasses, socketEvents } from '@free-drawing/protocol';
import { type Auth, type User, getUser } from './auth';
import type { Database } from './db';

type SocketData = {
  /** Logged in user (session cookie of handshake) */
  account: User | null;
  /** Client of the connection for limits: address, or network of an IPv6 address (`clientOf`) */
  client: string;
  /** Key of the client kept by rooms (`clients` of a room): HMAC of `client`, not the address */
  clientKey: string;
  room?: string;
  name: string;
  userId: string;
  invitedBy?: string;
  /** Gave the secret of the room owner: gives rights, changes settings */
  owner?: boolean;
  /** Messages allowed now by event (token bucket, see `rates`) and time they were counted */
  buckets?: Record<string, { tokens: number; at: number }>;
  /**
   * Shapes added to the drawing of the room by live previews of this socket (being drawn): removed for everyone when it
   * leaves or loses the right to draw before their final change
   */
  live?: Set<string>;
};

type RoomData = {
  /** Drawing: shapes JSON by id (encrypted room: encrypted JSON), in stacking order */
  shapes: Map<string, string>;
  /** Image files of the drawing by id (data URLs, encrypted in an encrypted room), kept with it */
  files: Map<string, string>;
  /**
   * Ids of the image files used by each shape (null: unknown, encrypted shape of a previous version): files no shape
   * uses are released when the drawing would be too big
   */
  shapeFiles: Map<string, string[] | null>;
  /** Size of the drawing: length of its shapes JSON and of its image files */
  size: number;
  /**
   * Drawing sent by users since the room was created or dropped: an empty one was emptied by them (users joining again
   * remove its shapes), else users joining send theirs
   */
  kept: boolean;
  /** Background color of the drawing (encrypted in an encrypted room), none until a user sends it (dropped with the drawing) */
  background?: string;
  /**
   * Proof of the key of an encrypted room (SHA-256 of the key, given by the user creating it): users giving another one
   * are refused; none for a room in clear. The key itself never reaches the server (`#` of links)
   */
  keyCheck?: string;
  /** Users without right to draw */
  viewers: Set<string>;
  /** Names of users who came, for who invited who, seen least recently first */
  names: Map<string, string>;
  /** Hash of the secret given when the room was created (`hashKey`), its user is owner */
  ownerKey?: string;
  ownerId?: string;
  /** Ids of logged in users who came: never taken by anonymous users */
  accounts: Set<string>;
  /**
   * Hashes of the secrets of the browsers of anonymous users (`hashKey`), by id: an id is given to the browser giving the
   * same secret only, not to a user who saw it (users of the room, `by` of links). Empty for the id of a connection
   * (user whose id was refused): given to nobody else
   */
  userKeys: Map<string, string>;
  /**
   * Keys of the first two clients who joined the room (`clientKey`), the first one created it: rooms of one client are
   * forgotten first when the server keeps too many rooms. None for a room of a previous version (never forgotten for it)
   */
  clients?: string[];
  /** Users coming for the first time can draw (owner setting), else they view only */
  newUsersCanEdit: boolean;
  /** Area shown by the owner presenting the drawing (encrypted in an encrypted room), sent to users joining meanwhile, not saved */
  view: ViewArea | EncryptedData | null;
  /** Viewers who asked for the right to draw, waiting for the answer of the owner (sent to it when it joins), not saved */
  requests: Set<string>;
  /** Last use (ms): user joining or leaving, rights or settings changed */
  usedAt: number;
};

/** Area of the drawing shown by a presenting owner, in drawing coordinates (`slide`: a frame of its slideshow, seen alone) */
type ViewArea = { x: number; y: number; width: number; height: number; slide?: true };

/** Pointer position or view of an encrypted room, relayed as it is */
type EncryptedData = { data: string };

/** State of a room kept in database while it is empty and after a restart: everything but its drawing */
type SavedRoom = {
  ownerKey?: string;
  ownerId?: string;
  viewers: string[];
  names: [string, string][];
  accounts: string[];
  /** None in rooms saved by previous versions */
  userKeys?: [string, string][];
  /** None in rooms saved by previous versions */
  clients?: string[];
  newUsersCanEdit: boolean;
  keyCheck?: string;
};

type CollaborationSocket = Socket<any, any, any, SocketData>;

/** Node state of a shape in a change (konva `toObject`), not trusted */
type ShapeJson = { attrs?: { id?: unknown; fileId?: unknown } | null; className?: unknown; children?: unknown };

/** Change of drawing checked as a whole: only its checked fields, shapes JSON by id (encrypted room: encrypted JSON) */
type CheckedChange = {
  upsert: Map<string, string>;
  /** Ids of the image files used by each shape of `upsert` (null: unknown, encrypted shape of a previous version) */
  shapeFiles: Map<string, string[] | null>;
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
  /**
   * Different users a room remembers (names, rights): beyond, the one seen least recently with the right of new users is
   * forgotten (nothing changes for them), the room refuses new users only when every other one got another right
   */
  knownUsers: 1_000,
  /** Rooms created by a client per hour (users behind the same address share it) */
  newRooms: 50,
  /**
   * Rooms kept for the client that created them (`roomLifetime`): beyond, its empty room used least recently is
   * forgotten (a client never fills the server, also with the 256 networks of 64 bits of an IPv6 network of 56 bits)
   */
  roomsPerClient: 30,
  /**
   * Rooms kept by the server, with or without users: beyond, the empty room of one client used least recently is
   * forgotten (rooms of several clients are kept), new rooms are refused when there is none
   */
  rooms: 10_000,
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

/**
 * Fields of a message (not trusted): socket.io runs listeners in `process.nextTick`, an error reading one (null
 * message) would stop the server with every room
 * @param message Message of a client
 * @returns The message when it is an object, else an object without fields (null, text, number, array)
 */
const fieldsOf = (message: unknown): Record<string, unknown> =>
  typeof message === 'object' && message !== null && !Array.isArray(message)
    ? (message as Record<string, unknown>)
    : {};

/**
 * Name of a user given by its client
 * @param name Name of a message (not trusted)
 * @returns Text trimmed and cut to 40 characters, empty for anything else (an object would not convert to text)
 */
const userName = (name: unknown) => (typeof name === 'string' ? name.trim().slice(0, 40) : '');

const isId = (id: unknown): id is string => typeof id === 'string' && /^[\w-]{1,64}$/.test(id);

/** Secret of a room owner or of the browser of a user (hashed by `hashKey`, never kept) */
const isSecret = (key: unknown): key is string => typeof key === 'string' && key.length > 0 && key.length <= 200;

/**
 * Client of an address, for limits: an IPv4 address, or the network of 64 bits of an IPv6 address (a client gets many
 * addresses of it)
 * @param address Address of a client (Express `req.ip`)
 * @returns IPv4 address, or the 4 first groups of an IPv6 address
 */
export const clientOf = (address: string) => {
  const ip = address.replace(/%.*$/, '').toLowerCase();
  const ipv4 = ip.match(/^(?:::ffff:)?(\d+\.\d+\.\d+\.\d+)$/)?.[1];

  if (ipv4 || !ip.includes(':')) return ipv4 ?? ip;

  // `::` stands for groups of zeros
  const [head, tail] = ip.split('::').map((part) => (part ? part.split(':') : []));
  const groups = tail
    ? [...head, ...Array<string>(Math.max(0, 8 - head.length - tail.length)).fill('0'), ...tail]
    : head;

  return groups
    .slice(0, 4)
    .map((group) => Number.parseInt(group, 16).toString(16))
    .join(':');
};

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
 * Image files used by a shape (checked by `isShape`): images of groups and frames too
 * @param state Shape of a change
 * @returns Ids of the files of its images
 */
const fileIdsOf = (state: ShapeJson): string[] => [
  ...(isFileId(state.attrs?.fileId) ? [state.attrs.fileId] : []),
  ...(Array.isArray(state.children) ? (state.children as ShapeJson[]).flatMap(fileIdsOf) : []),
];

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
  const shapeFiles = new Map<string, string[] | null>();

  for (const json of upsert) {
    // encrypted room: `{ id, data, files }`, ids of files as sent in the room (none from previous versions)
    if (encrypted) {
      const { id, data, files } = fieldsOf(json);

      if (!isShapeId(id) || !isEncrypted(data, maxMessageSize)) return null;
      if (files !== undefined && (!Array.isArray(files) || files.length > 1000 || !files.every(isFileId))) return null;
      shapes.set(id, data);
      shapeFiles.set(id, (files as string[] | undefined) ?? null);
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
    shapeFiles.set(state.attrs.id, fileIdsOf(state));
  }

  return {
    upsert: shapes,
    shapeFiles,
    files: checkedFiles,
    // each id once: an id repeated would be counted again out of the size and shapes of the drawing (limits passed)
    remove: [...new Set(remove)],
    order: order && [...new Set(order as string[])],
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

  const { data } = fieldsOf(view);

  return isEncrypted(data, 1000) ? { data } : undefined;
};

/**
 * Area shown by a presenting owner, checked
 * @param view Message of the owner (not trusted): area, or null when the presentation stops
 * @returns Area with finite coordinates and a positive size, null, or undefined when invalid (ignored)
 */
const checkView = (view: unknown): ViewArea | null | undefined => {
  if (view === null) return null;

  const { x, y, width, height, slide } = fieldsOf(view);

  if (![x, y, width, height].every(Number.isFinite) || (width as number) <= 0 || (height as number) <= 0) return;

  return { x, y, width, height, ...(slide === true && { slide }) } as ViewArea;
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
  shapeFiles: new Map(),
  size: 0,
  kept: false,
  viewers: new Set(),
  names: new Map(),
  accounts: new Set(),
  userKeys: new Map(),
  clients: [],
  newUsersCanEdit: false,
  view: null,
  requests: new Set(),
  usedAt: Date.now(),
});

/**
 * Live collaboration rooms: drawing kept for users joining later, owner gives or removes the right to draw.
 * Logged in users are identified by their account (id given by client ignored), others by the id of their browser,
 * bound to the secret of their browser (`userKeys`), which can't be the one of an account or of the owner: owner is the
 * user who gives the secret of the room.
 * Owner, rights and settings of rooms are saved in database (not drawings): kept while a room is empty and after a
 * restart, so nobody takes an empty room over; rooms unused for `roomLifetime` are forgotten.
 * Messages are checked as a whole and limited (`rates`, `limits`): a change making a drawing too big or a join of a
 * full room is refused (`REJECTED` sent to the client), only checked fields are relayed.
 * Encrypted rooms (end to end, created with the proof of a key: `keyCheck`) are joined with the same proof only: their
 * shapes, image files, background, pointers and views are kept and relayed encrypted, never read (ids, sizes checked).
 * @param io Socket.io server
 * @param auth Accounts, to identify logged in users by their session cookie
 * @param db Database of the app, rooms of previous runs are read from it first
 * @param addressOf Address of the client of a connection (rooms created per client), of the connection by default
 * @returns `close`, to stop forgetting old rooms and wait for writes of rooms (before closing the database)
 */
export async function attachCollaboration(
  io: Server,
  auth: Auth,
  db: Kysely<Database>,
  addressOf: (request: IncomingMessage) => string = (request) => request.socket.remoteAddress ?? ''
) {
  const rooms = new Map<string, RoomData>();
  // size of the drawings of all rooms
  let totalSize = 0;
  // rooms created by each client this hour (`limits.newRooms`)
  const newRooms = new Map<string, number>();
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
      userKeys: [...data.userKeys],
      clients: data.clients,
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
        shapeFiles: new Map(),
        size: 0,
        kept: false,
        ownerKey: typeof saved.ownerKey === 'string' ? saved.ownerKey : undefined,
        ownerId: isId(saved.ownerId) ? saved.ownerId : undefined,
        viewers: new Set(saved.viewers),
        names: new Map(saved.names),
        accounts: new Set(saved.accounts),
        userKeys: new Map(saved.userKeys ?? []),
        clients: Array.isArray(saved.clients) ? saved.clients.slice(0, 2) : undefined,
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
  // clients create rooms again each hour
  const newRoomsTimer = setInterval(() => newRooms.clear(), 60 * 60 * 1000);

  // do not keep the process running
  forgetTimer.unref();
  newRoomsTimer.unref();

  // key of a client kept by rooms: HMAC of its address with the secret of the server, not the address
  const keyOf = (client: string) =>
    createHmac('sha256', auth.options.secret).update(client).digest('base64url').slice(0, 22);

  // id of an account: never given to an anonymous user, also in a room its account did not join yet (ids of users are
  // seen in rooms and links)
  const isAccount = async (id: string) =>
    !!(await db.selectFrom('user').select('id').where('id', '=', id).executeTakeFirst());

  // room forgotten: its id is free again (owner, rights and settings lost; nobody becomes owner without its secret)
  const forgetRoom = (room: string) => {
    rooms.delete(room);
    write(() => db.deleteFrom('room').where('id', '=', room).execute());
  };

  // place for a room created by a client (key): beyond `roomsPerClient` rooms it created, its empty room used least
  // recently is forgotten; on a server keeping `limits.rooms`, the empty room of one client used least recently (rooms
  // of several clients are not taken by a client creating many); false when there is none to forget
  const makeRoom = (key: string) => {
    const empty = [...rooms]
      .filter(([room]) => !io.sockets.adapter.rooms.get(room)?.size)
      .sort(([, a], [, b]) => a.usedAt - b.usedAt);
    const forgetFirst = (match: (data: RoomData) => boolean) => {
      const found = empty.find(([room, data]) => rooms.has(room) && match(data));

      if (found) forgetRoom(found[0]);
      return !!found;
    };
    const created = (data: RoomData) => data.clients?.[0] === key;

    if ([...rooms.values()].filter(created).length >= limits.roomsPerClient && !forgetFirst(created)) return false;

    return rooms.size < limits.rooms || forgetFirst((data) => !!data.clients && data.clients.length < 2);
  };

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

  // room remembering too many users: the one seen least recently whose right is the one of new users (forgetting it
  // changes nothing for them, its secret too), neither the owner nor connected, is forgotten; false when there is none
  const forgetUser = (room: string, data: RoomData) => {
    const connected = new Set(
      [...(io.sockets.adapter.rooms.get(room) ?? [])].map(
        (id) => (io.sockets.sockets.get(id) as CollaborationSocket | undefined)?.data.userId
      )
    );

    for (const id of data.names.keys()) {
      if (id === data.ownerId || connected.has(id) || data.viewers.has(id) === data.newUsersCanEdit) continue;
      data.names.delete(id);
      data.viewers.delete(id);
      data.userKeys.delete(id);
      return true;
    }

    return false;
  };

  // ids of the image files of a room no shape uses once a change is applied (removed, replaced), except the files of
  // the change: released if it is applied; none when the files of encrypted shapes of previous versions are unknown
  const unusedFiles = (data: RoomData, change: CheckedChange) => {
    const shapeFiles = new Map(data.shapeFiles);
    const used = new Set(change.files.keys());

    for (const id of change.remove) shapeFiles.delete(id);
    for (const [id, files] of change.shapeFiles) shapeFiles.set(id, files);
    for (const files of shapeFiles.values()) {
      if (!files) return [];
      for (const id of files) used.add(id);
    }

    return [...data.files.keys()].filter((id) => !used.has(id));
  };

  // previews of shapes being drawn by a socket (`live`) removed for everyone: it left the room or lost the right to
  // draw before their final change (a discarded preview would stay)
  const dropLive = (socket: CollaborationSocket, room: string) => {
    const data = rooms.get(room);
    const ids = [...(socket.data.live ?? [])].filter((id) => data?.shapes.has(id));

    socket.data.live = undefined;
    if (!data || !ids.length) return;

    for (const id of ids) {
      data.size -= data.shapes.get(id)!.length;
      totalSize -= data.shapes.get(id)!.length;
      data.shapes.delete(id);
      data.shapeFiles.delete(id);
    }
    io.to(room).emit(socketEvents.CHANGE, { upsert: [], remove: ids });
  };

  const leaveRoom = (socket: CollaborationSocket) => {
    const { room, owner, userId } = socket.data;

    if (!room) return;
    socket.leave(room);
    socket.data.room = undefined;
    // cursor removed, shapes it was drawing too
    io.to(room).emit(socketEvents.LEAVE, socket.id);
    dropLive(socket, room);

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
      data.shapeFiles = new Map();
      data.size = 0;
      data.kept = false;
      data.background = undefined;
      saveRoom(room, data);
    }
  };

  // client of the connection (limits), account of session cookie, anonymous without it (or if session can't be read)
  io.use(async (socket: CollaborationSocket, next) => {
    socket.data.client = clientOf(addressOf(socket.request));
    socket.data.clientKey = keyOf(socket.data.client);
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

    // last message still handled (join checking an id in the database): the next ones wait for it
    let handling: Promise<unknown> | undefined;

    // listener of a message (with the acknowledgement asked by the client), run in the order of messages (a request to
    // draw sent with a join: once joined). An error (message of an unexpected shape) is logged: socket.io runs listeners
    // in `process.nextTick`, where it would stop the server with every room
    const on = (event: string, listener: (message: unknown, ack: unknown) => unknown) =>
      socket.on(event, (message: unknown, ack: unknown) => {
        const warn = (error: unknown) =>
          console.warn(`Message ignored (${event}, id: ${socket.id}): ${(error as Error).message}`);
        const run = () => {
          try {
            const result = listener(message, ack);

            return result instanceof Promise ? result.catch(warn) : undefined;
          } catch (error) {
            warn(error);
          }
        };
        const done = handling ? handling.then(run) : run();

        if (!done) return;
        handling = done;
        void done.then(() => {
          if (handling === done) handling = undefined;
        });
      });

    on(socketEvents.JOIN, async (message) => {
      const { room, name, userId, userKey, ownerKey, invitedBy, keyCheck } = fieldsOf(message);

      if (!isId(room)) return;

      const { account, client, clientKey } = socket.data;
      const check = isKeyCheck(keyCheck) ? keyCheck : undefined;
      // id of an account given by an anonymous user
      const ofAccount = !account && isId(userId) && (await isAccount(userId));

      // disconnected meanwhile
      if (!socket.connected) return;
      leaveRoom(socket);
      if ((io.sockets.adapter.rooms.get(room)?.size ?? 0) >= limits.users) return refuseJoin();
      if (!rooms.has(room)) {
        const created = newRooms.get(client) ?? 0;

        if (created >= limits.newRooms || !makeRoom(clientKey)) return refuseJoin();
        newRooms.set(client, created + 1);
        // encrypted by the user creating it (key of its links)
        rooms.set(room, newRoom(check));
      }

      const data = rooms.get(room)!;

      // encrypted room: users without its key (link cut, changed) refused, also a key for a room in clear
      if (data.keyCheck !== check) {
        return socket.emit(socketEvents.REJECTED, { event: socketEvents.JOIN, reason: 'key' });
      }
      const key = isSecret(ownerKey) ? hashKey(ownerKey) : undefined;
      const browserKey = isSecret(userKey) ? hashKey(userKey) : undefined;

      // first secret given (room creation) makes its user owner, also when the room is empty later
      if (key) data.ownerKey ??= key;

      // also the account of the owner, logged in from another browser (secret kept by the first one)
      const owner = (!!key && data.ownerKey === key) || (!!account && account.id === data.ownerId);
      // id of browser, unless it is the one of an account, of the owner (secret not given) or of another browser (other
      // secret: users of previous versions give none; id of a connection: nobody)
      const free =
        isId(userId) &&
        !ofAccount &&
        !data.accounts.has(userId) &&
        (owner || userId !== data.ownerId) &&
        (!data.userKeys.has(userId) || data.userKeys.get(userId) === browserKey);
      const id = account?.id ?? (free ? userId : socket.id);
      const known = data.names.has(id);

      // a new user remembered by a full room
      if (!known && data.names.size >= limits.knownUsers && !forgetUser(room, data)) return refuseJoin();

      socket.data.room = room;
      socket.data.owner = owner;
      socket.data.name = userName(name) || account?.name || 'Anonymous';
      socket.data.userId = id;
      socket.data.invitedBy = isId(invitedBy) && invitedBy !== socket.data.userId ? invitedBy : undefined;
      socket.join(room);
      if (account) data.accounts.add(account.id);
      // id bound to the secret of this browser
      else if (id === userId && browserKey && !data.userKeys.has(id)) data.userKeys.set(id, browserKey);
      // id of this connection (seen in pointers and users of the room): given to nobody else
      else if (id === socket.id) data.userKeys.set(id, '');
      // first clients of the room
      if (data.clients && data.clients.length < 2 && !data.clients.includes(clientKey)) data.clients.push(clientKey);

      if (owner) {
        data.ownerId = socket.data.userId;
        data.viewers.delete(data.ownerId);
      } else if (!known && !data.newUsersCanEdit) {
        // first time in the room: view only when the owner chose so (new ids of viewers too)
        data.viewers.add(socket.data.userId);
      }
      // seen last
      data.names.delete(socket.data.userId);
      data.names.set(socket.data.userId, socket.data.name);
      saveRoom(room, data);
      // user recognizes itself in users of the room (owner, rights), settings of the room
      socket.emit(socketEvents.JOINED, { userId: socket.data.userId });
      socket.emit(socketEvents.ROOM, { newUsersCanEdit: data.newUsersCanEdit, encrypted: !!data.keyCheck });

      // whole drawing of the room, also empty: a user joining merges it with its drawing (`kept`: emptied by users, not
      // dropped)
      socket.emit(socketEvents.CHANGE, {
        upsert: toUpsert(data.shapes, !!data.keyCheck),
        remove: [],
        order: [...data.shapes.keys()],
        full: true,
        ...(data.kept && { kept: true }),
        ...(data.background && { background: data.background }),
        ...(data.files.size > 0 && { files: Object.fromEntries(data.files) }),
      });
      sendUsers(room);
      // presentation going on: view of the owner followed at once; none: a user joining again stops following one
      // stopped meanwhile
      socket.emit(socketEvents.VIEW, data.view);
      // owner: requests waiting for an answer
      if (owner) {
        for (const id of data.requests) socket.emit(socketEvents.REQUEST, { userId: id, name: data.names.get(id) });
      }
    });

    on(socketEvents.NAME, (name) => {
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
    on(socketEvents.RIGHTS, (message) => {
      const { userId, canEdit } = fieldsOf(message);
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
        // shapes it was drawing: their final change will be refused
        for (const id of socketsOf(room, (other) => other.userId === userId)) {
          const other = io.sockets.sockets.get(id) as CollaborationSocket | undefined;

          if (other) dropLive(other, room);
        }
      }
      saveRoom(room, data);
      sendUsers(room);
    });

    // viewer asks for the right to draw (told to the owner, also when it joins later), the owner answers it
    on(socketEvents.REQUEST, (message) => {
      const { userId, accepted } = fieldsOf(message);
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
    on(socketEvents.VIEW, (message) => {
      const { room } = socket.data;
      const data = room ? rooms.get(room) : undefined;
      const view = data?.keyCheck ? checkEncryptedView(message) : checkView(message);

      if (!room || !data || !socket.data.owner || view === undefined) return;

      data.view = view;
      socket.to(room).emit(socketEvents.VIEW, view);
    });

    // owner changes the settings of the room: right to draw of users coming for the first time
    on(socketEvents.ROOM, (message) => {
      const { newUsersCanEdit } = fieldsOf(message);
      const { room } = socket.data;
      const data = room ? rooms.get(room) : undefined;

      if (!room || !data || !socket.data.owner || typeof newUsersCanEdit !== 'boolean') return;

      data.newUsersCanEdit = newUsersCanEdit;
      saveRoom(room, data);
      io.to(room).emit(socketEvents.ROOM, { newUsersCanEdit, encrypted: !!data.keyCheck });
    });

    // { upsert: shapes JSON (encrypted room: { id, data }), remove: ids, order: ids from bottom to top when stacking
    // order changed, live }
    // change received (applied or refused): acknowledged, the client sends again the changes lost with a connection
    on(socketEvents.CHANGE, (message, ack) => {
      receiveChange(message);
      if (typeof ack === 'function') ack();
    });

    const receiveChange = (message: unknown) => {
      const { room } = socket.data;
      const data = room ? rooms.get(room) : undefined;

      if (!room || !data) return;

      const change = checkChange(message, !!data.keyCheck);

      if (!change) {
        console.warn(`Invalid change (id: ${socket.id})`);
        return;
      }

      // refused: its shapes told, the client sends them again later (once allowed to draw, smaller drawing)
      const refuse = (reason: string) => {
        if (change.live) return;
        socket.emit(socketEvents.REJECTED, {
          event: socketEvents.CHANGE,
          reason,
          upsert: [...change.upsert.keys()],
          remove: change.remove,
        });
      };

      // users without right to draw
      if (data.viewers.has(socket.data.userId)) return refuse('right');

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

      const tooBig = () =>
        size > data.size && (size > limits.drawingSize || totalSize + size - data.size > limits.totalSize);
      // image files no shape uses once changed (removed, replaced): released with the change
      const released = tooBig() ? unusedFiles(data, change) : [];

      for (const id of released) size -= data.files.get(id)!.length;
      // a bigger drawing over the limits refused (smaller changes still allowed), its files kept
      if ((count > limits.shapes && count > shapes.size) || tooBig()) return refuse('too-big');

      // previews of shapes new to the room, until their final change
      const live = (socket.data.live ??= new Set());

      for (const id of change.upsert.keys()) {
        if (!change.live) live.delete(id);
        else if (!shapes.has(id)) live.add(id);
      }
      for (const id of change.remove) live.delete(id);
      for (const id of released) data.files.delete(id);
      for (const id of change.remove) {
        shapes.delete(id);
        data.shapeFiles.delete(id);
      }
      for (const [id, json] of change.upsert) shapes.set(id, json);
      for (const [id, files] of change.shapeFiles) data.shapeFiles.set(id, files);
      for (const [id, file] of newFiles) data.files.set(id, file);
      totalSize += size - data.size;
      data.size = size;
      data.kept = true;
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
    };

    // pointer position in drawing (null out of drawer, laser while pressed), not kept; encrypted in an encrypted room
    on(socketEvents.POINTER, (pointer) => {
      const { room, name } = socket.data;
      const { x, y, laser, data } = fieldsOf(pointer);

      if (room && rooms.get(room)?.keyCheck) {
        if (isEncrypted(data, 1000)) socket.to(room).volatile.emit(socketEvents.POINTER, { id: socket.id, name, data });
        return;
      }

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
      clearInterval(newRoomsTimer);
      await writes;
    },
  };
}
