import { describe, expect, it, beforeAll, afterEach, vi } from 'vitest';
import { Line } from 'konva/lib/shapes/Line';
import { Rect } from 'konva/lib/shapes/Rect';
import type { Drawer } from '@/Drawer';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import { historyLimit, shapeName } from '@/constants';
import { createDrawer, fireMouse } from './helpers';

/** Image file of 1 x 1 pixel */
const pngData =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

beforeAll(() => {
  function noOp() {}

  if (typeof window.URL.createObjectURL === 'undefined') {
    Object.defineProperty(window.URL, 'createObjectURL', { value: noOp });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Persistence and performance', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Corrupted saved data is ignored, with a warning', () => {
    const localStorageKey = `test-${Math.random()}`;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    for (const saved of ['{not json', JSON.stringify({ className: 'Stage', attrs: {}, children: [] })]) {
      localStorage.setItem(localStorageKey, saved);
      const drawer = createDrawer({ localStorageKey });

      expect(drawer.drawLayer).toBeDefined();
      expect(drawer.getDrawingShapes().length).toBe(0);
    }
    expect(warn).toHaveBeenCalledWith(`[free-drawing] invalid saved data "${localStorageKey}" ignored`);
    warn.mockRestore();
  });

  it('Unavailable storage does not break drawer', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });

    expect(() => createDrawer()).not.toThrow();
  });

  it('Save failure does not break history', () => {
    const drawer = createDrawer({ autoSave: true });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    const onChange = vi.fn();
    drawer.on('change', onChange);
    const length = drawer.undoRedo.entries.length;

    drawer.getWidget<TextWidget>('text')!.addTextNode('hello');
    expect(() => drawer.stage.fire('change')).not.toThrow();

    expect(drawer.undoRedo.entries.length).toBe(length + 1);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('History is limited', () => {
    const drawer = createDrawer();
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('hello');

    for (let i = 0; i < historyLimit + 50; i++) {
      text.x(i);
      drawer.stage.fire('change');
    }

    // with current state: historyLimit states
    expect(drawer.undoRedo.entries.length).toBe(historyLimit - 1);
    // properties of previous versions
    expect(drawer.undoRedo.appHistory.length).toBe(historyLimit);
    expect(drawer.undoRedo.appHistoryStep).toBe(historyLimit - 1);

    drawer.undoRedo.undo();
    expect(drawer.getDrawingShapes()[0].x()).toBe(historyLimit + 48);
  });

  it('Brush points are rounded', () => {
    const drawer = createDrawer();
    fireMouse(drawer, 'mousedown', 10.123, 10.456);
    fireMouse(drawer, 'mousemove', 100.789, 50.321);
    fireMouse(drawer, 'mouseup', 150.654, 80.987);

    const points = (drawer.drawLayer.children[0] as Line).points();

    expect(points.length).toBeGreaterThan(0);
    expect(points.every((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6)).toBe(true);
  });

  it('Grid is a single non listening shape, not recreated on pan', () => {
    const drawer = createDrawer();
    drawer.showGrid();
    const [grid] = drawer.gridLayer.children;

    drawer.stage.position({ x: 100, y: 50 });
    drawer.stage.fire('dragmove');
    drawer.setZoomLevel(0.1);

    expect(drawer.gridLayer.children).toEqual([grid]);
    expect(drawer.gridLayer.listening()).toBe(false);
    expect(drawer.bgLayer.listening()).toBe(false);
  });

  it('Grid saved with lines (previous versions) is restored', () => {
    const localStorageKey = `test-${Math.random()}`;
    const first = createDrawer({ localStorageKey });
    first.gridLayer.add(new Line({ points: [0, 0, 0, 100], name: shapeName.gridLine }));
    first.gridLayer.add(new Line({ points: [0, 0, 100, 0], name: shapeName.gridLine }));
    // view at save time, grid was not drawn outside after pan
    first.gridLayer.clip({ x: 0, y: 0, width: 1200, height: 750 });
    first.save();

    const second = createDrawer({ localStorageKey });

    expect(second.grid).toBe(true);
    expect(second.gridLayer.children.length).toBe(1);
    expect(second.gridLayer.listening()).toBe(false);
    expect(second.gridLayer.clipWidth()).toBeUndefined();
    // layers order: background, grid, drawing, selection
    expect(second.stage.children.map((layer) => layer.name().trim())).toEqual([
      'background',
      'grid',
      'draw',
      'selection',
    ]);
  });
});

/** Value stored by another tab of the browser (`storage` event of the window) */
const storedByOtherTab = (key: string, newValue: string) => {
  localStorage.setItem(key, newValue);
  window.dispatchEvent(new StorageEvent('storage', { key, newValue, storageArea: localStorage }));
};

/** Drawing with a rectangle and a background, saved as a tab does */
const savedDrawing = () => {
  const other = createDrawer();
  const rect = other.addShape(new Rect({ name: shapeName.rect, x: 10, y: 20, width: 50, height: 40 }));

  other.setBgColor('#ffeeaa');
  return { json: other.stage.toJSON(), rect };
};

describe('Other tabs of the browser', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Drawing saved by another tab shown here: not saved again nor undone; not over changes not saved', () => {
    const drawer = createDrawer({ autoSave: true });
    const key = drawer.options.localStorageKey;
    const { json, rect } = savedDrawing();
    const save = vi.spyOn(drawer, 'save');
    const change = vi.fn();

    drawer.on('change', change);
    storedByOtherTab(key, json);
    expect(drawer.getDrawingShapes().map((shape) => shape.id())).toEqual([rect.id()]);
    expect(drawer.background.fill()).toBe('#ffeeaa');
    expect(change).toHaveBeenCalledTimes(1);
    expect(save).not.toHaveBeenCalled();
    expect(drawer.undoRedo.canUndo()).toBe(false);
    // other keys and invalid data ignored
    storedByOtherTab(`${key}-other`, json);
    storedByOtherTab(key, '{not json');
    expect(drawer.getDrawingShapes()).toHaveLength(1);

    // changes of this tab not saved yet: kept, saved over the other drawing
    const manual = createDrawer();

    manual.addShape(new Rect({ name: shapeName.rect, width: 10, height: 10 }));
    manual.stage.fire('change');
    expect(manual.hasUnsavedChanges()).toBe(true);
    storedByOtherTab(manual.options.localStorageKey, json);
    expect(manual.getDrawingShapes().map((shape) => shape.id())).not.toContain(rect.id());
  });

  it('Library and image files of another tab taken', () => {
    const drawer = createDrawer();
    const key = drawer.options.localStorageKey;
    const other = createDrawer();
    const libraryChange = vi.fn();

    other.library.add([other.addShape(new Rect({ name: shapeName.rect, width: 10, height: 10 }))], 'Card');
    drawer.on('library.change', libraryChange);
    storedByOtherTab(`${key}-library`, JSON.stringify(other.library.toFile()));
    expect(drawer.library.items.map(({ name }) => name)).toEqual(['Card']);
    expect(libraryChange).toHaveBeenCalledTimes(1);

    storedByOtherTab(`${key}-files`, JSON.stringify({ image: pngData, bad: 'data:text/plain,x' }));
    expect([...drawer.files.keys()]).toEqual(['image']);
  });

  it('Drawing of the `storage` option: drawings of other tabs ignored', () => {
    const drawer = createDrawer({ storage: { load: async () => null, save: async () => {} } });

    storedByOtherTab(drawer.options.localStorageKey, savedDrawing().json);
    expect(drawer.getDrawingShapes()).toEqual([]);
  });
});

describe('Stored data cleared', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  /** Data kept in the browser for a drawer */
  const store = (drawer: Drawer) => {
    const key = drawer.options.localStorageKey;

    drawer.addShape(new Rect({ name: shapeName.rect, width: 10, height: 10 }));
    drawer.library.add([drawer.getDrawingShapes()[0]]);
    drawer.setPreferences({ grid: true });
    drawer.save();
    drawer.getUserId();
    drawer.setUserName('Ada');
    localStorage.setItem(`${key}-user-key`, 'secret');
    localStorage.setItem(`${key}-owner`, '{}');
    localStorage.setItem(`${key}-room-abc`, '[]');
    localStorage.setItem(`${key}-rooms`, '["abc"]');
    localStorage.setItem(`${key}-theme`, 'dark');
    localStorage.setItem(`${key}-other`, 'kept');
    localStorage.setItem(`${key}2`, 'kept');
  };

  it('Drawing, files, library and preferences removed, identity kept; new drawing shown, toast', () => {
    const drawer = createDrawer();
    const key = drawer.options.localStorageKey;
    const toast = vi.spyOn(drawer, 'toast');

    store(drawer);
    const removed = ['', '-tool', '-library', '-preferences', '-room-abc', '-rooms', '-theme'].map((end) => key + end);
    const kept = ['-user', '-user-key', '-owner', '-name', '-other', '2'].map((end) => key + end);

    expect(removed.concat(kept).filter((stored) => localStorage.getItem(stored) === null)).toEqual([]);

    // confirmed in a dialog
    drawer.clearStoredData();
    expect(localStorage.getItem(key)).not.toBeNull();
    drawer.clearStoredConfirmModal!.$confirmBtn.click();
    expect(removed.filter((stored) => localStorage.getItem(stored) !== null)).toEqual([]);
    expect(kept.filter((stored) => localStorage.getItem(stored) === null)).toEqual([]);
    expect(toast).toHaveBeenCalledWith('Stored data removed', 'info');

    // new drawing: nothing to undo nor to save, library emptied
    expect(drawer.getDrawingShapes()).toEqual([]);
    expect(drawer.undoRedo.canUndo()).toBe(false);
    expect(drawer.hasUnsavedChanges()).toBe(false);
    expect(drawer.library.items).toEqual([]);
    expect(drawer.getUserName()).toBe('Ada');
  });

  it('Drawing of a read only drawer kept; menu and palette without it with the `storage` option', () => {
    const drawer = createDrawer({ readOnly: true });

    drawer.addShape(new Rect({ name: shapeName.rect, width: 10, height: 10 }));
    drawer.clearStoredData(true);
    expect(drawer.getDrawingShapes()).toHaveLength(1);

    const app = createDrawer({ storage: { load: async () => null, save: async () => {} } });

    expect(app.setting.$clearStorageButton.isConnected).toBe(false);
    expect(createDrawer().setting.$clearStorageButton.isConnected).toBe(true);
  });
});
