import { describe, expect, it, beforeAll, vi } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import { Drawer } from '../src/Drawer';
import type { TextWidget } from '../src/components/toolbar/widgets/Text/Text';
import type { SelectWidget } from '../src/components/toolbar/widgets/Select/Select';
import {
  Collaboration,
  type CollaborationSocket,
  type DrawingChange,
} from '../src/components/Collaboration/Collaboration';
import { createDrawer, fireMouse, setPointer } from './helpers';
import type { Group } from 'konva/lib/Group';
import type { Text } from 'konva/lib/shapes/Text';

const tick = () => new Promise((resolve) => setTimeout(resolve));
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
  emit: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  room?: string;
  name?: string;
  id: string;
};

/**
 * Rooms of users, as server/index.mjs: changes relayed to users of the same room,
 * drawing of the room sent to joining users, names of users sent to the room
 */
const createServer = () => {
  const sockets: FakeSocket[] = [];
  const rooms = new Map<string, Map<string, string>>();
  let lastId = 0;
  const inRoom = (room?: string) => sockets.filter((s) => s.room === room);
  const sendUsers = (room?: string) =>
    inRoom(room).forEach((s) => s.receive('USERS', inRoom(room).map((user) => user.name || 'Anonymous')));

  /** New socket, connected when `receive('connect')` */
  const createSocket = () => {
    const handlers: Record<string, ((data?: unknown) => void)[]> = {};
    const socket = {
      on: (event: string, handler: (data?: unknown) => void) => (handlers[event] ??= []).push(handler),
      once: (event: string, handler: (data?: unknown) => void) => (handlers[event] ??= []).push(handler),
      receive: (event: string, data?: unknown) => handlers[event]?.forEach((handler) => handler(data)),
      disconnect: vi.fn(() => {
        sockets.splice(sockets.indexOf(socket), 1);
        inRoom(socket.room).forEach((s) => s.receive('LEAVE', socket.id));
        sendUsers(socket.room);
      }),
      emit: vi.fn((event: string, data: unknown) => {
        if (event === 'JOIN') {
          const { room, name } = data as { room: string; name: string };
          const shapes = rooms.get(room) ?? new Map<string, string>();

          Object.assign(socket, { room, name });
          rooms.set(room, shapes);
          if (shapes.size) socket.receive('CHANGE', { upsert: [...shapes.values()], remove: [] });
          sendUsers(room);
        } else if (event === 'NAME') {
          socket.name = data as string;
          sendUsers(socket.room);
        } else if (event === 'POINTER') {
          inRoom(socket.room)
            .filter((s) => s !== socket)
            .forEach((s) => s.receive(event, { id: socket.id, name: socket.name, position: data }));
        } else if (event === 'CHANGE') {
          const change = data as DrawingChange;
          const shapes = rooms.get(socket.room!)!;

          change.remove.forEach((id) => shapes.delete(id));
          change.upsert.forEach((json) => shapes.set(JSON.parse(json).attrs.id, json));
          inRoom(socket.room)
            .filter((s) => s !== socket)
            .forEach((s) => s.receive(event, change));
        }
      }),
    } as unknown as FakeSocket;

    socket.id = `socket-${++lastId}`;
    Object.assign(socket, { volatile: { emit: (event: string, data: unknown) => socket.emit(event, data) } });
    sockets.push(socket);
    return socket;
  };

  /** Drawer collaborating in a room */
  const connect = (drawer: Drawer, room = 'room', name = '') => {
    const socket = createSocket();

    drawer.collaboration = new Collaboration(drawer, socket, { room, name });
    socket.receive('connect');

    return socket;
  };

  return Object.assign(connect, { createSocket });
};

const addText = (drawer: Drawer, text: string) => {
  const node = drawer.getWidget<TextWidget>('text')!.addTextNode(text);
  drawer.getWidget<SelectWidget>('selection')!.clearSelection();
  drawer.stage.fire('change');
  return node;
};

const byId = (drawer: Drawer, id: string) => drawer.getDrawingShapes().find((s) => s.id() === id);

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
    await tick();
    await tick();

    const room = drawer.collaboration!.room;
    expect(drawer.collaboration!.name).toBe('Alice');
    expect(window.location.hash).toBe(`#room=${room}`);
    expect(modal.$link.value).toBe(drawer.getCollaborationLink());
    expect(modal.$users.textContent).toBe('Connected (1): Alice');
    expect(modal.$qrCode.querySelector('svg')).not.toBeNull();
    expect(drawer.setting.$collaborationButton.textContent).toContain('On (1)');

    modal.$stopButton.click();
    expect(drawer.collaboration).toBeNull();
    expect(socket.disconnect).toHaveBeenCalled();
    expect(window.location.hash).toBe('');
    expect(modal.$session.hidden).toBe(true);
  });

  it('Room link joins the room, collaboration needs its option', async () => {
    const server = createServer();
    const socket = server.createSocket();
    const createSocket = vi.spyOn(Drawer.prototype as unknown as { _createSocket(): Promise<FakeSocket> }, '_createSocket');

    createSocket.mockImplementation(async () => {
      setTimeout(() => socket.receive('connect'));
      return socket;
    });
    window.location.hash = '#room=abc123';

    const drawer = createDrawer({ collaboration: true });
    await tick();
    expect(drawer.collaboration?.room).toBe('abc123');
    drawer.stopCollaboration();

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
    expect(byId(b, line.id())!.getAttr('points')).toEqual(line.getAttr('points'));
    fireMouse(b, 'mouseup', 300, 300);

    fireMouse(a, 'mouseup', 120, 90);
    expect(byId(b, line.id())!.getAttr('points')).toEqual(line.getAttr('points'));
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
});
