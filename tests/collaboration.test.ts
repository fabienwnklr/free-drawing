import { describe, expect, it, beforeAll, vi } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import type { Drawer } from '../src/Drawer';
import type { TextWidget } from '../src/components/toolbar/widgets/Text/Text';
import type { SelectWidget } from '../src/components/toolbar/widgets/Select/Select';
import {
  Collaboration,
  type CollaborationSocket,
  type DrawingChange,
} from '../src/components/Collaboration/Collaboration';
import { createDrawer, fireMouse } from './helpers';

beforeAll(() => {
  function noOp() {}

  if (typeof window.URL.createObjectURL === 'undefined') {
    Object.defineProperty(window.URL, 'createObjectURL', { value: noOp });
  }
});

type FakeSocket = CollaborationSocket & { receive: (event: string, data?: unknown) => void; emit: ReturnType<typeof vi.fn> };

/**
 * Relays changes of a socket to the other ones and sends drawing to new ones, as server/index.mjs
 */
const createServer = () => {
  const sockets: FakeSocket[] = [];
  const shapes = new Map<string, string>();

  return (drawer: Drawer) => {
    const handlers: Record<string, ((data?: unknown) => void)[]> = {};
    const socket = {
      on: (event: string, handler: (data?: unknown) => void) => (handlers[event] ??= []).push(handler),
      emit: vi.fn((event: string, change: DrawingChange) => {
        change.remove.forEach((id) => shapes.delete(id));
        change.upsert.forEach((json) => shapes.set(JSON.parse(json).attrs.id, json));
        sockets.filter((s) => s !== socket).forEach((s) => s.receive(event, change));
      }),
      receive: (event: string, data?: unknown) => handlers[event]?.forEach((handler) => handler(data)),
    } as unknown as FakeSocket;

    sockets.push(socket);
    drawer.collaboration = new Collaboration(drawer, socket);
    socket.receive('connect');
    if (shapes.size) socket.receive('CHANGE', { upsert: [...shapes.values()], remove: [] });

    return socket;
  };
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
});
