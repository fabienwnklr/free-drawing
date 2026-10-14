import type { IncomingHttpHeaders } from 'node:http';
import type { Kysely } from 'kysely';
import { type BetterAuthOptions, betterAuth } from 'better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import { getMigrations } from 'better-auth/db/migration';
import type { ServerConfig } from './config';
import type { Database } from './db';

function getOptions(config: ServerConfig, db: Kysely<Database>) {
  return {
    database: { db, type: 'sqlite' },
    baseURL: config.baseURL,
    basePath: '/api/auth',
    secret: config.secret,
    trustedOrigins: config.trustedOrigins,
    emailAndPassword: { enabled: true, minPasswordLength: 8 },
  } satisfies BetterAuthOptions;
}

/**
 * Accounts and sessions (cookie) with Better Auth: sign up and sign in with email and password,
 * routes under `/api/auth` (`/sign-up/email`, `/sign-in/email`, `/sign-out`, `/get-session`...).
 * Its tables are created or updated first (it checks them when created).
 */
export async function createAuth(config: ServerConfig, db: Kysely<Database>) {
  const options = getOptions(config, db);
  const { runMigrations } = await getMigrations(options);

  await runMigrations();
  return betterAuth(options);
}

export type Auth = Awaited<ReturnType<typeof createAuth>>;

/**
 * User of a request or socket (session cookie), null when not logged in
 */
export async function getUser(auth: Auth, headers: IncomingHttpHeaders) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(headers) });

  return session ? { id: session.user.id, name: session.user.name, email: session.user.email } : null;
}

export type User = NonNullable<Awaited<ReturnType<typeof getUser>>>;
