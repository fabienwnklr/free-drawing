import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Kysely } from 'kysely';
import { io as connect, type Socket } from 'socket.io-client';
import type { AddressInfo } from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join as joinPath } from 'node:path';
import { socketEvents } from '@free-drawing/protocol';
import { createServer } from '../src/app';
import { type ServerConfig, getConfig } from '../src/config';
import { drawingsLimits } from '../src/api';
import { limits, roomLifetime } from '../src/collaboration';

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
    expect(getConfig({ TRUST_PROXY: '1' }).trustProxy).toBe(1);
    expect(getConfig({ TRUST_PROXY: 'loopback, 10.0.0.0/8' }).trustProxy).toBe('loopback, 10.0.0.0/8');
  });
});

describe('Accounts', () => {
  it('API needs a session', async () => {
    expect((await request(server.app).get('/api/me')).status).toBe(401);
    expect((await request(server.app).get('/api/drawings')).status).toBe(401);
    expect((await request(server.app).put('/api/preferences').send({})).status).toBe(401);
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
});

describe('Account', () => {
  it('Name, email and password changed', async () => {
    const { agent, email } = await signUp('Ada');
    const post = (path: string, body: object) =>
      agent.post(`/api/auth${path}`).set('Origin', config.baseURL).send(body);

    expect((await post('/update-user', { name: 'Ada L.' })).status).toBe(200);
    expect((await agent.get('/api/me')).body.name).toBe('Ada L.');

    const newEmail = `new${++count}@example.com`;

    expect((await post('/change-email', { newEmail })).status).toBe(200);
    expect((await agent.get('/api/me')).body.email).toBe(newEmail);
    // email of another account: not changed (not told, like Better Auth)
    const other = await signUp();

    expect((await post('/change-email', { newEmail: other.email })).status).toBe(200);
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
      other: 1,
    });

    expect(res.body).toEqual({
      theme: 'dark',
      language: 'fr',
      grid: true,
      zen: true,
      autoSave: false,
      keepTool: false,
    });
    expect((await agent.get('/api/preferences')).body).toEqual({
      theme: 'dark',
      language: 'fr',
      grid: true,
      zen: true,
      autoSave: false,
      keepTool: false,
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

  it('Invalid drawings and bodies refused', async () => {
    const { agent } = await signUp();
    const { id } = (await agent.post('/api/drawings').send({})).body;

    expect((await agent.post('/api/drawings').send({ content: { shapes: [] } })).status).toBe(400);
    expect((await agent.put(`/api/drawings/${id}`).send({ content: 'text' })).status).toBe(400);
    expect((await agent.put(`/api/drawings/${id}`).set('Content-Type', 'application/json').send('{ bad')).status).toBe(
      400
    );

    const huge = { ...drawing, shapes: [{ className: 'Text', attrs: { text: 'x'.repeat(6 * 1024 * 1024) } }] };

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

  /** Client joined to a room: its id and users of the room */
  const joinRoom = async (message: object, server = url) => {
    const user = client(server);
    const joined = user.next<{ userId: string }>(socketEvents.JOINED);
    const users = user.next<User[]>(socketEvents.USERS);

    user.socket.emit(socketEvents.JOIN, message);
    return { ...user, userId: (await joined).userId, users: await users };
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
    expect(await settingOn).toEqual({ newUsersCanEdit: true });

    const editor = await joinRoom({ room: 'room-3', name: 'Editor', userId: 'editor-3' });

    expect(canEdit(editor.users, 'editor-3')).toBe(true);

    // off again: new users view only, also users coming back with a new id
    const settingOff = editor.next<{ newUsersCanEdit: boolean }>(socketEvents.ROOM);

    owner.socket.emit(socketEvents.ROOM, { newUsersCanEdit: false });
    expect(await settingOff).toEqual({ newUsersCanEdit: false });
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
    expect(await drawing).toEqual({ upsert: [rect('r1')], remove: [], order: ['r1'], full: true });

    // also empty: users joining again know the drawing of the room was lost
    const empty = client();
    const nothing = empty.next(socketEvents.CHANGE);

    empty.socket.emit(socketEvents.JOIN, { room: 'room-6-empty', name: 'Empty', userId: 'empty-6' });
    expect(await nothing).toEqual({ upsert: [], remove: [], order: [], full: true });

    // pointer: position only
    const pointers = guest.next<{ position: unknown }>(socketEvents.POINTER);

    owner.socket.emit(socketEvents.POINTER, { x: 10, y: 20, laser: true, junk: 'x' });
    expect((await pointers).position).toEqual({ x: 10, y: 20, laser: true });

    const invalid = guest.next<{ position: unknown }>(socketEvents.POINTER);

    owner.socket.emit(socketEvents.POINTER, { x: 'big', y: 20 });
    expect((await invalid).position).toBeNull();
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
    expect(await drawing).toEqual({ upsert: [], remove: [], order: [], full: true, background: '#f5faff' });
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
      expect(await tooBig).toEqual({ event: socketEvents.CHANGE, reason: 'too-big' });
      owner.socket.emit(socketEvents.CHANGE, { upsert: [rect('a'), rect('b')], remove: [] });
      expect((await relayed).upsert).toEqual([rect('a'), rect('b')]);

      // as many shapes: allowed
      const replaced = guest.next<{ upsert: string[]; remove: string[] }>(socketEvents.CHANGE);

      owner.socket.emit(socketEvents.CHANGE, { upsert: [rect('c')], remove: ['a'] });
      expect(await replaced).toEqual({ upsert: [rect('c')], remove: ['a'] });

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

      // room unused for too long
      await first.db
        .insertInto('room')
        .values({ id: 'room-old', content: JSON.stringify({ ownerKey: 'hash', names: [] }), updatedAt: old })
        .execute();
      owner.socket.close();
      await first.close();

      const second = await start();

      try {
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
