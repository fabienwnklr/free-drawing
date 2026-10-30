import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import { Drawer, type DrawingFile } from '@fabwcie/free-drawing';
import { App } from '../src/App';
import { ApiError, type DrawingSummary, type User } from '../src/api';
import { local, localDrawings } from '../src/local';
import { Texts } from '../src/texts';

/** Drawing file with a rectangle of this id */
const fileWith = (id: string): DrawingFile => ({
  type: 'free-drawing',
  version: 1,
  background: '#fff',
  shapes: [{ className: 'Rect', attrs: { id, name: 'drawer-rect', width: 10, height: 10 } }],
});

/** Ids of the shapes of a drawing of the browser */
const shapesOf = async (id: string) => (await localDrawings.getDrawing(id)).content.shapes.map(({ attrs }) => attrs.id);

/** Texts of the toasts of the drawer */
const toasts = (app: App) =>
  [...app.drawer.$drawerContainer.querySelectorAll('.drawer-toast')].map(($toast) => $toast.textContent ?? '');

/** Response of the server: status and JSON body */
const respond = (status: number, body: unknown) => ({
  ok: status < 300,
  status,
  statusText: '',
  json: async () => body,
});

// jsdom has no modal dialogs
if (!('showModal' in HTMLDialogElement.prototype)) {
  Object.assign(HTMLDialogElement.prototype, {
    showModal(this: HTMLDialogElement) {
      this.open = true;
    },
    close(this: HTMLDialogElement) {
      this.open = false;
    },
  });
}

const apps: App[] = [];

/** App in the page: with accounts (server) or drawings of the browser only (static site) */
const createApp = (server = false) => {
  const $root = document.createElement('div');

  document.body.append($root);

  const app = new App($root, { server, collaboration: false });

  apps.push(app);
  return app;
};

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '';
  // drawer of the size of the window follows it (jsdom has no ResizeObserver)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    }
  );
});

afterEach(async () => {
  for (const app of apps.splice(0)) await app.drawer.destroy();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Drawings of the app', () => {
  it('A slow load ending after another drawing is opened does not set it back: saves go to the drawing shown', async () => {
    const first = await localDrawings.createDrawing({ name: 'First', content: fileWith('a') });
    const second = await localDrawings.createDrawing({ name: 'Second', content: fileWith('b') });
    const getDrawing = localDrawings.getDrawing;
    let release: (() => void) | undefined;

    local.setLastLocalDrawingId(first.id);
    vi.spyOn(localDrawings, 'getDrawing').mockImplementation(async (id) => {
      if (id === first.id && !release) await new Promise<void>((resolve) => (release = resolve));
      return getDrawing(id);
    });

    const app = createApp();

    await vi.waitFor(() => expect(release).toBeDefined());
    await app.openDrawing(second);
    release!();
    await app.drawer.ready.catch(() => {});
    expect(app.drawing!.id).toBe(second.id);

    await app.drawer.save();
    expect(await shapesOf(first.id)).toEqual(['a']);
    expect(await shapesOf(second.id)).toEqual(['b']);
  });

  it('A failed start is tried again by the next load: the drawing opened then is loaded and saved', async () => {
    vi.spyOn(localDrawings, 'createDrawing').mockRejectedValueOnce(new DOMException('full', 'QuotaExceededError'));

    const app = createApp();

    await expect(app.drawer.ready).rejects.toThrow();
    // storage freed: a new drawing
    await app.newDrawing();
    expect(app.drawing).not.toBeNull();
    app.drawer.addShape(new Rect({ id: 'drawn', name: 'drawer-rect', width: 10, height: 10 }));
    await app.drawer.save();
    expect(await shapesOf(app.drawing!.id)).toEqual(['drawn']);
  });

  it('A drawing saved in another tab is loaded again; saved over it, the changes of this tab are kept in a copy', async () => {
    const drawing = await localDrawings.createDrawing({ name: 'Plan', content: fileWith('a') });
    // save of the other tab, then its storage event in this one
    const saveInOtherTab = (id: string, version: number) =>
      localDrawings.updateDrawing(drawing.id, { content: fileWith(id), version });
    const storageEvent = () =>
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'free-drawing-web-drawings', storageArea: localStorage })
      );

    local.setLastLocalDrawingId(drawing.id);

    const app = createApp();

    await app.drawer.ready;
    await saveInOtherTab('b', 1);
    storageEvent();
    await vi.waitFor(() => expect(app.drawer.getDrawingShapes().map((shape) => shape.id())).toEqual(['b']));
    expect(app.drawing!.version).toBe(2);

    // changed here once the other tab saved it again (before its event): not loaded over these changes, kept in a copy
    // open here
    await saveInOtherTab('c', 2);
    app.drawer.addShape(new Rect({ id: 'mine', name: 'drawer-rect', width: 10, height: 10 }));
    app.drawer.stage.fire('change');
    storageEvent();
    await app.drawer.save();
    await new Promise((resolve) => setTimeout(resolve));
    expect(app.drawer.getDrawingShapes().map((shape) => shape.id())).toEqual(['b', 'mine']);
    expect(await shapesOf(drawing.id)).toEqual(['c']);
    expect(app.drawing).toMatchObject({ name: 'Plan (conflicted copy)', version: 2 });
    expect(await shapesOf(app.drawing!.id)).toEqual(['b', 'mine']);
    expect(local.lastLocalDrawingId()).toBe(app.drawing!.id);
    expect(toasts(app).some((text) => text.includes('changed in another tab'))).toBe(true);
  });

  it('Changes not saved (storage full) kept in a copy before another drawing is opened; nowhere: the drawing stays open', async () => {
    const first = await localDrawings.createDrawing({ name: 'First', content: fileWith('a') });
    const second = await localDrawings.createDrawing({ name: 'Second', content: fileWith('b') });
    const full = () => Promise.reject(new DOMException('full', 'QuotaExceededError'));

    local.setLastLocalDrawingId(first.id);

    const app = createApp();

    await app.drawer.ready;
    vi.spyOn(localDrawings, 'updateDrawing').mockImplementation(full);
    app.drawer.addShape(new Rect({ id: 'mine', name: 'drawer-rect', width: 10, height: 10 }));
    app.drawer.stage.fire('change');
    await app.openDrawing(second);
    expect(app.drawing!.id).toBe(second.id);

    const copy = (await localDrawings.listDrawings()).find(({ name }) => name === 'First (conflicted copy)');

    expect(await shapesOf(copy!.id)).toEqual(['a', 'mine']);
    expect(toasts(app).some((text) => text.includes('kept in a copy of the drawing'))).toBe(true);

    // a copy can't be created either: the drawing stays open with its changes
    vi.spyOn(localDrawings, 'createDrawing').mockImplementation(full);
    app.drawer.addShape(new Rect({ id: 'other', name: 'drawer-rect', width: 10, height: 10 }));
    app.drawer.stage.fire('change');
    await app.openDrawing(first);
    expect(app.drawing!.id).toBe(second.id);
    expect(app.drawer.getDrawingShapes().map((shape) => shape.id())).toEqual(['b', 'other']);
    expect(toasts(app).some((text) => text.includes("can't be saved anywhere"))).toBe(true);
  });

  it('A drawing deleted elsewhere: its changes kept in a new drawing of its name, open in its place', async () => {
    const drawing = await localDrawings.createDrawing({ name: 'Plan', content: fileWith('a') });

    local.setLastLocalDrawingId(drawing.id);

    const app = createApp();

    await app.drawer.ready;
    // deleted in another tab
    await localDrawings.deleteDrawing(drawing.id);
    app.drawer.addShape(new Rect({ id: 'mine', name: 'drawer-rect', width: 10, height: 10 }));
    app.drawer.stage.fire('change');
    await app.drawer.save();
    expect(app.drawing).toMatchObject({ name: 'Plan' });
    expect(app.drawing!.id).not.toBe(drawing.id);
    expect(await shapesOf(app.drawing!.id)).toEqual(['a', 'mine']);
    expect(app.drawer.hasUnsavedChanges()).toBe(false);
    expect(toasts(app).some((text) => text.includes('deleted elsewhere'))).toBe(true);
  });

  it('A drawing link opens in a new drawing: the last drawing is not saved over', async () => {
    const last = await localDrawings.createDrawing({ name: 'Last', content: fileWith('last') });
    const other = new Drawer(document.body.appendChild(document.createElement('div')), {
      localStorageKey: `web-${Math.random()}`,
      autoSave: false,
    });

    other.loadDrawing(fileWith('linked'));
    local.setLastLocalDrawingId(last.id);
    window.location.hash = new URL(await other.getLink()).hash;
    await other.destroy();

    const app = createApp();

    await app.drawer.ready;
    await vi.waitFor(() => expect(app.drawer.getDrawingShapes().map((shape) => shape.id())).toEqual(['linked']));
    await app.drawer.save();
    expect(app.drawing!.id).not.toBe(last.id);
    expect(await shapesOf(last.id)).toEqual(['last']);
    expect(await shapesOf(app.drawing!.id)).toEqual(['linked']);
  });
});

describe('Account of the app', () => {
  const user: User = { id: 'u1', name: 'Ada', email: 'ada@example.com' };
  const drawing: DrawingSummary = { id: 'd1', name: 'Plan', createdAt: '2026-01-01', updatedAt: '2026-01-01' };

  /**
   * Server of the app: user signed in with a drawing, session ended at will, preferences answered at will
   * @returns Calls of the server (method and path), session state, answer of the preferences
   */
  const stubServer = () => {
    const server = {
      signedIn: true,
      calls: [] as string[],
      preferences: Promise.resolve<object>({}),
    };

    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string, init?: RequestInit) => {
        const method = init?.method ?? 'GET';

        server.calls.push(`${method} ${path}`);
        if (path === '/api/auth/sign-out') return respond(200, {});
        if (!server.signedIn) return respond(401, { error: 'not logged in' });
        if (path === '/api/me') return respond(200, user);
        if (path === '/api/preferences') return respond(200, method === 'GET' ? await server.preferences : {});
        if (path === '/api/drawings') return respond(200, [drawing]);
        if (path === '/api/drawings/d1') {
          return respond(200, method === 'GET' ? { ...drawing, content: fileWith('a') } : drawing);
        }
        return respond(404, { error: 'not found' });
      })
    );
    return server;
  };

  it('Session ended elsewhere: saves fail with a translated reason, signed in again from the account button; changes kept in the browser on sign out', async () => {
    const server = stubServer();
    const app = createApp(true);

    await app.drawer.ready;
    await vi.waitFor(() => expect(app.user).toEqual(user));

    server.signedIn = false;
    app.drawer.addShape(new Rect({ id: 'drawn', name: 'drawer-rect', width: 10, height: 10 }));
    app.drawer.stage.fire('change');
    await app.drawer.save();
    expect(app.sessionEnded).toBe(true);
    expect(toasts(app).some((text) => text.includes('sign in again'))).toBe(true);
    expect(app.$accountButton.textContent).toContain('Sign in');
    app.$accountButton.click();
    expect(app.accountDialog.$dialog.open).toBe(true);
    expect(app.accountDialog.$email.value).toBe(user.email);
    app.accountDialog.$dialog.close();

    // signed out: changes not saved kept in a drawing of the browser, opened
    await app.logout();
    expect(app.user).toBeNull();
    expect(await shapesOf(app.drawing!.id)).toEqual(['a', 'drawn']);
    expect(app.drawer.getDrawingShapes().map((shape) => shape.id())).toEqual(['a', 'drawn']);
  });

  it('Session ended, then signed in again with this account in another tab: changes saved once the page is shown', async () => {
    const server = stubServer();
    const app = createApp(true);

    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    await app.drawer.ready;
    await vi.waitFor(() => expect(app.user).toEqual(user));
    server.signedIn = false;
    app.drawer.addShape(new Rect({ id: 'drawn', name: 'drawer-rect', width: 10, height: 10 }));
    app.drawer.stage.fire('change');
    await app.drawer.save();
    expect(app.sessionEnded).toBe(true);

    server.signedIn = true;
    server.calls.length = 0;
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.waitFor(() => expect(app.drawer.hasUnsavedChanges()).toBe(false));
    expect(app.sessionEnded).toBe(false);
    expect(server.calls).toContain('PUT /api/drawings/d1');
  });

  it('Drawing saved on another device: loaded again when the page is shown, saved over it in a copy', async () => {
    // drawing of the server, saved with its version (409 for another one), copies created
    const stored = { ...drawing, version: 1, content: fileWith('a') };
    const copies: DrawingSummary[] = [];

    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string, init?: RequestInit) => {
        const method = init?.method ?? 'GET';
        const body = init?.body ? JSON.parse(init.body as string) : {};
        const summary = () => ({ ...drawing, version: stored.version });

        if (path === '/api/me') return respond(200, user);
        if (path === '/api/preferences') return respond(200, {});
        if (path === '/api/drawings' && method === 'POST') {
          copies.push({ ...drawing, id: `copy-${copies.length}`, name: body.name, version: 1 });
          return respond(201, copies.at(-1));
        }
        if (path === '/api/drawings') return respond(200, [summary(), ...copies]);
        if (path === '/api/drawings/d1' && method === 'GET') return respond(200, stored);
        if (path === '/api/drawings/d1') {
          if (body.version !== stored.version) return respond(409, { code: 'DRAWING_CHANGED' });
          Object.assign(stored, { content: body.content, version: stored.version + 1 });
          return respond(200, summary());
        }
        return respond(200, { ...copies[0], version: 2 });
      })
    );

    const app = createApp(true);
    const show = () => document.dispatchEvent(new Event('visibilitychange'));

    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    await app.drawer.ready;
    await vi.waitFor(() => expect(app.user).toEqual(user));

    Object.assign(stored, { content: fileWith('b'), version: 2 });
    show();
    await vi.waitFor(() => expect(app.drawer.getDrawingShapes().map((shape) => shape.id())).toEqual(['b']));
    expect(app.drawing!.version).toBe(2);

    // saved again on the other device: changes of this page kept in a copy of the account
    Object.assign(stored, { content: fileWith('c'), version: 3 });
    app.drawer.addShape(new Rect({ id: 'mine', name: 'drawer-rect', width: 10, height: 10 }));
    app.drawer.stage.fire('change');
    await app.drawer.save();
    expect(stored.content).toEqual(fileWith('c'));
    expect(app.drawing).toMatchObject({ id: 'copy-0', name: 'Plan (conflicted copy)' });
    expect(app.drawer.getDrawingShapes().map((shape) => shape.id())).toEqual(['b', 'mine']);
  });

  it('Another account signed in from another tab: requests made for this account refused, told when the page is shown', async () => {
    // account of the session cookie
    let session: User = user;
    const expected: (string | undefined)[] = [];

    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string, init?: RequestInit) => {
        const id = (init?.headers as Record<string, string> | undefined)?.['X-Free-Drawing-User'];

        expected.push(id);
        if (id && id !== session.id)
          return respond(401, { error: 'signed in with another account', code: 'OTHER_ACCOUNT' });
        if (path === '/api/me') return respond(200, session);
        if (path === '/api/preferences') return respond(200, {});
        if (path === '/api/drawings') return respond(200, [drawing]);
        if (path === '/api/drawings/d1') return respond(200, { ...drawing, content: fileWith('a') });
        return respond(404, { error: 'not found' });
      })
    );

    const app = createApp(true);

    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    await app.drawer.ready;
    await vi.waitFor(() => expect(app.user).toEqual(user));
    expect(expected).toContain(user.id);

    session = { id: 'u2', name: 'Bob', email: 'bob@example.com' };
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.waitFor(() => expect(app.sessionEnded).toBe(true));
    expect(toasts(app).some((text) => text.includes('another account in another tab'))).toBe(true);
    // not saved in the other account
    app.drawer.addShape(new Rect({ id: 'mine', name: 'drawer-rect', width: 10, height: 10 }));
    app.drawer.stage.fire('change');
    await app.drawer.save();
    expect(app.drawer.hasUnsavedChanges()).toBe(true);
  });

  it('Email changed with the password of the account, asked once the email is changed', async () => {
    const account = { ...user };
    let sent: unknown;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string, init?: RequestInit) => {
        if (path === '/api/me') return respond(200, account);
        if (path === '/api/preferences') return respond(200, {});
        if (path === '/api/drawings') return respond(200, [drawing]);
        if (path === '/api/drawings/d1') return respond(200, { ...drawing, content: fileWith('a') });
        if (path === '/api/auth/change-email') {
          sent = JSON.parse(init!.body as string);
          account.email = (sent as { newEmail: string }).newEmail;
          return respond(200, { status: true });
        }
        return respond(404, { error: 'not found' });
      })
    );

    const app = createApp(true);
    const dialog = app.profileDialog;
    const field = (name: string) => dialog.$profile.elements.namedItem(name) as HTMLInputElement;
    const passwordShown = () => !field('password').closest('label')!.hidden;

    await app.drawer.ready;
    await vi.waitFor(() => expect(app.user).toEqual(user));
    dialog.show();
    expect([passwordShown(), field('password').required]).toEqual([false, false]);

    field('email').value = 'ada@new.example';
    field('email').dispatchEvent(new Event('input'));
    expect([passwordShown(), field('password').required]).toEqual([true, true]);
    expect(field('password').closest('label')!.textContent).toContain('Current password');

    field('password').value = 'secret password';
    dialog.$profile.dispatchEvent(new Event('submit', { cancelable: true }));
    // saved: email of the account, password no longer asked
    await vi.waitFor(() => expect([passwordShown(), field('password').value]).toEqual([false, '']));
    expect(sent).toEqual({ newEmail: 'ada@new.example', password: 'secret password' });
    expect(app.user!.email).toBe('ada@new.example');
    dialog.$dialog.close();
  });

  it('Preferences changed before the ones of the account are read: not saved over them', async () => {
    const server = stubServer();
    let answer: (preferences: object) => void = () => {};

    server.preferences = new Promise((resolve) => (answer = resolve));

    const app = createApp(true);

    await vi.waitFor(() => expect(server.calls).toContain('GET /api/preferences'));
    app.drawer.setPreferences({ gridStyle: 'dots' });
    await new Promise((resolve) => setTimeout(resolve));
    expect(server.calls).not.toContain('PUT /api/preferences');

    answer({ gridStyle: 'lines' });
    await vi.waitFor(() => expect(app.drawer.getPreferences().gridStyle).toBe('lines'));
  });
});

describe('Errors of the app', () => {
  it('Errors of My drawings and of the drawings of the browser explained in the language of the drawer', async () => {
    const app = createApp();

    await app.drawer.ready;
    vi.spyOn(localDrawings, 'listDrawings').mockRejectedValue(
      new DOMException('The quota has been exceeded.', 'QuotaExceededError')
    );
    await app.drawingsDialog.show();
    expect(toasts(app).some((text) => text.includes('browser storage full'))).toBe(true);
    // drawing of the browser missing: as on the server
    await expect(localDrawings.getDrawing('missing')).rejects.toMatchObject({ status: 404 });
  });
});

describe('Texts of the app', () => {
  it('Errors of the server explained in the language of the drawer', () => {
    const texts = new Texts({ language: 'fr' } as Drawer);

    expect(texts.reason(new ApiError('Too many requests', 429))).toBe(
      'Trop de tentatives : patientez un moment et réessayez'
    );
    expect(texts.reason(new ApiError('not logged in', 401))).toContain('reconnectez-vous');
    expect(texts.reason(new ApiError('drawing not found', 404))).toContain('Introuvable');
    expect(texts.reason(new ApiError('Password too long', 400, 'PASSWORD_TOO_LONG'))).toBe('Mot de passe trop long');
    // wrong password: its own text, not the one of an ended session
    expect(texts.reason(new ApiError('Invalid', 401, 'INVALID_EMAIL_OR_PASSWORD'))).toBe(
      'Email ou mot de passe incorrect'
    );
    expect(texts.reason(new Error('other'))).toBe('other');
  });
});
