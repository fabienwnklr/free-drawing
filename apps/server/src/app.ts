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

// web app (apps/web): its vite config in development, its build in production
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
 * Web app (apps/web) with metas of this server: accounts and drawings API, live collaboration.
 * Vite middleware in development (hot reload), its build in production.
 */
async function serveWeb(app: Express, httpServer: HttpServer, dev: boolean) {
  const vite = dev
    ? await (
        await import('vite')
      ).createServer({
        root: webRoot,
        // hot reload through this server: no other port (several servers can run)
        server: { middlewareMode: true, hmr: { server: httpServer } },
      })
    : null;
  const page = webRoot + (dev ? 'index.html' : 'dist/index.html');

  app.get(['/', '/index.html'], async (req, res, next) => {
    try {
      const html = (await readFile(page, 'utf-8')).replace(
        '</head>',
        '  <meta name="api-server" content="same-origin" />\n' +
          '  <meta name="collaboration-server" content="same-origin" />\n  </head>'
      );

      res.type('html').send(vite ? await vite.transformIndexHtml(req.originalUrl, html) : html);
    } catch (error) {
      next(error);
    }
  });
  app.use(vite ? vite.middlewares : express.static(webRoot + 'dist', { index: false }));
}

/**
 * HTTP server: accounts (`/api/auth`), API of logged in users (`/api`), live collaboration (socket.io), web app.
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

  if (config.web) await serveWeb(app, httpServer, config.dev);

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
