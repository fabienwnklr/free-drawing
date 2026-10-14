import { type Server as HttpServer, createServer as createHttpServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import express, { type Express, type RequestHandler } from 'express';
import { Server } from 'socket.io';
import { toNodeHandler } from 'better-auth/node';
import type { ServerConfig } from './config';
import { createDatabase, migrateApp } from './db';
import { createAuth } from './auth';
import { createApi } from './api';
import { attachCollaboration } from './collaboration';

// demo app (apps/web): its vite config in development, its build in production
const webRoot = fileURLToPath(new URL('../../web/', import.meta.url));

/**
 * Apps of other origins (`trustedOrigins`) call the API with their cookies
 */
function cors(origins: string[]): RequestHandler {
  return (req, res, next) => {
    const { origin } = req.headers;

    if (origin && origins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Vary', 'Origin');
      if (req.method === 'OPTIONS') return res.status(204).end();
    }
    next();
  };
}

/**
 * Demo page with collaboration server meta (live collaboration enabled): vite middleware in development, build in production
 */
async function serveDemo(app: Express, httpServer: HttpServer, dev: boolean) {
  if (!dev) {
    app.use(express.static(webRoot + 'dist'));
    return;
  }

  const { createServer: createViteServer } = await import('vite');
  // hot reload through this server: no other port (several servers can run)
  const vite = await createViteServer({ root: webRoot, server: { middlewareMode: true, hmr: { server: httpServer } } });

  app.get(['/', '/index.html'], async (req, res, next) => {
    try {
      const html = (await readFile(webRoot + 'index.html', 'utf-8')).replace(
        '</head>',
        '  <meta name="collaboration-server" content="same-origin" />\n  </head>'
      );

      res.type('html').send(await vite.transformIndexHtml(req.originalUrl, html));
    } catch (error) {
      next(error);
    }
  });
  app.use(vite.middlewares);
}

/**
 * HTTP server: accounts (`/api/auth`), API of logged in users (`/api`), live collaboration (socket.io), demo page.
 * Database tables are created or updated first.
 */
export async function createServer(config: ServerConfig) {
  const db = createDatabase(config.databasePath);
  const auth = await createAuth(config, db);

  // app tables reference users
  await migrateApp(db);

  const app = express();

  app.disable('x-powered-by');
  app.use('/api', cors(config.trustedOrigins));
  // before body parsers: Better Auth reads the body itself
  app.all('/api/auth/*', toNodeHandler(auth));
  app.use('/api', createApi(auth, db));

  const httpServer = createHttpServer(app);

  if (config.demo) await serveDemo(app, httpServer, config.dev);

  const io = new Server(httpServer, { cors: { origin: config.trustedOrigins, credentials: true } });

  attachCollaboration(io, auth);

  return {
    app,
    httpServer,
    io,
    auth,
    db,
    /** Stop server and close database */
    async close() {
      io.close();
      await db.destroy();
    },
  };
}
