import { createHash } from 'node:crypto';
import type { Kysely } from 'kysely';
import type { Server, Socket } from 'socket.io';
import { socketEvents } from '@free-drawing/protocol';
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
};

type RoomData = {
  /** Drawing: shapes JSON by id, in stacking order */
  shapes: Map<string, string>;
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
  /** Last use (ms): user joining or leaving, rights or settings changed */
  usedAt: number;
};

/** State of a room kept in database while it is empty and after a restart: everything but its drawing */
type SavedRoom = {
  ownerKey?: string;
  ownerId?: string;
  viewers: string[];
  names: [string, string][];
  accounts: string[];
  newUsersCanEdit: boolean;
};

type CollaborationSocket = Socket<any, any, any, SocketData>;

/** Messages of clients, checked on reception */
type JoinMessage = { room?: unknown; name?: unknown; userId?: unknown; ownerKey?: unknown; invitedBy?: unknown };
type RightsMessage = { userId?: unknown; canEdit?: unknown };
type RoomMessage = { newUsersCanEdit?: unknown };
type ChangeMessage = { upsert: string[]; remove: string[]; order?: string[]; live?: boolean };

const userName = (name: unknown) =>
  String(name ?? '')
    .trim()
    .slice(0, 40);
const isId = (id: unknown): id is string => typeof id === 'string' && /^[\w-]{1,64}$/.test(id);

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
 * @returns Data of a new room: new users can draw
 */
const newRoom = (): RoomData => ({
  shapes: new Map(),
  viewers: new Set(),
  names: new Map(),
  accounts: new Set(),
  newUsersCanEdit: true,
  usedAt: Date.now(),
});

/**
 * Live collaboration rooms: drawing kept for users joining later, owner gives or removes the right to draw.
 * Logged in users are identified by their account (id given by client ignored), others by the id of their browser,
 * which can't be the one of an account or of the owner: owner is the user who gives the secret of the room.
 * Owner, rights and settings of rooms are saved in database (not drawings): kept while a room is empty and after a
 * restart, so nobody takes an empty room over; rooms unused for `roomLifetime` are forgotten.
 * @param io Socket.io server
 * @param auth Accounts, to identify logged in users by their session cookie
 * @param db Database of the app, rooms of previous runs are read from it first
 * @returns `close`, to stop forgetting old rooms and wait for writes of rooms (before closing the database)
 */
export async function attachCollaboration(io: Server, auth: Auth, db: Kysely<Database>) {
  const rooms = new Map<string, RoomData>();
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
        ownerKey: typeof saved.ownerKey === 'string' ? saved.ownerKey : undefined,
        ownerId: isId(saved.ownerId) ? saved.ownerId : undefined,
        viewers: new Set(saved.viewers),
        names: new Map(saved.names),
        accounts: new Set(saved.accounts),
        newUsersCanEdit: saved.newUsersCanEdit !== false,
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

  const leaveRoom = (socket: CollaborationSocket) => {
    const { room } = socket.data;

    if (!room) return;
    socket.leave(room);
    socket.data.room = undefined;
    // cursor removed
    io.to(room).emit(socketEvents.LEAVE, socket.id);
    if (io.sockets.adapter.rooms.get(room)?.size) {
      sendUsers(room);
      return;
    }

    const data = rooms.get(room);

    // last user gone: drawing removed (users send theirs when they join again), owner, rights and settings kept
    if (data) {
      data.shapes = new Map();
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
    socket.on(socketEvents.JOIN, ({ room, name, userId, ownerKey, invitedBy }: JoinMessage = {}) => {
      if (!isId(room)) return;

      const { account } = socket.data;

      leaveRoom(socket);
      if (!rooms.has(room)) rooms.set(room, newRoom());

      const data = rooms.get(room)!;
      const key = typeof ownerKey === 'string' && ownerKey ? hashKey(ownerKey) : undefined;

      // first secret given (room creation) makes its user owner, also when the room is empty later
      if (key) data.ownerKey ??= key;

      const owner = !!key && data.ownerKey === key;
      // id of browser, unless it is the one of an account or of the owner (secret not given)
      const free = isId(userId) && !data.accounts.has(userId) && (owner || userId !== data.ownerId);

      socket.data.room = room;
      socket.data.owner = owner;
      socket.data.name = userName(name) || account?.name || 'Anonymous';
      socket.data.userId = account?.id ?? (free ? userId : socket.id);
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
      socket.emit(socketEvents.ROOM, { newUsersCanEdit: data.newUsersCanEdit });

      if (data.shapes.size) {
        socket.emit(socketEvents.CHANGE, {
          upsert: [...data.shapes.values()],
          remove: [],
          order: [...data.shapes.keys()],
        });
      }
      sendUsers(room);
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

      if (!room || !data || !socket.data.owner || !isId(userId) || userId === data.ownerId) return;

      if (canEdit) data.viewers.delete(userId);
      else data.viewers.add(userId);
      saveRoom(room, data);
      sendUsers(room);
    });

    // owner changes the settings of the room: right to draw of users coming for the first time
    socket.on(socketEvents.ROOM, ({ newUsersCanEdit }: RoomMessage = {}) => {
      const { room } = socket.data;
      const data = room ? rooms.get(room) : undefined;

      if (!room || !data || !socket.data.owner || typeof newUsersCanEdit !== 'boolean') return;

      data.newUsersCanEdit = newUsersCanEdit;
      saveRoom(room, data);
      io.to(room).emit(socketEvents.ROOM, { newUsersCanEdit });
    });

    // { upsert: shapes JSON, remove: ids, order: ids from bottom to top when stacking order changed }
    socket.on(socketEvents.CHANGE, (change: ChangeMessage) => {
      const { room } = socket.data;
      const data = room ? rooms.get(room) : undefined;

      // users without right to draw: ignored
      if (!room || !data || data.viewers.has(socket.data.userId)) return;
      try {
        const { shapes } = data;

        for (const id of change.remove) shapes.delete(id);
        for (const json of change.upsert) shapes.set(JSON.parse(json).attrs.id, json);
        // drawing kept in stacking order (sent so to joining users), unknown shapes after
        if (Array.isArray(change.order)) {
          const ordered = new Map(change.order.filter((id) => shapes.has(id)).map((id) => [id, shapes.get(id)!]));

          for (const [id, json] of shapes) ordered.set(id, json);
          data.shapes = ordered;
        }
      } catch (error) {
        console.warn(`Invalid change (id: ${socket.id}): ${(error as Error).message}`);
        return;
      }
      // to other users of the room, author already has it (live preview: dropped rather than delayed)
      (change.live ? socket.to(room).volatile : socket.to(room)).emit(socketEvents.CHANGE, change);
    });

    // pointer position in drawing (null out of drawer), not kept
    socket.on(socketEvents.POINTER, (position: unknown) => {
      const { room, name } = socket.data;

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
