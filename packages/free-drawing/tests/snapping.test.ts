import { describe, expect, it, vi } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import { Arrow } from 'konva/lib/shapes/Arrow';
import type { Vector2d } from 'konva/lib/types';
import type { Drawer } from '@/Drawer';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { shapeName } from '@/constants';
import { getFrameShapes, isFrame } from '@/utils/frame';
import { createDrawer, drag } from './helpers';

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

describe('Snapping setting', () => {
  it('Snapping is not the drawing: toggled without change of the drawing, nothing done when unchanged', async () => {
    const drawer = createDrawer();
    const selection = drawer.getWidget<SelectWidget>('selection')!;
    const change = vi.fn();
    const preferences = vi.fn();

    selection.toggleSnapping(false);
    await Promise.resolve();
    drawer.on('change', change);
    drawer.on('preferences.change', preferences);
    // unchanged (preferences dialog applying every field)
    drawer.setPreferences({ snapping: false });
    selection.toggleSnapping(false);
    await Promise.resolve();
    expect(preferences).not.toHaveBeenCalled();

    selection.toggleSnapping(true);
    await Promise.resolve();
    expect(selection.snapping).toBe(true);
    expect(preferences).toHaveBeenCalledTimes(1);
    expect(change).not.toHaveBeenCalled();
    expect(drawer.hasUnsavedChanges()).toBe(false);
  });
});

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

  it('Guides: shapes of frames and the frame of the shape, center of the view, not its edges nor hidden shapes', () => {
    const { drawer, selectWidget, a, b, bound, guides } = createRects();
    // C and B in a frame 120..700 x 380..600
    const c = drawer.addShape(new Rect({ name: shapeName.rect, x: 500, y: 420, width: 60, height: 60 }));

    drawer.getWidget<BaseWidget>('frame')!.setActive(true);
    drag(drawer, [120, 380], [700, 600]);
    expect(getFrameShapes(drawer.getDrawingShapes().find(isFrame)!)).toEqual(expect.arrayContaining([b, c]));

    selectWidget.toggleSnapping(true);
    selectWidget.select([b]);
    // frame of the shape: its right side
    expect(bound('middle-right', { x: 697, y: 461 })).toEqual({ x: 700, y: 461 });
    // shape of a frame, for a shape out of it: left side of C
    selectWidget.select([a]);
    expect(bound('middle-right', { x: 498, y: 175 })).toEqual({ x: 500, y: 175 });

    // view: no guide at its left side, one at its center (also moved and zoomed)
    const center = drawer.stage.width() / 2;

    expect(bound('middle-left', { x: 2, y: 175 })).toEqual({ x: 2, y: 175 });
    expect(guides()).toBe(0);
    expect(bound('middle-right', { x: center + 2, y: 175 })).toEqual({ x: center, y: 175 });
    drawer.stage.position({ x: -333, y: 71 });
    drawer.setZoomLevel(0.1);
    expect(bound('middle-right', { x: center - 3, y: 900 })).toEqual({ x: center, y: 900 });
    // guide across the view
    const [guide] = drawer.selectionLayer.find(`.${shapeName.guideLine}`);

    expect(guide.getClientRect().height).toBeGreaterThanOrEqual(drawer.stage.height());
    drawer.stage.position({ x: 0, y: 0 });
    drawer.setZoomLevel(1);

    // hidden shape
    c.hide();
    expect(bound('middle-right', { x: 498, y: 175 })).toEqual({ x: 498, y: 175 });
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

  it('Snapping turned off during a drag: guides removed, the next drag finds its own guides', () => {
    const { drawer, selectWidget, b, guides } = createRects();
    // its left side is a guide (600)
    const c = drawer.addShape(new Rect({ name: shapeName.rect, x: 600, y: 700, width: 100, height: 100 }));

    selectWidget.setActive(true);
    selectWidget.toggleSnapping(true);
    selectWidget.select([b]);
    drawer.stage.setPointersPositions(new MouseEvent('mousedown', { clientX: 200, clientY: 450 }));
    b.startDrag();
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 349, clientY: 450 }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 498, clientY: 450 }));
    // right side 598 snapped to 600
    expect(b.x()).toBe(450);
    expect(guides()).toBeGreaterThan(0);
    selectWidget.toggleSnapping(false);
    expect(guides()).toBe(0);
    window.dispatchEvent(new MouseEvent('mouseup', { clientX: 498, clientY: 450 }));

    // guide moved, snapping on again: right side 998 snapped to its new place
    c.x(1000);
    selectWidget.toggleSnapping(true);
    dragBy(drawer, b, { x: 500, y: 450 }, 398);
    expect(b.x()).toBe(850);
  });

  it('One change per drag: saved, in history and shared once, whatever the number of shapes moved', () => {
    const { drawer, selectWidget, a, b } = createRects();
    const c = drawer.addShape(new Rect({ name: shapeName.rect, x: 600, y: 100, width: 50, height: 50 }));
    const changes = vi.fn();

    drawer.stage.fire('change');
    drawer.on('change', changes);
    selectWidget.setActive(true);
    selectWidget.select([a, b, c]);
    const entries = drawer.undoRedo.entries.length;

    dragBy(drawer, a, { x: 200, y: 100 }, 50);
    expect([a.x(), b.x(), c.x()]).toEqual([150, 200, 650]);
    expect(changes).toHaveBeenCalledTimes(1);
    expect(drawer.undoRedo.entries).toHaveLength(entries + 1);

    // shape moved alone
    selectWidget.select([c]);
    dragBy(drawer, c, { x: 620, y: 120 }, 20);
    expect(changes).toHaveBeenCalledTimes(2);
    // one undo by drag: the three shapes put back (replaced by new nodes)
    drawer.undoRedo.undo();
    drawer.undoRedo.undo();
    expect([a, b, c].map((shape) => drawer.stage.findOne(`#${shape.id()}`)!.x())).toEqual([100, 150, 600]);
  });

  it('Big selection dragged: guides found once per drag, frames and links followed once per move', () => {
    const { drawer, selectWidget, a, b } = createRects();
    const c = drawer.addShape(new Rect({ name: shapeName.rect, x: 600, y: 100, width: 50, height: 50 }));
    const stops = vi.spyOn(selectWidget as unknown as Record<string, () => unknown>, '_getLineGuideStops');
    const moves = vi.spyOn(drawer as unknown as Record<string, () => void>, '_updateMove');
    const arrow = drawer.addShape(
      new Arrow({ name: shapeName.arrow, points: [625, 0, 625, 100], endBinding: c.id(), endAnchor: 'top' })
    ) as Arrow;

    selectWidget.setActive(true);
    selectWidget.toggleSnapping(true);
    selectWidget.select([a, b, c]);
    // links followed from the first move (the transformer starts the drag of the other shapes there)
    drawer.stage.setPointersPositions(new MouseEvent('mousedown', { clientX: 200, clientY: 100 }));
    a.startDrag();
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 225, clientY: 100 }));
    expect([c.x(), arrow.points()[2]]).toEqual([625, 650]);
    // two moves of the pointer, three shapes moved by konva
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 250, clientY: 100 }));
    window.dispatchEvent(new MouseEvent('mouseup', { clientX: 250, clientY: 100 }));
    expect([a.x(), b.x(), c.x(), arrow.points()[2]]).toEqual([150, 200, 650, 675]);
    expect(stops).toHaveBeenCalledTimes(1);
    expect(moves).toHaveBeenCalledTimes(2);
    // found again for the next drag
    dragBy(drawer, a, { x: 250, y: 100 }, 20);
    expect(stops).toHaveBeenCalledTimes(2);
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
