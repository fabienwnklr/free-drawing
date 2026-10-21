import { describe, expect, it, beforeAll, vi } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import { Drawer } from '@/Drawer';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { Collaboration } from '@/components/Collaboration/Collaboration';
import type { CollaborationSocket, DrawingChange } from '@/@types/collaboration';
import { createDrawer, fireMouse, keydown, setPointer } from './helpers';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import type { Group } from 'konva/lib/Group';
import type { Shape, ShapeConfig } from 'konva/lib/Shape';
import type { Text } from 'konva/lib/shapes/Text';
import type { Line } from 'konva/lib/shapes/Line';

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
    shapes: Map<string, string>;
    ownerKey?: string;
    ownerId?: string;
    viewers: Set<string>;
    names: Map<string, string>;
    newUsersCanEdit: boolean;
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
          const { room, name, userId, ownerKey, invitedBy } = data as {
            room: string;
            name: string;
            userId: string;
            ownerKey?: string;
            invitedBy?: string;
          };
          const roomData = rooms.get(room) ?? {
            shapes: new Map<string, string>(),
            viewers: new Set<string>(),
            names: new Map<string, string>(),
            newUsersCanEdit: true,
          };

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
          socket.receive('ROOM', { newUsersCanEdit: roomData.newUsersCanEdit });
          socket.receive('CHANGE', {
            upsert: [...roomData.shapes.values()],
            remove: [],
            order: [...roomData.shapes.keys()],
            full: true,
          });
          sendUsers(room);
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
          rooms.get(socket.room!)!.newUsersCanEdit = newUsersCanEdit;
          for (const s of inRoom(socket.room)) s.receive(event, { newUsersCanEdit });
        } else if (event === 'NAME') {
          socket.name = data as string;
          rooms.get(socket.room!)!.names.set(socket.userId!, socket.name);
          sendUsers(socket.room);
        } else if (event === 'POINTER') {
          for (const s of inRoom(socket.room).filter((s) => s !== socket)) {
            s.receive(event, { id: socket.id, name: socket.name, position: data });
          }
        } else if (event === 'CHANGE') {
          const change = data as DrawingChange;
          const roomData = rooms.get(socket.room!)!;
          const { shapes, viewers } = roomData;

          // without right to draw: ignored
          if (viewers.has(socket.userId!)) return;

          for (const id of change.remove) shapes.delete(id);
          for (const json of change.upsert) shapes.set(JSON.parse(json).attrs.id, json);
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
    ids: { userId?: string; ownerKey?: string; invitedBy?: string } = {}
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
    await tick();
    await tick();

    const room = drawer.collaboration!.room;
    expect(drawer.collaboration!.name).toBe('Alice');
    expect(window.location.hash).toBe(`#room=${room}&by=${drawer.getUserId()}`);
    expect(modal.$link.value).toBe(drawer.getCollaborationLink());
    expect(modal.$users.textContent).toBe('Connected (1)');
    // creator of the room is its owner
    expect(modal.$members.textContent).toBe('Alice (you)Owner');
    expect(modal.$qrCode.querySelector('svg')).not.toBeNull();
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

    expect(socket.emit).toHaveBeenCalledWith('JOIN', expect.objectContaining({ userId: drawer.getUserId() }));
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
    modal.$joinButton.click();
    await tick();
    await tick();
    expect(drawer.collaboration?.room).toBe('abc123');
    expect(drawer.collaboration?.name).toBe('Bob');
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
    owner.stopCollaboration();
    window.location.hash = `#room=${room}`;
    const reloaded = createDrawer({ collaboration: true, localStorageKey: owner.options.localStorageKey });
    await tick();
    expect(reloaded.collaboration?.room).toBe(room);
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

    indicator.$button.click();
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

  it('Owner of the room gives or removes the right to draw', async () => {
    const connect = createServer();
    const alice = createDrawer();
    const bob = createDrawer();
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

    $canEdit.checked = false;
    $canEdit.dispatchEvent(new Event('change'));
    expect(bob.collaboration!.canEdit).toBe(false);
    expect(bob.readOnly).toBe(true);
    expect(bob.activeTool).toBe('pan');

    // changes of user without right are ignored
    const text = addText(bob, 'not allowed');
    expect(byId(alice, text.id())).toBeUndefined();

    // only owner gives rights
    bob.collaboration!.setRight('bob', true);
    expect(bob.collaboration!.canEdit).toBe(false);

    alice.collaboration!.setRight('bob', true);
    expect(bob.readOnly).toBe(false);
    expect(bob.activeTool).toBe('brush');
    alice.collaboration!.setRight('alice', false);
    expect(alice.collaboration!.canEdit).toBe(true);
    alice.collaborationModal!.hide();
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
    // drawing of the room lost (emptied, server restarted)
    bobSocket.room = undefined;
    bobSocket.receive('disconnect');
    connect.rooms.get('room')!.shapes.clear();

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

  it('Groups are sent at their place, replaced when their shapes change', () => {
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

    second.x(100);
    a.stage.fire('change');
    const copy = b.getDrawingShapes()[0] as Group;
    expect(copy.id()).toBe(group.id());
    expect(copy.getChildren()[1].x()).toBe(100);

    a.ungroupShapes([group]);
    expect(classNames(b)).toEqual(['Rect', 'Rect', 'Rect']);
    expect(b.getDrawingShapes().map((shape) => shape.id())).toEqual([first.id(), second.id(), top.id()]);
  });
});
