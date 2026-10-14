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
  // drawing of each room: shapes JSON by id, sent to users joining the room
  const rooms = new Map();
  const userName = (name) => String(name ?? '').trim().slice(0, 40) || 'Anonymous';
  // names of users of a room, sent to them when someone joins, leaves or changes name
  const sendUsers = (room) => {
    const ids = [...(io.sockets.adapter.rooms.get(room) ?? [])];

    io.to(room).emit(socketEvents.USERS, ids.map((id) => io.sockets.sockets.get(id)?.data.name ?? 'Anonymous'));
  };
  const leaveRoom = (socket) => {
    const { room } = socket.data;

    if (!room) return;
    socket.leave(room);
    socket.data.room = undefined;
    // last user gone: drawing removed (users send theirs when they join again)
    if (!io.sockets.adapter.rooms.get(room)?.size) rooms.delete(room);
    else sendUsers(room);
  };

  io.on('connection', (socket) => {
    console.log(`A client has connected (id: ${socket.id})`);

    socket.on(socketEvents.JOIN, ({ room, name } = {}) => {
      if (typeof room !== 'string' || !/^[\w-]{1,64}$/.test(room)) return;

      leaveRoom(socket);
      socket.data.room = room;
      socket.data.name = userName(name);
      socket.join(room);
      if (!rooms.has(room)) rooms.set(room, new Map());

      const shapes = rooms.get(room);

      if (shapes.size) socket.emit(socketEvents.CHANGE, { upsert: [...shapes.values()], remove: [] });
      sendUsers(room);
    });

    socket.on(socketEvents.NAME, (name) => {
      socket.data.name = userName(name);
      if (socket.data.room) sendUsers(socket.data.room);
    });

    // { upsert: shapes JSON, remove: ids }
    socket.on(socketEvents.CHANGE, (change) => {
      const { room } = socket.data;

      if (!room) return;
      try {
        const shapes = rooms.get(room);

        change.remove.forEach((id) => shapes.delete(id));
        change.upsert.forEach((json) => shapes.set(JSON.parse(json).attrs.id, json));
      } catch (error) {
        console.warn(`Invalid change (id: ${socket.id}): ${error.message}`);
        return;
      }
      // to other users of the room, author already has it
      socket.to(room).emit(socketEvents.CHANGE, change);
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
