import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { io as connect, type Socket } from 'socket.io-client';
import type { AddressInfo } from 'node:net';
import { socketEvents } from '@free-drawing/protocol';
import { createServer } from '../src/app';
import type { ServerConfig } from '../src/config';

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
    sockets.forEach((socket) => socket.close());
    server.httpServer.close();
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

  /** Socket of a new client, next message of an event */
  const client = () => {
    const socket = connect(url, { forceNew: true });
    const next = <T>(event: string) => new Promise<T>((resolve) => socket.once(event, resolve));

    sockets.push(socket);
    return { socket, next };
  };

  /** Client joined to a room: its id and users of the room */
  const joinRoom = async (message: object) => {
    const user = client();
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

    // rights from the impostor ignored, from the owner applied
    impostor.socket.emit(socketEvents.RIGHTS, { userId: 'guest-2', canEdit: false });
    const updated = owner.next<User[]>(socketEvents.USERS);

    owner.socket.emit(socketEvents.RIGHTS, { userId: impostor.userId, canEdit: false });
    expect((await updated).map(({ id, canEdit }) => [id, canEdit])).toEqual([
      ['owner-1', true],
      ['guest-2', true],
      [impostor.userId, false],
    ]);
    expect(guest.userId).toBe('guest-2');
  });

  it('Owner makes new users view only, also users coming back with a new id', async () => {
    const owner = await joinRoom({ room: 'room-3', name: 'Owner', userId: 'owner-3', ownerKey: 'secret 3' });
    const known = await joinRoom({ room: 'room-3', name: 'Known', userId: 'known-3' });
    const setting = known.next<{ newUsersCanEdit: boolean }>(socketEvents.ROOM);

    // not the owner: ignored
    known.socket.emit(socketEvents.ROOM, { newUsersCanEdit: false });
    owner.socket.emit(socketEvents.ROOM, { newUsersCanEdit: false });
    expect(await setting).toEqual({ newUsersCanEdit: false });

    const newcomer = await joinRoom({ room: 'room-3', name: 'New', userId: 'new-3' });
    const canEdit = (users: User[], id: string) => users.find((user) => user.id === id)?.canEdit;

    expect(canEdit(newcomer.users, 'new-3')).toBe(false);
    // users who came before keep their right
    known.socket.close();
    const back = await joinRoom({ room: 'room-3', name: 'Known', userId: 'known-3' });

    expect(canEdit(back.users, 'known-3')).toBe(true);

    // turned on again: new users draw
    const settingOn = back.next<{ newUsersCanEdit: boolean }>(socketEvents.ROOM);

    owner.socket.emit(socketEvents.ROOM, { newUsersCanEdit: true });
    expect(await settingOn).toEqual({ newUsersCanEdit: true });
    expect(canEdit((await joinRoom({ room: 'room-3', name: 'Other', userId: 'other-3' })).users, 'other-3')).toBe(true);
  });
});
