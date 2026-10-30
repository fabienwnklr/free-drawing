import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Kysely } from 'kysely';
import { io as connect, type Socket } from 'socket.io-client';
import type { AddressInfo } from 'node:net';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { dirname, join as joinPath } from 'node:path';
import { socketEvents } from '@free-drawing/protocol';
import { createServer } from '../src/app';
import { type ServerConfig, getConfig } from '../src/config';
import { drawingsLimits } from '../src/api';
import { clientOf, limits, roomLifetime } from '../src/collaboration';

/** Folder of these tests */
const testsDir = dirname(fileURLToPath(import.meta.url));

const config: ServerConfig = {
  port: 0,
  dev: true,
  web: false,
  databasePath: ':memory:',
  baseURL: 'http://localhost:3000',
  secret: 'secret of tests, thirty two characters at least',
  trustedOrigins: ['http://app.example'],
};
const password = 'correct horse battery staple';
const drawing = {
  type: 'free-drawing',
  version: 1,
  background: '#fff',
  shapes: [{ className: 'Rect', attrs: { id: 'r1' } }],
};

let server: Awaited<ReturnType<typeof createServer>>;
let count = 0;

beforeAll(async () => {
  server = await createServer(config);
});

afterAll(() => server.close());

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * New user, logged in: agent keeping their session cookie
 */
async function signUp(name = 'Ada') {
  const agent = request.agent(server.app);
  const email = `user${++count}@example.com`;
  const res = await agent.post('/api/auth/sign-up/email').set('Origin', config.baseURL).send({ email, password, name });

  expect(res.status).toBe(200);
  return { agent, email, cookie: res.headers['set-cookie'] as unknown as string[] };
}

describe('Settings', () => {
  it('Secret and public URL required in production', () => {
    const secret = 'x'.repeat(32);

    expect(() => getConfig({ NODE_ENV: 'production' })).toThrow('BETTER_AUTH_SECRET');
    expect(() => getConfig({ NODE_ENV: 'production', BETTER_AUTH_SECRET: secret })).toThrow('BASE_URL');
    expect(
      getConfig({ NODE_ENV: 'production', BETTER_AUTH_SECRET: secret, BASE_URL: 'https://draw.example' })
    ).toMatchObject({ dev: false, baseURL: 'https://draw.example', trustProxy: false });
    const dev = { NODE_ENV: 'development' };

    expect(getConfig({ ...dev, TRUST_PROXY: '1' }).trustProxy).toBe(1);
    expect(getConfig({ ...dev, TRUST_PROXY: 'loopback, 10.0.0.0/8' }).trustProxy).toBe('loopback, 10.0.0.0/8');
  });

  it('Production unless NODE_ENV is development (yarn serve): development listens to localhost only', () => {
    const secret = 'x'.repeat(32);

    // no development secret without NODE_ENV
    expect(() => getConfig({})).toThrow('BETTER_AUTH_SECRET');
    expect(() => getConfig({ NODE_ENV: 'test' })).toThrow('BETTER_AUTH_SECRET');
    expect(getConfig({ NODE_ENV: 'development' })).toMatchObject({ dev: true, host: 'localhost' });
    expect(getConfig({ NODE_ENV: 'development', HOST: '0.0.0.0' }).host).toBe('0.0.0.0');
    // every interface
    expect(getConfig({ BETTER_AUTH_SECRET: secret, BASE_URL: 'https://draw.example' }).host).toBeUndefined();
    expect(getConfig({ BETTER_AUTH_SECRET: secret, BASE_URL: 'https://draw.example', HOST: '127.0.0.1' }).host).toBe(
      '127.0.0.1'
    );
  });

  it('Development server: files of the repository served by vite, never databases nor secrets', async () => {
    // folders of the dependencies vite optimizes when it starts: the ones of this test removed (interrupted)
    const viteCache = joinPath(testsDir, '../../web/node_modules/.vite/');
    const cached = () => (existsSync(viteCache) ? readdirSync(viteCache) : []);
    const before = new Set(cached());
    const dev = await createServer({ ...config, web: true });
    const data = joinPath(testsDir, '../data/');
    const database = joinPath(data, `vite-${process.pid}.db`);
    // secret of the environment (refused by vite by default)
    const env = joinPath(data, `.env.vite-${process.pid}`);
    // file asked by its path (`/@fs/` of vite)
    const served = (path: string) => request(dev.app).get(`/@fs/${path.replace(/\\/g, '/').replace(/^\//, '')}`);

    mkdirSync(data, { recursive: true });
    writeFileSync(database, 'sessions');
    writeFileSync(`${database}-wal`, 'sessions');
    writeFileSync(env, 'SECRET=1');
    try {
      expect((await served(joinPath(testsDir, '../package.json'))).status).toBe(200);
      expect((await served(database)).status).toBe(403);
      expect((await served(`${database}-wal`)).status).toBe(403);
      // defaults of vite kept (a list given replaces them)
      expect((await served(env)).status).toBe(403);
    } finally {
      rmSync(database, { force: true });
      rmSync(`${database}-wal`, { force: true });
      rmSync(env, { force: true });
      await dev.close();
      for (const name of cached()) {
        if (!before.has(name) && name.startsWith('deps_temp'))
          rmSync(joinPath(viteCache, name), { recursive: true, force: true });
      }
    }
  });
});

describe('Accounts', () => {
  it('API needs a session', async () => {
    expect((await request(server.app).get('/api/me')).status).toBe(401);
    expect((await request(server.app).get('/api/drawings')).status).toBe(401);
    expect((await request(server.app).put('/api/preferences').send({})).status).toBe(401);
  });

  it('Bodies of the API read once the session is known, within the size of each route', async () => {
    // anonymous: refused before its body is read (not parsed: no 400 for invalid JSON, nor 413 for a big one)
    const anonymous = await request(server.app)
      .post('/api/drawings')
      .set('Content-Type', 'application/json')
      .send('{ not json');

    expect(anonymous.status).toBe(401);

    const { agent } = await signUp();
    const big = { content: { ...drawing, data: 'x'.repeat(21_000_000) } };

    expect((await agent.post('/api/drawings').send(big)).status).toBe(413);
    // preferences: a few values
    expect((await agent.put('/api/preferences').send({ theme: 'dark', other: 'x'.repeat(20_000) })).status).toBe(413);
    expect((await agent.put('/api/preferences').send({ theme: 'dark' })).body).toEqual({ theme: 'dark' });
  });

  it('Sign up, sign out, sign in', async () => {
    const { agent, email } = await signUp('Grace');
    const me = await agent.get('/api/me');

    expect(me.status).toBe(200);
    expect(me.body).toMatchObject({ name: 'Grace', email });
    expect(me.body.id).toEqual(expect.any(String));

    expect((await agent.post('/api/auth/sign-out').set('Origin', config.baseURL)).status).toBe(200);
    expect((await agent.get('/api/me')).status).toBe(401);

    // logged by Better Auth, not printed by tests
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrong = await agent
      .post('/api/auth/sign-in/email')
      .set('Origin', config.baseURL)
      .send({ email, password: 'nope nope nope' });

    expect(wrong.status).toBe(401);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Invalid password'));
    await agent.post('/api/auth/sign-in/email').set('Origin', config.baseURL).send({ email, password });
    expect((await agent.get('/api/me')).body.email).toBe(email);
  });

  it('Bodies of requests to accounts are limited', async () => {
    const res = await request(server.app)
      .post('/api/auth/sign-up/email')
      .set('Origin', config.baseURL)
      .send({ email: `user${++count}@example.com`, password, name: 'x'.repeat(20_000) });

    expect(res.status).toBe(413);
    expect(res.body).toEqual({ error: 'request entity too large' });
  });

  it('Checks of the password of a logged in user are rate limited (production): 3 per 10 s, as sign in (deletion, email)', async () => {
    const production = await createServer({ ...config, dev: false });

    try {
      // errors without their stack (Express is in development without NODE_ENV)
      expect(production.app.get('env')).toBe('production');

      const agent = request.agent(production.app);
      /** Statuses of 4 checks of a wrong password by a route */
      const tries = async (path: string) => {
        const statuses: number[] = [];

        for (let i = 0; i < 4; i++) {
          const res = await agent.post(path).set('Origin', config.baseURL).send({ password: 'wrong password' });

          statuses.push(res.status);
        }
        return statuses;
      };

      await agent
        .post('/api/auth/sign-up/email')
        .set('Origin', config.baseURL)
        .send({ email: `user${++count}@example.com`, password, name: 'Rate' });
      // wrong passwords logged by Better Auth
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(await tries('/api/auth/delete-user')).toEqual([400, 400, 400, 429]);
      expect(await tries('/api/auth/verify-password')).toEqual([400, 400, 400, 429]);
      expect(await tries('/api/auth/change-email')).toEqual([400, 400, 400, 429]);
      expect((await agent.get('/api/me')).status).toBe(200);
    } finally {
      await production.close();
    }
  });
});

describe('Account', () => {
  it('Name, email and password changed', async () => {
    const { agent, email } = await signUp('Ada');
    const post = (path: string, body: object) =>
      agent.post(`/api/auth${path}`).set('Origin', config.baseURL).send(body);

    expect((await post('/update-user', { name: 'Ada L.' })).status).toBe(200);
    expect((await agent.get('/api/me')).body.name).toBe('Ada L.');

    const newEmail = `new${++count}@example.com`;

    // with the password of the account only (a session left open or a stolen cookie does not take the account)
    expect((await post('/change-email', { newEmail })).body.code).toBe('PASSWORD_REQUIRED');
    // wrong password logged by Better Auth
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect((await post('/change-email', { newEmail, password: 'wrong password' })).body.code).toBe('INVALID_PASSWORD');
    expect((await agent.get('/api/me')).body.email).toBe(email);
    expect((await post('/change-email', { newEmail, password })).status).toBe(200);
    expect((await agent.get('/api/me')).body.email).toBe(newEmail);
    // email of another account: not changed (not told, like Better Auth)
    const other = await signUp();

    expect((await post('/change-email', { newEmail: other.email, password })).status).toBe(200);
    expect((await agent.get('/api/me')).body.email).toBe(newEmail);

    // wrong current password, then other sessions signed out
    const second = request.agent(server.app);

    await second.post('/api/auth/sign-in/email').set('Origin', config.baseURL).send({ email: newEmail, password });
    expect((await second.get('/api/me')).status).toBe(200);
    expect(
      (await post('/change-password', { currentPassword: 'wrong password', newPassword: 'other password' })).body.code
    ).toBe('INVALID_PASSWORD');

    const changed = await post('/change-password', {
      currentPassword: password,
      newPassword: 'new password 42',
      revokeOtherSessions: true,
    });

    expect(changed.status).toBe(200);
    expect((await agent.get('/api/me')).status).toBe(200);
    expect((await second.get('/api/me')).status).toBe(401);
    expect(email).not.toBe(newEmail);
  });

  it('Account deleted with its password, with drawings and preferences', async () => {
    const { agent, email } = await signUp();
    // sign in of deleted user logged by Better Auth, not printed by tests
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const post = (path: string, body: object) =>
      agent.post(`/api/auth${path}`).set('Origin', config.baseURL).send(body);
    const { id } = (await agent.post('/api/drawings').send({ content: drawing })).body;
    const userId = (await agent.get('/api/me')).body.id;

    await agent.put('/api/preferences').send({ theme: 'dark' });
    expect((await post('/delete-user', { password: 'wrong password' })).body.code).toBe('INVALID_PASSWORD');
    // also without password while the session is fresh (signed in just now)
    for (const body of [{}, { password: '' }, { password: 12 }]) {
      const res = await post('/delete-user', body);

      expect([res.status, res.body.code]).toEqual([400, 'PASSWORD_REQUIRED']);
    }
    expect((await agent.get(`/api/drawings/${id}`)).status).toBe(200);

    expect((await post('/delete-user', { password })).status).toBe(200);
    expect((await agent.get('/api/me')).status).toBe(401);
    expect(await server.db.selectFrom('drawing').where('userId', '=', userId).selectAll().execute()).toEqual([]);
    expect(await server.db.selectFrom('preferences').where('userId', '=', userId).selectAll().execute()).toEqual([]);

    // email free again
    const res = await request(server.app)
      .post('/api/auth/sign-in/email')
      .set('Origin', config.baseURL)
      .send({ email, password });

    expect(res.status).toBe(401);
  });
});

describe('Preferences', () => {
  it('Known preferences saved, others ignored', async () => {
    const { agent } = await signUp();

    expect((await agent.get('/api/preferences')).body).toEqual({});

    const res = await agent.put('/api/preferences').send({
      theme: 'dark',
      language: 'fr',
      grid: true,
      snapping: 'yes',
      zen: true,
      autoSave: false,
      keepTool: false,
      shapeRecognition: true,
      gridStyle: 'dots',
      wheelAction: 'pan',
      other: 1,
    });

    expect(res.body).toEqual({
      theme: 'dark',
      language: 'fr',
      grid: true,
      zen: true,
      autoSave: false,
      keepTool: false,
      shapeRecognition: true,
      gridStyle: 'dots',
      wheelAction: 'pan',
    });
    expect((await agent.get('/api/preferences')).body).toEqual({
      theme: 'dark',
      language: 'fr',
      grid: true,
      zen: true,
      autoSave: false,
      keepTool: false,
      shapeRecognition: true,
      gridStyle: 'dots',
      wheelAction: 'pan',
    });

    // replaced
    await agent.put('/api/preferences').send({ theme: 'system' });
    expect((await agent.get('/api/preferences')).body).toEqual({ theme: 'system' });
    expect((await agent.put('/api/preferences').send([1])).status).toBe(400);
  });
});

describe('Drawings', () => {
  it('Create, list, read, update, delete', async () => {
    const { agent } = await signUp();
    const created = await agent.post('/api/drawings').send({ name: '  Plan  ', content: drawing });

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ name: 'Plan', id: expect.any(String) });

    const { id } = created.body;

    expect((await agent.get('/api/drawings')).body).toEqual([created.body]);
    expect((await agent.get(`/api/drawings/${id}`)).body).toMatchObject({ id, name: 'Plan', content: drawing });

    const content = { ...drawing, background: '#000' };
    const updated = await agent.put(`/api/drawings/${id}`).send({ content });

    expect(updated.status).toBe(200);
    expect(updated.body.name).toBe('Plan');
    expect(updated.body.updatedAt >= created.body.updatedAt).toBe(true);
    expect((await agent.get(`/api/drawings/${id}`)).body.content).toEqual(content);

    expect((await agent.delete(`/api/drawings/${id}`)).status).toBe(204);
    expect((await agent.get(`/api/drawings/${id}`)).status).toBe(404);
    expect((await agent.delete(`/api/drawings/${id}`)).status).toBe(404);
  });

  it('Contents saved with their version: a content saved over another version (another tab or device) is refused', async () => {
    const { agent } = await signUp();
    const created = (await agent.post('/api/drawings').send({ name: 'Plan', content: drawing })).body;
    const path = `/api/drawings/${created.id}`;
    const content = (background: string) => ({ ...drawing, background });

    expect(created.version).toBe(1);
    // saved in a tab: next version
    const saved = await agent.put(path).send({ content: content('#111'), version: 1 });

    expect(saved.status).toBe(200);
    expect(saved.body.version).toBe(2);
    expect((await agent.get('/api/drawings')).body[0].version).toBe(2);

    // another tab saving the version it loaded: refused, content kept
    const refused = await agent.put(path).send({ content: content('#222'), version: 1 });

    expect(refused.status).toBe(409);
    expect(refused.body).toMatchObject({ code: 'DRAWING_CHANGED', version: 2 });
    expect((await agent.get(path)).body).toMatchObject({ version: 2, content: content('#111') });

    // renamed with an older version: a name alone keeps the version
    expect((await agent.put(path).send({ name: 'Renamed', version: 1 })).body).toMatchObject({
      name: 'Renamed',
      version: 2,
    });
    // clients of previous versions (no version): saved over any version
    expect((await agent.put(path).send({ content: content('#333') })).body.version).toBe(3);
    expect((await agent.get(path)).body).toMatchObject({ version: 3, content: content('#333') });
  });

  it('Empty drawing by default, last updated first', async () => {
    const { agent } = await signUp();
    const first = (await agent.post('/api/drawings').send({})).body;
    const second = (await agent.post('/api/drawings').send({ name: 'Second' })).body;

    expect((await agent.get(`/api/drawings/${first.id}`)).body.content).toEqual({
      type: 'free-drawing',
      version: 1,
      background: '#fff',
      shapes: [],
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await agent.put(`/api/drawings/${first.id}`).send({ name: 'First' });
    expect((await agent.get('/api/drawings')).body.map((d: { id: string }) => d.id)).toEqual([first.id, second.id]);
  });

  it('Users only reach their own drawings', async () => {
    const owner = await signUp();
    const other = await signUp();
    const { id } = (await owner.agent.post('/api/drawings').send({ content: drawing })).body;

    expect((await other.agent.get('/api/drawings')).body).toEqual([]);
    expect((await other.agent.get(`/api/drawings/${id}`)).status).toBe(404);
    expect((await other.agent.put(`/api/drawings/${id}`).send({ name: 'Mine' })).status).toBe(404);
    expect((await other.agent.delete(`/api/drawings/${id}`)).status).toBe(404);
    expect((await owner.agent.get(`/api/drawings/${id}`)).body.name).toBe('');
  });

  it('Drawings of an account are limited: count, size', async () => {
    const { agent } = await signUp();
    const saved = { ...drawingsLimits };
    const big = { ...drawing, shapes: [{ className: 'Rect', attrs: { id: 'r1', label: 'x'.repeat(2000) } }] };

    Object.assign(drawingsLimits, { count: 2, size: 1000 });
    try {
      const { id } = (await agent.post('/api/drawings').send({ content: drawing })).body;

      expect((await agent.post('/api/drawings').send({})).status).toBe(201);
      expect((await agent.post('/api/drawings').send({})).body).toMatchObject({ code: 'TOO_MANY_DRAWINGS' });

      // bigger drawing beyond the size of the account refused, smaller ones saved
      const res = await agent.put(`/api/drawings/${id}`).send({ content: big });

      expect([res.status, res.body.code]).toEqual([403, 'DRAWINGS_TOO_BIG']);
      expect((await agent.put(`/api/drawings/${id}`).send({ content: { ...drawing, shapes: [] } })).status).toBe(200);
      expect((await agent.get(`/api/drawings/${id}`)).body.content.shapes).toEqual([]);
    } finally {
      Object.assign(drawingsLimits, saved);
    }
  });

  it('Limits of an account hold for requests sent at once', async () => {
    const { agent } = await signUp();
    const saved = { ...drawingsLimits };
    const statuses = (requests: Promise<{ status: number }>[]) =>
      Promise.all(requests).then((responses) => responses.map((res) => res.status).sort());

    Object.assign(drawingsLimits, { count: 3 });
    try {
      expect(await statuses(Array.from({ length: 5 }, () => agent.post('/api/drawings').send({})))).toEqual([
        201, 201, 201, 403, 403,
      ]);

      // two drawings growing at once: room for one only
      const ids: string[] = (await agent.get('/api/drawings')).body.map(({ id }: { id: string }) => id);
      const small = (await agent.get(`/api/drawings/${ids[0]}`)).body.content;
      const big = { ...drawing, shapes: [{ className: 'Rect', attrs: { id: 'r1', label: 'x'.repeat(2000) } }] };
      const growth = JSON.stringify(big).length - JSON.stringify(small).length;

      Object.assign(drawingsLimits, { count: 10, size: 3 * JSON.stringify(small).length + growth + 10 });
      expect(
        await statuses(ids.slice(0, 2).map((id) => agent.put(`/api/drawings/${id}`).send({ content: big })))
      ).toEqual([200, 403]);
    } finally {
      Object.assign(drawingsLimits, saved);
    }
  });

  it('Invalid drawings and bodies refused', async () => {
    const { agent } = await signUp();
    const { id } = (await agent.post('/api/drawings').send({})).body;

    expect((await agent.post('/api/drawings').send({ content: { shapes: [] } })).status).toBe(400);
    expect((await agent.put(`/api/drawings/${id}`).send({ content: 'text' })).status).toBe(400);
    expect((await agent.put(`/api/drawings/${id}`).set('Content-Type', 'application/json').send('{ bad')).status).toBe(
      400
    );

    const huge = { ...drawing, shapes: [{ className: 'Text', attrs: { text: 'x'.repeat(21 * 1024 * 1024) } }] };

    expect((await agent.put(`/api/drawings/${id}`).send({ content: huge })).status).toBe(413);
  });
});

describe('Apps of other origins', () => {
  /** Address of the session of a new user, signed up with forged headers of addresses */
  async function signUpIp(app: typeof server.app, db: typeof server.db) {
    const res = await request(app)
      .post('/api/auth/sign-up/email')
      .set('Origin', config.baseURL)
      .set('X-Forwarded-For', '203.0.113.7')
      .set('X-Free-Drawing-Client-Ip', '198.51.100.9')
      .send({ email: `user${++count}@example.com`, password, name: 'Ip' });
    const session = await (db as unknown as Kysely<Record<string, { userId: string; ipAddress: string }>>)
      .selectFrom('session')
      .select('ipAddress')
      .where('userId', '=', res.body.user.id)
      .executeTakeFirstOrThrow();

    return session.ipAddress;
  }

  it('Rate limits and sessions use the address of the connection, not headers of the client', async () => {
    expect(await signUpIp(server.app, server.db)).toMatch(/^(127\.0\.0\.1|::1|::ffff:127\.0\.0\.1)$/);

    // behind a trusted proxy: address it gives
    const proxied = await createServer({ ...config, trustProxy: 'loopback' });

    try {
      expect(await signUpIp(proxied.app, proxied.db)).toBe('203.0.113.7');
    } finally {
      await proxied.close();
    }
  });

  it('Trusted origins only get CORS headers', async () => {
    const trusted = await request(server.app).options('/api/drawings').set('Origin', 'http://app.example');

    expect(trusted.status).toBe(204);
    expect(trusted.headers['access-control-allow-origin']).toBe('http://app.example');
    expect(trusted.headers['access-control-allow-credentials']).toBe('true');

    const other = await request(server.app).get('/api/me').set('Origin', 'http://evil.example');

    expect(other.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('Collaboration', () => {
  let url = '';
  const sockets: Socket[] = [];

  beforeAll(async () => {
    await new Promise<void>((resolve) => server.httpServer.listen(0, resolve));
    url = `http://localhost:${(server.httpServer.address() as AddressInfo).port}`;
  });

  afterAll(() => {
    for (const socket of sockets) socket.close();
    server.httpServer.close();
  });

  it('Sockets of pages of other origins refused (session cookies of the same site)', async () => {
    const connected = (origin: string) =>
      new Promise<boolean>((resolve) => {
        const socket = connect(url, { forceNew: true, reconnection: false, extraHeaders: { origin } });

        sockets.push(socket);
        socket.once('connect', () => resolve(true));
        socket.once('connect_error', () => resolve(false));
      });

    expect(await connected('http://evil.example')).toBe(false);
    expect(await connected('http://localhost:3000')).toBe(true);
    expect(await connected('http://app.example')).toBe(true);
  });

  type Joined = { userId: string; users: { id: string; name: string; owner: boolean }[] };

  /** Id given by server and users of room, received after joining it */
  const join = (message: object, cookie?: string[]) =>
    new Promise<Joined>((resolve) => {
      const socket = connect(url, { forceNew: true, extraHeaders: cookie ? { cookie: cookie.join('; ') } : {} });
      let userId = '';

      sockets.push(socket);
      socket.once(socketEvents.JOINED, (joined: { userId: string }) => (userId = joined.userId));
      socket.once(socketEvents.USERS, (users: Joined['users']) => resolve({ userId, users }));
      socket.emit(socketEvents.JOIN, message);
    });

  it('Logged in users are identified by their account, others by the id of their browser', async () => {
    const { agent, cookie } = await signUp('Ada');
    const { id } = (await agent.get('/api/me')).body;

    // id given by client ignored: no impersonation of another user (owner, rights)
    const owner = await join({ room: 'room-1', name: '', userId: 'someone-else', ownerKey: 'secret' }, cookie);

    expect(owner.userId).toBe(id);
    expect(owner.users).toEqual([expect.objectContaining({ id, name: 'Ada', owner: true })]);

    const guest = await join({ room: 'room-1', name: 'Guest', userId: 'guest-1' });

    expect(guest.userId).toBe('guest-1');
    expect(guest.users.map((user) => user.id)).toEqual([id, 'guest-1']);

    // id of an account never given to an anonymous user
    const impostor = await join({ room: 'room-1', name: 'Impostor', userId: id });

    expect(impostor.userId).not.toBe(id);
  });

  type User = { id: string; name: string; owner: boolean; canEdit: boolean };

  /** Socket of a new client (of this server by default), next message of an event */
  const client = (server = url) => {
    const socket = connect(server, { forceNew: true });
    const next = <T>(event: string) => new Promise<T>((resolve) => socket.once(event, resolve));

    sockets.push(socket);
    return { socket, next };
  };

  /** Client joined to a room: its id, users of the room, view presented (sent last) */
  const joinRoom = async (message: object, server = url) => {
    const user = client(server);
    const joined = user.next<{ userId: string }>(socketEvents.JOINED);
    const users = user.next<User[]>(socketEvents.USERS);
    const view = user.next(socketEvents.VIEW);

    user.socket.emit(socketEvents.JOIN, message);
    return { ...user, userId: (await joined).userId, users: await users, view: await view };
  };

  it('Owner is the user giving the secret: its id is not given to others, rights only changed by it', async () => {
    const owner = await joinRoom({ room: 'room-2', name: 'Owner', userId: 'owner-1', ownerKey: 'secret' });
    const guest = await joinRoom({ room: 'room-2', name: 'Guest', userId: 'guest-2' });
    const impostor = await joinRoom({ room: 'room-2', name: 'Impostor', userId: 'owner-1' });

    expect(owner.userId).toBe('owner-1');
    expect(impostor.userId).not.toBe('owner-1');
    expect(impostor.users.filter((user) => user.owner).map((user) => user.id)).toEqual(['owner-1']);

    // new users view only; rights from the impostor ignored, from the owner applied
    impostor.socket.emit(socketEvents.RIGHTS, { userId: impostor.userId, canEdit: true });
    const updated = owner.next<User[]>(socketEvents.USERS);

    owner.socket.emit(socketEvents.RIGHTS, { userId: 'guest-2', canEdit: true });
    expect((await updated).map(({ id, canEdit }) => [id, canEdit])).toEqual([
      ['owner-1', true],
      ['guest-2', true],
      [impostor.userId, false],
    ]);
    expect(guest.userId).toBe('guest-2');
  });

  it('New users view only by default, the owner lets them draw: users coming back keep their right', async () => {
    const owner = await joinRoom({ room: 'room-3', name: 'Owner', userId: 'owner-3', ownerKey: 'secret 3' });
    const viewer = await joinRoom({ room: 'room-3', name: 'Viewer', userId: 'viewer-3' });
    const canEdit = (users: User[], id: string) => users.find((user) => user.id === id)?.canEdit;

    expect(canEdit(viewer.users, 'viewer-3')).toBe(false);

    // not the owner: ignored
    const settingOn = viewer.next<{ newUsersCanEdit: boolean }>(socketEvents.ROOM);

    viewer.socket.emit(socketEvents.ROOM, { newUsersCanEdit: true });
    owner.socket.emit(socketEvents.ROOM, { newUsersCanEdit: true });
    expect(await settingOn).toEqual({ newUsersCanEdit: true, encrypted: false });

    const editor = await joinRoom({ room: 'room-3', name: 'Editor', userId: 'editor-3' });

    expect(canEdit(editor.users, 'editor-3')).toBe(true);

    // off again: new users view only, also users coming back with a new id
    const settingOff = editor.next<{ newUsersCanEdit: boolean }>(socketEvents.ROOM);

    owner.socket.emit(socketEvents.ROOM, { newUsersCanEdit: false });
    expect(await settingOff).toEqual({ newUsersCanEdit: false, encrypted: false });
    expect(canEdit((await joinRoom({ room: 'room-3', name: 'Other', userId: 'other-3' })).users, 'other-3')).toBe(
      false
    );

    // users who came before keep their right
    editor.socket.close();
    viewer.socket.close();
    expect(canEdit((await joinRoom({ room: 'room-3', name: 'Editor', userId: 'editor-3' })).users, 'editor-3')).toBe(
      true
    );
    expect(canEdit((await joinRoom({ room: 'room-3', name: 'Viewer', userId: 'viewer-3' })).users, 'viewer-3')).toBe(
      false
    );
  });

  it('Owner, rights and settings of an empty room are kept: nobody takes it over', async () => {
    const owner = await joinRoom({ room: 'room-4', name: 'Owner', userId: 'owner-4', ownerKey: 'secret 4' });
    const viewer = await joinRoom({ room: 'room-4', name: 'Viewer', userId: 'viewer-4' });
    const updated = owner.next<User[]>(socketEvents.USERS);
    const setting = owner.next(socketEvents.ROOM);
    const find = (users: User[], id: string) => users.find((user) => user.id === id);

    owner.socket.emit(socketEvents.RIGHTS, { userId: 'viewer-4', canEdit: false });
    await updated;
    owner.socket.emit(socketEvents.ROOM, { newUsersCanEdit: false });
    await setting;

    // everyone left
    owner.socket.close();
    viewer.socket.close();
    await vi.waitFor(() => expect(server.io.sockets.adapter.rooms.has('room-4')).toBe(false));

    // another secret, id of the owner: neither owner nor drawing
    const intruder = await joinRoom({ room: 'room-4', name: 'Intruder', userId: 'owner-4', ownerKey: 'other secret' });

    expect(intruder.userId).not.toBe('owner-4');
    expect(intruder.users).toEqual([expect.objectContaining({ id: intruder.userId, owner: false, canEdit: false })]);
    expect(
      find((await joinRoom({ room: 'room-4', name: 'Viewer', userId: 'viewer-4' })).users, 'viewer-4')
    ).toMatchObject({
      canEdit: false,
    });

    const back = await joinRoom({ room: 'room-4', name: 'Owner', userId: 'owner-4', ownerKey: 'secret 4' });

    expect(find(back.users, 'owner-4')).toMatchObject({ owner: true, canEdit: true });
    // secret not kept, its hash only
    const saved = await server.db.selectFrom('room').where('id', '=', 'room-4').selectAll().executeTakeFirstOrThrow();

    expect(saved.content).not.toContain('secret 4');
  });

  it('Owner presents its view: relayed, sent to users joining meanwhile, stopped when the owner leaves', async () => {
    const owner = await joinRoom({ room: 'room-view', name: 'Owner', userId: 'owner-v', ownerKey: 'secret v' });
    const viewer = await joinRoom({ room: 'room-view', name: 'Viewer', userId: 'viewer-v' });
    const view = { x: 10, y: -20, width: 800, height: 600 };
    const received = viewer.next(socketEvents.VIEW);

    // not the owner, invalid area: ignored; other fields dropped
    viewer.socket.emit(socketEvents.VIEW, { x: 0, y: 0, width: 100, height: 100 });
    owner.socket.emit(socketEvents.VIEW, { x: 0, y: 0, width: -1, height: 100 });
    owner.socket.emit(socketEvents.VIEW, { ...view, extra: 'dropped' });
    expect(await received).toEqual(view);

    // user joining meanwhile: view at once
    const late = client();
    const lateView = late.next(socketEvents.VIEW);

    late.socket.emit(socketEvents.JOIN, { room: 'room-view', name: 'Late', userId: 'late-v' });
    expect(await lateView).toEqual(view);

    // slide of a slideshow: flag kept
    const slide = viewer.next(socketEvents.VIEW);

    owner.socket.emit(socketEvents.VIEW, { ...view, slide: true });
    expect(await slide).toEqual({ ...view, slide: true });

    // owner gone: presentation stopped
    const stopped = viewer.next(socketEvents.VIEW);

    owner.socket.close();
    expect(await stopped).toBeNull();
  });

  it('Viewers ask the owner for the right to draw: once until answered, told to an owner joining later', async () => {
    const room = 'room-request';
    const owner = await joinRoom({ room, name: 'Owner', userId: 'owner-r', ownerKey: 'secret r' });
    const viewer = await joinRoom({ room, name: 'Viewer', userId: 'viewer-r' });
    const requests: unknown[] = [];
    const wait = () => new Promise((resolve) => setTimeout(resolve, 100));

    owner.socket.on(socketEvents.REQUEST, (request: unknown) => requests.push(request));
    viewer.socket.emit(socketEvents.REQUEST);
    viewer.socket.emit(socketEvents.REQUEST);
    await wait();
    expect(requests).toEqual([{ userId: 'viewer-r', name: 'Viewer' }]);

    // refused: told to the viewer
    const refused = viewer.next(socketEvents.REQUEST);

    owner.socket.emit(socketEvents.REQUEST, { userId: 'viewer-r', accepted: false });
    expect(await refused).toEqual({ accepted: false });

    // asked again while the owner is away: told when it joins again
    const left = viewer.next(socketEvents.USERS);

    owner.socket.close();
    await left;
    viewer.socket.emit(socketEvents.REQUEST);
    await wait();

    const back = client();
    const pending = back.next(socketEvents.REQUEST);

    back.socket.emit(socketEvents.JOIN, { room, name: 'Owner', userId: 'owner-r', ownerKey: 'secret r' });
    expect(await pending).toEqual({ userId: 'viewer-r', name: 'Viewer' });

    // accepted: right given
    const updated = viewer.next<User[]>(socketEvents.USERS);

    back.socket.emit(socketEvents.REQUEST, { userId: 'viewer-r', accepted: true });
    expect((await updated).find((user) => user.id === 'viewer-r')?.canEdit).toBe(true);
  });

  /** JSON of a rectangle of a change */
  const rect = (id: string) => JSON.stringify({ attrs: { id, width: 10 }, className: 'Rect' });

  it('Changes are checked as a whole, only checked fields are relayed', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const owner = await joinRoom({ room: 'room-6', name: 'Owner', userId: 'owner-6', ownerKey: 'secret 6' });
    const guest = await joinRoom({ room: 'room-6', name: 'Guest', userId: 'guest-6' });
    const relayed = guest.next(socketEvents.CHANGE);

    // a stage or an invalid shape: whole change ignored
    owner.socket.emit(socketEvents.CHANGE, {
      upsert: [rect('r0'), JSON.stringify({ attrs: { id: 's1', container: 'app' }, className: 'Stage' })],
      remove: [],
    });
    owner.socket.emit(socketEvents.CHANGE, { upsert: [rect('r0'), '{ not json'], remove: [] });
    owner.socket.emit(socketEvents.CHANGE, {
      upsert: [
        JSON.stringify({ attrs: { id: 'g1' }, className: 'Group', children: [{ attrs: {}, className: 'Layer' }] }),
      ],
      remove: [],
    });
    owner.socket.emit(socketEvents.CHANGE, { upsert: [rect('r1')], remove: [], junk: 'x'.repeat(1000) });

    expect(await relayed).toEqual({ upsert: [rect('r1')], remove: [] });
    expect(warn).toHaveBeenCalledTimes(3);

    // whole drawing sent to joining users (`full`): valid change only
    const later = client();
    const drawing = later.next<{ upsert: string[] }>(socketEvents.CHANGE);

    later.socket.emit(socketEvents.JOIN, { room: 'room-6', name: 'Later', userId: 'later-6' });
    // kept by its users: an empty one was emptied by them
    expect(await drawing).toEqual({ upsert: [rect('r1')], remove: [], order: ['r1'], full: true, kept: true });

    // also empty, not kept: users joining again know the drawing of the room was lost
    const empty = client();
    const nothing = empty.next(socketEvents.CHANGE);

    empty.socket.emit(socketEvents.JOIN, { room: 'room-6-empty', name: 'Empty', userId: 'empty-6' });
    expect(await nothing).toEqual({ upsert: [], remove: [], order: [], full: true, kept: false });

    // pointer: position only
    const pointers = guest.next<{ position: unknown }>(socketEvents.POINTER);

    owner.socket.emit(socketEvents.POINTER, { x: 10, y: 20, laser: true, junk: 'x' });
    expect((await pointers).position).toEqual({ x: 10, y: 20, laser: true });

    const invalid = guest.next<{ position: unknown }>(socketEvents.POINTER);

    owner.socket.emit(socketEvents.POINTER, { x: 'big', y: 20 });
    expect((await invalid).position).toBeNull();
  });

  it('Image files: checked, relayed once, given to users joining later, counted in the size of the drawing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const png =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const image = (id: string, fileId: string) =>
      JSON.stringify({ attrs: { id, fileId, width: 10, height: 10 }, className: 'Image' });
    const owner = await joinRoom({ room: 'room-img', name: 'Owner', userId: 'owner-img', ownerKey: 'secret img' });
    const guest = await joinRoom({ room: 'room-img', name: 'Guest', userId: 'guest-img' });
    const relayed = guest.next(socketEvents.CHANGE);

    // invalid files: whole change ignored
    owner.socket.emit(socketEvents.CHANGE, {
      upsert: [image('i1', 'f1')],
      remove: [],
      files: { f1: 'https://example.com/a.png' },
    });
    owner.socket.emit(socketEvents.CHANGE, { upsert: [image('i1', 'f1')], remove: [], files: { 'bad id': png } });
    owner.socket.emit(socketEvents.CHANGE, { upsert: [image('i1', 'f1')], remove: [], files: [png] });
    owner.socket.emit(socketEvents.CHANGE, { upsert: [image('i1', 'f1')], remove: [], files: { f1: png } });

    expect(await relayed).toEqual({ upsert: [image('i1', 'f1')], remove: [], files: { f1: png } });
    expect(warn).toHaveBeenCalledTimes(3);

    // whole drawing of joining users: its files too
    const later = client();
    const drawing = later.next(socketEvents.CHANGE);

    later.socket.emit(socketEvents.JOIN, { room: 'room-img', name: 'Later', userId: 'later-img' });
    expect(await drawing).toEqual({
      upsert: [image('i1', 'f1')],
      remove: [],
      order: ['i1'],
      full: true,
      kept: true,
      files: { f1: png },
    });

    // a file making the drawing too big: refused
    const saved = { ...limits };

    Object.assign(limits, { drawingSize: 1_000 });
    try {
      const tooBig = owner.next(socketEvents.REJECTED);

      owner.socket.emit(socketEvents.CHANGE, {
        upsert: [image('i2', 'f2')],
        remove: [],
        files: { f2: `data:image/png;base64,${'A'.repeat(2_000)}` },
      });
      // shapes of the change told: sent again later
      expect(await tooBig).toEqual({ event: socketEvents.CHANGE, reason: 'too-big', upsert: ['i2'], remove: [] });
    } finally {
      Object.assign(limits, saved);
    }
  });

  it('Shapes of viewers ignored: drawn once the owner gives the right, ignored again once removed', async () => {
    const room = 'room-rights';
    const owner = await joinRoom({ room, name: 'Owner', userId: 'owner-r', ownerKey: 'secret r' });
    const guest = await joinRoom({ room, name: 'Guest', userId: 'guest-r' });
    /** Drawing of the room, as a user joining gets it */
    const drawing = async () => {
      const later = client();
      const full = later.next<{ upsert: string[]; remove: string[] }>(socketEvents.CHANGE);

      later.socket.emit(socketEvents.JOIN, { room, name: 'Later', userId: 'later-r' });
      const { upsert } = await full;

      later.socket.close();
      return upsert;
    };
    /** Rights of the guest changed by the owner, users sent again */
    const setRight = async (canEdit: boolean) => {
      const updated = owner.next(socketEvents.USERS);

      owner.socket.emit(socketEvents.RIGHTS, { userId: 'guest-r', canEdit });
      await updated;
    };

    // viewer (new users by default): shapes neither relayed nor kept, refused with their ids (sent again once allowed)
    const refused = guest.next(socketEvents.REJECTED);

    guest.socket.emit(socketEvents.CHANGE, { upsert: [rect('v1')], remove: [] });
    expect(await refused).toEqual({ event: socketEvents.CHANGE, reason: 'right', upsert: ['v1'], remove: [] });
    expect(await drawing()).toEqual([]);

    // right given: relayed to the owner and kept
    await setRight(true);
    const relayed = owner.next(socketEvents.CHANGE);

    guest.socket.emit(socketEvents.CHANGE, { upsert: [rect('e1')], remove: [] });
    expect(await relayed).toEqual({ upsert: [rect('e1')], remove: [] });
    expect(await drawing()).toEqual([rect('e1')]);

    // right removed: its changes ignored again, also removals
    await setRight(false);
    guest.socket.emit(socketEvents.CHANGE, { upsert: [rect('v2')], remove: ['e1'] });
    expect(await drawing()).toEqual([rect('e1')]);
  });

  it('Background of the drawing kept by the room for users joining, invalid ones refused, viewers ignored', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const room = 'room-background';
    const owner = await joinRoom({ room, name: 'Owner', userId: 'owner-bg', ownerKey: 'secret bg' });
    const guest = await joinRoom({ room, name: 'Guest', userId: 'guest-bg' });
    const relayed = guest.next(socketEvents.CHANGE);

    // not a color: whole change ignored
    owner.socket.emit(socketEvents.CHANGE, { upsert: [], remove: [], background: 42 });
    owner.socket.emit(socketEvents.CHANGE, { upsert: [], remove: [], background: 'x'.repeat(101) });
    owner.socket.emit(socketEvents.CHANGE, { upsert: [], remove: [], background: '#f5faff' });
    expect(await relayed).toEqual({ upsert: [], remove: [], background: '#f5faff' });
    expect(warn).toHaveBeenCalledTimes(2);

    // viewer (new users by default): ignored
    guest.socket.emit(socketEvents.CHANGE, { upsert: [], remove: [], background: '#000' });
    await new Promise((resolve) => setTimeout(resolve, 100));

    const later = client();
    const drawing = later.next(socketEvents.CHANGE);

    later.socket.emit(socketEvents.JOIN, { room, name: 'Later', userId: 'later-bg' });
    expect(await drawing).toEqual({ upsert: [], remove: [], order: [], full: true, kept: true, background: '#f5faff' });
  });

  it('Encrypted rooms: joined with the proof of their key only, drawing kept and relayed without being read', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const room = 'room-encrypted';
    const keyCheck = `${'k'.repeat(42)}0`;
    const refused = async (message: object) => {
      const user = client();
      const rejected = user.next(socketEvents.REJECTED);

      user.socket.emit(socketEvents.JOIN, message);
      return rejected;
    };
    const owner = client();
    const settings = owner.next(socketEvents.ROOM);

    owner.socket.emit(socketEvents.JOIN, { room, name: 'Owner', userId: 'owner-e', ownerKey: 'e', keyCheck });
    // encrypted by the user creating it
    expect(await settings).toEqual({ newUsersCanEdit: false, encrypted: true });

    const guest = await joinRoom({ room, name: 'Guest', userId: 'guest-e', keyCheck });

    // without the key, with another one
    expect(await refused({ room, name: 'Eve', userId: 'eve' })).toEqual({ event: socketEvents.JOIN, reason: 'key' });
    expect(await refused({ room, name: 'Eve', userId: 'eve', keyCheck: 'x'.repeat(43) })).toEqual({
      event: socketEvents.JOIN,
      reason: 'key',
    });
    // a key for a room in clear
    await joinRoom({ room: 'room-clear-e', name: 'Clear', userId: 'clear-e' });
    expect(await refused({ room: 'room-clear-e', name: 'Keyed', keyCheck })).toEqual({
      event: socketEvents.JOIN,
      reason: 'key',
    });

    // shapes in clear, images as data URLs: whole change ignored
    const relayed = guest.next(socketEvents.CHANGE);
    const shape = { id: 'e1', data: 'ZW5jcnlwdGVk_-' };
    const files = { 'random-id': 'ZmlsZQ' };

    owner.socket.emit(socketEvents.CHANGE, { upsert: [rect('r1')], remove: [] });
    owner.socket.emit(socketEvents.CHANGE, { upsert: [{ id: 'e1', data: 'not base64url!' }], remove: [] });
    owner.socket.emit(socketEvents.CHANGE, {
      upsert: [shape],
      remove: [],
      files: { f1: 'data:image/png;base64,iVBORw0KGgo=' },
    });
    owner.socket.emit(socketEvents.CHANGE, { upsert: [shape], remove: [], background: 'Y29sb3I', files });
    expect(await relayed).toEqual({ upsert: [shape], remove: [], background: 'Y29sb3I', files });
    expect(warn).toHaveBeenCalledTimes(3);

    // pointer and view: encrypted, relayed as they are
    const pointer = guest.next<object>(socketEvents.POINTER);
    const view = guest.next(socketEvents.VIEW);

    owner.socket.emit(socketEvents.POINTER, { data: 'cG9pbnRlcg', x: 1, y: 2 });
    expect(await pointer).toEqual({ id: owner.socket.id, name: 'Owner', data: 'cG9pbnRlcg' });
    owner.socket.emit(socketEvents.VIEW, { x: 0, y: 0, width: 100, height: 100 });
    owner.socket.emit(socketEvents.VIEW, { data: 'dmlldw' });
    expect(await view).toEqual({ data: 'dmlldw' });

    // joining later: encrypted drawing of the room
    const later = client();
    const drawing = later.next(socketEvents.CHANGE);
    const presented = later.next(socketEvents.VIEW);

    later.socket.emit(socketEvents.JOIN, { room, name: 'Later', userId: 'later-e', keyCheck });
    expect(await drawing).toEqual({
      upsert: [shape],
      remove: [],
      order: ['e1'],
      full: true,
      kept: true,
      background: 'Y29sb3I',
      files,
    });
    expect(await presented).toEqual({ data: 'dmlldw' });

    // proof of the key kept with the room: nobody joins it in clear once empty
    owner.socket.close();
    guest.socket.close();
    later.socket.close();
    await vi.waitFor(() => expect(server.io.sockets.adapter.rooms.has(room)).toBe(false));
    expect(await refused({ room, name: 'Eve', userId: 'eve' })).toEqual({ event: socketEvents.JOIN, reason: 'key' });

    const saved = await server.db.selectFrom('room').where('id', '=', room).selectAll().executeTakeFirstOrThrow();

    expect(JSON.parse(saved.content).keyCheck).toBe(keyCheck);
  });

  it('Rooms and messages are limited: drawing, users, rate', async () => {
    const saved = { ...limits };

    Object.assign(limits, { shapes: 2, users: 2 });
    try {
      const owner = await joinRoom({ room: 'room-7', name: 'Owner', userId: 'owner-7', ownerKey: 'secret 7' });
      const guest = await joinRoom({ room: 'room-7', name: 'Guest', userId: 'guest-7' });

      // room full
      const third = client();
      const refused = third.next(socketEvents.REJECTED);

      third.socket.emit(socketEvents.JOIN, { room: 'room-7', name: 'Third', userId: 'third-7' });
      expect(await refused).toEqual({ event: socketEvents.JOIN, reason: 'full' });

      // drawing with too many shapes refused, not relayed
      const tooBig = owner.next(socketEvents.REJECTED);
      const relayed = guest.next<{ upsert: string[] }>(socketEvents.CHANGE);

      owner.socket.emit(socketEvents.CHANGE, { upsert: [rect('a'), rect('b'), rect('c')], remove: [] });
      expect(await tooBig).toEqual({
        event: socketEvents.CHANGE,
        reason: 'too-big',
        upsert: ['a', 'b', 'c'],
        remove: [],
      });
      owner.socket.emit(socketEvents.CHANGE, { upsert: [rect('a'), rect('b')], remove: [] });
      expect((await relayed).upsert).toEqual([rect('a'), rect('b')]);

      // as many shapes: allowed
      const replaced = guest.next<{ upsert: string[]; remove: string[] }>(socketEvents.CHANGE);

      owner.socket.emit(socketEvents.CHANGE, { upsert: [rect('c')], remove: ['a'] });
      expect(await replaced).toEqual({ upsert: [rect('c')], remove: ['a'] });

      // an id removed several times counts once: limits kept, relayed once
      const repeated = owner.next(socketEvents.REJECTED);

      owner.socket.emit(socketEvents.CHANGE, { upsert: [rect('d'), rect('e')], remove: ['b', 'b', 'b'] });
      expect(await repeated).toEqual({
        event: socketEvents.CHANGE,
        reason: 'too-big',
        upsert: ['d', 'e'],
        remove: ['b'],
      });

      const once = guest.next(socketEvents.CHANGE);

      owner.socket.emit(socketEvents.CHANGE, { upsert: [rect('d')], remove: ['b', 'b'], order: ['c', 'd', 'c'] });
      expect(await once).toEqual({ upsert: [rect('d')], remove: ['b'], order: ['c', 'd'] });

      // names changed too often: more ignored (10 at once, then 2 per second)
      let updates = 0;

      guest.socket.on(socketEvents.USERS, () => updates++);
      for (let i = 0; i < 30; i++) owner.socket.emit(socketEvents.NAME, `Owner ${i}`);
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(updates).toBeGreaterThanOrEqual(5);
      expect(updates).toBeLessThanOrEqual(11);
    } finally {
      Object.assign(limits, saved);
    }
  });

  it('Changes beyond the rate of a client refused in their acknowledgement: not applied, sent again by the client', async () => {
    const room = 'room-rate';
    const owner = await joinRoom({ room, name: 'Owner', userId: 'owner-rate', ownerKey: 'secret rate' });
    const answers = await Promise.all(
      Array.from(
        { length: 110 },
        (_, i) =>
          new Promise((resolve) =>
            owner.socket.emit(socketEvents.CHANGE, { upsert: [rect(`rate-${i}`)], remove: [] }, resolve)
          )
      )
    );

    // 100 at once
    expect(answers.filter((answer) => answer === undefined)).toHaveLength(100);
    expect(answers.slice(100)).toEqual(Array(10).fill({ refused: 'rate' }));

    const later = client();
    const drawing = later.next<{ upsert: string[] }>(socketEvents.CHANGE);

    later.socket.emit(socketEvents.JOIN, { room, name: 'Later', userId: 'later-rate' });
    expect((await drawing).upsert).toHaveLength(100);
  });

  it('Messages of an unexpected shape are ignored: the server keeps running', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const room = 'room-malformed';
    const owner = await joinRoom({ room, name: 'Owner', userId: 'owner-m', ownerKey: 'secret m' });
    // a name of another type (an object without text) is no name
    const guest = await joinRoom({ room, name: { toString: 1 }, userId: 'guest-m' });

    expect(guest.users.find((user) => user.id === 'guest-m')?.name).toBe('Anonymous');
    for (const event of Object.values(socketEvents)) {
      for (const message of [null, 42, 'text', [], { toString: 1 }]) {
        owner.socket.emit(event, message);
        guest.socket.emit(event, message);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 200));

    const later = await joinRoom({ room, name: 'Later', userId: 'later-m' });

    expect(later.users.map(({ id, name }) => [id, name])).toEqual([
      ['owner-m', 'Anonymous'],
      ['guest-m', 'Anonymous'],
      ['later-m', 'Later'],
    ]);
    // invalid changes only, no listener failed
    expect(warn.mock.calls.every(([message]) => String(message).startsWith('Invalid change'))).toBe(true);
  });

  it('Ids of anonymous users are bound to the secret of their browser: nobody else takes them', async () => {
    const room = 'room-keys';
    const owner = await joinRoom({ room, name: 'Owner', userId: 'owner-k', userKey: 'owner browser', ownerKey: 'k' });
    const editor = await joinRoom({ room, name: 'Editor', userId: 'editor-k', userKey: 'editor browser' });
    const updated = owner.next(socketEvents.USERS);

    owner.socket.emit(socketEvents.RIGHTS, { userId: 'editor-k', canEdit: true });
    await updated;
    editor.socket.close();

    // id seen in the users of the room or in a link: not given without the secret of its browser
    const impostor = await joinRoom({ room, name: 'Impostor', userId: 'editor-k' });
    const other = await joinRoom({ room, name: 'Other', userId: 'editor-k', userKey: 'other browser' });

    expect(impostor.userId).not.toBe('editor-k');
    expect(other.userId).not.toBe('editor-k');
    expect(other.users.find((user) => user.id === other.userId)?.canEdit).toBe(false);

    // browser of the user: its id and right
    const back = await joinRoom({ room, name: 'Editor', userId: 'editor-k', userKey: 'editor browser' });

    expect(back.userId).toBe('editor-k');
    expect(back.users.find((user) => user.id === 'editor-k')?.canEdit).toBe(true);

    // secrets not kept, their hashes only (ids of connections of the impostors: given to nobody)
    await vi.waitFor(async () => {
      const saved = await server.db.selectFrom('room').where('id', '=', room).selectAll().executeTakeFirstOrThrow();

      expect(JSON.parse(saved.content).userKeys).toEqual([
        ['owner-k', expect.any(String)],
        ['editor-k', expect.any(String)],
        [impostor.userId, ''],
        [other.userId, ''],
      ]);
      expect(saved.content).not.toContain('editor browser');
    });
  });

  it('Ids of accounts and of connections are never given to another user', async () => {
    const { agent, cookie } = await signUp('Grace');
    const { id } = (await agent.get('/api/me')).body;
    const room = 'room-ids';
    const owner = await joinRoom({ room, name: 'Owner', userId: 'owner-i', userKey: 'owner browser i', ownerKey: 'i' });

    // id of an account (users of other rooms, `by` of links): not given, also before the account comes in the room
    const impostor = await joinRoom({ room, name: 'Impostor', userId: id, userKey: 'impostor browser' });

    expect(impostor.userId).not.toBe(id);
    expect((await join({ room, name: '', userId: 'grace-i' }, cookie)).userId).toBe(id);

    // id refused: id of the connection, not given to a user who saw it
    const refused = await joinRoom({ room, name: 'Refused', userId: 'not an id!', userKey: 'refused browser' });
    // users of the room once the right is given (the ones of the join may come before)
    const updated = new Promise<void>((resolve) =>
      owner.socket.on(socketEvents.USERS, (users: User[]) => {
        if (users.find((user) => user.id === refused.userId)?.canEdit) resolve();
      })
    );

    owner.socket.emit(socketEvents.RIGHTS, { userId: refused.userId, canEdit: true });
    await updated;

    const copycat = await joinRoom({ room, name: 'Copycat', userId: refused.userId, userKey: 'copycat browser' });

    expect(copycat.userId).not.toBe(refused.userId);
    expect(copycat.users.find((user) => user.id === copycat.userId)?.canEdit).toBe(false);
  });

  it('Messages sent with a join are handled once joined', async () => {
    const room = 'room-order';
    const owner = await joinRoom({ room, name: 'Owner', userId: 'owner-o', ownerKey: 'o' });
    const viewer = client();
    const request = owner.next(socketEvents.REQUEST);

    // id checked in the database first: the request waits for the join
    viewer.socket.emit(socketEvents.JOIN, { room, name: 'Viewer', userId: 'viewer-o', userKey: 'viewer browser o' });
    viewer.socket.emit(socketEvents.REQUEST);
    expect(await request).toEqual({ userId: 'viewer-o', name: 'Viewer' });
  });

  it('A room remembering too many users forgets the ones with the right of new users', async () => {
    const saved = { ...limits };
    const room = 'room-known';

    Object.assign(limits, { knownUsers: 3 });
    try {
      const owner = await joinRoom({ room, name: 'Owner', userId: 'owner-n', ownerKey: 'secret n' });
      const editor = await joinRoom({ room, name: 'Editor', userId: 'editor-n' });
      const updated = owner.next(socketEvents.USERS);

      owner.socket.emit(socketEvents.RIGHTS, { userId: 'editor-n', canEdit: true });
      await updated;

      const viewer = await joinRoom({ room, name: 'Viewer', userId: 'viewer-n' });

      editor.socket.close();
      viewer.socket.close();
      await vi.waitFor(() => expect(server.io.sockets.adapter.rooms.get(room)?.size).toBe(1));

      // viewer forgotten (new users view only): nothing changes for them
      const newcomer = await joinRoom({ room, name: 'New', userId: 'new-n' });

      expect(newcomer.userId).toBe('new-n');

      // every other user connected or given another right: refused
      const refused = client();
      const rejected = refused.next(socketEvents.REJECTED);

      refused.socket.emit(socketEvents.JOIN, { room, name: 'Viewer', userId: 'viewer-n' });
      expect(await rejected).toEqual({ event: socketEvents.JOIN, reason: 'full' });

      // editor remembered with its right
      const back = await joinRoom({ room, name: 'Editor', userId: 'editor-n' });

      expect(back.users.find((user) => user.id === 'editor-n')?.canEdit).toBe(true);
    } finally {
      Object.assign(limits, saved);
    }
  });

  it('Clients of addresses: IPv4 address, network of 64 bits of an IPv6 address', () => {
    expect(clientOf('203.0.113.7')).toBe('203.0.113.7');
    expect(clientOf('::ffff:203.0.113.7')).toBe('203.0.113.7');
    expect(clientOf('2001:db8:1:2:3:4:5:6')).toBe('2001:db8:1:2');
    expect(clientOf('2001:0DB8:0001:0002::')).toBe('2001:db8:1:2');
    expect(clientOf('2001:db8::1')).toBe('2001:db8:0:0');
    expect(clientOf('::1')).toBe('0:0:0:0');
    expect(clientOf('fe80::1%eth0')).toBe('fe80:0:0:0');
  });

  it('Rooms created by a client and kept by the server are limited', async () => {
    // clients behind a proxy: address given by `X-Forwarded-For`
    const proxied = await createServer({ ...config, trustProxy: 'loopback' });
    const saved = { ...limits };

    await new Promise<void>((resolve) => proxied.httpServer.listen(0, resolve));
    const proxiedUrl = `http://localhost:${(proxied.httpServer.address() as AddressInfo).port}`;
    /** Answer of the server to a join from an address: joined, or reason of refusal */
    const joinFrom = (address: string, room: string) =>
      new Promise<string>((resolve) => {
        const socket = connect(proxiedUrl, { forceNew: true, extraHeaders: { 'x-forwarded-for': address } });

        sockets.push(socket);
        socket.once(socketEvents.REJECTED, ({ reason }: { reason: string }) => resolve(reason));
        socket.once(socketEvents.JOINED, () => resolve('joined'));
        socket.emit(socketEvents.JOIN, { room, name: 'User' });
      });

    Object.assign(limits, { newRooms: 1 });
    try {
      expect(await joinFrom('203.0.113.1', 'room-p1')).toBe('joined');
      expect(await joinFrom('203.0.113.1', 'room-p2')).toBe('full');
      // rooms that exist: joined
      expect(await joinFrom('203.0.113.1', 'room-p1')).toBe('joined');
      expect(await joinFrom('203.0.113.2', 'room-p2')).toBe('joined');
      // addresses of an IPv6 network: one client
      expect(await joinFrom('2001:db8:1:2::1', 'room-p3')).toBe('joined');
      expect(await joinFrom('2001:db8:1:2::2', 'room-p4')).toBe('full');

      // rooms of the server
      Object.assign(limits, { rooms: 3 });
      expect(await joinFrom('203.0.113.3', 'room-p4')).toBe('full');
      expect(await joinFrom('203.0.113.3', 'room-p3')).toBe('joined');
    } finally {
      Object.assign(limits, saved);
      await proxied.close();
    }
  });

  it('Rooms of a client beyond its limit, then rooms of one client on a full server are forgotten first', async () => {
    const proxied = await createServer({ ...config, trustProxy: 'loopback' });
    const saved = { ...limits };

    await new Promise<void>((resolve) => proxied.httpServer.listen(0, resolve));
    const proxiedUrl = `http://localhost:${(proxied.httpServer.address() as AddressInfo).port}`;
    /** Room joined from an address and left: answer of the server (joined, or reason of refusal) */
    const visit = async (address: string, room: string) => {
      const socket = connect(proxiedUrl, { forceNew: true, extraHeaders: { 'x-forwarded-for': address } });
      const answer = await new Promise<string>((resolve) => {
        socket.once(socketEvents.REJECTED, ({ reason }: { reason: string }) => resolve(reason));
        socket.once(socketEvents.JOINED, () => resolve('joined'));
        socket.emit(socketEvents.JOIN, { room, name: 'User', ownerKey: room });
      });

      socket.close();
      await vi.waitFor(() => expect(proxied.io.sockets.adapter.rooms.has(room)).toBe(false));
      return answer;
    };
    /** Rooms kept in the database */
    const kept = async () =>
      (await proxied.db.selectFrom('room').select('id').orderBy('id').execute()).map(({ id }) => id);

    Object.assign(limits, { roomsPerClient: 2, rooms: 4 });
    try {
      // its own empty room used least recently forgotten
      expect(await visit('203.0.113.20', 'a1')).toBe('joined');
      expect(await visit('203.0.113.20', 'a2')).toBe('joined');
      expect(await visit('203.0.113.20', 'a3')).toBe('joined');
      // room of two clients, of one client
      expect(await visit('203.0.113.21', 'b1')).toBe('joined');
      expect(await visit('203.0.113.22', 'b1')).toBe('joined');
      expect(await visit('203.0.113.23', 'c1')).toBe('joined');
      // full server: room of one client used least recently forgotten, not the room of two clients
      expect(await visit('203.0.113.24', 'd1')).toBe('joined');
      await vi.waitFor(async () => expect(await kept()).toEqual(['a3', 'b1', 'c1', 'd1']));
    } finally {
      Object.assign(limits, saved);
      await proxied.close();
    }
  });

  it('Drawing of a room saved when its last user leaves, given back to the next user joining; presentation told to users joining', async () => {
    const room = 'room-dropped';
    const owner = await joinRoom({ room, name: 'Owner', userId: 'owner-d', ownerKey: 'secret d' });
    const guest = await joinRoom({ room, name: 'Guest', userId: 'guest-d' });
    const savedRooms = async (ids: string[]) =>
      (await server.db.selectFrom('roomDrawing').select('room').where('room', 'in', ids).execute()).map(
        (row) => row.room
      );

    // no presentation: users joining again stop following one
    expect(guest.view).toBeNull();
    owner.socket.emit(socketEvents.CHANGE, { upsert: [rect('d1')], remove: [] });
    await guest.next(socketEvents.CHANGE);
    owner.socket.close();
    guest.socket.close();
    await vi.waitFor(() => expect(server.io.sockets.adapter.rooms.has(room)).toBe(false));

    // given back: a stale copy of a user joining (page left open) does not replace it
    const back = client();
    const drawing = back.next(socketEvents.CHANGE);

    back.socket.emit(socketEvents.JOIN, { room, name: 'Owner', userId: 'owner-d', ownerKey: 'secret d' });
    expect(await drawing).toEqual({ upsert: [rect('d1')], remove: [], order: ['d1'], full: true, kept: true });
    // in memory again, no longer saved; saved again when its last user leaves
    expect(await savedRooms([room])).toEqual([]);
    back.socket.close();
    await vi.waitFor(async () => expect(await savedRooms([room])).toEqual([room]));

    // room never drawn in: no drawing; previews of a shape being drawn are not one, nothing saved
    const first = await joinRoom({ room: 'room-not-drawn', name: 'First', userId: 'first-d', ownerKey: 'secret n' });

    first.socket.emit(socketEvents.CHANGE, { upsert: [rect('d2')], remove: [], live: true });

    const later = client();
    const preview = later.next(socketEvents.CHANGE);

    later.socket.emit(socketEvents.JOIN, { room: 'room-not-drawn', name: 'Later', userId: 'later-d' });
    expect(await preview).toEqual({ upsert: [rect('d2')], remove: [], order: ['d2'], full: true, kept: false });
    first.socket.close();
    later.socket.close();
    await vi.waitFor(() => expect(server.io.sockets.adapter.rooms.has('room-not-drawn')).toBe(false));
    expect(await savedRooms(['room-not-drawn'])).toEqual([]);
  });

  it('Saved drawings of empty rooms within their size: the ones saved first dropped', async () => {
    const { savedSize } = limits;
    const rooms = ['room-saved-1', 'room-saved-2'];
    const savedRooms = async () =>
      (await server.db.selectFrom('roomDrawing').select('room').where('room', 'in', rooms).execute()).map(
        (row) => row.room
      );
    // drawing of a room saved by its user leaving
    const draw = async (room: string) => {
      const user = await joinRoom({ room, name: 'Owner', userId: `owner-${room}`, ownerKey: `secret ${room}` });

      await new Promise((resolve) =>
        user.socket.emit(socketEvents.CHANGE, { upsert: [rect(`shape-${room}`)], remove: [] }, resolve)
      );
      user.socket.close();
      await vi.waitFor(async () => expect(await savedRooms()).toContain(room));
    };

    // one of them
    limits.savedSize = 200;
    try {
      await draw(rooms[0]);
      await draw(rooms[1]);
      expect(await savedRooms()).toEqual([rooms[1]]);
    } finally {
      limits.savedSize = savedSize;
    }
  });

  it('Changes acknowledged; previews of shapes being drawn removed when their author leaves or loses the right', async () => {
    const room = 'room-live';
    const owner = await joinRoom({ room, name: 'Owner', userId: 'owner-l', ownerKey: 'secret l' });

    owner.socket.emit(socketEvents.ROOM, { newUsersCanEdit: true });
    await owner.next(socketEvents.ROOM);

    // received: applied or refused
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await owner.socket.timeout(2000).emitWithAck(socketEvents.CHANGE, { upsert: [rect('e1')], remove: [] });
    await owner.socket.timeout(2000).emitWithAck(socketEvents.CHANGE, { upsert: ['{ not json'] });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Invalid change'));

    const drawingOf = async () => {
      const later = client();
      const drawing = later.next<{ upsert: string[] }>(socketEvents.CHANGE);

      later.socket.emit(socketEvents.JOIN, { room, name: 'Later' });
      const ids = (await drawing).upsert.map((json) => JSON.parse(json).attrs.id);

      later.socket.close();
      return ids;
    };
    /** Live preview of a guest received by the owner */
    const preview = async (user: Awaited<ReturnType<typeof joinRoom>>, ...ids: string[]) => {
      const received = owner.next(socketEvents.CHANGE);

      user.socket.emit(socketEvents.CHANGE, { upsert: ids.map(rect), remove: [], live: true });
      await received;
    };

    // a new shape and a shape of the room moved: only the new one removed when its author leaves
    const guest = await joinRoom({ room, name: 'Guest', userId: 'guest-l' });

    await preview(guest, 'p1', 'e1');
    // final change of a shape: kept
    const final = owner.next(socketEvents.CHANGE);

    guest.socket.emit(socketEvents.CHANGE, { upsert: [rect('p2')], remove: [] });
    await final;
    await preview(guest, 'p2');

    const removed = owner.next(socketEvents.CHANGE);

    guest.socket.close();
    expect(await removed).toEqual({ upsert: [], remove: ['p1'] });
    expect((await drawingOf()).sort()).toEqual(['e1', 'p2']);

    // right removed while drawing: its previews removed (their final change is refused)
    const drawer = await joinRoom({ room, name: 'Drawer', userId: 'drawer-l' });

    await preview(drawer, 'p3');

    const dropped = owner.next(socketEvents.CHANGE);

    owner.socket.emit(socketEvents.RIGHTS, { userId: 'drawer-l', canEdit: false });
    expect(await dropped).toEqual({ upsert: [], remove: ['p3'] });
    expect((await drawingOf()).sort()).toEqual(['e1', 'p2']);
  });

  it('Changes applied, relayed and acknowledged at once: a client gets the changes applied before its own first', async () => {
    const room = 'room-concurrent';
    const owner = await joinRoom({ room, name: 'Owner', userId: 'owner-c', ownerKey: 'secret c' });

    owner.socket.emit(socketEvents.ROOM, { newUsersCanEdit: true });
    await owner.next(socketEvents.ROOM);

    const guest = await joinRoom({ room, name: 'Guest', userId: 'guest-c' });
    const shape = (label: string) => JSON.stringify({ attrs: { id: 'shared', width: 10, label }, className: 'Rect' });
    const kept = async () => {
      const later = client();
      const drawing = later.next<{ upsert: string[] }>(socketEvents.CHANGE);

      later.socket.emit(socketEvents.JOIN, { room, name: 'Later' });
      const [json] = (await drawing).upsert;

      later.socket.close();
      return JSON.parse(json).attrs.label;
    };

    // one shape changed by both at once: the guest keeps its change when the one of the owner reaches it before its
    // acknowledgement (applied before it), as the room
    for (const round of [1, 2, 3, 4, 5]) {
      const events: string[] = [];
      const relayed = new Promise<void>((resolve) =>
        guest.socket.once(socketEvents.CHANGE, () => resolve(void events.push('relayed')))
      );
      const acknowledged = new Promise<void>((resolve) =>
        guest.socket.emit(socketEvents.CHANGE, { upsert: [shape(`guest ${round}`)], remove: [] }, () =>
          resolve(void events.push('acknowledged'))
        )
      );

      owner.socket.emit(socketEvents.CHANGE, { upsert: [shape(`owner ${round}`)], remove: [] });
      await Promise.all([relayed, acknowledged]);
      expect(await kept()).toBe(events[0] === 'relayed' ? `guest ${round}` : `owner ${round}`);
    }
  });

  it('Image files no shape uses released when the drawing would be too big', async () => {
    const saved = { ...limits };
    const file = (size: number) => `data:image/png;base64,${'A'.repeat(size)}`;
    const image = (id: string, fileId: string) =>
      JSON.stringify({ attrs: { id, fileId, width: 10, height: 10 }, className: 'Image' });
    const filesOf = async (room: string, keyCheck?: string) => {
      const later = client();
      const drawing = later.next<{ files?: object }>(socketEvents.CHANGE);

      later.socket.emit(socketEvents.JOIN, { room, name: 'Later', ...(keyCheck && { keyCheck }) });
      const { files } = await drawing;

      later.socket.close();
      return Object.keys(files ?? {});
    };
    /** Change of the owner, applied (relayed to the guest) or refused */
    const send = async (user: Awaited<ReturnType<typeof joinRoom>>, guest: typeof user, change: object) => {
      const answer = Promise.race([
        guest.next(socketEvents.CHANGE).then(() => 'applied'),
        user.next<{ reason: string }>(socketEvents.REJECTED).then(({ reason }) => reason),
      ]);

      user.socket.emit(socketEvents.CHANGE, change);
      return answer;
    };

    Object.assign(limits, { drawingSize: 3_000 });
    try {
      const owner = await joinRoom({ room: 'room-files', name: 'Owner', userId: 'owner-f', ownerKey: 'secret f' });
      const guest = await joinRoom({ room: 'room-files', name: 'Guest', userId: 'guest-f' });

      expect(await send(owner, guest, { upsert: [image('i1', 'f1')], remove: [], files: { f1: file(2000) } })).toBe(
        'applied'
      );
      // image removed: its file kept while there is room
      expect(await send(owner, guest, { upsert: [], remove: ['i1'] })).toBe('applied');
      expect(await filesOf('room-files')).toEqual(['f1']);
      // too big with it: released
      expect(await send(owner, guest, { upsert: [image('i2', 'f2')], remove: [], files: { f2: file(2000) } })).toBe(
        'applied'
      );
      expect(await filesOf('room-files')).toEqual(['f2']);
      // refused even with them released: files kept for the shapes of the room
      expect(await send(owner, guest, { upsert: [image('i3', 'f3')], remove: ['i2'], files: { f3: file(3500) } })).toBe(
        'too-big'
      );
      expect(await filesOf('room-files')).toEqual(['f2']);

      // encrypted room: files of each shape told by the clients
      const keyCheck = `${'f'.repeat(42)}0`;
      const data = 'ZW5jcnlwdGVk';
      const encryptedOwner = await joinRoom({ room: 'room-files-e', name: 'Owner', ownerKey: 'secret fe', keyCheck });
      const encryptedGuest = await joinRoom({ room: 'room-files-e', name: 'Guest', keyCheck });
      const encrypted = (change: object) => send(encryptedOwner, encryptedGuest, change);

      expect(
        await encrypted({ upsert: [{ id: 'e1', data, files: ['k1'] }], remove: [], files: { k1: 'Z'.repeat(2000) } })
      ).toBe('applied');
      expect(
        await encrypted({
          upsert: [{ id: 'e2', data, files: ['k2'] }],
          remove: ['e1'],
          files: { k2: 'Z'.repeat(2000) },
        })
      ).toBe('applied');
      expect(await filesOf('room-files-e', keyCheck)).toEqual(['k2']);
      // a shape of a previous version (files unknown): nothing released
      expect(await encrypted({ upsert: [{ id: 'e3', data }], remove: ['e2'] })).toBe('applied');
      expect(
        await encrypted({ upsert: [{ id: 'e4', data, files: ['k4'] }], remove: [], files: { k4: 'Z'.repeat(2000) } })
      ).toBe('too-big');
    } finally {
      Object.assign(limits, saved);
    }
  });

  it('Owner logged in recognized by their account from another browser (secret kept by the first one)', async () => {
    const { cookie } = await signUp('Owner');
    const room = 'room-account';
    const browser = () => {
      const socket = connect(url, { forceNew: true, extraHeaders: { cookie: cookie.join('; ') } });

      sockets.push(socket);
      return socket;
    };
    const first = browser();
    const created = new Promise((resolve) => first.once(socketEvents.USERS, resolve));

    first.emit(socketEvents.JOIN, { room, name: 'Owner', ownerKey: 'secret of the first browser' });
    await created;
    first.close();

    const guest = await joinRoom({ room, name: 'Guest', userId: 'guest-a' });
    const other = browser();
    const updated = new Promise<User[]>((resolve) =>
      guest.socket.on(socketEvents.USERS, (users: User[]) => {
        if (users.find((user) => user.id === 'guest-a')?.canEdit) resolve(users);
      })
    );

    other.emit(socketEvents.JOIN, { room, name: 'Owner' });
    await new Promise((resolve) => other.once(socketEvents.USERS, resolve));
    other.emit(socketEvents.RIGHTS, { userId: 'guest-a', canEdit: true });
    expect((await updated).find((user) => user.owner)).toMatchObject({ name: 'Owner' });
  });

  it('Rooms are kept after a restart, forgotten after a while without use', async () => {
    const dir = mkdtempSync(joinPath(tmpdir(), 'free-drawing-'));
    const start = async () => {
      const started = await createServer({ ...config, databasePath: joinPath(dir, 'app.db') });

      await new Promise<void>((resolve) => started.httpServer.listen(0, resolve));
      return { ...started, url: `http://localhost:${(started.httpServer.address() as AddressInfo).port}` };
    };

    try {
      const first = await start();
      const owner = await joinRoom(
        { room: 'room-5', name: 'Owner', userId: 'owner-5', ownerKey: 'secret 5' },
        first.url
      );
      const old = new Date(Date.now() - roomLifetime - 60_000).toISOString();

      await new Promise((resolve) =>
        owner.socket.emit(socketEvents.CHANGE, { upsert: [rect('shape-5')], remove: [] }, resolve)
      );
      // room unused for too long
      await first.db
        .insertInto('room')
        .values({ id: 'room-old', content: JSON.stringify({ ownerKey: 'hash', names: [] }), updatedAt: old })
        .execute();
      // stopped with users: drawings of their rooms saved
      await first.close();
      owner.socket.close();

      const second = await start();

      try {
        const reader = client(second.url);
        const drawing = reader.next(socketEvents.CHANGE);

        reader.socket.emit(socketEvents.JOIN, { room: 'room-5', name: 'Reader', userId: 'reader-5' });
        expect(await drawing).toMatchObject({ upsert: [rect('shape-5')], kept: true });
        reader.socket.close();

        const intruder = await joinRoom(
          { room: 'room-5', name: 'Intruder', userId: 'owner-5', ownerKey: 'other secret' },
          second.url
        );
        const newOwner = await joinRoom({ room: 'room-old', name: 'New', ownerKey: 'new secret' }, second.url);

        expect(intruder.users).toEqual([expect.objectContaining({ owner: false })]);
        expect(newOwner.users).toEqual([expect.objectContaining({ owner: true })]);
        intruder.socket.close();
        newOwner.socket.close();
      } finally {
        await second.close();
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
