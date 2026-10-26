import { describe, expect, it, vi } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import { Ellipse } from 'konva/lib/shapes/Ellipse';
import { Arrow } from 'konva/lib/shapes/Arrow';
import type { Circle } from 'konva/lib/shapes/Circle';
import type { Drawer } from '@/Drawer';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import type { BaseOverlay } from '@/components/tools/Overlay/BaseOverlay';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { defaultOptions, shapeName } from '@/constants';
import { arrowheadSvg, getArrowheads, getArrowType, getDrawnBend, toVectors } from '@/utils/arrow';
import { arrowHandleName } from '@/utils/arrowHandle';
import { parseDrawingFile } from '@/utils/drawingFile';
import { getExportBox, renderSvg } from '@/utils/export';
import { createDrawer, drag, fireMouse } from './helpers';

const arrows = (drawer: Drawer) => drawer.drawLayer.find<Arrow>('Arrow');

/** Arrow drawn with the arrow tool from a point to another */
const drawArrow = (drawer: Drawer, from: [number, number], to: [number, number]) => {
  drawer.getWidget<BaseWidget>('arrow')!.setActive(true);
  drag(drawer, from, to);
  return arrows(drawer).at(-1)!;
};

/** Handle of the selected arrow */
const handle = (drawer: Drawer) => drawer.selectionLayer.findOne<Circle>(`.${arrowHandleName}`);

/** Drag of the handle of the selected arrow to a point (absolute position) */
const dragHandle = (drawer: Drawer, x: number, y: number) => {
  const node = handle(drawer)!;

  node.fire('dragstart');
  node.absolutePosition({ x, y });
  node.fire('dragmove');
  node.fire('dragend');
};

describe('Arrows: paths and heads', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Arrows are straight with a triangle at the end by default, arrows of previous versions read the same', () => {
    const drawer = createDrawer();
    const arrow = drawArrow(drawer, [100, 100], [300, 200]);

    expect(arrow.points()).toEqual([100, 100, 300, 200]);
    expect(arrow.getAttr('arrowType')).toBeUndefined();
    expect(getArrowType(arrow)).toBe('straight');
    expect(getArrowheads(arrow)).toEqual({ start: 'none', end: 'triangle' });
    // drawn by its own function, not saved
    expect(arrow.sceneFunc()).toBeTypeOf('function');
    expect(JSON.stringify(arrow.toObject())).not.toContain('sceneFunc');

    // arrows without heads attributes: from konva pointers
    const old = new Arrow({ points: [0, 0, 10, 0], pointerAtBeginning: true, pointerAtEnding: false });
    expect(getArrowheads(old)).toEqual({ start: 'triangle', end: 'none' });
    old.setAttr('arrowType', 'zigzag');
    expect(getArrowType(old)).toBe('straight');
  });

  it('Curved arrows bend on the side the pointer went, elbow arrows along the longest distance', () => {
    const drawer = createDrawer();

    drawer.setArrowType('curved');
    const curved = drawArrow(drawer, [100, 100], [300, 100]);
    // straight gesture: middle on the left of the way, above for an arrow to the right
    expect(curved.getAttr('arrowType')).toBe('curved');
    expect(curved.getAttr('bend')).toBe(0.2);
    expect(curved.points()).toEqual([100, 100, 200, 60, 300, 100]);
    expect(curved.tension()).toBe(0.5);

    // gesture going below the way: bent below, as far as the pointer went
    fireMouse(drawer, 'mousedown', 100, 300);
    fireMouse(drawer, 'mousemove', 200, 360);
    fireMouse(drawer, 'mousemove', 300, 300);
    fireMouse(drawer, 'mouseup', 300, 300);
    expect(arrows(drawer).at(-1)!.getAttr('bend')).toBe(-0.3);
    expect(arrows(drawer).at(-1)!.points()).toEqual([100, 300, 200, 360, 300, 300]);
    // bend between the least and the largest one, on the left without a clear side
    expect(getDrawnBend({ x: 0, y: 0 }, { x: 100, y: 0 }, [{ x: 50, y: -2 }])).toBe(0.2);
    expect(getDrawnBend({ x: 0, y: 0 }, { x: 100, y: 0 }, [{ x: 50, y: 10 }])).toBe(-0.2);
    expect(getDrawnBend({ x: 0, y: 0 }, { x: 100, y: 0 }, [{ x: 50, y: -300 }])).toBe(0.75);

    drawer.setArrowType('elbow');
    // wider than high: horizontal, vertical in the middle, horizontal
    expect(drawArrow(drawer, [100, 500], [300, 600]).points()).toEqual([100, 500, 200, 500, 200, 600, 300, 600]);
    // higher than wide: vertical first
    expect(drawArrow(drawer, [500, 100], [550, 400]).points()).toEqual([500, 100, 500, 250, 550, 250, 550, 400]);
  });

  it('Elbow arrows linked to shapes leave the sides facing each other, go around them and follow them', () => {
    const drawer = createDrawer();
    const fill = '#ffffff';
    const rect = drawer.addShape(new Rect({ name: shapeName.rect, x: 0, y: 0, width: 200, height: 100, fill }));
    const ellipse = drawer.addShape(
      new Ellipse({ name: shapeName.ellipse, x: 500, y: 250, radiusX: 50, radiusY: 50, fill })
    );

    drawer.setArrowType('elbow');
    const arrow = drawArrow(drawer, [150, 50], [500, 250]);
    const points = () => arrow.points();

    expect([arrow.getAttr('startBinding'), arrow.getAttr('endBinding')]).toEqual([rect.id(), ellipse.id()]);
    // right side of the rectangle, left side of the ellipse (a gap outside), turns in the middle of the space between
    expect(points()).toEqual([206, 50, 325, 50, 325, 250, 444, 250]);

    // the ellipse goes below the rectangle: from its bottom to its top
    ellipse.setAttrs({ x: 100, y: 400 });
    drawer.stage.fire('change');
    expect(points()).toEqual([100, 106, 100, 344]);

    // wide shapes overlapping horizontally, apart vertically: from the bottom to the top (not through them)
    rect.setAttrs({ width: 400 });
    ellipse.setAttrs({ x: 500, y: 250, radiusX: 200 });
    drawer.stage.fire('change');
    expect(points()).toEqual([200, 106, 200, 150, 500, 150, 500, 194]);

    // sides chosen by the user, both on the right: around them, out of their sides first
    ellipse.setAttrs({ x: 200, y: 400, radiusX: 50 });
    arrow.setAttrs({ startAnchor: 'right', endAnchor: 'right' });
    drawer.stage.fire('change');
    expect(points()).toEqual([406, 50, 430, 50, 430, 400, 256, 400]);
    // straight out of the sides of the shapes before turning, never through them
    const route = toVectors(points());
    expect(route.every(({ x, y }) => !(x > 0 && x < 400 && y > 0 && y < 100))).toBe(true);

    // free start: straight to the side
    arrow.setAttrs({ startBinding: undefined, startAnchor: undefined, endAnchor: 'left' });
    arrow.points([0, 400, ...points().slice(-2)]);
    drawer.stage.fire('change');
    expect(points()).toEqual([0, 400, 144, 400]);
  });

  it('Changing the path of selected arrows routes them again on their linked shapes', () => {
    const drawer = createDrawer();
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
    const fill = '#ffffff';

    drawer.addShape(new Rect({ name: shapeName.rect, x: 0, y: 0, width: 200, height: 100, fill }));
    drawer.addShape(new Rect({ name: shapeName.rect, x: 400, y: 200, width: 200, height: 100, fill }));
    const arrow = drawArrow(drawer, [100, 50], [500, 250]);

    selectWidget.setActive(true);
    selectWidget.select([arrow]);
    drawer.setArrowType('elbow');
    expect(arrow.points()).toEqual([206, 50, 300, 50, 300, 250, 394, 250]);
    drawer.setArrowType('curved');
    expect(arrow.points()).toHaveLength(6);
    selectWidget.clearSelection();
  });

  it('Handle of a selected curved arrow bends it on either side, straight near the line, one history entry', () => {
    const drawer = createDrawer();
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;

    drawer.setArrowType('curved');
    const arrow = drawArrow(drawer, [100, 100], [300, 100]);
    const straight = drawArrow(drawer, [100, 300], [300, 300]);

    straight.setAttr('arrowType', undefined);
    selectWidget.setActive(true);
    selectWidget.select([arrow]);
    expect(handle(drawer)?.visible()).toBe(true);
    expect(handle(drawer)!.absolutePosition()).toEqual({ x: 200, y: 60 });

    // below the way: bent on its right, handle on the curve
    dragHandle(drawer, 200, 150);
    expect(arrow.getAttr('bend')).toBe(-0.25);
    expect(arrow.points()).toEqual([100, 100, 200, 150, 300, 100]);
    expect(handle(drawer)!.absolutePosition()).toEqual({ x: 200, y: 150 });
    // near the straight line: straight
    dragHandle(drawer, 220, 104);
    expect(arrow.getAttr('bend')).toBe(0);
    expect(arrow.points()).toEqual([100, 100, 200, 100, 300, 100]);
    drawer.undoRedo.undo();
    expect(arrows(drawer)[0].getAttr('bend')).toBe(-0.25);
    drawer.undoRedo.undo();
    expect(arrows(drawer)[0].getAttr('bend')).toBe(0.2);

    // no handle: straight arrow, several arrows, locked, read only, other tool
    const visible = () => !!handle(drawer)?.visible();
    const [curved] = arrows(drawer);

    selectWidget.select([straight]);
    expect(visible()).toBe(false);
    selectWidget.select([curved, straight]);
    expect(visible()).toBe(false);
    selectWidget.select([curved]);
    expect(visible()).toBe(true);
    drawer.setShapesLocked(true, [curved]);
    selectWidget.select([curved]);
    expect(visible()).toBe(false);
    drawer.setShapesLocked(false, [curved]);
    selectWidget.select([curved]);
    expect(visible()).toBe(true);
    drawer.setReadOnly(true);
    expect(visible()).toBe(false);
    drawer.setReadOnly(false);
  });

  it('Handle of a selected elbow arrow moves its middle segment, back to automatic near its place', () => {
    const drawer = createDrawer();
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
    const fill = '#ffffff';

    drawer.addShape(new Rect({ name: shapeName.rect, x: 0, y: 0, width: 200, height: 100, fill }));
    const ellipse = drawer.addShape(
      new Ellipse({ name: shapeName.ellipse, x: 500, y: 250, radiusX: 50, radiusY: 50, fill })
    );

    drawer.setArrowType('elbow');
    const arrow = drawArrow(drawer, [150, 50], [500, 250]);

    selectWidget.setActive(true);
    selectWidget.select([arrow]);
    expect(handle(drawer)!.absolutePosition()).toEqual({ x: 325, y: 150 });

    // vertical middle segment moved along x, kept at this distance from the middle when shapes move
    dragHandle(drawer, 280, 140);
    expect(arrow.getAttr('elbowMid')).toBe(-45);
    expect(arrow.points()).toEqual([206, 50, 280, 50, 280, 250, 444, 250]);
    ellipse.x(600);
    drawer.stage.fire('change');
    expect(arrow.points()).toEqual([206, 50, 330, 50, 330, 250, 544, 250]);

    // in a shape: stays where it was
    dragHandle(drawer, 100, 150);
    expect(arrow.getAttr('elbowMid')).toBe(-45);
    // near the place of the automatic path: automatic
    dragHandle(drawer, 372, 150);
    expect(arrow.getAttr('elbowMid')).toBeUndefined();
    expect(arrow.points()).toEqual([206, 50, 375, 50, 375, 250, 544, 250]);

    // shapes moved round each other: the middle segment turns, its place is forgotten
    dragHandle(drawer, 300, 150);
    ellipse.position({ x: 400, y: 400 });
    drawer.stage.fire('change');
    expect(arrow.getAttr('elbowMid')).toBeUndefined();
    expect(arrow.points()).toEqual([100, 106, 100, 225, 400, 225, 400, 344]);
    ellipse.position({ x: 600, y: 250 });
    drawer.stage.fire('change');

    // kept by files
    dragHandle(drawer, 300, 150);
    drawer.setArrowType('curved');
    dragHandle(drawer, 375, 100);
    const [state] = parseDrawingFile(JSON.stringify(drawer.getDrawingFile())).shapes.filter(
      (shape) => shape.className === 'Arrow'
    );
    expect(state.attrs).toMatchObject({ elbowMid: -75, bend: expect.any(Number) });
    selectWidget.clearSelection();
    expect(handle(drawer)?.visible()).toBe(false);
  });

  it('Heads of each end: options of new arrows and of selected ones', () => {
    const drawer = createDrawer();
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
    const onOptions = vi.fn();

    drawer.on('drawer.options.change', onOptions);
    drawer.setArrowheads({ start: 'dot' });
    expect(onOptions).toHaveBeenCalledWith({ arrowheads: { start: 'dot', end: 'triangle' } });
    // defaults never mutated
    expect(defaultOptions.arrowheads).toEqual({ start: 'none', end: 'triangle' });

    const arrow = drawArrow(drawer, [100, 100], [300, 200]);
    expect(getArrowheads(arrow)).toEqual({ start: 'dot', end: 'triangle' });
    expect([arrow.pointerAtBeginning(), arrow.pointerAtEnding()]).toEqual([true, true]);

    // selected arrows: given end only, other shapes unchanged
    const rect = drawer.addShape(new Rect({ name: shapeName.rect, width: 80, height: 40 }));
    selectWidget.setActive(true);
    selectWidget.select([arrow, rect]);
    drawer.setArrowheads({ end: 'none' });
    expect(getArrowheads(arrow)).toEqual({ start: 'dot', end: 'none' });
    expect(arrow.pointerAtEnding()).toBe(false);
    expect(rect.getAttr('endHead')).toBeUndefined();

    // path of selected arrows routed again, straight without attribute
    drawer.setArrowType('curved');
    expect(arrow.points()).toEqual([100, 100, 220, 110, 300, 200]);
    drawer.setArrowType('straight');
    expect(arrow.points()).toEqual([100, 100, 300, 200]);
    expect(arrow.getAttr('arrowType')).toBeUndefined();
    expect(rect.getAttr('arrowType')).toBeUndefined();

    drawer.resetDrawer();
    expect(drawer.options.arrowType).toBe('straight');
    expect(drawer.options.arrowheads).toEqual({ start: 'none', end: 'triangle' });
  });

  it('Options panel shows path and heads sections for arrows only, buttons pressed by options or the arrow', () => {
    const drawer = createDrawer({ tool: 'arrow' });
    const overlay = drawer.getWidget<BaseWidget>('arrow')!.overlay as BaseOverlay;
    const shown = () => overlay.$arrowTypeContainer.style.display !== 'none';
    const pressed = ($container: HTMLDivElement) => $container.querySelector('.active')?.getAttribute('aria-label');

    expect(shown()).toBe(true);
    expect(overlay.$arrowheadContainers.start.style.display).toBe('');
    expect(pressed(overlay.$arrowTypeBtnContainer)).toBe('Straight');
    expect(pressed(overlay.$arrowheadBtnContainers.end)).toBe('Triangle');

    overlay.$arrowTypeBtnContainer.querySelector<HTMLButtonElement>('[data-arrow-type="elbow"]')!.click();
    overlay.$arrowheadBtnContainers.start.querySelector<HTMLButtonElement>('[data-arrowhead="bar"]')!.click();
    expect(drawer.options.arrowType).toBe('elbow');
    expect(drawer.options.arrowheads).toEqual({ start: 'bar', end: 'triangle' });
    expect(pressed(overlay.$arrowTypeBtnContainer)).toBe('Elbow');
    expect(pressed(overlay.$arrowheadBtnContainers.start)).toBe('Bar');

    // other shape tools
    drawer.getWidget<BaseWidget>('square')!.setActive(true);
    expect(shown()).toBe(false);

    // selection: sections of an arrow, values of the first one
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
    const arrow = drawer.addShape(
      new Arrow({
        name: shapeName.arrow,
        points: [0, 0, 50, 0],
        arrowType: 'curved',
        startHead: 'dot',
        endHead: 'arrow',
      })
    );
    const rect = drawer.addShape(new Rect({ name: shapeName.rect, width: 80, height: 40 }));

    selectWidget.setActive(true);
    selectWidget.select([rect]);
    expect(selectWidget.overlay.$arrowTypeContainer.style.display).toBe('none');
    selectWidget.select([rect, arrow]);
    expect(selectWidget.overlay.$arrowTypeContainer.style.display).toBe('');
    expect(pressed(selectWidget.overlay.$arrowTypeBtnContainer)).toBe('Curved');
    expect(pressed(selectWidget.overlay.$arrowheadBtnContainers.start)).toBe('Dot');
    expect(pressed(selectWidget.overlay.$arrowheadBtnContainers.end)).toBe('Arrow');
    selectWidget.clearSelection();
  });

  it('Path and heads are kept by files, invalid ones dropped', () => {
    const drawer = createDrawer();

    drawer.setArrowType('elbow');
    drawer.setArrowheads({ start: 'arrow', end: 'dot' });
    drawArrow(drawer, [100, 100], [300, 200]);
    const file = drawer.getDrawingFile();
    const [state] = parseDrawingFile(JSON.stringify(file)).shapes;

    expect(state.attrs).toMatchObject({ arrowType: 'elbow', startHead: 'arrow', endHead: 'dot' });

    // wrong types ignored
    const crafted = structuredClone(file);
    Object.assign(crafted.shapes[0].attrs, { arrowType: 3, startHead: {} });
    const [parsed] = parseDrawingFile(JSON.stringify(crafted)).shapes;
    expect(parsed.attrs.arrowType).toBeUndefined();
    expect(parsed.attrs.startHead).toBeUndefined();

    // loaded arrows drawn with their heads
    drawer.loadDrawing(file);
    expect(arrows(drawer)[0].sceneFunc()).toBeTypeOf('function');
  });

  it('Svg exports draw the heads of both ends as drawn', () => {
    const drawer = createDrawer();
    const stroke = '#e03131';
    const arrow = (startHead: string, endHead: string, y: number) =>
      drawer.addShape(
        new Arrow({ name: shapeName.arrow, points: [0, y, 100, y], stroke, fill: stroke, startHead, endHead })
      ) as Arrow;
    const triangleBar = arrow('bar', 'triangle', 0);
    const openDot = arrow('arrow', 'dot', 50);

    expect(arrowheadSvg(triangleBar, true, stroke, '')).toMatch(/^<path d="M0 \S+L0 \S+" transform="translate\(0 0\)/);
    expect(arrowheadSvg(openDot, false, stroke, '')).toMatch(/^<circle .*translate\(100 50\).* fill="#e03131"/);
    expect(arrowheadSvg(openDot, true, stroke, '')).toContain('fill="none"');
    expect(arrowheadSvg(new Arrow({ points: [0, 0, 10, 0], pointerAtEnding: false }), false, stroke, '')).toBe('');

    const shapes = drawer.getExportShapes(false);
    const svg = renderSvg(shapes, getExportBox(shapes, drawer.drawLayer)!, { background: '#fff' });
    expect(svg.match(/<circle /g)).toHaveLength(1);
  });
});
