import { describe, expect, it } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import { Ellipse } from 'konva/lib/shapes/Ellipse';
import { Arrow } from 'konva/lib/shapes/Arrow';
import { Line } from 'konva/lib/shapes/Line';
import type { Drawer } from '@/Drawer';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { shapeName } from '@/constants';
import {
  findBindingTarget,
  getAnchorAt,
  getAnchorPoints,
  getOutlinePoint,
  unbindMoved,
  updateBindings,
} from '@/utils/binding';
import { getFrameShapes, isFrame, withFrameShapes } from '@/utils/frame';
import { createDrawer, drag, fireMouse, keydown } from './helpers';

const round = ({ x, y }: { x: number; y: number }) => ({ x: Math.round(x), y: Math.round(y) });

/** Rectangle 0..200 x 0..100 (no stroke), ellipse centered at 500, 50, radius 50, with a background (linked inside) */
const createShapes = () => {
  const drawer = createDrawer();
  const fill = '#ffffff';
  const rect = drawer.addShape(new Rect({ name: shapeName.rect, x: 0, y: 0, width: 200, height: 100, fill }));
  const ellipse = drawer.addShape(
    new Ellipse({ name: shapeName.ellipse, x: 500, y: 50, radiusX: 50, radiusY: 50, fill })
  );

  return { drawer, rect, ellipse };
};

const arrows = (drawer: Drawer) => drawer.drawLayer.find<Arrow>('Arrow');

/** Ids of shapes linked to arrow ends */
const links = (arrow: { getAttr: (attr: string) => unknown }) => [
  arrow.getAttr('startBinding'),
  arrow.getAttr('endBinding'),
];

describe('Arrows linked to shapes', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Outline point of a shape on the way to a point, a gap outside', () => {
    const { drawer, rect, ellipse } = createShapes();
    const layer = drawer.drawLayer;

    // gap of 6
    expect(round(getOutlinePoint(rect, layer, { x: 500, y: 50 })!)).toEqual({ x: 206, y: 50 });
    expect(round(getOutlinePoint(rect, layer, { x: 100, y: 300 })!)).toEqual({ x: 100, y: 106 });
    expect(round(getOutlinePoint(ellipse, layer, { x: 100, y: 50 })!)).toEqual({ x: 444, y: 50 });
    expect(getOutlinePoint(rect, layer, { x: 100, y: 50 })).toBeNull();

    // rotated rectangle: its outline, not its box
    rect.setAttrs({ x: 100, y: 0, rotation: 90 });
    expect(round(getOutlinePoint(rect, layer, { x: 50, y: 500 })!)).toEqual({ x: 50, y: 206 });
  });

  it('Arrow ends are linked to the smallest shape near them, not to arrows, lines and hidden shapes', () => {
    const { drawer, rect } = createShapes();
    const small = drawer.addShape(new Rect({ name: shapeName.rect, x: 20, y: 20, width: 30, height: 30 }));
    const arrow = drawer.addShape(new Arrow({ name: shapeName.arrow, points: [0, 300, 100, 300] }));
    const line = drawer.addShape(new Line({ name: shapeName.straightLine, points: [0, 400, 100, 400] }));
    const shapes = () => drawer.getDrawingShapes();

    expect(findBindingTarget(shapes(), { x: 30, y: 30 })).toBe(small);
    expect(findBindingTarget(shapes(), { x: 150, y: 80 })).toBe(rect);
    // margin around shape
    expect(findBindingTarget(shapes(), { x: 208, y: 50 })).toBe(rect);
    expect(findBindingTarget(shapes(), { x: 230, y: 50 })).toBeNull();
    expect(findBindingTarget(shapes(), { x: 50, y: 300 })).toBeNull();
    expect(findBindingTarget(shapes(), { x: 50, y: 400 })).toBeNull();
    expect(line.getLayer() && arrow.getLayer()).toBeTruthy();

    small.hide();
    expect(findBindingTarget(shapes(), { x: 30, y: 30 })).toBe(rect);
  });

  it('Rectangles and ellipses as drawn: near their outline, inside only with a background, not corners of a box', () => {
    const { drawer, rect, ellipse } = createShapes();
    const shapes = () => drawer.getDrawingShapes();

    // background: inside linked
    expect(findBindingTarget(shapes(), { x: 100, y: 50 })).toBe(rect);
    expect(findBindingTarget(shapes(), { x: 500, y: 50 })).toBe(ellipse);
    // corner of the box of the ellipse, out of the ellipse
    expect(findBindingTarget(shapes(), { x: 453, y: 3 })).toBeNull();
    expect(findBindingTarget(shapes(), { x: 540, y: 85 })).toBe(ellipse);

    // without background: an empty inside is a free place far from the outline (2 margins), linked from both sides
    rect.fill(undefined);
    ellipse.fill(undefined);
    expect(findBindingTarget(shapes(), { x: 100, y: 50 })).toBeNull();
    expect(findBindingTarget(shapes(), { x: 500, y: 50 })).toBeNull();
    expect(findBindingTarget(shapes(), { x: 190, y: 50 })).toBe(rect);
    expect(findBindingTarget(shapes(), { x: 177, y: 50 })).toBe(rect);
    expect(findBindingTarget(shapes(), { x: 175, y: 50 })).toBeNull();
    expect(findBindingTarget(shapes(), { x: 100, y: 108 })).toBe(rect);
    expect(findBindingTarget(shapes(), { x: 455, y: 50 })).toBe(ellipse);
    // rotated rectangle: its outline, not its box
    rect.setAttrs({ x: 100, y: -50, rotation: 45 });
    expect(findBindingTarget(shapes(), { x: 100, y: -48 })).toBe(rect);
    expect(findBindingTarget(shapes(), { x: 250, y: -40 })).toBeNull();
  });

  it('Margin of links and simple click of the arrow tool on screen, whatever the zoom', () => {
    const { drawer, rect } = createShapes();
    const highlighted = () => drawer.selectionLayer.find('.binding-highlight').length;
    /** Pointer at a point of the drawing */
    const pointer = (type: string, x: number, y: number) => {
      const scale = drawer.getZoomLevel();

      fireMouse(drawer, type, x * scale, y * scale);
    };

    drawer.getWidget<BaseWidget>('arrow')!.setActive(true);
    // 20 units right of the rectangle: 20 px at zoom 1, 10 px at zoom 0.5
    pointer('mousemove', 220, 50);
    expect(highlighted()).toBe(0);
    drawer.setZoomLevel(0.5, { x: 0, y: 0 });
    pointer('mousemove', 220, 50);
    expect(highlighted()).toBe(1);
    // 8 units: 16 px at zoom 2
    drawer.setZoomLevel(2, { x: 0, y: 0 });
    pointer('mousemove', 208, 50);
    expect(highlighted()).toBe(0);
    expect(findBindingTarget(drawer.getDrawingShapes(), { x: 208, y: 50 })).toBe(rect);

    // move of 2 px on screen at zoom 2 (1 unit): a click, no arrow; 4 units at zoom 0.5 (2 px) neither
    pointer('mousedown', 300, 300);
    pointer('mouseup', 301, 300);
    drawer.setZoomLevel(0.5, { x: 0, y: 0 });
    pointer('mousedown', 300, 300);
    pointer('mouseup', 304, 300);
    expect(arrows(drawer)).toHaveLength(0);
    // 8 units at zoom 0.5 (4 px): drawn
    pointer('mousedown', 300, 300);
    pointer('mousemove', 308, 300);
    pointer('mouseup', 308, 300);
    expect(arrows(drawer)).toHaveLength(1);
  });

  it('Arrow drawn in a frame links to its shapes or to nothing, a frame only near its border', () => {
    const { drawer, rect } = createShapes();
    // frame 0..400 x 0..300 around the rectangle
    drawer.getWidget<BaseWidget>('frame')!.setActive(true);
    drag(drawer, [-20, -20], [400, 300]);
    const frame = drawer.getDrawingShapes().find(isFrame)!;
    const shapes = withFrameShapes(drawer.getDrawingShapes());

    expect(getFrameShapes(frame)).toContain(rect);
    // empty place of the frame: no link
    expect(findBindingTarget(shapes, { x: 300, y: 200 })).toBeNull();
    // shape of the frame
    expect(findBindingTarget(shapes, { x: 100, y: 50 })).toBe(rect);
    // border of the frame, inside or outside
    expect(findBindingTarget(shapes, { x: 395, y: 200 })).toBe(frame);
    expect(findBindingTarget(shapes, { x: 405, y: 200 })).toBe(frame);

    drawer.getWidget<BaseWidget>('arrow')!.setActive(true);
    drag(drawer, [300, 200], [100, 50]);
    expect(links(arrows(drawer)[0])).toEqual([undefined, rect.id()]);
  });

  it('Arrow drawn from a shape to another one is linked to them, highlighted while drawing, not with Ctrl', () => {
    const { drawer, rect, ellipse } = createShapes();
    const highlights = () => drawer.selectionLayer.find('.binding-highlight').length;

    drawer.getWidget<BaseWidget>('arrow')!.setActive(true);
    fireMouse(drawer, 'mousedown', 100, 50);
    fireMouse(drawer, 'mousemove', 480, 60);
    expect(highlights()).toBe(2);
    fireMouse(drawer, 'mouseup', 480, 60);
    expect(highlights()).toBe(0);

    const [arrow] = arrows(drawer);
    expect(links(arrow)).toEqual([rect.id(), ellipse.id()]);
    // centers line: from right side of rectangle to left of ellipse
    expect(arrow.points().map(Math.round)).toEqual([206, 50, 444, 50]);

    // from empty place: start free
    drag(drawer, [300, 300], [520, 60]);
    expect(links(arrows(drawer)[1])).toEqual([undefined, ellipse.id()]);

    // Ctrl / Cmd: not linked
    drag(drawer, [100, 50], [480, 60], { ctrlKey: true });
    expect(links(arrows(drawer)[2])).toEqual([undefined, undefined]);
    expect(arrows(drawer)[2].points()).toEqual([100, 50, 480, 60]);

    // inside a single shape
    drag(drawer, [20, 20], [150, 80]);
    expect(arrows(drawer)[3].getAttr('startBinding')).toBeUndefined();
  });

  it('Linked arrows follow their shapes, unlinked from removed shapes and when moved alone', () => {
    const { drawer, rect, ellipse } = createShapes();
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;

    drawer.getWidget<BaseWidget>('arrow')!.setActive(true);
    drag(drawer, [100, 50], [480, 60]);
    const [arrow] = arrows(drawer);

    ellipse.y(250);
    drawer.stage.fire('change');
    // aiming at centers: corner of rectangle, side of ellipse
    expect(arrow.points().map(Math.round)).toEqual([205, 103, 450, 225]);

    // moved with its shapes: still linked
    unbindMoved([arrow, rect, ellipse]);
    expect(arrow.getAttr('endBinding')).toBe(ellipse.id());

    // moved alone with keyboard
    selectWidget.setActive(true);
    selectWidget.select([arrow]);
    keydown(drawer, { key: 'ArrowRight' });
    expect(links(arrow)).toEqual([undefined, undefined]);

    // removed shape
    arrow.setAttrs({ startBinding: rect.id(), endBinding: ellipse.id() });
    drawer.deleteShapes([ellipse]);
    expect(arrow.getAttr('endBinding')).toBeUndefined();
    expect(arrow.getAttr('startBinding')).toBe(rect.id());
    expect(updateBindings(drawer.drawLayer)).toBe(false);
  });

  it('Copies of arrows are linked to copies of their shapes', () => {
    const { drawer, rect, ellipse } = createShapes();

    drawer.getWidget<BaseWidget>('arrow')!.setActive(true);
    drag(drawer, [100, 50], [480, 60]);
    const [arrow] = arrows(drawer);
    const [rectCopy, ellipseCopy, arrowCopy] = drawer.duplicateShapes([rect, ellipse, arrow]);

    expect(links(arrowCopy)).toEqual([rectCopy.id(), ellipseCopy.id()]);

    // copied alone: unlinked
    const [alone] = drawer.duplicateShapes([arrow]);
    expect(links(alone)).toEqual([undefined, undefined]);
  });

  it('Middle of sides of shapes, rotated with them', () => {
    const { drawer, rect, ellipse } = createShapes();
    const layer = drawer.drawLayer;

    expect(getAnchorPoints(rect, layer)).toEqual({
      top: { x: 100, y: 0 },
      right: { x: 200, y: 50 },
      bottom: { x: 100, y: 100 },
      left: { x: 0, y: 50 },
    });
    expect(getAnchorPoints(ellipse, layer).left).toEqual({ x: 450, y: 50 });
    expect(getAnchorAt(rect, layer, { x: 105, y: 96 }, 14)).toBe('bottom');
    expect(getAnchorAt(rect, layer, { x: 100, y: 50 }, 14)).toBeUndefined();

    rect.setAttrs({ x: 100, rotation: 90 });
    expect(round(getAnchorPoints(rect, layer).bottom)).toEqual({ x: 0, y: 100 });
  });

  it('Arrow ends near middle of a side are fixed to it, the other end aims at it', () => {
    const { drawer, rect, ellipse } = createShapes();
    const anchorsShown = () => drawer.selectionLayer.find('.binding-anchor').length;

    drawer.getWidget<BaseWidget>('arrow')!.setActive(true);
    // sides shown under pointer before drawing
    fireMouse(drawer, 'mousemove', 100, 98);
    expect(anchorsShown()).toBe(4);
    expect(drawer.selectionLayer.find('.active').length).toBe(1);

    // bottom of rectangle to left of ellipse
    fireMouse(drawer, 'mousedown', 100, 98);
    fireMouse(drawer, 'mousemove', 452, 52);
    fireMouse(drawer, 'mouseup', 452, 52);
    const [arrow] = arrows(drawer);
    expect([arrow.getAttr('startAnchor'), arrow.getAttr('endAnchor')]).toEqual(['bottom', 'left']);
    // gap outside sides
    expect(arrow.points()).toEqual([100, 106, 444, 50]);

    // sides kept when shapes move
    ellipse.position({ x: 500, y: 300 });
    drawer.stage.fire('change');
    expect(arrow.points()).toEqual([100, 106, 444, 300]);

    // end aiming at fixed start
    drag(drawer, [480, 0], [100, 0]);
    expect(arrows(drawer)[1].getAttr('endAnchor')).toBe('top');

    // side removed with link
    arrow.setAttr('startBinding', 'removed');
    drawer.stage.fire('change');
    expect([arrow.getAttr('startBinding'), arrow.getAttr('startAnchor')]).toEqual([undefined, undefined]);
    unbindMoved([arrow]);
    expect([arrow.getAttr('endBinding'), arrow.getAttr('endAnchor')]).toEqual([undefined, undefined]);
    expect(rect.getLayer()).toBeTruthy();
  });
});
