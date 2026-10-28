import { describe, expect, it, beforeAll, vi } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import { Drawer } from '@/Drawer';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { Collaboration } from '@/components/Collaboration/Collaboration';
import type { CollaborationSocket, DrawingChange, EncryptedShape } from '@/@types/collaboration';
import { RoomCipher, createRoomKey } from '@/utils/encryption';
import { createFrame } from '@/utils/frame';
import { slideMaskName } from '@/components/Slideshow/Slideshow';
import { createDrawer, fireMouse, keydown, setPointer } from './helpers';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import type { Group } from 'konva/lib/Group';
import type { Shape, ShapeConfig } from 'konva/lib/Shape';
import type { Text } from 'konva/lib/shapes/Text';
import type { Line } from 'konva/lib/shapes/Line';

const tick = () => new Promise((resolve) => setTimeout(resolve));

/** Image file of 1 x 1 pixel */
const pngData =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
// after live messages interval
const wait = () => new Promise((resolve) => setTimeout(resolve, 80));

beforeAll(() => {
  function noOp() {}

  if (typeof window.URL.createObjectURL === 'undefined') {
    Object.defineProperty(window.URL, 'createObjectURL', { value: noOp });
  }
});

type FakeSocket = CollaborationSocket & {
  receive: (event: string, data?: unknown) => void;
  /** Id of logged in account: server gives it instead of id of client */
  account?: string;
  emit: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  room?: string;
  name?: string;
  id: string;
  userId?: string;
  invitedBy?: string;
  owner?: boolean;
};

/**
 * Rooms of users, as server/index.mjs: changes relayed to users of the same room,
 * drawing of the room sent to joining users, names of users sent to the room
 */
const createServer = () => {
  const sockets: FakeSocket[] = [];
  type Room = {
    /** JSON of shapes, `{ id, data }` in an encrypted room */
    shapes: Map<string, string | EncryptedShape>;
    keyCheck?: string;
    ownerKey?: string;
    ownerId?: string;
    viewers: Set<string>;
    names: Map<string, string>;
    newUsersCanEdit: boolean;
    view?: unknown;
    requests: Set<string>;
    background?: string;
    files?: Map<string, string>;
    /** Drawing sent by users: an empty one was emptied by them */
    kept?: boolean;
  };
  const rooms = new Map<string, Room>();
  let lastId = 0;
  const inRoom = (room?: string) => sockets.filter((s) => s.room === room);
  const sendUsers = (room?: string) => {
    const data = rooms.get(room!)!;
    const users = inRoom(room).map((user) => ({
      id: user.userId,
      name: user.name || 'Anonymous',
      owner: user.userId === data.ownerId,
      canEdit: !data.viewers.has(user.userId!),
      invitedBy: user.invitedBy && data.names.get(user.invitedBy),
    }));

    for (const s of inRoom(room)) s.receive('USERS', users);
  };

  /** New socket, connected when `receive('connect')` */
  const createSocket = () => {
    const handlers: Record<string, ((data?: unknown) => void)[]> = {};
    const listen = (event: string, handler: (data?: unknown) => void) => {
      handlers[event] = [...(handlers[event] ?? []), handler];
    };
    const socket = {
      on: listen,
      once: listen,
      receive: (event: string, data?: unknown) => {
        for (const handler of handlers[event] ?? []) handler(data);
      },
      disconnect: vi.fn(() => {
        sockets.splice(sockets.indexOf(socket), 1);
        for (const s of inRoom(socket.room)) s.receive('LEAVE', socket.id);
        sendUsers(socket.room);
      }),
      emit: vi.fn((event: string, data: unknown) => {
        if (event === 'JOIN') {
          const { room, name, userId, ownerKey, invitedBy, keyCheck } = data as {
            room: string;
            name: string;
            userId: string;
            ownerKey?: string;
            invitedBy?: string;
            keyCheck?: string;
          };
          const roomData = rooms.get(room) ?? {
            shapes: new Map<string, string | EncryptedShape>(),
            viewers: new Set<string>(),
            names: new Map<string, string>(),
            newUsersCanEdit: true,
            requests: new Set<string>(),
            keyCheck,
          };

          // encrypted room: proof of its key only
          if (roomData.keyCheck !== keyCheck) {
            socket.receive('REJECTED', { event: 'JOIN', reason: 'key' });
            return;
          }

          if (ownerKey) roomData.ownerKey ??= ownerKey;
          const owner = !!ownerKey && roomData.ownerKey === ownerKey;
          // id of the owner taken only with its secret
          const free = userId && (owner || userId !== roomData.ownerId);

          Object.assign(socket, {
            room,
            name,
            owner,
            userId: socket.account ?? (free ? userId : socket.id),
            invitedBy,
          });
          rooms.set(room, roomData);
          if (owner) roomData.ownerId = socket.userId;
          else if (!roomData.names.has(socket.userId!) && !roomData.newUsersCanEdit)
            roomData.viewers.add(socket.userId!);
          roomData.names.set(socket.userId!, name);
          socket.receive('JOINED', { userId: socket.userId });
          socket.receive('ROOM', { newUsersCanEdit: roomData.newUsersCanEdit, encrypted: !!roomData.keyCheck });
          socket.receive('CHANGE', {
            upsert: [...roomData.shapes.values()],
            remove: [],
            order: [...roomData.shapes.keys()],
            full: true,
            ...(roomData.kept && { kept: true }),
            ...(roomData.background && { background: roomData.background }),
            ...(roomData.files?.size && { files: Object.fromEntries(roomData.files) }),
          });
          sendUsers(room);
          // none: a presentation stopped meanwhile is no longer followed
          socket.receive('VIEW', roomData.view ?? null);
        } else if (event === 'RIGHTS') {
          const { userId, canEdit } = data as { userId: string; canEdit: boolean };
          const roomData = rooms.get(socket.room!)!;

          if (!socket.owner || userId === roomData.ownerId) return;
          if (canEdit) roomData.viewers.delete(userId);
          else roomData.viewers.add(userId);
          sendUsers(socket.room);
        } else if (event === 'ROOM') {
          const { newUsersCanEdit } = data as { newUsersCanEdit: boolean };

          if (!socket.owner) return;
          const roomData = rooms.get(socket.room!)!;

          roomData.newUsersCanEdit = newUsersCanEdit;
          for (const s of inRoom(socket.room)) s.receive(event, { newUsersCanEdit, encrypted: !!roomData.keyCheck });
        } else if (event === 'VIEW') {
          // owner presenting its view
          if (!socket.owner) return;
          rooms.get(socket.room!)!.view = data;
          for (const s of inRoom(socket.room).filter((s) => s !== socket)) s.receive(event, data);
        } else if (event === 'REQUEST') {
          const roomData = rooms.get(socket.room!)!;
          const { requests } = roomData;

          if (!socket.owner) {
            // viewer asking to draw, once until answered
            if (!roomData.viewers.has(socket.userId!) || requests.has(socket.userId!)) return;
            requests.add(socket.userId!);
            for (const s of inRoom(socket.room).filter((s) => s.owner)) {
              s.receive(event, { userId: socket.userId, name: socket.name });
            }
            return;
          }

          const { userId, accepted } = data as { userId: string; accepted: boolean };

          if (!requests.delete(userId)) return;
          if (accepted) {
            roomData.viewers.delete(userId);
            sendUsers(socket.room);
          } else {
            for (const s of inRoom(socket.room).filter((s) => s.userId === userId))
              s.receive(event, { accepted: false });
          }
        } else if (event === 'NAME') {
          socket.name = data as string;
          rooms.get(socket.room!)!.names.set(socket.userId!, socket.name);
          sendUsers(socket.room);
        } else if (event === 'POINTER') {
          // encrypted room: `{ data }`
          const pointer = data && typeof data === 'object' && 'data' in data ? { data: data.data } : { position: data };

          for (const s of inRoom(socket.room).filter((s) => s !== socket)) {
            s.receive(event, { id: socket.id, name: socket.name, ...pointer });
          }
        } else if (event === 'CHANGE') {
          const change = data as DrawingChange;
          const roomData = rooms.get(socket.room!)!;
          const { shapes, viewers } = roomData;

          // without right to draw: refused
          if (viewers.has(socket.userId!)) {
            const upsert = (change.upsert as (string | EncryptedShape)[]).map((json) =>
              typeof json === 'string' ? JSON.parse(json).attrs.id : json.id
            );

            if (!change.live) socket.receive('REJECTED', { event, reason: 'right', upsert, remove: change.remove });
            return;
          }

          if (change.background && !change.live) roomData.background = change.background;
          roomData.kept = true;
          roomData.files ??= new Map();
          for (const [id, file] of Object.entries(change.files ?? {})) roomData.files.set(id, file);
          for (const id of change.remove) shapes.delete(id);
          for (const json of change.upsert as (string | EncryptedShape)[]) {
            shapes.set(typeof json === 'string' ? JSON.parse(json).attrs.id : json.id, json);
          }
          if (change.order) {
            const ordered = new Map(change.order.filter((id) => shapes.has(id)).map((id) => [id, shapes.get(id)!]));

            for (const [id, json] of shapes) ordered.set(id, json);
            roomData.shapes = ordered;
          }
          for (const s of inRoom(socket.room).filter((s) => s !== socket)) {
            s.receive(event, change);
          }
        }
      }),
    } as unknown as FakeSocket;

    socket.id = `socket-${++lastId}`;
    Object.assign(socket, { volatile: { emit: (event: string, data: unknown) => socket.emit(event, data) } });
    sockets.push(socket);
    return socket;
  };

  /** Drawer collaborating in a room */
  const connect = (
    drawer: Drawer,
    room = 'room',
    name = '',
    ids: { userId?: string; ownerKey?: string; invitedBy?: string; cipher?: RoomCipher } = {}
  ) => {
    const socket = createSocket();

    drawer.collaboration = new Collaboration(drawer, socket, { room, name, ...ids });
    socket.receive('connect');

    return socket;
  };

  return Object.assign(connect, { createSocket, rooms });
};

const addText = (drawer: Drawer, text: string) => {
  const node = drawer.getWidget<TextWidget>('text')!.addTextNode(text);
  drawer.getWidget<SelectWidget>('selection')!.clearSelection();
  drawer.stage.fire('change');
  return node;
};

// shapes of these tests
const byId = (drawer: Drawer, id: string) =>
  drawer.getDrawingShapes().find((s) => s.id() === id) as Shape<ShapeConfig> | undefined;

describe('Collaboration', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Drawing shapes get a unique id, also shapes of a saved drawing of previous versions', () => {
    const drawer = createDrawer();
    const first = drawer.addShape(new Rect({ width: 10, height: 10 }));
    const second = drawer.addShape(new Rect({ width: 10, height: 10 }));

    expect(first.id()).toBeTruthy();
    expect(second.id()).not.toBe(first.id());

    // saved without id
    first.setAttr('id', undefined);
    drawer.save();
    const loaded = createDrawer({ localStorageKey: drawer.options.localStorageKey });
    expect(loaded.getDrawingShapes().every((s) => s.id())).toBe(true);
  });

  it('Image files sent once, with the first shape using them, also to users joining later', async () => {
    const connect = createServer();
    const a = createDrawer();
    const b = createDrawer();
    const socketA = connect(a);

    connect(b);
    socketA.emit.mockClear();

    const image = (await a.addImage({ data: pngData, width: 40, height: 20 }))!;
    const files = (change: unknown) => (change as DrawingChange).files;
    const sent = () => socketA.emit.mock.calls.filter(([event]) => event === 'CHANGE').map(([, change]) => change);
    const copy = byId(b, image.id())!;

    expect(Object.keys(files(sent()[0]) ?? {})).toEqual([image.getAttr('fileId')]);
    expect(b.files.get(image.getAttr('fileId'))).toBe(pngData);
    expect((copy as unknown as { image: () => HTMLImageElement }).image().src).toBe(pngData);

    // moved: file not sent again, element of the copy kept
    socketA.emit.mockClear();
    image.x(300);
    a.stage.fire('change');
    expect(sent()).toHaveLength(1);
    expect(files(sent()[0])).toBeUndefined();
    expect(copy.x()).toBe(300);
    expect((copy as unknown as { image: () => HTMLImageElement }).image().src).toBe(pngData);

    // joining later: files of the room
    const c = createDrawer();

    connect(c);
    expect(c.files.get(image.getAttr('fileId'))).toBe(pngData);
    expect((byId(c, image.id()) as unknown as { image: () => HTMLImageElement }).image().src).toBe(pngData);
  });

  it('Drawing changes are sent to other drawers, shape by shape', () => {
    const connect = createServer();
    const a = createDrawer();
    const b = createDrawer();
    const socketA = connect(a);
    const socketB = connect(b);

    const text = addText(a, 'hello');
    const copy = byId(b, text.id())!;
    expect(copy.getClassName()).toBe('Text');
    expect(copy.getAttr('text')).toBe('hello');

    // update: same node, removed attributes are removed
    text.setAttrs({ x: 120, fill: undefined });
    a.stage.fire('change');
    expect(byId(b, text.id())).toBe(copy);
    expect(copy.x()).toBe(120);
    expect(copy.fill()).toBeUndefined();

    // nothing sent without drawing change, nor back by receiver
    socketA.emit.mockClear();
    socketB.emit.mockClear();
    a.stage.fire('change');
    expect(socketA.emit).not.toHaveBeenCalled();
    expect(socketB.emit).not.toHaveBeenCalled();

    // removed (eraser, delete...), also from selection
    b.getWidget<SelectWidget>('selection')!.transformer.nodes([copy]);
    text.destroy();
    a.stage.fire('change');
    expect(byId(b, text.id())).toBeUndefined();
    expect(b.getWidget<SelectWidget>('selection')!.transformer.nodes()).toEqual([]);
  });

  it('Changes received during a pointer action are applied when it ends', () => {
    const connect = createServer();
    const a = createDrawer();
    const b = createDrawer();
    connect(a);
    connect(b);

    // b is drawing
    fireMouse(b, 'mousedown', 10, 10);
    const text = addText(a, 'hello');
    expect(byId(b, text.id())).toBeUndefined();

    fireMouse(b, 'mouseup', 50, 50);
    expect(byId(b, text.id())).toBeDefined();
    // b line sent to a
    expect(a.getDrawingShapes().length).toBe(2);
  });

  it('Undo and redo are sent and saved', () => {
    const connect = createServer();
    const a = createDrawer({ autoSave: true });
    const b = createDrawer();
    connect(a);
    connect(b);
    const text = addText(a, 'hello');

    a.undoRedo.undo();
    expect(byId(b, text.id())).toBeUndefined();
    expect(localStorage.getItem(a.options.localStorageKey)).not.toContain(text.id());
    // history kept
    expect(a.undoRedo.canRedo()).toBe(true);

    a.undoRedo.redo();
    expect(byId(b, text.id())).toBeDefined();
  });

  it('Undo and redo change shapes of this user only, changes of other users are kept', () => {
    const connect = createServer();
    const a = createDrawer();
    const b = createDrawer();
    connect(a);
    connect(b);
    const mine = addText(a, 'mine');
    const x = mine.x();
    const theirs = addText(b, 'theirs');

    mine.x(x + 100);
    a.stage.fire('change');
    theirs.setAttr('text', 'changed');
    b.stage.fire('change');

    // move of a undone, not the text changed by b after it
    a.undoRedo.undo();
    for (const drawer of [a, b]) {
      expect(byId(drawer, mine.id())!.x()).toBe(x);
      expect(byId(drawer, theirs.id())!.getAttr('text')).toBe('changed');
    }

    // shapes of b are not changes of a
    a.undoRedo.undo();
    expect(a.undoRedo.canUndo()).toBe(false);
    for (const drawer of [a, b]) {
      expect(byId(drawer, mine.id())).toBeUndefined();
      expect(byId(drawer, theirs.id())).toBeDefined();
    }

    a.undoRedo.redo();
    a.undoRedo.redo();
    for (const drawer of [a, b]) {
      expect(byId(drawer, mine.id())!.x()).toBe(x + 100);
      expect(byId(drawer, theirs.id())!.getAttr('text')).toBe('changed');
      // at its place, below the shape added after it
      expect(drawer.getDrawingShapes().map((shape) => shape.id())).toEqual([mine.id(), theirs.id()]);
    }
  });

  it('Changes of shapes removed by other users have nothing to undo', () => {
    const connect = createServer();
    const a = createDrawer();
    const b = createDrawer();
    connect(a);
    connect(b);
    const mine = addText(a, 'mine');

    mine.x(mine.x() + 100);
    a.stage.fire('change');
    byId(b, mine.id())!.destroy();
    b.stage.fire('change');
    expect(a.undoRedo.canUndo()).toBe(true);

    // not put back for everyone, changes dropped
    a.undoRedo.undo();
    expect(byId(a, mine.id())).toBeUndefined();
    expect(byId(b, mine.id())).toBeUndefined();
    expect(a.undoRedo.canUndo()).toBe(false);
    expect(a.undoRedo.canRedo()).toBe(false);
  });

  it('Undo puts removed shapes back at their place, shapes added since by other users stay above', () => {
    const connect = createServer();
    const a = createDrawer();
    const b = createDrawer();
    connect(a);
    connect(b);
    const ids = (drawer: Drawer) => drawer.getDrawingShapes().map((shape) => shape.id());
    const [first, second, third] = ['first', 'second', 'third'].map((text) => addText(a, text));

    second.destroy();
    a.stage.fire('change');
    const theirs = addText(b, 'theirs');

    a.undoRedo.undo();
    expect(ids(a)).toEqual([first.id(), second.id(), third.id(), theirs.id()]);
    expect(ids(b)).toEqual(ids(a));

    a.undoRedo.redo();
    expect(ids(b)).toEqual([first.id(), third.id(), theirs.id()]);
  });

  it('Drawings of connected drawers are merged', () => {
    const connect = createServer();
    const a = createDrawer();
    const b = createDrawer();
    const textA = a.getWidget<TextWidget>('text')!.addTextNode('from a');
    const textB = b.getWidget<TextWidget>('text')!.addTextNode('from b');

    connect(a);
    connect(b);

    expect(byId(a, textB.id())).toBeDefined();
    expect(byId(b, textA.id())).toBeDefined();
  });
  it('Changes are shared in a room only, users of the room are known by their name', () => {
    const connect = createServer();
    const alice = createDrawer();
    const bob = createDrawer();
    const other = createDrawer();
    connect(alice, 'r1', 'Alice');
    connect(bob, 'r1', 'Bob');
    connect(other, 'r2', 'Other');

    const text = addText(alice, 'hello');
    expect(byId(bob, text.id())).toBeDefined();
    expect(byId(other, text.id())).toBeUndefined();

    expect(alice.collaboration!.users).toEqual(['Alice', 'Bob']);
    bob.setUserName('Bobby');
    expect(alice.collaboration!.users).toEqual(['Alice', 'Bobby']);
  });

  it('Collaboration dialog starts a session, with link and QR code, and stops it', async () => {
    const server = createServer();
    const drawer = createDrawer({ collaboration: true });
    const socket = server.createSocket();
    const createSocket = vi.spyOn(drawer as unknown as { _createSocket(): Promise<FakeSocket> }, '_createSocket');

    createSocket.mockImplementation(async () => {
      setTimeout(() => socket.receive('connect'));
      return socket;
    });

    expect(drawer.setting.$collaborationButton.isConnected).toBe(true);
    drawer.setting.$collaborationButton.click();
    const modal = drawer.collaborationModal!;
    expect(modal.isVisible()).toBe(true);
    expect(modal.$session.hidden).toBe(true);

    modal.$name.value = 'Alice';
    modal.$name.dispatchEvent(new Event('change'));
    modal.$startButton.click();
    // key of the room made, then connected
    await vi.waitFor(() => expect(window.location.hash).toContain('#room='));

    const room = drawer.collaboration!.room;
    const key = drawer.collaboration!.cipher!.key;
    expect(drawer.collaboration!.name).toBe('Alice');
    // new room encrypted end to end: key in its link
    expect(key).toMatch(/^[\w-]{22}$/);
    expect(window.location.hash).toBe(`#room=${room}&by=${drawer.getUserId()}&key=${key}`);
    expect(modal.$security.textContent!.trim()).toBe(
      'End-to-end encrypted: only people with the link see the drawing, not the server.'
    );
    await vi.waitFor(() => expect(modal.$users.textContent).toBe('Connected (1)'));
    expect(modal.$link.value).toBe(drawer.getCollaborationLink());
    // creator of the room is its owner
    expect(modal.$members.textContent).toBe('Alice (you)Owner');
    // QR code generator loaded with a dynamic import
    await vi.waitFor(() => expect(modal.$qrCode.querySelector('svg')).not.toBeNull());
    expect(drawer.setting.$collaborationButton.textContent).toContain('On (1)');

    modal.$stopButton.click();
    expect(drawer.collaboration).toBeNull();
    expect(socket.disconnect).toHaveBeenCalled();
    expect(window.location.hash).toBe('');
    expect(modal.$session.hidden).toBe(true);
  });

  it('User id given by server (logged in account) recognizes this user: owner, links', async () => {
    const server = createServer();
    const drawer = createDrawer({ collaboration: true, language: 'en' });
    const socket = server.createSocket();

    socket.account = 'account-1';
    vi.spyOn(drawer as unknown as { _createSocket(): Promise<FakeSocket> }, '_createSocket').mockImplementation(
      async () => {
        setTimeout(() => socket.receive('connect'));
        return socket;
      }
    );
    await drawer.startCollaboration(undefined, 'Ada');
    // users received after the empty drawing of the room, decrypted
    await vi.waitFor(() => expect(drawer.collaboration!.members).toHaveLength(1));

    expect(socket.emit).toHaveBeenCalledWith('JOIN', expect.objectContaining({ userId: drawer.getUserId() }));
    // secret of this browser with its id (kept for next sessions), secret of the owner and id of the new room: random
    // values of Web Crypto
    const [, join] = socket.emit.mock.calls.find(([event]) => event === 'JOIN')! as [
      string,
      { room: string; userKey: string; ownerKey: string },
    ];

    expect(join.userKey).toMatch(/^[\w-]{22}$/);
    expect(localStorage.getItem(`${drawer.options.localStorageKey}-user-key`)).toBe(join.userKey);
    expect(join.ownerKey).toMatch(/^[\w-]{22}$/);
    expect(join.ownerKey).not.toBe(join.userKey);
    expect(join.room).toMatch(/^[\w-]{22}$/);
    expect(drawer.collaboration!.userId).toBe('account-1');
    expect(drawer.collaboration!.isOwner).toBe(true);
    expect(drawer.getCollaborationLink()).toContain('&by=account-1');

    drawer.showCollaboration();
    expect(drawer.collaborationModal!.$members.textContent).toBe('Ada (you)Owner');
    drawer.collaborationModal!.hide();
  });

  it('Room link joins the room, collaboration needs its option', async () => {
    const server = createServer();
    const socket = server.createSocket();
    const createSocket = vi.spyOn(
      Drawer.prototype as unknown as { _createSocket(): Promise<FakeSocket> },
      '_createSocket'
    );

    createSocket.mockImplementation(async () => {
      setTimeout(() => socket.receive('connect'));
      return socket;
    });
    window.location.hash = '#room=abc123';

    // invited: name asked before joining
    const drawer = createDrawer({ collaboration: true });
    const modal = drawer.collaborationModal!;
    await tick();
    expect(drawer.collaboration).toBeNull();
    expect(modal.isVisible()).toBe(true);
    expect(modal.$joinButton.hidden).toBe(false);
    expect(modal.$name.required).toBe(true);
    modal.$name.value = '';
    modal.$name.dispatchEvent(new Event('input'));
    expect(modal.$joinButton.disabled).toBe(true);

    modal.$name.value = 'Bob';
    modal.$name.dispatchEvent(new Event('input'));
    const toast = vi.spyOn(drawer, 'toast');

    modal.$joinButton.click();
    await tick();
    await tick();
    expect(drawer.collaboration?.room).toBe('abc123');
    expect(drawer.collaboration?.name).toBe('Bob');
    // name given: dialog closed, session shown by the header
    expect(modal.isVisible()).toBe(false);
    expect(toast).toHaveBeenCalledWith('You joined the live collaboration session.', 'info');
    expect(drawer.collaborationIndicator!.$container.hidden).toBe(false);
    // link of the room shared by this user
    expect(drawer.getCollaborationLink()).toBe(
      `${window.location.origin}${window.location.pathname}#room=abc123&by=${drawer.getUserId()}`
    );
    expect(window.location.hash).toBe(`#room=abc123&by=${drawer.getUserId()}`);
    drawer.stopCollaboration();

    // link with user who shared it
    window.location.hash = '#room=xyz&by=alice';
    const invited = createDrawer({ collaboration: true });
    await tick();
    // name to give first: focused
    expect(document.activeElement).toBe(invited.collaborationModal!.$name);
    invited.collaborationModal!.$name.value = 'Carol';
    invited.collaborationModal!.$name.dispatchEvent(new Event('input'));
    invited.collaborationModal!.$joinButton.click();
    await tick();
    await tick();
    expect(socket.emit).toHaveBeenCalledWith('JOIN', expect.objectContaining({ room: 'xyz', invitedBy: 'alice' }));
    invited.stopCollaboration();

    // owner (room created in this browser): back in the room without dialog
    const owner = createDrawer({ collaboration: true });
    await owner.startCollaboration();
    const room = owner.collaboration!.room;
    const { hash } = new URL(owner.getCollaborationLink());
    owner.stopCollaboration();
    window.location.hash = hash;
    const reloaded = createDrawer({ collaboration: true, localStorageKey: owner.options.localStorageKey });
    await vi.waitFor(() => expect(reloaded.collaboration?.room).toBe(room));
    expect(reloaded.collaboration!.cipher!.key).toBe(hash.split('&key=')[1]);
    expect(reloaded.collaborationModal).toBeNull();
    reloaded.stopCollaboration();

    const disabled = createDrawer();
    expect(disabled.setting.$collaborationButton.isConnected).toBe(false);
    await expect(disabled.startCollaboration()).rejects.toThrow();
    createSocket.mockRestore();
  });

  it('Session is stopped when server is unreachable', async () => {
    const socket = createServer().createSocket();
    const drawer = createDrawer({ collaboration: true });

    vi.spyOn(drawer as unknown as { _createSocket(): Promise<FakeSocket> }, '_createSocket').mockImplementation(
      async () => {
        setTimeout(() => socket.receive('connect_error', new Error('xhr poll error')));
        return socket;
      }
    );

    await expect(drawer.startCollaboration()).rejects.toThrow('server unreachable (xhr poll error)');
    expect(drawer.collaboration).toBeNull();
    expect(socket.disconnect).toHaveBeenCalled();
  });
  it('Live session reminded in header, also in zen mode: people connected, dialog, stopped or left', () => {
    const connect = createServer();
    const owner = createDrawer({ collaboration: true, language: 'en' });
    const guest = createDrawer({ collaboration: true, language: 'en' });
    const indicator = owner.collaborationIndicator!;

    expect(indicator.$container.hidden).toBe(true);
    connect(owner, 'room', 'Ada', { ownerKey: 'secret' });
    expect(indicator.$container.hidden).toBe(false);
    expect(indicator.$label.textContent).toBe('Live');
    expect(indicator.$button.getAttribute('aria-label')).toBe('Live collaboration: Connected (1)');
    expect(indicator.$stopButton.getAttribute('aria-label')).toBe('Stop session');
    // not hidden by zen mode
    expect(indicator.$container.classList.contains('drawer-zen-hidden')).toBe(false);

    connect(guest, 'room', 'Bob');
    expect(indicator.$count.textContent).toBe('2');
    expect(guest.collaborationIndicator!.$stopButton.getAttribute('aria-label')).toBe('Leave session');

    // panel of the session, link and settings in the dialog
    indicator.$button.click();
    expect(indicator.panel.isShown()).toBe(true);
    expect(indicator.$button.getAttribute('aria-expanded')).toBe('true');
    indicator.panel.$settingsButton.click();
    expect(indicator.panel.isShown()).toBe(false);
    expect(owner.collaborationModal!.isVisible()).toBe(true);
    owner.collaborationModal!.hide();

    // click by mistake: confirmation, Cancel keeps the session
    indicator.$stopButton.click();
    const confirm = indicator.confirmModal!;
    expect(confirm.isVisible()).toBe(true);
    expect(confirm.$message.textContent).toBe('Stop the live collaboration session?');
    expect(confirm.$confirmBtn.textContent).toBe('Stop session');
    confirm.$cancelBtn.click();
    expect(confirm.isVisible()).toBe(false);
    expect(owner.collaboration).not.toBeNull();

    guest.collaborationIndicator!.$stopButton.click();
    const leave = guest.collaborationIndicator!.confirmModal!;
    expect(leave.$message.textContent).toBe('Leave the live collaboration session?');
    expect(leave.$confirmBtn.textContent).toBe('Leave session');
    leave.$confirmBtn.click();
    expect(leave.isVisible()).toBe(false);
    expect(guest.collaboration).toBeNull();
    expect(guest.collaborationIndicator!.$container.hidden).toBe(true);
    expect(indicator.$count.textContent).toBe('1');

    // command of the palette too
    owner.showCommandPalette();
    const labels = [...owner.commandPalette!.$list.querySelectorAll('[role="option"]')].map(($o) => $o.textContent);
    owner.commandPalette!.hide();
    expect(labels.some((label) => label?.includes('Stop session'))).toBe(true);
    owner.stopCollaboration();
    expect(indicator.$container.hidden).toBe(true);
  });

  it('Shape drawn then released at its start (simple click): its live preview removed for everyone', async () => {
    const connect = createServer();
    const a = createDrawer({ keepTool: true });
    const b = createDrawer();
    connect(a);
    connect(b);
    a.getWidget<BaseWidget>('square')!.setActive(true);

    fireMouse(a, 'mousedown', 100, 100);
    fireMouse(a, 'mousemove', 101, 101);
    await wait();
    expect(b.getDrawingShapes()).toHaveLength(1);

    fireMouse(a, 'mouseup', 100.5, 100.5);
    expect(a.getDrawingShapes()).toHaveLength(0);
    expect(b.getDrawingShapes()).toHaveLength(0);
    // not in the drawing of the room for users joining later
    const c = createDrawer();
    connect(c);
    expect(c.getDrawingShapes()).toHaveLength(0);

    // drawn shape: kept, no removal sent
    fireMouse(a, 'mousedown', 100, 100);
    fireMouse(a, 'mousemove', 160, 140);
    await wait();
    fireMouse(a, 'mouseup', 160, 140);
    expect(b.getDrawingShapes()).toHaveLength(1);
  });

  it('Shapes being drawn are shown live to other users, saved with final change', async () => {
    const connect = createServer();
    const a = createDrawer();
    const b = createDrawer();
    connect(a);
    connect(b);

    fireMouse(a, 'mousedown', 10, 10);
    fireMouse(a, 'mousemove', 50, 30);
    await wait();
    const line = a.getDrawingShapes()[0];
    const copy = byId(b, line.id())!;
    expect(copy.getClassName()).toBe('Line');
    // preview: not in history nor saved
    expect(b.undoRedo.canUndo()).toBe(false);

    // shown even while other user draws
    fireMouse(b, 'mousedown', 300, 300);
    fireMouse(a, 'mousemove', 120, 90);
    await wait();
    expect(byId(b, line.id())!.getAttr('points')).toEqual(line.attrs.points);
    fireMouse(b, 'mouseup', 300, 300);

    fireMouse(a, 'mouseup', 120, 90);
    expect(byId(b, line.id())!.getAttr('points')).toEqual(line.attrs.points);
    expect(b.undoRedo.canUndo()).toBe(true);
  });

  it('Cursors of other users with their name, hidden out of drawer, removed when they leave', async () => {
    const connect = createServer();
    const alice = createDrawer();
    const bob = createDrawer();
    connect(alice, 'room', 'Alice');
    connect(bob, 'room', 'Bob');
    const cursors = () => bob.selectionLayer.find<Group>('.collaborator-cursor');

    setPointer(alice, 100, 50);
    alice.stage.fire('pointermove');
    await wait();
    expect(cursors()).toHaveLength(1);
    expect(cursors()[0].findOne<Text>('Text')!.text()).toBe('Alice');
    expect(cursors()[0].position()).toEqual({ x: 100, y: 50 });

    // same size on screen whatever zoom
    bob.setZoomLevel(2);
    expect(cursors()[0].scaleX()).toBe(0.5);

    alice.stage.fire('mouseleave');
    await wait();
    expect(cursors()[0].visible()).toBe(false);

    alice.stopCollaboration();
    expect(cursors()).toHaveLength(0);
  });
  it('Laser of another user: trail of their color following their pointer', async () => {
    const connect = createServer();
    const alice = createDrawer();
    const bob = createDrawer();
    const socket = connect(alice, 'room', 'Alice');
    connect(bob, 'room', 'Bob');
    const trails = () => bob.selectionLayer.find<Line>('.trail');
    const pointers = () => socket.emit.mock.calls.filter(([event]) => event === 'POINTER').map(([, data]) => data);
    const cursor = () => bob.selectionLayer.findOne<Group>('.collaborator-cursor')!;

    alice.getWidget<BaseWidget>('laser')!.setActive(true);
    setPointer(alice, 100, 50);
    fireMouse(alice, 'mousedown', 100, 50);
    await wait();
    expect(pointers().at(-1)).toEqual({ x: 100, y: 50, laser: true });
    expect(trails()).toHaveLength(1);
    // color of cursor of this user
    expect(trails()[0].fill()).toBe(cursor().findOne<Line>('Line')!.fill());
    expect(cursor().getAttr('laser')).toBeUndefined();

    setPointer(alice, 120, 60);
    alice.stage.fire('pointermove');
    await wait();
    expect(cursor().position()).toEqual({ x: 120, y: 60 });

    // released: told at once, trail fades
    fireMouse(alice, 'mouseup', 120, 60);
    await wait();
    expect(pointers().at(-1)).toEqual({ x: 120, y: 60 });
    expect(bob.getDrawingShapes()).toEqual([]);

    alice.stopCollaboration();
    expect(trails()).toHaveLength(0);
  });

  it('Owner presents its view: other users follow it until they move theirs, then follow it again', async () => {
    const connect = createServer();
    const bob = createDrawer({ collaboration: true, language: 'en' });
    const alice = createDrawer({ collaboration: true, language: 'en' });
    const view = (drawer: Drawer) => Object.values(drawer.getViewArea()).map((value) => Math.round(value));
    const commands = (drawer: Drawer) => {
      drawer.showCommandPalette();
      const labels = [...drawer.commandPalette!.$list.querySelectorAll('[role="option"]')].map(($o) => $o.textContent);

      drawer.commandPalette!.hide();
      return labels.join('|');
    };

    connect(alice, 'room', 'Alice', { userId: 'alice', ownerKey: 'secret' });
    connect(bob, 'room', 'Bob', { userId: 'bob' });
    const toast = vi.spyOn(bob, 'toast');
    const indicator = bob.collaborationIndicator!;

    // only the owner presents
    bob.collaboration!.present(true);
    expect(bob.collaboration!.presenting).toBe(false);
    expect(commands(alice)).toContain('Present my view');
    expect(commands(bob)).not.toContain('Present my view');

    alice.setZoomLevel(2);
    alice.collaboration!.present(true);
    await wait();
    expect(alice.collaborationIndicator!.$label.textContent).toBe('Presenting');
    expect(toast).toHaveBeenCalledWith('Alice presents: you follow their view', 'info');
    expect(view(bob)).toEqual(view(alice));
    expect(indicator.$followButton.hidden).toBe(true);

    // view of the owner followed
    alice.stage.position({ x: -300, y: -100 });
    alice._update();
    await wait();
    expect(view(bob)).toEqual(view(alice));

    // moved by bob: no longer followed
    bob.setZoomLevel(0.5);
    expect(bob.collaboration!.following).toBe(false);
    expect(indicator.$followButton.hidden).toBe(false);
    expect(commands(bob)).toContain('Follow the view of Alice');
    const own = view(bob);

    alice.setZoomLevel(3);
    await wait();
    expect(view(bob)).toEqual(own);

    // followed again in one click
    indicator.$followButton.click();
    expect(bob.collaboration!.following).toBe(true);
    expect(view(bob)).toEqual(view(alice));
    expect(indicator.$followButton.hidden).toBe(true);

    // presentation stopped
    alice.collaboration!.present(false);
    expect(bob.collaboration!.presentedView).toBeNull();
    expect(toast).toHaveBeenLastCalledWith('Presentation ended', 'info');
    alice.stopCollaboration();
    bob.stopCollaboration();
  });

  it('Viewers ask the owner to draw from the panel of the session: refused, then accepted', () => {
    const connect = createServer();
    const bob = createDrawer({ collaboration: true, language: 'en' });
    const alice = createDrawer({ collaboration: true, language: 'en' });

    connect(alice, 'room', 'Alice', { userId: 'alice', ownerKey: 'secret' });
    alice.collaboration!.setNewUsersCanEdit(false);
    const bobToast = vi.spyOn(bob, 'toast');

    connect(bob, 'room', 'Bob', { userId: 'bob' });
    // joined as viewer: told how to ask, no right removed
    expect(bobToast).toHaveBeenCalledWith('You view only: ask the owner of the session to draw (Live button)', 'info');
    const aliceToast = vi.spyOn(alice, 'toast');
    const bobPanel = bob.collaborationIndicator!.panel;
    const aliceIndicator = alice.collaborationIndicator!;
    const alicePanel = aliceIndicator.panel;
    const answer = (button: number) => alicePanel.$requestList.querySelectorAll('button')[button].click();

    expect(bob.readOnly).toBe(true);
    bob.collaborationIndicator!.$button.click();
    expect(bobPanel.$status.textContent).toBe('You view only');
    expect(bobPanel.$requestButton.hidden).toBe(false);
    // presenting: owner only
    expect(bobPanel.$present.closest('label')!.hidden).toBe(true);

    // asked once until answered
    bobPanel.$requestButton.click();
    bobPanel.$requestButton.click();
    expect(bobPanel.$requestButton.textContent).toBe('Request sent');
    expect(bobPanel.$requestButton.getAttribute('aria-disabled')).toBe('true');
    expect(aliceToast).toHaveBeenCalledTimes(1);
    expect(aliceToast).toHaveBeenCalledWith('Bob asks to draw', 'info');
    expect(aliceIndicator.$requests.textContent).toBe('1');
    expect(aliceIndicator.$button.getAttribute('aria-label')).toContain('1 asking to draw');

    // owner: request in its panel, refused
    aliceIndicator.$button.click();
    expect(alicePanel.$requests.hidden).toBe(false);
    expect(alicePanel.$requestList.textContent).toBe('BobAcceptRefuse');
    // in the language chosen since
    alice.setLanguage('fr');
    expect(alicePanel.$requestList.textContent).toBe('BobAccepterRefuser');
    alice.setLanguage('en');
    answer(1);
    expect(bobToast).toHaveBeenLastCalledWith('The owner of the session refused your request to draw', 'warning');
    expect(bob.collaboration!.requested).toBe(false);
    expect(alicePanel.$requests.hidden).toBe(true);
    expect(aliceIndicator.$requests.hidden).toBe(true);

    // asked again, accepted (a click in the page of bob closed the panel of alice: same page in tests)
    bobPanel.$requestButton.click();
    aliceIndicator.$button.click();
    answer(0);
    expect(bob.readOnly).toBe(false);
    expect(bobToast).toHaveBeenLastCalledWith('You can draw: the owner of the session allowed you', 'info');
    // panel of bob closed by the click in the page of alice: up to date when opened
    bob.collaborationIndicator!.$button.click();
    expect(bobPanel.$status.textContent).toBe('You can draw');
    expect(bobPanel.$requestButton.hidden).toBe(true);
    expect(alice.collaboration!.requests).toEqual([]);

    // owner: presents from its panel, closed by Escape (focus back on its button)
    alicePanel.$present.checked = true;
    alicePanel.$present.dispatchEvent(new Event('change'));
    expect(alice.collaboration!.presenting).toBe(true);
    alicePanel.$present.focus();
    alicePanel.$present.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(alicePanel.isShown()).toBe(false);
    expect(document.activeElement).toBe(aliceIndicator.$button);
    alice.stopCollaboration();
    bob.stopCollaboration();
  });

  it('Owner of the room gives or removes the right to draw', async () => {
    const connect = createServer();
    const bob = createDrawer();
    const carol = createDrawer();
    // created last: drawer of the page (focus)
    const alice = createDrawer();
    connect(alice, 'room', 'Alice', { userId: 'alice', ownerKey: 'secret' });
    connect(bob, 'room', 'Bob', { userId: 'bob' });

    expect(alice.collaboration!.isOwner).toBe(true);
    expect(bob.collaboration!.isOwner).toBe(false);
    expect(bob.collaboration!.canEdit).toBe(true);

    // owner dialog: right to draw of each user
    alice.showCollaboration();
    const $canEdit = alice.collaborationModal!.$members.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    expect($canEdit.getAttribute('aria-label')).toBe('Bob can draw');
    expect($canEdit.checked).toBe(true);

    const modal = alice.collaborationModal!;
    const $rows = Array.from(modal.$members.children);

    $canEdit.focus();
    $canEdit.checked = false;
    $canEdit.dispatchEvent(new Event('change'));
    expect(bob.collaboration!.canEdit).toBe(false);
    expect(bob.readOnly).toBe(true);
    expect(bob.activeTool).toBe('pan');
    // rows kept: focus stays on the switch, the live region does not read the users again
    expect(Array.from(modal.$members.children)).toEqual($rows);
    expect(document.activeElement).toBe($canEdit);
    expect($canEdit.checked).toBe(false);

    // changes of user without right are ignored
    const text = addText(bob, 'not allowed');
    expect(byId(alice, text.id())).toBeUndefined();

    // only owner gives rights
    bob.collaboration!.setRight('bob', true);
    expect(bob.collaboration!.canEdit).toBe(false);

    alice.collaboration!.setRight('bob', true);
    expect(bob.readOnly).toBe(false);
    expect(bob.activeTool).toBe('brush');
    expect($canEdit.checked).toBe(true);

    // user joining: row added, others kept
    connect(carol, 'room', 'Carol', { userId: 'carol' });
    expect(modal.$members.textContent).toContain('Carol');
    expect(modal.$members.children).toHaveLength(3);
    expect($rows.every(($row) => $row.isConnected)).toBe(true);
    expect(document.activeElement).toBe($canEdit);

    // user leaving: row removed
    bob.stopCollaboration();
    expect($canEdit.isConnected).toBe(false);
    expect(modal.$members.textContent).not.toContain('Bob');
    carol.stopCollaboration();
    alice.collaboration!.setRight('alice', false);
    expect(alice.collaboration!.canEdit).toBe(true);
    alice.collaborationModal!.hide();
  });

  it('Read only of the app kept by the right to draw of a session, a viewer stays read only', () => {
    const connect = createServer();
    const alice = createDrawer();
    const bob = createDrawer();

    connect(alice, 'room', 'Alice', { userId: 'alice', ownerKey: 'secret' });
    connect(bob, 'room', 'Bob', { userId: 'bob' });
    // viewer: the app turning read only off gives no right
    alice.collaboration!.setRight('bob', false);
    bob.setReadOnly(false);
    expect(bob.readOnly).toBe(true);
    // read only asked by the app: kept when the right is given
    bob.setReadOnly(true);
    alice.collaboration!.setRight('bob', true);
    expect(bob.readOnly).toBe(true);
    bob.setReadOnly(false);
    expect(bob.readOnly).toBe(false);
  });

  it('Background color shared: the one of the room for users joining, changes sent, kept by undo of others', () => {
    const connect = createServer();
    const alice = createDrawer();
    const bob = createDrawer();
    const carol = createDrawer();

    // room without background: the one of its first user
    alice.setBgColor('#f5faff');
    connect(alice, 'room', 'Alice', { userId: 'alice', ownerKey: 'secret' });
    // user joining: background of the room, not theirs
    bob.setBgColor('#fffce8');
    const bobSocket = connect(bob, 'room', 'Bob', { userId: 'bob' });

    expect(bob.background.fill()).toBe('#f5faff');
    expect(alice.background.fill()).toBe('#f5faff');

    // change sent, not a change of alice in her history
    const entries = alice.undoRedo.entries.length;

    bob.setBgColor('#fdf8f6');
    expect(alice.background.fill()).toBe('#fdf8f6');
    expect(alice.undoRedo.entries).toHaveLength(entries);
    // undone by bob: sent too
    bob.undoRedo.undo();
    expect(alice.background.fill()).toBe('#f5faff');
    bob.undoRedo.redo();
    expect(alice.background.fill()).toBe('#fdf8f6');

    // users joining later
    connect(carol, 'room', 'Carol', { userId: 'carol' });
    expect(carol.background.fill()).toBe('#fdf8f6');

    // reconnection: changed meanwhile by bob kept and sent, else the one of the room
    bobSocket.room = undefined;
    bobSocket.receive('disconnect');
    bob.setBgColor('#f8f9fa');
    bobSocket.receive('connect');
    expect(alice.background.fill()).toBe('#f8f9fa');
    bobSocket.room = undefined;
    bobSocket.receive('disconnect');
    alice.setBgColor('#fff');
    bobSocket.receive('connect');
    expect(bob.background.fill()).toBe('#fff');
  });

  it('Change bigger than a message of the server sent in parts, a shape too big alone not sent (no reconnection loop)', () => {
    const connect = createServer();
    const alice = createDrawer();
    const bob = createDrawer();
    const aliceSocket = connect(alice, 'room', 'Alice', { userId: 'alice', ownerKey: 'secret' });

    connect(bob, 'room', 'Bob', { userId: 'bob' });
    const toast = vi.spyOn(alice, 'toast');
    const max = Collaboration.maxMessageSize;
    const changes = () => aliceSocket.emit.mock.calls.filter(([event]) => event === 'CHANGE');

    Collaboration.maxMessageSize = 2000;
    try {
      const big = addText(alice, 'x'.repeat(3000));

      expect(byId(bob, big.id())).toBeUndefined();
      expect(toast).toHaveBeenCalledWith(
        'Drawing too big for the collaboration session: your changes are not shared',
        'warning'
      );
      // connection kept: the server would close it
      expect(aliceSocket.disconnect).not.toHaveBeenCalled();

      // other changes still shared, the shape too big not tried again
      aliceSocket.emit.mockClear();
      const small = addText(alice, 'small');

      expect(byId(bob, small.id())).toBeDefined();
      expect(JSON.stringify(changes())).not.toContain('xxx');

      // many shapes at once: several messages
      aliceSocket.emit.mockClear();
      const texts = Array.from({ length: 10 }, (_, i) => addText(alice, `${i} ${'y'.repeat(150)}`));

      aliceSocket.emit.mockClear();
      for (const text of texts) text.x(100);
      alice.stage.fire('change');
      expect(changes().length).toBeGreaterThan(1);
      expect(texts.every((text) => byId(bob, text.id())?.x() === 100)).toBe(true);

      // made smaller: sent
      big.text('fits now');
      alice.stage.fire('change');
      expect(byId(bob, big.id())?.attrs.text).toBe('fits now');
    } finally {
      Collaboration.maxMessageSize = max;
    }
  });

  it('Changes refused by the server sent again: drawing too big, right to draw removed meanwhile', () => {
    const connect = createServer();
    const alice = createDrawer();
    const bob = createDrawer();
    const bobSocket = connect(bob, 'room', 'Bob', { userId: 'bob' });

    connect(alice, 'room', 'Alice', { userId: 'alice', ownerKey: 'secret' });
    // refused by the server (its drawing too big): known again as not sent
    const text = addText(bob, 'B');

    connect.rooms.get('room')!.shapes.delete(text.id());
    for (const shape of alice.getDrawingShapes()) shape.destroy();
    bobSocket.receive('REJECTED', { event: 'CHANGE', reason: 'too-big', upsert: [text.id()], remove: [] });
    addText(bob, 'C');
    expect(alice.getDrawingShapes().map((shape) => shape.attrs.text)).toEqual(['B', 'C']);

    // right removed while bob draws (users not received yet): refused, sent again once allowed to draw
    connect.rooms.get('room')!.viewers.add('bob');
    const refused = addText(bob, 'D');

    expect(byId(alice, refused.id())).toBeUndefined();
    alice.collaboration!.setRight('bob', false);
    // viewer: kept until allowed to draw (shapes added by the app)
    const kept = addText(bob, 'E');

    alice.collaboration!.setRight('bob', true);
    expect(byId(alice, refused.id())).toBeDefined();
    expect(byId(alice, kept.id())).toBeDefined();
  });

  it('Reconnection merges the drawing of the room with changes made meanwhile, not a stale copy', () => {
    const connect = createServer();
    const alice = createDrawer();
    const bob = createDrawer();
    const texts = (drawer: Drawer) =>
      drawer
        .getDrawingShapes()
        .map((shape) => shape.attrs.text as string)
        .sort();
    connect(alice, 'room', 'Alice', { userId: 'alice', ownerKey: 'secret' });
    const bobSocket = connect(bob, 'room', 'Bob', { userId: 'bob' });

    const a = addText(alice, 'A');
    const d = addText(alice, 'D');
    addText(bob, 'B');
    expect(texts(bob)).toEqual(['A', 'B', 'D']);

    // connection of bob lost
    bobSocket.room = undefined;
    bobSocket.receive('disconnect');
    // alice meanwhile: A removed, D changed
    a.destroy();
    alice.stage.fire('change');
    d.text('D2');
    alice.stage.fire('change');
    // bob meanwhile: B changed, C added, not sent
    (bob.getDrawingShapes().find((shape) => shape.attrs.text === 'B') as Text).text('B2');
    bob.stage.fire('change');
    addText(bob, 'C');
    expect(texts(alice)).toEqual(['B', 'D2']);

    // connected again: A stays removed, D2 kept, changes of bob sent
    bobSocket.receive('connect');
    expect(texts(bob)).toEqual(['B2', 'C', 'D2']);
    expect(texts(alice)).toEqual(['B2', 'C', 'D2']);
  });

  it('Reconnection to a room without drawing gives it again, merged after a pointer action', () => {
    const connect = createServer();
    const alice = createDrawer();
    const bob = createDrawer();
    connect(alice, 'room', 'Alice', { userId: 'alice', ownerKey: 'secret' });
    const bobSocket = connect(bob, 'room', 'Bob', { userId: 'bob' });

    addText(bob, 'B');
    // drawing of the room lost (server restarted, last user gone)
    bobSocket.room = undefined;
    bobSocket.receive('disconnect');
    connect.rooms.get('room')!.shapes.clear();
    connect.rooms.get('room')!.kept = false;

    // drawing with the brush: merged when it ends
    bob.getWidget<BaseWidget>('brush')!.setActive(true);
    fireMouse(bob, 'mousedown', 10, 10);
    bobSocket.receive('connect');
    expect(connect.rooms.get('room')!.shapes.size).toBe(0);
    fireMouse(bob, 'mousemove', 50, 50);
    fireMouse(bob, 'mouseup', 50, 50);

    // text and stroke of bob sent again
    expect(connect.rooms.get('room')!.shapes.size).toBe(2);
    expect(alice.getDrawingShapes().map((shape) => shape.getClassName())).toEqual(['Text', 'Line']);
  });

  it('Page opened again in a room: its copy merged with the drawing of the room, changes of others kept', () => {
    const connect = createServer();
    const alice = createDrawer();
    const bob = createDrawer();
    const carol = createDrawer();
    const texts = (drawer: Drawer) =>
      drawer
        .getDrawingShapes()
        .map((shape) => shape.attrs.text as string)
        .sort();

    connect(alice, 'room', 'Alice', { userId: 'alice', ownerKey: 'secret' });
    connect(bob, 'room', 'Bob', { userId: 'bob' });
    const a = addText(alice, 'A');
    const d = addText(alice, 'D');
    const b = addText(bob, 'B');

    // page of bob closed: its drawing kept, a copy of the room
    bob.stopCollaboration();
    // alice meanwhile: A removed, D changed
    a.destroy();
    alice.stage.fire('change');
    d.text('D2');
    alice.stage.fire('change');
    // bob out of the session: B changed, C added
    (byId(bob, b.id()) as Text).text('B2');
    bob.stage.fire('change');
    addText(bob, 'C');

    // opened again: A stays removed, D2 kept, changes of bob sent
    connect(bob, 'room', 'Bob', { userId: 'bob' });
    expect(texts(bob)).toEqual(['B2', 'C', 'D2']);
    expect(texts(alice)).toEqual(['B2', 'C', 'D2']);

    // a new user: its shapes added to the room, its copies of shapes of the room (file of the room) take their state
    const copy = byId(alice, d.id())!.clone() as Text;

    copy.text('old D');
    carol.addShape(copy);
    addText(carol, 'E');
    connect(carol, 'room', 'Carol', { userId: 'carol' });
    expect(texts(carol)).toEqual(['B2', 'C', 'D2', 'E']);
    expect(texts(alice)).toEqual(['B2', 'C', 'D2', 'E']);
  });

  it('Reconnection to a room emptied by its users removes its shapes, not sent again', () => {
    const connect = createServer();
    const alice = createDrawer();
    const bob = createDrawer();

    connect(alice, 'room', 'Alice', { userId: 'alice', ownerKey: 'secret' });
    const bobSocket = connect(bob, 'room', 'Bob', { userId: 'bob' });

    addText(alice, 'A');
    addText(bob, 'B');
    bobSocket.room = undefined;
    bobSocket.receive('disconnect');
    // alice clears the drawing meanwhile
    for (const shape of alice.getDrawingShapes()) shape.destroy();
    alice.stage.fire('change');

    bobSocket.receive('connect');
    expect(bob.getDrawingShapes()).toEqual([]);
    expect(alice.getDrawingShapes()).toEqual([]);
    expect(connect.rooms.get('room')!.shapes.size).toBe(0);
  });

  it('Drawing of a room without drawing sent again with its image files', async () => {
    const connect = createServer();
    const alice = createDrawer();
    const bob = createDrawer();
    const carol = createDrawer();
    const aliceSocket = connect(alice, 'room', 'Alice', { userId: 'alice', ownerKey: 'secret' });

    connect(bob, 'room', 'Bob', { userId: 'bob' });
    const image = (await alice.addImage({ data: pngData, width: 40, height: 20 }))!;
    const fileId = image.getAttr('fileId');

    expect(bob.files.get(fileId)).toBe(pngData);

    // server restarted: drawing of the room lost, alice joins again first
    const room = connect.rooms.get('room')!;

    aliceSocket.room = undefined;
    aliceSocket.receive('disconnect');
    room.shapes.clear();
    room.files!.clear();
    room.kept = false;
    aliceSocket.receive('connect');
    expect(room.files!.get(fileId)).toBe(pngData);

    connect(carol, 'room', 'Carol', { userId: 'carol' });
    expect(carol.files.get(fileId)).toBe(pngData);
  });

  it('Only drawing shapes of other users are created, as from files', () => {
    const connect = createServer();
    const drawer = createDrawer();
    const socket = connect(drawer, 'room', 'Ada', { userId: 'ada' });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const $page = document.createElement('div');
    const json = (state: object) => JSON.stringify(state);

    $page.id = 'page';
    $page.innerHTML = '<p>Page of the app</p>';
    document.body.append($page);
    socket.receive('CHANGE', {
      upsert: [
        // stage emptying an element of the page, layer
        json({ className: 'Stage', attrs: { id: 's1', container: 'page' } }),
        json({ className: 'Layer', attrs: { id: 'l1' } }),
        // group: only its drawing shapes, attributes without prototype
        json({
          className: 'Group',
          attrs: { id: 'g1', ['__proto__']: { draggable: true } },
          children: [
            { className: 'Stage', attrs: { id: 's2', container: 'page' } },
            { className: 'Rect', attrs: { id: 'r2', width: 5 } },
          ],
        }),
        '{ not json',
        json({ className: 'Rect', attrs: { width: 10 } }),
        json({ className: 'Rect', attrs: { id: 'r1', width: 10 } }),
      ],
      remove: [],
    });

    expect($page.innerHTML).toBe('<p>Page of the app</p>');
    expect(drawer.getDrawingShapes().map((shape) => [shape.getClassName(), shape.id()])).toEqual([
      ['Group', 'g1'],
      ['Rect', 'r1'],
    ]);
    const group = drawer.getDrawingShapes()[0] as Group;
    expect(group.getChildren().map((shape) => shape.id())).toEqual(['r2']);
    expect(Object.getPrototypeOf(group.attrs)).toBe(Object.prototype);
    // stage, layer, invalid JSON, shape without id
    expect(warn).toHaveBeenCalledTimes(4);
    $page.remove();
  });

  it('Refused messages: drawing too big tells it, full room stops the session', () => {
    const connect = createServer();
    const drawer = createDrawer();
    const socket = connect(drawer, 'room', 'Ada', { userId: 'ada' });
    const toast = vi.spyOn(drawer, 'toast');

    // once for several refused changes
    socket.receive('REJECTED', { event: 'CHANGE', reason: 'too-big' });
    socket.receive('REJECTED', { event: 'CHANGE', reason: 'too-big' });
    expect(toast.mock.calls).toEqual([
      ['Drawing too big for the collaboration session: your changes are not shared', 'warning'],
    ]);
    expect(drawer.collaboration).not.toBeNull();

    socket.receive('REJECTED', { event: 'JOIN', reason: 'full' });
    expect(toast).toHaveBeenLastCalledWith('This collaboration session is full', 'error');
    expect(drawer.collaboration).toBeNull();
    expect(socket.disconnect).toHaveBeenCalled();
  });

  it('Owner makes users coming for the first time view only', () => {
    const connect = createServer();
    const alice = createDrawer();
    const bob = createDrawer();
    const carol = createDrawer();
    connect(alice, 'room', 'Alice', { userId: 'alice', ownerKey: 'secret' });
    connect(bob, 'room', 'Bob', { userId: 'bob' });

    // switch of the owner only (session of the dialog)
    alice.showCollaboration();
    const $switch = alice.collaborationModal!.$newUsersCanEdit;
    expect($switch.getAttribute('role')).toBe('switch');
    expect($switch.checked).toBe(true);
    expect(alice.collaborationModal!.$session.contains($switch)).toBe(true);
    expect(alice.collaborationModal!.$session.hidden).toBe(false);
    expect($switch.closest('label')!.textContent).toBe('New participants can draw');
    bob.showCollaboration();
    expect(bob.collaborationModal!.$session.hidden).toBe(true);
    bob.collaborationModal!.hide();

    // only owner changes it
    bob.collaboration!.setNewUsersCanEdit(false);
    expect(alice.collaboration!.newUsersCanEdit).toBe(true);

    $switch.checked = false;
    $switch.dispatchEvent(new Event('change'));
    expect(alice.collaboration!.newUsersCanEdit).toBe(false);
    expect(bob.collaboration!.newUsersCanEdit).toBe(false);
    expect($switch.checked).toBe(false);

    // users already there keep their right, new ones (also a new id of a user) view only
    expect(bob.collaboration!.canEdit).toBe(true);
    connect(carol, 'room', 'Carol', { userId: 'carol' });
    expect(carol.collaboration!.canEdit).toBe(false);
    expect(carol.readOnly).toBe(true);

    // a user can't take the id of the owner without its secret
    const impostor = createDrawer();
    connect(impostor, 'room', 'Impostor', { userId: 'alice' });
    expect(impostor.collaboration!.isOwner).toBe(false);
    expect(impostor.collaboration!.canEdit).toBe(false);
    expect(alice.collaboration!.isOwner).toBe(true);

    alice.collaboration!.setRight(carol.collaboration!.userId, true);
    expect(carol.readOnly).toBe(false);
    alice.collaborationModal!.hide();
  });

  it('Read only mode: drawing not modified by user, only pan, zoom and view options', () => {
    const drawer = createDrawer({ readOnly: true });
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('hello');
    drawer.stage.fire('change');
    const widgets = [...drawer.toolbar.widgets.values()] as BaseWidget[];

    expect(drawer.activeTool).toBe('pan');
    expect(widgets.filter((w) => w.isDisabled).map((w) => w.id)).not.toContain('pan');
    // laser points without drawing
    expect(widgets.filter((w) => !w.isDisabled).map((w) => w.id)).toEqual(['pan', 'laser']);
    expect(drawer.undoRedo.$btnUndo.disabled).toBe(true);
    expect(drawer.setting.$clearCanvasButton.disabled).toBe(true);
    expect(drawer.setting.$openButton.disabled).toBe(true);
    // background color: part of the drawing
    const bgChoices = [...drawer.setting.$bgColorBtnContainer.querySelectorAll<HTMLButtonElement>('button, input')];

    expect(bgChoices.length).toBeGreaterThan(1);
    expect(bgChoices.every(($choice) => $choice.disabled)).toBe(true);
    // no paste in menu
    drawer.contextMenu.show();
    expect(drawer.contextMenu.$pasteBtn.hidden).toBe(true);
    drawer.contextMenu.hide();

    // shortcuts modifying drawing do nothing
    keydown(drawer, { key: 'a', ctrlKey: true });
    keydown(drawer, { key: 'Delete' });
    keydown(drawer, { key: 'z', ctrlKey: true });
    keydown(drawer, { key: 'b' });
    expect(drawer.getDrawingShapes()).toEqual([text]);
    expect(drawer.activeTool).toBe('pan');

    drawer.setReadOnly(false);
    expect(widgets.every((w) => !w.isDisabled)).toBe(true);
    expect(drawer.undoRedo.$btnUndo.disabled).toBe(false);
    expect(bgChoices.every(($choice) => !$choice.disabled)).toBe(true);
  });
  it('Users who joined only give their name, owner knows who shared the link they used', () => {
    const connect = createServer();
    const alice = createDrawer();
    const bob = createDrawer();
    const carol = createDrawer();
    connect(alice, 'room', 'Alice', { userId: 'alice', ownerKey: 'secret' });
    connect(bob, 'room', 'Bob', { userId: 'bob', invitedBy: 'alice' });
    // page url of Bob shared
    connect(carol, 'room', 'Carol', { userId: 'carol', invitedBy: 'bob' });

    expect(alice.collaboration!.members.map((m) => [m.name, m.invitedBy])).toEqual([
      ['Alice', undefined],
      ['Bob', 'Alice'],
      ['Carol', 'Bob'],
    ]);

    alice.showCollaboration();
    const ownerModal = alice.collaborationModal!;
    expect(ownerModal.$session.hidden).toBe(false);
    expect(ownerModal.$stopButton.hidden).toBe(false);
    expect(ownerModal.$members.textContent).toContain('Carolinvited by Bob');
    ownerModal.hide();

    // other users: name only, no link, QR code nor button
    bob.showCollaboration();
    const modal = bob.collaborationModal!;
    expect(modal.$intro.textContent).toBe('You joined the live collaboration session of Alice.');
    expect(modal.$name.closest('.drawer-collaboration-field')!.hasAttribute('hidden')).toBe(false);
    expect(modal.$session.hidden).toBe(true);
    expect(
      [modal.$stopButton, modal.$startButton, modal.$joinButton, modal.$cancelButton].every(($btn) => $btn.hidden)
    ).toBe(true);
  });

  it('Stacking order is sent, kept by server for users joining later', () => {
    const connect = createServer();
    const a = createDrawer();
    const b = createDrawer();
    const socketA = connect(a);
    const socketB = connect(b);
    const first = addText(a, 'first');
    const second = addText(a, 'second');
    const ids = (drawer: Drawer) => drawer.getDrawingShapes().map((shape) => shape.id());

    // new shapes are on top for everyone: no order sent
    expect(socketA.emit).not.toHaveBeenCalledWith('CHANGE', expect.objectContaining({ order: expect.anything() }));
    expect(ids(b)).toEqual([first.id(), second.id()]);

    socketB.emit.mockClear();
    a.reorderShapes('front', [first]);
    expect(ids(b)).toEqual([second.id(), first.id()]);
    // not sent back
    expect(socketB.emit).not.toHaveBeenCalled();

    a.undoRedo.undo();
    expect(ids(b)).toEqual([first.id(), second.id()]);

    b.reorderShapes('back', [byId(b, second.id())!]);
    expect(ids(a)).toEqual([second.id(), first.id()]);

    const c = createDrawer();
    connect(c);
    expect(ids(c)).toEqual([second.id(), first.id()]);
    // drawing of the room: not a change of this user
    expect(c.undoRedo.canUndo()).toBe(false);
  });

  it('Updates received keep local hit region of shapes', () => {
    const connect = createServer();
    const a = createDrawer();
    const b = createDrawer();
    connect(a);
    connect(b);
    const rect = a.addShape(new Rect({ name: 'drawer-rect', width: 10, height: 10, stroke: '#000' }));

    a.stage.fire('change');
    const copy = byId(b, rect.id())!;
    expect(copy.hitFunc()).toBeTypeOf('function');

    rect.x(50);
    a.stage.fire('change');
    expect(copy.x()).toBe(50);
    expect(copy.hitFunc()).toBeTypeOf('function');
  });

  it('Groups are sent at their place, updated when their shapes change', () => {
    const connect = createServer();
    const a = createDrawer();
    const b = createDrawer();
    connect(a);
    connect(b);
    const first = a.addShape(new Rect({ name: 'drawer-rect', width: 10, height: 10 }));
    const second = a.addShape(new Rect({ name: 'drawer-rect', x: 20, width: 10, height: 10 }));
    const top = a.addShape(new Rect({ name: 'drawer-rect', x: 40, width: 10, height: 10 }));
    const classNames = (drawer: Drawer) => drawer.getDrawingShapes().map((shape) => shape.getClassName());

    a.stage.fire('change');
    const group = a.groupShapes([first, second])!;
    // new group under top shape
    expect(classNames(b)).toEqual(['Group', 'Rect']);
    expect(b.getDrawingShapes()[1].id()).toBe(top.id());

    const copy = b.getDrawingShapes()[0] as Group;
    const [copyOfFirst, copyOfSecond] = copy.getChildren();

    second.x(100);
    a.stage.fire('change');
    // same nodes
    expect(b.getDrawingShapes()[0]).toBe(copy);
    expect(copy.getChildren()).toEqual([copyOfFirst, copyOfSecond]);
    expect(copyOfSecond.x()).toBe(100);
    expect(copyOfSecond.draggable()).toBe(false);

    // shape added to the group, another removed, in the order of the group
    const third = new Rect({ name: 'drawer-rect', id: 'third', x: 60, width: 10, height: 10 });

    first.destroy();
    group.add(third);
    third.zIndex(0);
    a.stage.fire('change');
    expect(copy.getChildren().map((shape) => shape.id())).toEqual(['third', second.id()]);
    expect(copy.getChildren()[1]).toBe(copyOfSecond);
    expect(copy.getChildren()[0].draggable()).toBe(false);

    a.ungroupShapes([group]);
    expect(classNames(b)).toEqual(['Rect', 'Rect', 'Rect']);
    expect(b.getDrawingShapes().map((shape) => shape.id())).toEqual(['third', second.id(), top.id()]);
  });

  it('Frames of other users updated in place: their shapes stay selected, a text being typed is kept and sent', () => {
    const connect = createServer();
    const alice = createDrawer();
    const bob = createDrawer();
    const editor = () => document.querySelector<HTMLTextAreaElement>('.drawer-text-editor')!;

    connect(alice, 'room', 'Alice', { userId: 'alice', ownerKey: 'secret' });
    connect(bob, 'room', 'Bob', { userId: 'bob' });
    const frame = alice.addShape(createFrame({ x: 0, y: 0, width: 400, height: 300, label: 'Intro' }));
    const rect = alice.addShape(new Rect({ name: 'drawer-rect', x: 10, y: 10, width: 50, height: 50 }));

    alice.placeInFrames([rect]);
    alice.stage.fire('change');
    const shapeOfFrame = bob.drawLayer.findOne<Rect>(`#${rect.id()}`)!;

    bob.getWidget<SelectWidget>('selection')!.setActive(true);
    bob.getWidget<SelectWidget>('selection')!.select([shapeOfFrame]);

    // frame renamed and moved live by alice: same nodes, still selected and draggable
    frame.x(50);
    alice.setShapeLabel(frame, 'Plan', false);
    alice.collaboration!.sendLive([frame]);
    alice.stage.fire('change');
    expect(bob.drawLayer.findOne(`#${frame.id()}`)!.x()).toBe(50);
    expect(bob.drawLayer.findOne(`#${rect.id()}`)).toBe(shapeOfFrame);
    expect(bob.getSelectedShapes()).toEqual([shapeOfFrame]);
    expect(shapeOfFrame.draggable()).toBe(true);

    // text being typed by bob while alice moves it: moved, typed text kept and sent
    const note = addText(alice, 'note');
    const text = bob.drawLayer.findOne<Text>(`#${note.id()}`)!;

    bob.getWidget<TextWidget>('text')!.editTextNode(text);
    note.x(200);
    alice.stage.fire('change');
    editor().value = 'typed';
    editor().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect([text.text(), text.x()]).toEqual(['typed', 200]);
    expect([note.text(), note.x()]).toEqual(['typed', 200]);

    // new text cancelled with Escape: changes received meanwhile applied
    const added = bob.getWidget<TextWidget>('text')!.addTextNode('');

    bob.getWidget<TextWidget>('text')!.editTextNode(added);
    note.x(300);
    alice.stage.fire('change');
    editor().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(text.x()).toBe(300);
  });

  it('Changes received after the drawing of the room during a pointer action are not reverted by its merge', () => {
    const connect = createServer();
    const alice = createDrawer();
    const bob = createDrawer();

    connect(alice, 'room', 'Alice', { userId: 'alice', ownerKey: 'secret' });
    const bobSocket = connect(bob, 'room', 'Bob', { userId: 'bob' });
    const text = addText(alice, 'A');

    bobSocket.room = undefined;
    bobSocket.receive('disconnect');
    bob.getWidget<BaseWidget>('brush')!.setActive(true);
    fireMouse(bob, 'mousedown', 10, 10);
    bobSocket.receive('connect');
    // after the drawing of the room
    text.text('A2');
    alice.stage.fire('change');
    fireMouse(bob, 'mousemove', 50, 50);
    fireMouse(bob, 'mouseup', 50, 50);

    expect(byId(bob, text.id())!.attrs.text).toBe('A2');
    expect(text.text()).toBe('A2');
  });

  it('Reconnection: request to draw asked again, cursors of users gone removed, presentation stopped meanwhile left', async () => {
    const connect = createServer();
    const alice = createDrawer();
    const bob = createDrawer();

    connect(alice, 'room', 'Alice', { userId: 'alice', ownerKey: 'secret' });
    alice.collaboration!.setNewUsersCanEdit(false);
    const bobSocket = connect(bob, 'room', 'Bob', { userId: 'bob' });
    const room = connect.rooms.get('room')!;

    bob.collaboration!.requestEdit();
    alice.collaboration!.present(true);
    bobSocket.receive('POINTER', { id: 'socket-9', name: 'Gone', position: { x: 10, y: 20 } });
    expect(bob.selectionLayer.find('.collaborator-cursor')).toHaveLength(1);
    // view sent at live interval
    await vi.waitFor(() => expect(bob.collaboration!.presentedView).not.toBeNull());

    // connection lost: request forgotten by the server, presentation stopped
    bobSocket.room = undefined;
    bobSocket.receive('disconnect');
    room.requests.clear();
    alice.collaboration!.answerRequest('bob', false);
    alice.collaboration!.requests = [];
    alice.collaboration!.present(false);

    bobSocket.receive('connect');
    expect(alice.collaboration!.requests).toEqual([{ userId: 'bob', name: 'Bob' }]);
    expect(bob.selectionLayer.find('.collaborator-cursor')).toHaveLength(0);
    expect(bob.collaboration!.presentedView).toBeNull();
  });

  it('Owner keys kept for the rooms used last, a start asked again while it connects gives the same session', async () => {
    const server = createServer();
    const drawer = createDrawer({ collaboration: true });
    const keys = drawer as unknown as {
      _setOwnerKey(room: string, key: string): void;
      _getOwnerKey(room: string): string | undefined;
    };

    for (let i = 0; i < 20; i++) keys._setOwnerKey(`room-${i}`, `key ${i}`);
    // used again: last one
    keys._setOwnerKey('room-0', 'key 0');
    keys._setOwnerKey('room-20', 'key 20');
    expect(keys._getOwnerKey('room-0')).toBe('key 0');
    expect(keys._getOwnerKey('room-1')).toBeUndefined();

    const sockets: FakeSocket[] = [];
    const createSocket = vi
      .spyOn(drawer as unknown as { _createSocket(): Promise<FakeSocket> }, '_createSocket')
      .mockImplementation(async () => {
        const socket = server.createSocket();

        sockets.push(socket);
        setTimeout(() => socket.receive('connect'));
        return socket;
      });

    // double click
    const [first, second] = await Promise.all([drawer.startCollaboration(), drawer.startCollaboration()]);

    expect(second).toBe(first);
    expect(createSocket).toHaveBeenCalledTimes(1);

    // another room asked while starting: the first start stops, its socket closed
    drawer.stopCollaboration();
    const overtaken = drawer.startCollaboration();
    const joined = drawer.startCollaboration('other-room');

    await expect(overtaken).rejects.toThrow();
    expect(await joined).toContain('#room=other-room');
    expect(sockets.filter((socket) => !socket.disconnect.mock.calls.length)).toEqual([drawer.socket]);
    drawer.stopCollaboration();
  });
});

describe('Encrypted collaboration', () => {
  /** Texts of the drawing, sorted */
  const texts = (drawer: Drawer) =>
    drawer
      .getDrawingShapes()
      .map((shape) => shape.attrs.text as string)
      .sort();

  it('Shapes, background, files, pointers and views encrypted: the server keeps and relays them without reading them', async () => {
    const connect = createServer();
    const cipher = await RoomCipher.create(await createRoomKey());
    const alice = createDrawer({ collaboration: true, language: 'en' });
    const bob = createDrawer({ collaboration: true, language: 'en' });
    const aliceSocket = connect(alice, 'secret-room', 'Alice', { userId: 'alice', ownerKey: 'owner', cipher });

    connect(bob, 'secret-room', 'Bob', { userId: 'bob', cipher });
    await vi.waitFor(() => expect(bob.collaboration!.members).toHaveLength(2));

    const text = addText(alice, 'top secret');
    const image = (await alice.addImage({ data: pngData, width: 40, height: 20 }))!;

    alice.setBgColor('#f5faff');
    await vi.waitFor(() => expect(texts(bob)).toEqual(['top secret', undefined]));
    await vi.waitFor(() => expect(bob.background.fill()).toBe('#f5faff'));
    expect(bob.files.get(image.getAttr('fileId'))).toBe(pngData);
    expect(byId(bob, text.id())).toBeDefined();

    // pointer and presented view
    setPointer(alice, 100, 50);
    alice.stage.fire('pointermove');
    await vi.waitFor(() =>
      expect(bob.selectionLayer.findOne<Group>('.collaborator-cursor')?.position()).toEqual({ x: 100, y: 50 })
    );
    alice.collaboration!.present(true);
    // as sent (JSON: no -0)
    await vi.waitFor(() =>
      expect(bob.collaboration!.presentedView).toEqual(JSON.parse(JSON.stringify(alice.getViewArea())))
    );

    // nothing of the drawing sent nor kept in clear: texts, colors, images, ids of files, positions
    const room = connect.rooms.get('secret-room')!;
    const sent = JSON.stringify(aliceSocket.emit.mock.calls.filter(([event]) => event !== 'JOIN'));
    const kept = JSON.stringify([[...room.shapes.values()], room.background, [...room.files!], room.view]);

    for (const clear of ['top secret', '#f5faff', 'iVBORw0K', image.getAttr('fileId'), '"x":100', 'Text']) {
      expect(sent).not.toContain(clear);
      expect(kept).not.toContain(clear);
    }
    // ids of shapes in clear: the server keeps the drawing shape by shape
    expect([...room.shapes.keys()]).toEqual([text.id(), image.id()]);
    // the key never reaches the server, its proof only
    expect(JSON.stringify(aliceSocket.emit.mock.calls)).not.toContain(cipher.key);
    expect(aliceSocket.emit).toHaveBeenCalledWith('JOIN', expect.objectContaining({ keyCheck: cipher.keyCheck }));

    // joining later: drawing of the room decrypted
    const carol = createDrawer();

    connect(carol, 'secret-room', 'Carol', { cipher });
    await vi.waitFor(() => expect(texts(carol)).toEqual(['top secret', undefined]));
    expect(carol.background.fill()).toBe('#f5faff');
  });

  it('Links without the key of the room or with another one refused, servers without encryption stop the session', async () => {
    const connect = createServer();
    const cipher = await RoomCipher.create(await createRoomKey());
    const alice = createDrawer();
    const message = (error: string) => `Collaboration unavailable: ${error}`;

    connect(alice, 'room-k', 'Alice', { cipher });
    addText(alice, 'top secret');

    for (const keyOf of [undefined, await RoomCipher.create(await createRoomKey())]) {
      const intruder = createDrawer({ language: 'en' });
      const toast = vi.spyOn(intruder, 'toast');

      connect(intruder, 'room-k', 'Eve', { cipher: keyOf });
      expect(toast).toHaveBeenCalledWith(message('key of the session missing or wrong in the link'), 'error');
      expect(intruder.collaboration).toBeNull();
      expect(texts(intruder)).toEqual([]);
    }

    // a key for a room in clear
    const clear = createDrawer({ language: 'en' });
    const keyed = createDrawer({ language: 'en' });

    connect(clear, 'room-clear', 'Clear');
    connect(keyed, 'room-clear', 'Keyed', { cipher });
    expect(clear.collaboration!.cipher).toBeNull();
    expect(keyed.collaboration).toBeNull();

    // server of previous versions: no encrypted room
    const old = createDrawer({ language: 'en' });
    const toast = vi.spyOn(old, 'toast');
    const socket = connect(old, 'room-k', 'Old', { cipher });

    socket.receive('ROOM', { newUsersCanEdit: true });
    await vi.waitFor(() =>
      expect(toast).toHaveBeenCalledWith(message('the server does not support end-to-end encryption'), 'error')
    );
    expect(old.collaboration).toBeNull();
  });

  it('Reconnection merges the drawing of an encrypted room with changes made meanwhile', async () => {
    const connect = createServer();
    const cipher = await RoomCipher.create(await createRoomKey());
    const alice = createDrawer();
    const bob = createDrawer();

    connect(alice, 'room-r', 'Alice', { userId: 'alice', ownerKey: 'secret', cipher });
    const bobSocket = connect(bob, 'room-r', 'Bob', { userId: 'bob', cipher });

    const a = addText(alice, 'A');
    addText(bob, 'B');
    await vi.waitFor(() => expect(texts(alice)).toEqual(['A', 'B']));
    await vi.waitFor(() => expect(texts(bob)).toEqual(['A', 'B']));

    // connection of bob lost: changes of both sides meanwhile
    bobSocket.room = undefined;
    bobSocket.receive('disconnect');
    a.destroy();
    alice.stage.fire('change');
    addText(bob, 'C');
    await vi.waitFor(() => expect(texts(alice)).toEqual(['B']));

    bobSocket.receive('connect');
    await vi.waitFor(() => expect(texts(bob)).toEqual(['B', 'C']));
    await vi.waitFor(() => expect(texts(alice)).toEqual(['B', 'C']));
  });

  it('Links of encrypted rooms carry their key, joined with it; rooms in clear with the option', async () => {
    const server = createServer();
    const createSocket = vi.spyOn(
      Drawer.prototype as unknown as { _createSocket(): Promise<FakeSocket> },
      '_createSocket'
    );

    createSocket.mockImplementation(async () => {
      const socket = server.createSocket();

      setTimeout(() => socket.receive('connect'));
      return socket;
    });

    try {
      const owner = createDrawer({ collaboration: true });
      const link = await owner.startCollaboration(undefined, 'Alice');
      const key = owner.collaboration!.cipher!.key;

      expect(link).toBe(owner.getCollaborationLink());
      expect(link).toContain(`&key=${key}`);
      addText(owner, 'shared');

      // invited user: key of the link
      window.location.hash = new URL(link).hash;
      const invited = createDrawer({ collaboration: true });
      const modal = invited.collaborationModal!;

      await tick();
      modal.$name.value = 'Bob';
      modal.$name.dispatchEvent(new Event('input'));
      modal.$joinButton.click();
      await vi.waitFor(() => expect(texts(invited)).toEqual(['shared']));
      expect(invited.collaboration!.cipher!.key).toBe(key);
      // shared by this user, with the key
      expect(invited.getCollaborationLink()).toContain(`&by=${invited.getUserId()}&key=${key}`);
      invited.stopCollaboration();

      // key cut by an app: told, nothing joined
      window.location.hash = new URL(link).hash.slice(0, -5);
      const cut = createDrawer({ collaboration: true, language: 'en' });
      const toast = vi.spyOn(cut, 'toast');

      await tick();
      cut.collaborationModal!.$name.value = 'Carol';
      cut.collaborationModal!.$name.dispatchEvent(new Event('input'));
      await cut.collaborationModal!.join();
      expect(toast).toHaveBeenCalledWith(
        'Collaboration unavailable: key of the session missing or wrong in the link',
        'error'
      );
      expect(cut.collaboration).toBeNull();
      cut.collaborationModal!.cancelJoin();
      owner.stopCollaboration();

      // option: rooms in clear, told in the dialog
      const clear = createDrawer({ collaboration: { encrypt: false }, language: 'en' });
      const clearLink = await clear.startCollaboration(undefined, 'Dan');

      expect(clear.collaboration!.cipher).toBeNull();
      expect(clearLink).not.toContain('&key=');
      clear.showCollaboration();
      expect(clear.collaborationModal!.$security.textContent).toBe(
        'Not encrypted: the server of the session can read the drawing.'
      );
      clear.collaborationModal!.hide();
      clear.stopCollaboration();
    } finally {
      createSocket.mockRestore();
    }
  });
});

describe('Slideshow in a session', () => {
  it('Slides of the owner followed by the other users, alone (around them masked), until they move their view', async () => {
    const connect = createServer();
    const alice = createDrawer({ collaboration: true, language: 'en' });
    const bob = createDrawer({ collaboration: true, language: 'en' });
    alice.addShape(createFrame({ x: 0, y: 0, width: 400, height: 300, label: 'Intro' }));
    alice.addShape(createFrame({ x: 600, y: 0, width: 300, height: 300, label: 'Plan' }));
    const mask = (drawer: Drawer) => drawer.selectionLayer.findOne(`.${slideMaskName}`);
    const center = (drawer: Drawer) => {
      const view = drawer.getViewArea();

      return [Math.round(view.x + view.width / 2), Math.round(view.y + view.height / 2)];
    };

    connect(alice, 'room', 'Alice', { userId: 'alice', ownerKey: 'secret' });
    connect(bob, 'room', 'Bob', { userId: 'bob' });
    alice.stage.fire('change');

    // owner: presentation started with the slideshow
    alice.slideshow.start();
    await wait();
    expect(alice.collaboration!.presenting).toBe(true);
    expect(bob.collaboration!.presentedView).toEqual({ x: 0, y: 0, width: 400, height: 300, slide: true });
    expect(center(bob)).toEqual([200, 150]);
    expect(mask(bob)).toBeDefined();

    alice.slideshow.next();
    await wait();
    expect(center(bob)).toEqual([750, 150]);

    // view moved: slide no longer alone, followed again with the button
    bob.setZoomLevel(0.5);
    expect(bob.collaboration!.following).toBe(false);
    expect(mask(bob)).toBeUndefined();
    bob.collaboration!.follow();
    expect(mask(bob)).toBeDefined();
    expect(center(bob)).toEqual([750, 150]);

    // stopped: presentation stopped (started by the slideshow), whole drawing shown again
    alice.slideshow.stop();
    await wait();
    expect(alice.collaboration!.presenting).toBe(false);
    expect(bob.collaboration!.presentedView).toBeNull();
    expect(mask(bob)).toBeUndefined();
  });
});
