import type { IncomingHttpHeaders } from 'node:http';
import type { Kysely } from 'kysely';
import { type BetterAuthOptions, betterAuth } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { fromNodeHeaders } from 'better-auth/node';
import { getMigrations } from 'better-auth/db/migration';
import type { ServerConfig } from './config';
import type { Database } from './db';

/**
 * Header giving the address of the client to Better Auth (rate limits of sign in, sessions): set by the server from
 * the connection or its trusted proxies (`trustProxy`), never the one sent by the client
 */
export const clientIpHeader = 'x-free-drawing-client-ip';

/**
 * Deletion of an account always needs its password: Better Auth deletes it without password while the session is
 * fresh (signed in less than a day ago), e.g. from a session left open or a stolen cookie
 */
const passwordToDelete = createAuthMiddleware(async (ctx) => {
  const { password } = (ctx.body ?? {}) as { password?: unknown };

  if (ctx.path === '/delete-user' && (typeof password !== 'string' || !password)) {
    throw new APIError('BAD_REQUEST', { code: 'PASSWORD_REQUIRED', message: 'Password required' });
  }
});

/**
 * Options of Better Auth: database of the app, accounts with email and password
 * @param config Settings of the server (base URL, secret, trusted origins)
 * @param db Database of the app
 * @returns Options for `betterAuth` and its migrations
 */
function getOptions(config: ServerConfig, db: Kysely<Database>) {
  return {
    database: { db, type: 'sqlite' },
    baseURL: config.baseURL,
    basePath: '/api/auth',
    secret: config.secret,
    trustedOrigins: config.trustedOrigins,
    emailAndPassword: { enabled: true, minPasswordLength: 8 },
    user: {
      // no email sent (no verification): the new email is used at once, unless an account uses it
      changeEmail: { enabled: true, updateEmailWithoutVerification: true },
      // with password (`passwordToDelete`), drawings and preferences removed with the user (foreign keys)
      deleteUser: { enabled: true },
    },
    hooks: { before: passwordToDelete },
    // not X-Forwarded-For: sent by any client, a new rate limit for each value
    advanced: { ipAddress: { ipAddressHeaders: [clientIpHeader] } },
  } satisfies BetterAuthOptions;
}

/**
 * Accounts and sessions (cookie) with Better Auth: sign up and sign in with email and password, account changes,
 * routes under `/api/auth` (`/sign-up/email`, `/sign-in/email`, `/sign-out`, `/get-session`, `/update-user`,
 * `/change-email`, `/change-password`, `/delete-user`...).
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
