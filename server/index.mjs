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

  io.on('connection', (socket) => {
    console.log(`A client has connected (id: ${socket.id})`);

    if (!(socket.id in connectedClients)) {
      connectedClients[socket.id] = {};
    }

    socket.on(socketEvents.DRAW, (data) => {
      // Emit to all connected clients (including the one who originally sent it)
      io.sockets.emit(socketEvents.DRAW, data);
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
