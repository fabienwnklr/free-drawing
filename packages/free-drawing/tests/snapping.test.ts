import { describe, expect, it, vi } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import type { Vector2d } from 'konva/lib/types';
import type { Drawer } from '@/Drawer';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { shapeName } from '@/constants';
import { createDrawer } from './helpers';

/** Rectangle A 100..400 x 100..250 and B 150..300 x 400..520 (no stroke), B selected */
const createRects = () => {
  const drawer = createDrawer();
  const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
  const a = drawer.addShape(new Rect({ name: shapeName.rect, x: 100, y: 100, width: 300, height: 150 }));
  const b = drawer.addShape(new Rect({ name: shapeName.rect, x: 150, y: 400, width: 150, height: 120 }));
  const { transformer } = selectWidget;
  const anchor = vi.spyOn(transformer, 'getActiveAnchor');
  const bound = (name: string, pos: Vector2d) => {
    anchor.mockReturnValue(name);
    return transformer.anchorDragBoundFunc()(pos, pos, new MouseEvent('mousemove'));
  };
  const guides = () => drawer.selectionLayer.find(`.${shapeName.guideLine}`).length;

  selectWidget.select([b]);
  return { drawer, selectWidget, transformer, a, b, bound, guides };
};

describe('Snapping while resizing', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Resized sides and corners are snapped to edges and centers of other shapes, guides shown', () => {
    const { selectWidget, transformer, bound, guides } = createRects();

    // snapping disabled
    expect(bound('middle-right', { x: 398, y: 460 })).toEqual({ x: 398, y: 460 });

    selectWidget.toggleSnapping(true);
    // right side to right of A, on x only
    expect(bound('middle-right', { x: 398, y: 461 })).toEqual({ x: 400, y: 461 });
    expect(guides()).toBe(1);
    // bottom side on y only (center of A is 175)
    expect(bound('bottom-center', { x: 398, y: 177 })).toEqual({ x: 398, y: 175 });
    // corner on both axes
    expect(bound('bottom-right', { x: 252, y: 248 })).toEqual({ x: 250, y: 250 });
    expect(guides()).toBe(2);
    // too far
    expect(bound('middle-right', { x: 420, y: 461 })).toEqual({ x: 420, y: 461 });
    expect(guides()).toBe(0);

    // rotation and rotated selection are not snapped
    expect(bound('rotater', { x: 398, y: 177 })).toEqual({ x: 398, y: 177 });
    transformer.rotation(30);
    expect(bound('middle-right', { x: 398, y: 461 })).toEqual({ x: 398, y: 461 });

    // guides removed at the end of transform
    transformer.rotation(0);
    bound('middle-right', { x: 398, y: 461 });
    transformer.fire('transformend');
    expect(guides()).toBe(0);
  });

  it('Selected shapes are not snapping guides, grid snap applied when not snapped to shapes', () => {
    const { drawer, selectWidget, a, b, bound } = createRects();

    selectWidget.toggleSnapping(true);
    selectWidget.select([a, b]);
    // right of A is selected: no guide (stage center is 512)
    expect(bound('middle-right', { x: 398, y: 175 })).toEqual({ x: 398, y: 175 });

    selectWidget.gridAnchorBound = (_oldPos, newPos) => ({ x: Math.round(newPos.x / 30) * 30, y: newPos.y });
    expect(bound('middle-right', { x: 398, y: 175 })).toEqual({ x: 390, y: 175 });

    // shape snap first
    selectWidget.select([b]);
    expect(bound('middle-right', { x: 402, y: 461 })).toEqual({ x: 400, y: 461 });
    expect(drawer.getSelectedShapes()).toEqual([b]);
  });
});

describe('Snapping while moving', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  /** Konva drag of a shape from a point (selected shapes dragged with it), in two moves, released on the window */
  const dragBy = (drawer: Drawer, shape: Rect, from: Vector2d, dx: number) => {
    drawer.stage.setPointersPositions(new MouseEvent('mousedown', { clientX: from.x, clientY: from.y }));
    shape.startDrag();
    for (const step of [dx / 2, dx]) {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: from.x + step, clientY: from.y }));
    }
    window.dispatchEvent(new MouseEvent('mouseup', { clientX: from.x + dx, clientY: from.y }));
  };

  it('Shapes moved together snap by the box of the selection: gaps between them kept', () => {
    const { drawer, selectWidget, a, b } = createRects();
    // its left side is a guide (600)
    drawer.addShape(new Rect({ name: shapeName.rect, x: 600, y: 700, width: 100, height: 100 }));

    selectWidget.setActive(true);
    selectWidget.toggleSnapping(true);
    selectWidget.select([a, b]);
    // box of A and B: 298..598, right side snapped to 600
    dragBy(drawer, a, { x: 200, y: 100 }, 198);
    expect([a.x(), b.x()]).toEqual([300, 350]);
  });

  it('Shapes moved together on the grid: the one dragged by the pointer snapped, the others follow it', () => {
    const { drawer, selectWidget, a, b } = createRects();

    drawer.setPreferences({ grid: true });
    selectWidget.setActive(true);
    selectWidget.select([a, b]);
    // A at 107 snapped to 120 (grid of 40), B follows: gap of 50 kept
    dragBy(drawer, a, { x: 200, y: 100 }, 7);
    expect([a.x(), b.x()]).toEqual([120, 170]);
  });
});
