import { env } from 'process';
import { createServer as createHttpServer } from 'http';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Server } from 'socket.io';
import { socketEvents } from './socket-events.js';

async function server() {
  const productionRootPath = 'dist';
  const isProductionMode = env.NODE_ENV === 'production';
  // An object to store connected clients and their data
  const connectedClients = {};

  const app = express();
  if (!isProductionMode) {
    console.log('> Development Mode');
    const vite = await createViteServer({
      server: { middlewareMode: true, open: true },
    });
    app.use(vite.middlewares);
  } else {
    console.log('> Production Mode');
    app.use(express.static(productionRootPath));
  }

  const httpServer = createHttpServer(app);
  const io = new Server(httpServer);
  // shared drawing: shapes JSON by id, sent to clients when they connect
  const shapes = new Map();

  io.on('connection', (socket) => {
    console.log(`A client has connected (id: ${socket.id})`);

    if (!(socket.id in connectedClients)) {
      connectedClients[socket.id] = {};
    }

    if (shapes.size) socket.emit(socketEvents.CHANGE, { upsert: [...shapes.values()], remove: [] });

    // { upsert: shapes JSON, remove: ids }
    socket.on(socketEvents.CHANGE, (change) => {
      try {
        change.remove.forEach((id) => shapes.delete(id));
        change.upsert.forEach((json) => shapes.set(JSON.parse(json).attrs.id, json));
      } catch (error) {
        console.warn(`Invalid change (id: ${socket.id}): ${error.message}`);
        return;
      }
      // to other clients, author already has it
      socket.broadcast.emit(socketEvents.CHANGE, change);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected (id: ${socket.id})`);
      delete connectedClients[socket.id];
    });
  });

  httpServer.listen(3000);
  console.log('> Local: http://localhost:3000/');
}

server();
