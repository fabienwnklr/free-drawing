import type { IncomingHttpHeaders } from 'node:http';
import type { Kysely } from 'kysely';
import { type BetterAuthOptions, betterAuth } from 'better-auth';
import { APIError, createAuthMiddleware, getSessionFromCtx } from 'better-auth/api';
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
 * Deletion and change of email of an account always need its password, e.g. from a session left open or a stolen
 * cookie: Better Auth deletes an account without password while the session is fresh (signed in less than a day ago),
 * and changes its email at once (no email sent), which would give the account to the new email (password reset)
 */
const passwordChecks = createAuthMiddleware(async (ctx) => {
  if (ctx.path !== '/delete-user' && ctx.path !== '/change-email') return;

  const { password } = (ctx.body ?? {}) as { password?: unknown };
  // Better Auth answers without session
  const session = await getSessionFromCtx(ctx);

  if (!session) return;
  if (typeof password !== 'string' || !password) {
    throw new APIError('BAD_REQUEST', { code: 'PASSWORD_REQUIRED', message: 'Password required' });
  }
  // checked by Better Auth for a deletion
  if (ctx.path !== '/change-email') return;

  const account = await ctx.context.internalAdapter.findCredentialAccount(session.user.id);
  const valid =
    password.length <= ctx.context.password.config.maxPasswordLength &&
    !!account?.password &&
    (await ctx.context.password.verify({ hash: account.password, password }));

  if (!valid) {
    ctx.context.logger.warn('Invalid password');
    throw new APIError('BAD_REQUEST', { code: 'INVALID_PASSWORD', message: 'Invalid password' });
  }
});

/**
 * Rate limit of the routes checking the password of a logged in user, as the ones of sign in and change of password in
 * Better Auth (else 100 requests per 10 s): a stolen session cookie does not give the password, nor the deletion of the
 * account with its drawings
 */
const passwordRule = { window: 10, max: 3 };

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
      // no email sent (no verification): the new email is used at once (with the password: `passwordChecks`), unless
      // an account uses it
      changeEmail: { enabled: true, updateEmailWithoutVerification: true },
      // with password (`passwordChecks`), drawings and preferences removed with the user (foreign keys)
      deleteUser: { enabled: true },
    },
    hooks: { before: passwordChecks },
    // per address (`clientIpHeader`), in production
    rateLimit: {
      enabled: !config.dev,
      customRules: { '/delete-user': passwordRule, '/verify-password': passwordRule },
    },
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

/**
 * User of a request of the API and the cookies to send back: Better Auth extends a session once a day (`updateAge`),
 * its cookie with it (else browsers drop it 7 days after the sign in)
 * @param auth Better Auth of the server
 * @param headers Headers of the request (session cookie)
 * @returns User, null when not logged in, and the `Set-Cookie` values of the response
 */
export async function getRequestUser(auth: Auth, headers: IncomingHttpHeaders) {
  const { headers: responseHeaders, response: session } = await auth.api.getSession({
    headers: fromNodeHeaders(headers),
    returnHeaders: true,
  });
  const user: User | null = session
    ? { id: session.user.id, name: session.user.name, email: session.user.email }
    : null;

  return { user, cookies: responseHeaders.getSetCookie() };
}
