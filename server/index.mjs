import { env } from 'process';
import { readFile } from 'fs/promises';
import { createServer as createHttpServer } from 'http';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Server } from 'socket.io';
import { socketEvents } from './socket-events.js';

async function server() {
  const productionRootPath = 'dist';
  const isProductionMode = env.NODE_ENV === 'production';
  const app = express();
  if (!isProductionMode) {
    console.log('> Development Mode');
    const vite = await createViteServer({
      server: { middlewareMode: true, open: true },
    });

    // demo page: collaboration server is there (live collaboration enabled)
    app.get(['/', '/index.html'], async (req, res, next) => {
      try {
        const html = (await readFile('index.html', 'utf-8')).replace(
          '</head>',
          '  <meta name="collaboration-server" content="same-origin" />\n  </head>'
        );

        res.type('html').send(await vite.transformIndexHtml(req.originalUrl, html));
      } catch (error) {
        next(error);
      }
    });
    app.use(vite.middlewares);
  } else {
    console.log('> Production Mode');
    app.use(express.static(productionRootPath));
  }

  const httpServer = createHttpServer(app);
  const io = new Server(httpServer);
  // rooms: drawing (shapes JSON by id, sent to users joining the room), owner (user with the secret given when the
  // room was created) and users without right to draw (ids)
  const rooms = new Map();
  const userName = (name) => String(name ?? '').trim().slice(0, 40) || 'Anonymous';
  const isId = (id) => typeof id === 'string' && /^[\w-]{1,64}$/.test(id);
  // users of a room with their rights, sent to them when someone joins, leaves, changes name or rights
  const sendUsers = (room) => {
    const data = rooms.get(room);
    const users = [...(io.sockets.adapter.rooms.get(room) ?? [])]
      .map((id) => io.sockets.sockets.get(id)?.data)
      .filter(Boolean)
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
  const leaveRoom = (socket) => {
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

  io.on('connection', (socket) => {
    console.log(`A client has connected (id: ${socket.id})`);

    socket.on(socketEvents.JOIN, ({ room, name, userId, ownerKey, invitedBy } = {}) => {
      if (!isId(room)) return;

      leaveRoom(socket);
      socket.data.room = room;
      socket.data.name = userName(name);
      socket.data.userId = isId(userId) ? userId : socket.id;
      socket.data.invitedBy = isId(invitedBy) && invitedBy !== socket.data.userId ? invitedBy : undefined;
      socket.join(room);
      if (!rooms.has(room)) rooms.set(room, { shapes: new Map(), viewers: new Set(), names: new Map() });

      const data = rooms.get(room);
      const { shapes } = data;

      // names of users who came, for who invited who
      data.names.set(socket.data.userId, socket.data.name);

      // first secret given (room creation) makes its user owner
      if (typeof ownerKey === 'string' && ownerKey) {
        data.ownerKey ??= ownerKey;
        if (data.ownerKey === ownerKey) {
          data.ownerId = socket.data.userId;
          data.viewers.delete(data.ownerId);
        }
      }

      if (shapes.size) socket.emit(socketEvents.CHANGE, { upsert: [...shapes.values()], remove: [] });
      sendUsers(room);
    });

    socket.on(socketEvents.NAME, (name) => {
      socket.data.name = userName(name);
      if (socket.data.room) {
        rooms.get(socket.data.room).names.set(socket.data.userId, socket.data.name);
        sendUsers(socket.data.room);
      }
    });

    // owner gives or removes the right to draw
    socket.on(socketEvents.RIGHTS, ({ userId, canEdit } = {}) => {
      const { room } = socket.data;
      const data = rooms.get(room);

      if (!data || socket.data.userId !== data.ownerId || !isId(userId) || userId === data.ownerId) return;

      if (canEdit) data.viewers.delete(userId);
      else data.viewers.add(userId);
      sendUsers(room);
    });

    // { upsert: shapes JSON, remove: ids }
    socket.on(socketEvents.CHANGE, (change) => {
      const { room } = socket.data;

      // users without right to draw: ignored
      if (!room || rooms.get(room).viewers.has(socket.data.userId)) return;
      try {
        const { shapes } = rooms.get(room);

        change.remove.forEach((id) => shapes.delete(id));
        change.upsert.forEach((json) => shapes.set(JSON.parse(json).attrs.id, json));
      } catch (error) {
        console.warn(`Invalid change (id: ${socket.id}): ${error.message}`);
        return;
      }
      // to other users of the room, author already has it (live preview: dropped rather than delayed)
      (change.live ? socket.to(room).volatile : socket.to(room)).emit(socketEvents.CHANGE, change);
    });

    // pointer position in drawing (null out of drawer), not kept
    socket.on(socketEvents.POINTER, (position) => {
      const { room, name } = socket.data;

      if (room) socket.to(room).volatile.emit(socketEvents.POINTER, { id: socket.id, name, position });
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected (id: ${socket.id})`);
      leaveRoom(socket);
    });
  });

  httpServer.listen(3000);
  console.log('> Local: http://localhost:3000/');
}

server();
