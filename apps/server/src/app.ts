import { type IncomingMessage, type Server as HttpServer, createServer as createHttpServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import express, { type Express, type Request, type RequestHandler } from 'express';
import { Server } from 'socket.io';
import { maxMessageSize } from '@free-drawing/protocol';
import { toNodeHandler } from 'better-auth/node';
import type { ServerConfig } from './config';
import { createDatabase, migrateApp } from './db';
import { clientIpHeader, createAuth } from './auth';
import { createApi, onError, userHeader } from './api';
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
      res.setHeader('Access-Control-Allow-Headers', `Content-Type, ${userHeader}`);
      res.setHeader('Vary', 'Origin');
      if (req.method === 'OPTIONS') return res.status(204).end();
    }
    next();
  };
}

/** Size of the body of a request to accounts at most (names, emails, passwords) */
const authBodyLimit = '16kb';

/**
 * Body of a request to accounts read within `authBodyLimit` (413 beyond, also for a body sent without its length) and
 * given to Better Auth as text: Better Auth reads a whole body, whatever its size. Empty bodies are left unread (no
 * body for Better Auth)
 */
const authBody = express.text({ type: (req) => req.headers['content-length'] !== '0', limit: authBodyLimit });

/**
 * Address of the client given to Better Auth in `clientIpHeader` (rate limits, sessions), replacing any value sent by
 * the client
 */
const clientIp: RequestHandler = (req, _res, next) => {
  if (req.ip) req.headers[clientIpHeader] = req.ip;
  else delete req.headers[clientIpHeader];
  next();
};

/** Files of the server vite never serves, besides its defaults (environment, keys, git...): databases */
const serverFiles = ['**/*.db', '**/*.db-*', '**/apps/server/data/**'];

/**
 * Vite server of development: web app with hot reload through this server (no other port: several servers can run),
 * files of the repository served (`/@fs/`) but secrets and databases (sessions, hashes of passwords)
 * @param httpServer HTTP server of the app (hot reload)
 * @returns Vite server in middleware mode
 */
async function createViteServer(httpServer: HttpServer) {
  const { createServer, resolveConfig } = await import('vite');
  // a list given replaces the defaults of vite: kept
  const { server } = await resolveConfig({ root: webRoot, configFile: false }, 'serve');

  return createServer({
    root: webRoot,
    server: { middlewareMode: true, hmr: { server: httpServer }, fs: { deny: [...server.fs.deny, ...serverFiles] } },
  });
}

/**
 * Web app (apps/web) with metas of this server: accounts and drawings API, live collaboration.
 * Vite middleware in development (hot reload), its build in production.
 * @returns Vite server of development (closed with the server), null in production
 */
async function serveWeb(app: Express, httpServer: HttpServer, dev: boolean) {
  const vite = dev ? await createViteServer(httpServer) : null;
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
  app.use(vite ? vite.middlewares : express.static(`${webRoot}dist`, { index: false }));

  return vite;
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
  // errors of production without their stack (Express reads NODE_ENV, development without it)
  app.set('env', config.dev ? 'development' : 'production');
  // address of clients (req.ip): of the connection, or given by trusted proxies
  app.set('trust proxy', config.trustProxy ?? false);
  app.use('/api', cors(config.trustedOrigins));
  // before the body parser of the API: Better Auth reads the body itself (limited by `authBody`), with the address of
  // the client in its header
  app.all('/api/auth/*', clientIp, authBody, toNodeHandler(auth), onError);
  app.use('/api', createApi(auth, db));

  const httpServer = createHttpServer(app);

  const vite = config.web ? await serveWeb(app, httpServer, config.dev) : null;

  const origins = [new URL(config.baseURL).origin, ...config.trustedOrigins];
  const io = new Server(httpServer, {
    cors: { origin: config.trustedOrigins, credentials: true },
    // pages of other origins (cookies of the same site sent with WebSocket, no CORS) can't use the session of the user;
    // clients without origin are not browsers: no cookie of a user
    allowRequest: (req, callback) => callback(null, !req.headers.origin || origins.includes(req.headers.origin)),
    // a change can hold a whole drawing (shapes JSON escaped in the message): bigger ones not sent by the library
    maxHttpBufferSize: maxMessageSize,
  });

  // address of the client of a socket as `req.ip` of Express: of the connection, or given by trusted proxies
  const addressOf = (request: IncomingMessage) =>
    (Object.create(app.request, { headers: { value: request.headers }, socket: { value: request.socket } }) as Request)
      .ip ?? '';
  // rooms of previous runs read before connections
  const collaboration = await attachCollaboration(io, auth, db, addressOf);

  return {
    app,
    httpServer,
    io,
    auth,
    db,
    /** Stop server and close database (after writes of rooms) */
    async close() {
      io.close();
      await vite?.close();
      await collaboration.close();
      await db.destroy();
    },
  };
}
