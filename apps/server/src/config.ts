import { fileURLToPath } from 'node:url';

/**
 * Server settings, from environment variables (see `getConfig`)
 */
export type ServerConfig = {
  port: number;
  /** Development: web app served by vite middleware, default secret allowed */
  dev: boolean;
  /** Web app served (apps/web): vite middleware in development, its build in production */
  web: boolean;
  /** SQLite database file, `:memory:` for tests */
  databasePath: string;
  /** Public URL of the server: auth cookies and callbacks */
  baseURL: string;
  /** Secret signing sessions, at least 32 characters */
  secret: string;
  /** Other origins of apps calling the API and collaboration server (CORS with cookies) */
  trustedOrigins: string[];
  /**
   * Proxies in front of the server whose `X-Forwarded-For` gives the address of clients (Express `trust proxy`: number
   * of proxies, `true`, addresses or subnets), none by default: address of the connection
   */
  trustProxy?: boolean | number | string;
};

const devSecret = 'free-drawing development secret, never use it in production';

/**
 * Express `trust proxy` setting of `TRUST_PROXY`
 * @param value Number of proxies, `true`, or addresses and subnets (comma separated), empty without proxy
 * @returns Setting of Express, false without proxy
 */
function parseTrustProxy(value = ''): boolean | number | string {
  const setting = value.trim();

  if (!setting || setting === 'false') return false;
  if (setting === 'true') return true;

  return /^\d+$/.test(setting) ? Number(setting) : setting;
}

/**
 * Settings of environment: PORT (3000), NODE_ENV, DATABASE_PATH (data/free-drawing.db),
 * BASE_URL (http://localhost:<port>, required in production), BETTER_AUTH_SECRET (required in production),
 * TRUSTED_ORIGINS (comma separated),
 * TRUST_PROXY (proxies giving the address of clients, see `parseTrustProxy`)
 */
export function getConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const dev = env.NODE_ENV !== 'production';
  const port = Number(env.PORT) || 3000;
  const secret = env.BETTER_AUTH_SECRET ?? (dev ? devSecret : '');

  if (secret.length < 32) throw new Error('BETTER_AUTH_SECRET of 32 characters at least is required in production');
  // public URL: origin of the web app (checked origins of sockets and auth), Secure cookies with https
  if (!dev && !env.BASE_URL) throw new Error('BASE_URL (public URL of the server) is required in production');

  return {
    port,
    dev,
    web: true,
    databasePath: env.DATABASE_PATH ?? fileURLToPath(new URL('../data/free-drawing.db', import.meta.url)),
    baseURL: env.BASE_URL ?? `http://localhost:${port}`,
    secret,
    trustedOrigins: (env.TRUSTED_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    trustProxy: parseTrustProxy(env.TRUST_PROXY),
  };
}
