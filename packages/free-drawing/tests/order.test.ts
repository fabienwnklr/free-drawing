import { describe, expect, it } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import type { Shape, ShapeConfig } from 'konva/lib/Shape';
import type { Drawer } from '@/Drawer';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import type { BaseOverlay } from '@/components/tools/Overlay/BaseOverlay';
import { applyOrder } from '@/utils/order';
import { createDrawer, keydown } from './helpers';

/** Rects added in this order (bottom to top), named by their id */
const addRects = (drawer: Drawer, rects: Record<string, [number, number, number, number]>) =>
  Object.entries(rects).map(([id, [x, y, width, height]]) => drawer.addShape(new Rect({ id, x, y, width, height })));

const order = (drawer: Drawer) => drawer.getDrawingShapes().map((shape) => shape.id());

const select = (drawer: Drawer, shapes: Shape<ShapeConfig>[]) =>
  drawer.getWidget<SelectWidget>('selection')!.transformer.nodes(shapes);

describe('Stacking order', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Shapes move forward / backward past the next shape they overlap', () => {
    const drawer = createDrawer();
    // b is far from a and c
    const [a] = addRects(drawer, { a: [0, 0, 50, 50], b: [500, 500, 10, 10], c: [20, 20, 50, 50] });

    expect(drawer.reorderShapes('forward', [a])).toBe(true);
    expect(order(drawer)).toEqual(['b', 'c', 'a']);
    // nothing overlapping above
    expect(drawer.reorderShapes('forward', [a])).toBe(false);

    expect(drawer.reorderShapes('backward', [a])).toBe(true);
    expect(order(drawer)).toEqual(['b', 'a', 'c']);
  });

  it('Shapes move to front / back, relative order of moved shapes is kept', () => {
    const drawer = createDrawer();
    const [a, b, c, d] = addRects(drawer, {
      a: [0, 0, 10, 10],
      b: [0, 0, 10, 10],
      c: [0, 0, 10, 10],
      d: [0, 0, 10, 10],
    });

    drawer.reorderShapes('front', [c, a]);
    expect(order(drawer)).toEqual(['b', 'd', 'a', 'c']);

    drawer.reorderShapes('back', [d, c]);
    expect(order(drawer)).toEqual(['d', 'c', 'b', 'a']);
    expect(drawer.reorderShapes('back', [c, d])).toBe(false);

    // overlapping moved shapes move together
    drawer.reorderShapes('forward', [d, c]);
    expect(order(drawer)).toEqual(['b', 'd', 'c', 'a']);
    // b is already at the bottom
    drawer.reorderShapes('backward', [a, b]);
    expect(order(drawer)).toEqual(['b', 'd', 'a', 'c']);
  });

  it('Selection is reordered with shortcuts, arrows without Ctrl still move it, undo restores order', () => {
    const drawer = createDrawer();
    const [a] = addRects(drawer, { a: [0, 0, 50, 50], b: [10, 10, 50, 50], c: [20, 20, 50, 50] });

    // nothing selected: nothing happens
    keydown(drawer, { key: 'ArrowUp', ctrlKey: true });
    expect(order(drawer)).toEqual(['a', 'b', 'c']);

    select(drawer, [a]);
    expect(keydown(drawer, { key: 'ArrowUp', ctrlKey: true })).toBe(false);
    expect(order(drawer)).toEqual(['b', 'a', 'c']);
    keydown(drawer, { key: 'ArrowUp', metaKey: true, shiftKey: true });
    expect(order(drawer)).toEqual(['b', 'c', 'a']);
    keydown(drawer, { key: 'ArrowDown', ctrlKey: true, shiftKey: true });
    expect(order(drawer)).toEqual(['a', 'b', 'c']);
    keydown(drawer, { key: 'ArrowUp', ctrlKey: true });
    keydown(drawer, { key: 'ArrowDown', ctrlKey: true });
    expect(order(drawer)).toEqual(['a', 'b', 'c']);
    expect(a.position()).toEqual({ x: 0, y: 0 });

    keydown(drawer, { key: 'ArrowUp' });
    expect(a.position()).toEqual({ x: 0, y: -4 });

    // each reorder is a history state
    drawer.undoRedo.undo();
    expect(order(drawer)).toEqual(['b', 'a', 'c']);
  });

  it('Read only: shortcuts do not reorder', () => {
    const drawer = createDrawer({ readOnly: true });
    const [a] = addRects(drawer, { a: [0, 0, 50, 50], b: [10, 10, 50, 50] });

    select(drawer, [a]);
    keydown(drawer, { key: 'ArrowUp', ctrlKey: true, shiftKey: true });
    expect(order(drawer)).toEqual(['a', 'b']);
  });

  it('Layers buttons of selection options reorder selection, not shown in tool options', () => {
    const drawer = createDrawer({ tool: 'brush' });
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
    const brushOverlay = drawer.getWidget<BaseWidget>('brush')!.overlay as BaseOverlay;
    const [a] = addRects(drawer, { a: [0, 0, 50, 50], b: [10, 10, 50, 50], c: [20, 20, 50, 50] });

    expect(brushOverlay.$orderContainer.style.display).toBe('none');

    select(drawer, [a]);
    selectWidget.showOverlay([a]);
    const $buttons = [...selectWidget.overlay.$orderContainer.querySelectorAll('button')];

    expect(selectWidget.overlay.$orderContainer.style.display).toBe('');
    expect($buttons.map(($btn) => $btn.getAttribute('aria-label'))).toEqual([
      'Send to back',
      'Send backward',
      'Bring forward',
      'Bring to front',
    ]);
    expect($buttons[3].getAttribute('aria-keyshortcuts')).toBe('Control+Shift+ArrowUp');
    // actions, not toggles
    expect($buttons.some(($btn) => $btn.hasAttribute('aria-pressed'))).toBe(false);

    $buttons[3].click();
    expect(order(drawer)).toEqual(['b', 'c', 'a']);
    $buttons[1].click();
    expect(order(drawer)).toEqual(['b', 'a', 'c']);
    $buttons[0].click();
    expect(order(drawer)).toEqual(['a', 'b', 'c']);
    $buttons[2].click();
    expect(order(drawer)).toEqual(['b', 'a', 'c']);
  });

  it('Order of other shapes is applied, shapes not listed keep their place', () => {
    const drawer = createDrawer();
    addRects(drawer, { a: [0, 0, 1, 1], x: [0, 0, 1, 1], b: [0, 0, 1, 1], c: [0, 0, 1, 1], y: [0, 0, 1, 1] });

    applyOrder(drawer.getDrawingShapes(), ['c', 'unknown', 'b', 'a', 'c']);
    expect(order(drawer)).toEqual(['c', 'x', 'b', 'a', 'y']);
  });
});
