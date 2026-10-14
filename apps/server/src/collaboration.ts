import type { Server, Socket } from 'socket.io';
import { socketEvents } from '@free-drawing/protocol';
import { type Auth, type User, getUser } from './auth';

type SocketData = {
  /** Logged in user (session cookie of handshake) */
  account: User | null;
  room?: string;
  name: string;
  userId: string;
  invitedBy?: string;
};

type RoomData = {
  /** Drawing: shapes JSON by id, in stacking order */
  shapes: Map<string, string>;
  /** Users without right to draw */
  viewers: Set<string>;
  /** Names of users who came, for who invited who */
  names: Map<string, string>;
  /** Secret given when the room was created, its user is owner */
  ownerKey?: string;
  ownerId?: string;
};

type CollaborationSocket = Socket<any, any, any, SocketData>;

/** Messages of clients, checked on reception */
type JoinMessage = { room?: unknown; name?: unknown; userId?: unknown; ownerKey?: unknown; invitedBy?: unknown };
type RightsMessage = { userId?: unknown; canEdit?: unknown };
type ChangeMessage = { upsert: string[]; remove: string[]; order?: string[]; live?: boolean };

const userName = (name: unknown) =>
  String(name ?? '')
    .trim()
    .slice(0, 40);
const isId = (id: unknown): id is string => typeof id === 'string' && /^[\w-]{1,64}$/.test(id);

/**
 * Live collaboration rooms: drawing kept for users joining later, owner gives or removes the right to draw.
 * Logged in users are identified by their account (id given by client ignored), others by the id of their browser.
 */
export function attachCollaboration(io: Server, auth: Auth) {
  const rooms = new Map<string, RoomData>();

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
    // last user gone: drawing removed (users send theirs when they join again)
    if (!io.sockets.adapter.rooms.get(room)?.size) rooms.delete(room);
    else sendUsers(room);
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
      socket.data.room = room;
      socket.data.name = userName(name) || account?.name || 'Anonymous';
      socket.data.userId = account?.id ?? (isId(userId) ? userId : socket.id);
      socket.data.invitedBy = isId(invitedBy) && invitedBy !== socket.data.userId ? invitedBy : undefined;
      socket.join(room);
      if (!rooms.has(room)) rooms.set(room, { shapes: new Map(), viewers: new Set(), names: new Map() });

      const data = rooms.get(room)!;

      data.names.set(socket.data.userId, socket.data.name);
      // user recognizes itself in users of the room (owner, rights)
      socket.emit(socketEvents.JOINED, { userId: socket.data.userId });

      // first secret given (room creation) makes its user owner
      if (typeof ownerKey === 'string' && ownerKey) {
        data.ownerKey ??= ownerKey;
        if (data.ownerKey === ownerKey) {
          data.ownerId = socket.data.userId;
          data.viewers.delete(data.ownerId);
        }
      }

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
      if (socket.data.room) {
        rooms.get(socket.data.room)?.names.set(socket.data.userId, socket.data.name);
        sendUsers(socket.data.room);
      }
    });

    // owner gives or removes the right to draw
    socket.on(socketEvents.RIGHTS, ({ userId, canEdit }: RightsMessage = {}) => {
      const { room } = socket.data;
      const data = room ? rooms.get(room) : undefined;

      if (!room || !data || socket.data.userId !== data.ownerId || !isId(userId) || userId === data.ownerId) return;

      if (canEdit) data.viewers.delete(userId);
      else data.viewers.add(userId);
      sendUsers(room);
    });

    // { upsert: shapes JSON, remove: ids, order: ids from bottom to top when stacking order changed }
    socket.on(socketEvents.CHANGE, (change: ChangeMessage) => {
      const { room } = socket.data;
      const data = room ? rooms.get(room) : undefined;

      // users without right to draw: ignored
      if (!room || !data || data.viewers.has(socket.data.userId)) return;
      try {
        const { shapes } = data;

        change.remove.forEach((id) => shapes.delete(id));
        change.upsert.forEach((json) => shapes.set(JSON.parse(json).attrs.id, json));
        // drawing kept in stacking order (sent so to joining users), unknown shapes after
        if (Array.isArray(change.order)) {
          const ordered = new Map(change.order.filter((id) => shapes.has(id)).map((id) => [id, shapes.get(id)!]));

          shapes.forEach((json, id) => ordered.set(id, json));
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
}
