import { describe, expect, it, vi } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import { Ellipse } from 'konva/lib/shapes/Ellipse';
import { Line } from 'konva/lib/shapes/Line';
import type { Context } from 'konva/lib/Context';
import type { Shape, ShapeConfig } from 'konva/lib/Shape';
import type { Drawer } from '../src/Drawer';
import type { SelectWidget } from '../src/components/toolbar/widgets/Select/Select';
import type { TextWidget } from '../src/components/toolbar/widgets/Text/Text';
import { shapeName } from '../src/constants';
import { createDrawer, fireMouse, setPointer } from './helpers';

type Modifiers = { shiftKey?: boolean; altKey?: boolean };

/** Drawer with selection tool */
const createSelection = () => {
  const drawer = createDrawer();
  const selectWidget = drawer.getWidget<SelectWidget>('selection')!;

  selectWidget.setActive(true);
  return { drawer, selectWidget, selected: () => selectWidget.transformer.nodes() };
};

const addRect = (drawer: Drawer, x: number, y: number, size: number, fill?: string) =>
  drawer.addShape(new Rect({ name: shapeName.rect, x, y, width: size, height: size, fill, stroke: '#000' }));

/** Press on a shape (konva hit, not available in jsdom) */
const press = (drawer: Drawer, shape: Shape<ShapeConfig>, x: number, y: number, modifiers: Modifiers = {}) => {
  setPointer(drawer, x, y);
  shape.fire('mousedown', { evt: { button: 0, preventDefault() {}, ...modifiers } }, true);
};

/** Release: konva ends drags on window */
const release = (drawer: Drawer, x: number, y: number, modifiers: Modifiers = {}) => {
  fireMouse(drawer, 'mouseup', x, y, modifiers);
  window.dispatchEvent(new MouseEvent('mouseup', { clientX: x, clientY: y }));
};

/** Click on a shape */
const click = (drawer: Drawer, shape: Shape<ShapeConfig>, x: number, y: number, modifiers: Modifiers = {}) => {
  press(drawer, shape, x, y, modifiers);
  release(drawer, x, y, modifiers);
};

/** Click or selection rectangle on empty place */
const drag = (drawer: Drawer, from: [number, number], to: [number, number], modifiers: Modifiers = {}) => {
  fireMouse(drawer, 'mousedown', ...from, modifiers);
  fireMouse(drawer, 'mousemove', ...to, modifiers);
  release(drawer, ...to, modifiers);
};

describe('Selection', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Click selects only the shape drawn under pointer, a text on a shape is selected alone', () => {
    const { drawer, selected } = createSelection();
    const rect = addRect(drawer, 0, 0, 300, '#a5d8ff');
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('hello');

    text.position({ x: 50, y: 50 });
    click(drawer, text, 55, 55);
    expect(selected()).toEqual([text]);

    click(drawer, rect, 250, 250);
    expect(selected()).toEqual([rect]);

    // empty place
    drag(drawer, [600, 600], [600, 600]);
    expect(selected()).toEqual([]);
  });

  it('Shape pressed is selected at once to be dragged, a drag keeps selection', () => {
    const { drawer, selected } = createSelection();
    const first = addRect(drawer, 0, 0, 50, '#a5d8ff');
    const second = addRect(drawer, 100, 0, 50, '#a5d8ff');

    click(drawer, first, 10, 10);
    // pressed shape not selected: dragged alone
    press(drawer, second, 110, 10);
    expect(selected()).toEqual([second]);
    fireMouse(drawer, 'mouseup', 150, 60);
    expect(selected()).toEqual([second]);

    // with Shift: added, dragged with selection
    press(drawer, first, 10, 10, { shiftKey: true });
    expect(selected()).toEqual([second, first]);
    fireMouse(drawer, 'mouseup', 10, 10, { shiftKey: true });
    expect(selected()).toEqual([second, first]);

    // drag of a selected shape moves all of them
    press(drawer, first, 10, 10);
    fireMouse(drawer, 'mouseup', 40, 40);
    expect(selected()).toEqual([second, first]);

    // click on a selected shape selects it alone, with Shift unselects it
    click(drawer, first, 10, 10);
    expect(selected()).toEqual([first]);
    click(drawer, second, 110, 10, { shiftKey: true });
    click(drawer, first, 10, 10, { shiftKey: true });
    expect(selected()).toEqual([second]);
  });

  it('Click inside rectangle or ellipse without background selects the smallest one around pointer', () => {
    const { drawer, selected } = createSelection();
    const big = addRect(drawer, 0, 0, 300);
    const small = addRect(drawer, 100, 100, 50);
    const ellipse = drawer.addShape(
      new Ellipse({ name: shapeName.ellipse, x: 500, y: 100, radiusX: 50, radiusY: 50, stroke: '#000' })
    );

    // no hit: inside outlines
    drag(drawer, [120, 120], [120, 120]);
    expect(selected()).toEqual([small]);
    drag(drawer, [20, 20], [20, 20]);
    expect(selected()).toEqual([big]);
    drag(drawer, [500, 100], [500, 100]);
    expect(selected()).toEqual([ellipse]);
    // corner of ellipse box: in selection box, selection kept
    drag(drawer, [455, 55], [455, 55]);
    expect(selected()).toEqual([ellipse]);
    drag(drawer, [700, 600], [700, 600]);
    drag(drawer, [455, 55], [455, 55]);
    expect(selected()).toEqual([]);

    // rotated rectangle
    small.rotation(45);
    drag(drawer, [100, 140], [100, 140]);
    expect(selected()).toEqual([small]);
  });

  it('Inside of rectangles and ellipses without background is not hit, shapes under it can be pressed', () => {
    const { drawer } = createSelection();
    const rect = addRect(drawer, 0, 0, 300);
    const ellipse = drawer.addShape(new Ellipse({ name: shapeName.ellipse, radiusX: 50, radiusY: 30, stroke: '#000' }));
    const context = { strokeShape: vi.fn(), fillStrokeShape: vi.fn() } as unknown as Context;
    const hit = (shape: Shape<ShapeConfig>) => {
      vi.mocked(context.strokeShape).mockClear();
      vi.mocked(context.fillStrokeShape).mockClear();
      // path drawing methods
      shape.hitFunc().call(shape, Object.assign(Object.create(new Proxy({}, { get: () => () => {} })), context), shape);
    };

    for (const shape of [rect, ellipse]) {
      hit(shape);
      expect(context.strokeShape).toHaveBeenCalledWith(shape);
      expect(context.fillStrokeShape).not.toHaveBeenCalled();

      shape.fill('#a5d8ff');
      hit(shape);
      expect(context.fillStrokeShape).toHaveBeenCalledWith(shape);
    }

    // lines saved while selected (previous versions): wide hit
    const line = drawer.addShape(new Line({ points: [0, 0, 100, 100], stroke: '#000', strokeWidth: 3 }));
    expect(line.hitStrokeWidth()).toBe(20);
  });

  it('Selection is dragged from its box, out of its shapes', () => {
    const { drawer, selected } = createSelection();
    const line = drawer.addShape(new Line({ points: [0, 0, 200, 200], stroke: '#000', strokeWidth: 3 }));
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('hello');

    text.position({ x: 300, y: 300 });
    click(drawer, line, 100, 100);

    // empty place of line box (pointer id given by konva in browser)
    setPointer(drawer, 150, 30);
    drawer.stage.fire('mousedown', { evt: { button: 0, preventDefault() {} }, pointerId: 999 });
    expect(line.isDragging()).toBe(true);
    release(drawer, 150, 30);
    expect(line.isDragging()).toBe(false);
    expect(selected()).toEqual([line]);

    // shape pressed in selection box is selected
    text.position({ x: 150, y: 30 });
    click(drawer, text, 155, 35);
    expect(selected()).toEqual([text]);
  });

  it('Selection rectangle selects shapes entirely in it, Shift adds them to selection', () => {
    const { drawer, selected } = createSelection();
    const big = addRect(drawer, 0, 0, 300);
    const small = addRect(drawer, 100, 100, 50);
    const other = addRect(drawer, 400, 100, 50);

    // drawn in big rectangle
    drag(drawer, [80, 80], [200, 200]);
    expect(selected()).toEqual([small]);

    drag(drawer, [-20, -20], [350, 350]);
    expect(selected()).toEqual([big, small]);

    // partly over other: not selected
    drag(drawer, [380, 80], [420, 200], { shiftKey: true });
    expect(selected()).toEqual([big, small]);
    drag(drawer, [380, 80], [470, 200], { shiftKey: true });
    expect(selected()).toEqual([big, small, other]);
  });

  it('Alt + click selects the shape behind selected one, then back to top', () => {
    const { drawer, selected } = createSelection();
    const bottom = addRect(drawer, 0, 0, 300, '#a5d8ff');
    const middle = addRect(drawer, 50, 50, 100, '#b2f2bb');
    const top = addRect(drawer, 80, 80, 40, '#ffc9c9');
    const other = addRect(drawer, 400, 0, 50, '#ffc9c9');

    // no hit canvas in jsdom: shapes drawn at this point
    [bottom, middle, other].forEach((shape) => vi.spyOn(shape, 'intersects').mockReturnValue(shape !== other));

    click(drawer, top, 100, 100, { altKey: true });
    expect(selected()).toEqual([top]);
    click(drawer, top, 100, 100, { altKey: true });
    expect(selected()).toEqual([middle]);
    click(drawer, top, 100, 100, { altKey: true });
    expect(selected()).toEqual([bottom]);
    click(drawer, top, 100, 100, { altKey: true });
    expect(selected()).toEqual([top]);

    // without Alt: top one
    click(drawer, top, 100, 100, { altKey: true });
    click(drawer, top, 100, 100);
    expect(selected()).toEqual([top]);
  });
});
