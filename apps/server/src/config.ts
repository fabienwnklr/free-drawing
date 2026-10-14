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
};

const devSecret = 'free-drawing development secret, never use it in production';

/**
 * Settings of environment: PORT (3000), NODE_ENV, DATABASE_PATH (data/free-drawing.db),
 * BASE_URL (http://localhost:<port>), BETTER_AUTH_SECRET (required in production), TRUSTED_ORIGINS (comma separated)
 */
export function getConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const dev = env.NODE_ENV !== 'production';
  const port = Number(env.PORT) || 3000;
  const secret = env.BETTER_AUTH_SECRET ?? (dev ? devSecret : '');

  if (secret.length < 32) throw new Error('BETTER_AUTH_SECRET of 32 characters at least is required in production');

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
  };
}
