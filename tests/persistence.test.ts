import { describe, expect, it, beforeAll, afterEach, vi } from 'vitest';
import { Line } from 'konva/lib/shapes/Line';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import { historyLimit, shapeName } from '@/constants';
import { createDrawer, fireMouse } from './helpers';

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

  it('Corrupted saved data is ignored', () => {
    const localStorageKey = 'test-' + Math.random();

    for (const saved of ['{not json', JSON.stringify({ className: 'Stage', attrs: {}, children: [] })]) {
      localStorage.setItem(localStorageKey, saved);
      const drawer = createDrawer({ localStorageKey });

      expect(drawer.drawLayer).toBeDefined();
      expect(drawer.getDrawingShapes().length).toBe(0);
    }
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
    const length = drawer.undoRedo.appHistory.length;

    drawer.getWidget<TextWidget>('text')!.addTextNode('hello');
    expect(() => drawer.stage.fire('change')).not.toThrow();

    expect(drawer.undoRedo.appHistory.length).toBe(length + 1);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('History is limited', () => {
    const drawer = createDrawer();
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('hello');

    for (let i = 0; i < historyLimit + 50; i++) {
      text.x(i);
      drawer.stage.fire('change');
    }

    expect(drawer.undoRedo.appHistory.length).toBe(historyLimit);

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
    const localStorageKey = 'test-' + Math.random();
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
    expect(second.stage.children.map((layer) => layer.name().trim())).toEqual(['background', 'grid', 'draw', 'selection']);
  });
});
