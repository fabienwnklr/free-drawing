import { describe, expect, it, vi } from 'vitest';
import type { Path } from 'konva/lib/shapes/Path';
import type { Line } from 'konva/lib/shapes/Line';
import { Shape } from 'konva/lib/Shape';
import type { HighlighterWidget } from '@/components/toolbar/widgets/Highlighter/Highlighter';
import { Rect } from 'konva/lib/shapes/Rect';
import { Node } from 'konva/lib/Node';
import { Frame, getFrameShapes, getFrameTitle, isFrame } from '@/utils/frame';
import { frameHighlightName } from '@/utils/frameHighlight';
import type { DrawingShape } from '@/@types/drawer';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import { scalePath } from '@/components/toolbar/widgets/PathShapeWidget';
import { shapeName } from '@/constants';
import { parseDrawingFile } from '@/utils/drawingFile';
import { getAnchorPoints } from '@/utils/binding';
import { createDrawer, drag, finger, fireMouse, fireTouch, keydown } from './helpers';

/** Text of a blob (jsdom has no `blob.text()`) */
const readText = (blob: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result as string);
    reader.readAsText(blob);
  });

describe('Tools of shapes', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Path of a box of size 1 scaled to a box', () => {
    expect(scalePath('M0.5 0L1 1L0 1Z', 100, 50)).toBe('M50 0L100 50L0 50Z');
    expect(scalePath('M0.5 1C0.18 0.78 0 0.56 0 0.3', 10, 10)).toBe('M5 10C1.8 7.8 0 5.6 0 3');
  });

  it('Triangle, diamond, heart and cloud drawn in dragged box, square with Shift', () => {
    const drawer = createDrawer();
    const draw = (tool: string, from: [number, number], to: [number, number], shiftKey = false) => {
      drawer.getWidget<BaseWidget>(tool as BaseWidget['id'])!.setActive(true);
      drag(drawer, from, to, { shiftKey });
      return drawer.getDrawingShapes().at(-1) as Path;
    };

    const triangle = draw('triangle', [100, 100], [200, 150]);
    expect(triangle.getClassName()).toBe('Path');
    expect(triangle.hasName(shapeName.triangle)).toBe(true);
    expect([triangle.x(), triangle.y(), triangle.data()]).toEqual([100, 100, 'M50 0L100 50L0 50Z']);

    // drawn up and left, in a square
    const diamond = draw('diamond', [300, 300], [250, 280], true);
    expect([diamond.x(), diamond.y(), diamond.data()]).toEqual([250, 250, 'M25 0L50 25L25 50L0 25Z']);
    expect(drawer.getWidget<BaseWidget>('diamond')!.shortcut).toBe('d');

    expect(draw('heart', [0, 0], [40, 40]).hasName(shapeName.heart)).toBe(true);
    expect(draw('cloud', [0, 0], [40, 40]).hasName(shapeName.cloud)).toBe(true);
    // a click draws nothing
    draw('cloud', [500, 500], [500, 500]);
    expect(drawer.getDrawingShapes()).toHaveLength(4);
  });

  it('Star, hexagon, block arrow, speech bubble and check box: in the dragged box, in "More tools", outline as drawn', () => {
    const drawer = createDrawer();
    const layer = drawer.drawLayer;
    const draw = (tool: string, to: [number, number]) => {
      drawer.getWidget<BaseWidget>(tool as BaseWidget['id'])!.setActive(true);
      drag(drawer, [0, 0], to);
      return drawer.getDrawingShapes().at(-1) as Path;
    };
    const tools = ['star', 'hexagon', 'blockArrow', 'bubble', 'checkbox'];

    expect(draw('hexagon', [100, 50]).data()).toBe('M25 0L75 0L100 25L75 50L25 50L0 25Z');
    expect(draw('blockArrow', [100, 100]).data()).toBe('M0 30L60 30L60 0L100 50L60 100L60 70L0 70Z');

    const star = draw('star', [200, 200]);
    const bubble = draw('bubble', [200, 100]);
    const checkbox = draw('checkbox', [200, 200]);

    expect([star, bubble, checkbox].map((shape) => shape.name())).toEqual([
      shapeName.star,
      shapeName.bubble,
      shapeName.checkbox,
    ]);
    // in the group of the toolbar, without shortcut, named in the layers panel
    expect(tools.every((tool) => drawer.options.widgetGroups[0].widgets.includes(tool))).toBe(true);
    expect(tools.map((tool) => drawer.getWidget<BaseWidget>(tool as BaseWidget['id'])!.shortcut)).toEqual(
      tools.map(() => undefined)
    );
    expect(drawer.getShapeLabel(star)).toBe('Star');
    // sides on the outline: top point of the star, side of the check box (its check mark is not an outline)
    expect(getAnchorPoints(star, layer).top).toEqual({ x: 100, y: 0 });
    const right = getAnchorPoints(checkbox, layer).right;
    expect([Math.round(right.x), Math.round(right.y)]).toEqual([200, 100]);
  });

  it('Background color, stroke style, svg export and files', async () => {
    const drawer = createDrawer();

    drawer.getWidget<BaseWidget>('triangle')!.setActive(true);
    drag(drawer, [0, 0], [100, 100]);

    const triangle = drawer.getDrawingShapes()[0] as Path;
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;

    selectWidget.setActive(true);
    selectWidget.select([triangle]);
    drawer.setFillColor('#ffc9c9');
    drawer.setStrokeStyle('dashed');
    expect(triangle.fill()).toBe('#ffc9c9');
    expect(triangle.dash().length).toBeGreaterThan(0);

    const svg = await readText(await drawer.exportImage('svg', { background: false }));

    expect(svg).toContain('<path d="M50 0L100 100L0 100Z" fill="#ffc9c9"');

    const file = parseDrawingFile(JSON.stringify(drawer.getDrawingFile()));

    expect(file.shapes[0].className).toBe('Path');
  });
});

describe('Frame', () => {
  /** Drawer with a rectangle, a frame drawn around it */
  const createFrame = () => {
    const drawer = createDrawer({ language: 'en' });
    const inside = drawer.addShape(
      new Rect({ name: shapeName.rect, x: 120, y: 120, width: 50, height: 50, stroke: '#000' })
    );
    const outside = drawer.addShape(
      new Rect({ name: shapeName.rect, x: 500, y: 500, width: 50, height: 50, stroke: '#000' })
    );

    drawer.getWidget<BaseWidget>('frame')!.setActive(true);
    drag(drawer, [100, 100], [300, 250]);

    const frame = drawer.getDrawingShapes().find(isFrame)!;

    return { drawer, frame, inside, outside, selectWidget: drawer.getWidget<SelectWidget>('selection')! };
  };
  const absolute = (shape: DrawingShape) => shape.getAbsolutePosition();

  it('New frames named after the numbers of frames: no name given twice after a frame is deleted', () => {
    const drawer = createDrawer({ language: 'en' });
    const frames = () => drawer.getDrawingShapes().filter(isFrame);
    const names = () =>
      frames()
        .map((frame) => drawer.getShapeLabel(frame))
        .sort();
    const named = (name: string) => frames().find((frame) => drawer.getShapeLabel(frame) === name)!;
    const draw = (x: number) => drag(drawer, [x, 0], [x + 100, 100]);

    drawer.getWidget<BaseWidget>('frame')!.setActive(true);
    for (const x of [0, 200, 400]) draw(x);
    expect(names()).toEqual(['Frame 1', 'Frame 2', 'Frame 3']);

    // second one deleted: next one after the highest number
    drawer.deleteShapes([named('Frame 2')]);
    draw(600);
    expect(names()).toEqual(['Frame 1', 'Frame 3', 'Frame 4']);

    // renamed frames counted, numbers of names in another language not read
    drawer.setShapeLabel(named('Frame 4'), 'Roadmap');
    drawer.setLanguage('fr');
    draw(800);
    draw(1000);
    expect(names()).toEqual(['Cadre 4', 'Cadre 5', 'Frame 1', 'Frame 3', 'Roadmap']);
  });

  it('Shapes grouped or ungrouped in a frame stay draggable, not shapes of a group', () => {
    const { drawer, frame, inside, selectWidget } = createFrame();
    const rect = (x: number) =>
      drawer.addShape(new Rect({ name: shapeName.rect, x, y: 180, width: 20, height: 20, stroke: '#000' }));
    const [second, third] = [rect(200), rect(240)];

    drawer.placeInFrames([second, third]);
    selectWidget.setActive(true);
    const group = drawer.groupShapes([inside, second])!;

    expect(getFrameShapes(frame)).toEqual([group, third]);
    expect([group.draggable(), inside.draggable()]).toEqual([true, false]);

    // group of groups: only the top one dragged
    const parent = drawer.groupShapes([group, third])!;
    expect([parent.draggable(), group.draggable(), third.draggable()]).toEqual([true, false, false]);

    drawer.ungroupShapes([parent]);
    expect([group.draggable(), third.draggable()]).toEqual([true, true]);
    drawer.ungroupShapes([group]);
    expect(getFrameShapes(frame).map((shape) => shape.draggable())).toEqual([true, true, true]);
  });

  it('Title renamed in place, on one line: field at the title wherever the drawer is in the page', () => {
    const { drawer, frame } = createFrame();
    const title = getFrameTitle(frame);
    const rect = (left: number, top: number) => ({ left, top }) as DOMRect;
    // drawer below the bar of an app, view below its header
    const drawerRect = vi.spyOn(drawer.$drawerContainer, 'getBoundingClientRect').mockReturnValue(rect(0, 48));
    const viewRect = vi.spyOn(drawer.$stageContainer, 'getBoundingClientRect').mockReturnValue(rect(10, 60));

    drawer.getWidget<TextWidget>('text')!.editTextNode(title);

    const textarea = document.querySelector<HTMLTextAreaElement>('.drawer-text-editor')!;
    const spacing = Math.ceil(title.fontSize() * 0.25);
    const { x, y } = title.absolutePosition();

    // view coordinates in the drawer container
    expect([textarea.style.left, textarea.style.top]).toEqual([`${x - spacing + 10}px`, `${y - spacing + 12}px`]);
    expect([textarea.wrap, textarea.style.whiteSpace]).toEqual(['off', 'pre']);

    // no line break: Shift + Enter does nothing, pasted ones become spaces
    const shiftEnter = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', shiftKey: true, cancelable: true });

    textarea.dispatchEvent(shiftEnter);
    expect(shiftEnter.defaultPrevented).toBe(true);
    textarea.value = 'Roadmap\n2027 ';
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter' }));
    expect([title.text(), frame.getAttr('label'), title.y()]).toEqual(['Roadmap 2027', 'Roadmap 2027', -20]);
    expect(document.querySelector('.drawer-text-editor')).toBe(null);
    drawerRect.mockRestore();
    viewRect.mockRestore();
  });

  it('Drawn frame takes shapes entirely in it, under other shapes, named by its title', () => {
    const { drawer, frame, inside, outside } = createFrame();

    expect(drawer.getWidget<BaseWidget>('frame')!.shortcut).toBe('f');
    expect(frame).toBeInstanceOf(Frame);
    expect(frame.getClassName()).toBe('Frame');
    expect(frame.hasName(shapeName.frame)).toBe(true);
    expect(frame.getClientRect()).toEqual({ x: 100, y: 100, width: 200, height: 150 });
    expect(getFrameShapes(frame)).toEqual([inside]);
    // same place on screen
    expect(absolute(inside)).toEqual({ x: 120, y: 120 });
    expect(drawer.getDrawingShapes()).toEqual([frame, outside]);
    expect(drawer.getShapeLabel(frame)).toBe('Frame 1');
    expect(getFrameTitle(frame).text()).toBe('Frame 1');

    // named by its title, never empty
    drawer.setShapeLabel(frame, 'Home');
    expect(getFrameTitle(frame).text()).toBe('Home');
    drawer.setShapeLabel(frame, ' ');
    expect(drawer.getShapeLabel(frame)).toBe('Frame');

    // second frame
    drawer.getWidget<BaseWidget>('frame')!.setActive(true);
    drag(drawer, [600, 100], [700, 200]);
    expect(drawer.getShapeLabel(drawer.getDrawingShapes()[0])).toBe('Frame 2');
  });

  it('Shapes drawn, moved or duplicated in a frame belong to it, moved with it, out of it when moved out', () => {
    const { drawer, frame, inside, outside, selectWidget } = createFrame();

    // drawn in frame
    drawer.getWidget<BaseWidget>('square')!.setActive(true);
    drag(drawer, [200, 200], [240, 230]);
    expect(drawer.getDrawingShapes()).toEqual([frame, outside]);
    expect(getFrameShapes(frame)).toHaveLength(2);

    // moved with frame
    frame.move({ x: 10, y: 0 });
    expect(absolute(inside)).toEqual({ x: 130, y: 120 });

    // moved out (drag end): back in drawing, at same place
    inside.absolutePosition({ x: 800, y: 100 });
    inside.fire('dragend', {}, true);
    expect(inside.getParent()).toBe(drawer.drawLayer);
    expect(absolute(inside)).toEqual({ x: 800, y: 100 });
    // moved in
    outside.absolutePosition({ x: 150, y: 150 });
    selectWidget.select([outside]);
    outside.fire('dragend', {}, true);
    expect(getFrameShapes(frame)).toContain(outside);

    // copies of shapes of frame in it
    selectWidget.select([outside]);
    const [copy] = drawer.duplicateShapes();
    expect(copy.getParent()).toBe(outside.getParent());

    // arrows linked to shapes of frames, not to frames (near the outline: no background)
    drawer.getWidget<BaseWidget>('arrow')!.setActive(true);
    drag(drawer, [600, 300], [155, 160]);
    const arrow = drawer.getDrawingShapes().find((shape) => shape.hasName(shapeName.arrow))!;
    expect(arrow.attrs.endBinding).toBe(outside.id());
  });

  it('Shapes moved in or out of frames: drawn above while moved (not cut), frames entered or left highlighted', () => {
    const { drawer, frame, inside, outside, selectWidget } = createFrame();
    const highlights = () => drawer.selectionLayer.find<Rect>(`.${frameHighlightName}`);
    // rectangles drawn by the draw layer, in drawing order
    const drawn: Node[] = [];
    const drawScene = vi.spyOn(Shape.prototype, 'drawScene').mockImplementation(function (this: Shape) {
      drawn.push(this);
      return this;
    });
    const drawOrder = () => {
      drawn.length = 0;
      drawer.drawLayer.draw();
      return drawn.filter((node) => node === inside || node === outside);
    };

    expect(drawOrder()).toEqual([inside, outside]);
    // shape of frame dragged: drawn above the drawing, out of the cut of its frame, still in it (saved, sent...)
    inside.fire('dragstart', {}, true);
    expect(drawOrder()).toEqual([outside, inside]);
    expect(getFrameShapes(frame)).toEqual([inside]);
    expect(drawer.getDrawingFile().shapes.map((s) => s.className)).toEqual(['Frame', 'Rect']);

    // still in its frame: nothing highlighted
    inside.absolutePosition({ x: 150, y: 130 });
    inside.fire('dragmove', {}, true);
    expect(highlights()).toHaveLength(0);
    // out of it: frame left, dashed
    inside.absolutePosition({ x: 800, y: 100 });
    inside.fire('dragmove', {}, true);
    expect(highlights().map((h) => [h.x(), h.y(), h.width(), h.height(), h.attrs.dash])).toEqual([
      [100, 100, 200, 150, [6, 4]],
    ]);

    // dropped: in drawing, drawn once, highlight fading
    inside.fire('dragend', {}, true);
    expect(inside.getParent()).toBe(drawer.drawLayer);
    expect(absolute(inside)).toEqual({ x: 800, y: 100 });
    expect(drawOrder()).toEqual([outside, inside]);
    drawScene.mockRestore();

    // shape of drawing dragged in: frame entered, solid and tinted
    selectWidget.select([outside]);
    outside.fire('dragstart', {}, true);
    outside.absolutePosition({ x: 150, y: 150 });
    outside.fire('dragmove', {}, true);
    // (highlight of the previous drag still fading)
    const entered = highlights().find((h) => !h.attrs.dash)!;
    expect([entered.x(), entered.y(), entered.fill()]).toEqual([100, 100, 'rgba(100, 108, 255, 0.08)']);
    outside.fire('dragend', {}, true);
    expect(getFrameShapes(frame)).toEqual([outside]);
    // frames entered and left
    expect(drawer.placeInFrames([outside])).toEqual({ entered: [], left: [] });
    outside.absolutePosition({ x: 600, y: 600 });
    expect(drawer.placeInFrames([outside])).toEqual({ entered: [], left: [frame] });
  });

  it('Shape moved in its frame keeps its place, moved out with arrow keys its frame is highlighted', () => {
    const { drawer, frame, inside, selectWidget } = createFrame();

    drawer.getWidget<BaseWidget>('square')!.setActive(true);
    drag(drawer, [200, 180], [260, 230]);
    const [, top] = getFrameShapes(frame);
    expect(getFrameShapes(frame)).toEqual([inside, top]);

    // shape under another one moved in the frame: still under it
    inside.fire('dragstart', {}, true);
    inside.absolutePosition({ x: 130, y: 125 });
    inside.fire('dragmove', {}, true);
    inside.fire('dragend', {}, true);
    expect(getFrameShapes(frame)).toEqual([inside, top]);

    // arrow key (4 px) putting its center out of the frame: frame left flashed
    selectWidget.setActive(true);
    selectWidget.select([inside]);
    inside.absolutePosition({ x: 274, y: 125 });
    keydown(drawer, { key: 'ArrowRight' });
    drawer.$drawerContainer.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }));
    expect(inside.getParent()).toBe(drawer.drawLayer);
    expect(drawer.selectionLayer.find(`.${frameHighlightName}`).map((h) => h.attrs.dash)).toEqual([[6, 4]]);
  });

  it('Selection: shapes of frame alone, frame with its border or title, resized without scaling its shapes', () => {
    const { drawer, frame, inside, selectWidget } = createFrame();
    const { transformer } = selectWidget;

    selectWidget.setActive(true);
    expect(inside.draggable()).toBe(true);
    // click on a shape of frame: the shape
    expect(selectWidget.getShapesAt({ x: 121, y: 121 }, inside)[0]).toBe(inside);
    // shapes of a selected frame are selected with it
    selectWidget.select([frame, inside]);
    expect(drawer.getSelectedShapes()).toEqual([frame]);
    // no style (panel without color: opacity, layers, actions), no rotation
    expect(selectWidget.overlay.$overlayContainer.classList.contains('show')).toBe(true);
    expect(selectWidget.overlay.$strokeColorContainer.style.display).toBe('none');
    expect(transformer.rotateEnabled()).toBe(false);

    // resized from left: shapes stay in place, size instead of scale
    transformer.fire('transformstart');
    frame.setAttrs({ x: 50, scaleX: 1.25 });
    transformer.fire('transform', { target: frame });
    expect([frame.width(), frame.scaleX()]).toEqual([250, 1]);
    expect(absolute(inside)).toEqual({ x: 120, y: 120 });
    // smaller: shapes out of it given back
    transformer.fire('transformstart');
    frame.setAttrs({ x: 200, width: 100, scaleX: 1 });
    transformer.fire('transform', { target: frame });
    transformer.fire('transformend');
    expect(getFrameShapes(frame)).toEqual([]);
    expect(inside.getParent()).toBe(drawer.drawLayer);

    // no style change, not rotated nor flipped
    drawer.setStrokeColor('#e03131');
    drawer.rotateShapes(90, [frame]);
    drawer.flipShapes('horizontal', [frame]);
    expect([frame.rotation(), frame.scaleX()]).toEqual([0, 1]);
    expect(drawer.canGroupShapes([frame, inside])).toBe(false);
    // not ungrouped, not rotated from selection menu
    expect(drawer.ungroupShapes([frame])).toEqual([]);
    selectWidget.select([frame]);
    drawer.selectionMenu!.update();
    expect(drawer.selectionMenu!.$rotateLeftBtn.hidden).toBe(true);
    expect(drawer.selectionMenu!.$ungroupBtn.hidden).toBe(true);

    // last shape of a frame removed: frame still takes shapes
    inside.absolutePosition({ x: 210, y: 120 });
    drawer.placeInFrames([inside]);
    expect(getFrameShapes(frame)).toEqual([inside]);
    drawer.deleteShapes([inside]);
    expect(getFrameShapes(frame)).toEqual([]);

    const other = drawer.addShape(new Rect({ name: shapeName.rect, x: 220, y: 130, width: 20, height: 20 }));

    drawer.placeInFrames([other]);
    expect(getFrameShapes(frame)).toEqual([other]);
  });

  it('Eraser, layers panel, history, files and export', async () => {
    const { drawer, frame } = createFrame();

    // layers: shapes of frame under it
    drawer.layersPanel!.toggle(true);
    drawer.layersPanel!.setExpanded(frame, true);
    const rows = [...drawer.layersPanel!.$list.querySelectorAll('.drawer-layers-label')].map(($l) => $l.textContent);
    expect(rows).toEqual(['Rectangle', 'Frame 1', 'Rectangle']);

    // undone and done again: frame with its shapes
    drawer.undoRedo.undo();
    drawer.undoRedo.redo();
    const restored = drawer.getDrawingShapes().find(isFrame)!;
    expect(restored).toBeInstanceOf(Frame);
    expect(getFrameShapes(restored)).toHaveLength(1);

    // files keep frames
    const file = drawer.getDrawingFile();
    expect(JSON.stringify(file)).toContain('"className":"Frame"');
    expect(Node.create(JSON.stringify(file.shapes[0]))).toBeInstanceOf(Frame);

    // svg: shapes cut, no title
    const svg = await readText(await drawer.exportImage('svg', { background: false }));
    expect(svg).toContain('<clipPath');
    expect(svg).not.toContain('Frame 1');

    // eraser: shape of frame alone
    const shape = getFrameShapes(restored)[0];
    drawer.getWidget<BaseWidget>('eraser')!.setActive(true);
    // no hit canvas in jsdom
    vi.spyOn(drawer.drawLayer, 'getIntersection').mockReturnValue(shape as Shape);
    fireMouse(drawer, 'mousedown', 10, 10);
    fireMouse(drawer, 'mouseup', 10, 10);
    expect(getFrameShapes(restored)).toEqual([]);
    expect(restored.getLayer()).toBe(drawer.drawLayer);
  });
});

describe('Laser', () => {
  it('Trail while pressed, nothing drawn nor saved, also in read only', () => {
    const drawer = createDrawer();
    const laser = drawer.getWidget<BaseWidget>('laser')!;
    const trails = () => drawer.selectionLayer.find<Line>('.trail');

    expect(laser.shortcut).toBe('k');
    laser.setActive(true);
    fireMouse(drawer, 'mousedown', 100, 100);
    fireMouse(drawer, 'mousemove', 150, 120);
    expect(laser.inAction).toBe(true);
    expect(trails()).toHaveLength(1);
    expect([trails()[0].fill(), trails()[0].shadowColor()]).toEqual(['#ff3b30', '#ff3b30']);
    fireMouse(drawer, 'mouseup', 150, 120);
    expect(laser.inAction).toBe(false);
    expect(drawer.getDrawingShapes()).toEqual([]);
    expect(drawer.undoRedo.canUndo()).toBe(false);

    // pointing does not change drawing
    drawer.setReadOnly(true);
    expect(laser.isDisabled).toBe(false);
    expect(drawer.getWidget<BaseWidget>('highlighter')!.isDisabled).toBe(true);
    drawer.setReadOnly(false);
  });
});

describe('Highlighter', () => {
  it('Wide fluorescent strokes multiplied with drawing, its own colors and widths', async () => {
    const drawer = createDrawer({ language: 'en' });
    const highlighter = drawer.getWidget<HighlighterWidget>('highlighter')!;
    const strokeColor = drawer.options.strokeColor;
    const draw = () => {
      highlighter.setActive(true);
      drag(drawer, [100, 100], [300, 100]);
      return drawer.getDrawingShapes().at(-1) as Line;
    };

    expect(highlighter.shortcut).toBe('m');
    const yellow = draw();
    const box = yellow.getClientRect();

    expect(yellow.hasName(shapeName.highlighter)).toBe(true);
    expect([yellow.fill(), yellow.stroke(), yellow.globalCompositeOperation()]).toEqual([
      '#ffe066',
      undefined,
      'multiply',
    ]);
    // medium width (20)
    expect(Math.round(box.height)).toBeGreaterThanOrEqual(19);

    // overlay: own colors and widths, stroke color of other tools kept
    const { overlay } = highlighter;
    expect(overlay.$overlayContainer.getAttribute('aria-label')).toBe('Highlighter options');
    expect(overlay.colorPicker.$buttons.map(($btn) => $btn.getAttribute('aria-label'))).toEqual([
      'Yellow',
      'Green',
      'Blue',
      'Pink',
      'Orange',
    ]);
    overlay.colorPicker.$buttons[3].click();
    overlay.$sizeButtons[2].click();
    expect(overlay.$sizeButtons[2].getAttribute('aria-pressed')).toBe('true');

    const pink = draw();

    expect(pink.fill()).toBe('#faa2c1');
    expect(Math.round(pink.getClientRect().height)).toBeGreaterThanOrEqual(31);
    expect(drawer.options.strokeColor).toBe(strokeColor);

    // selected: color is its fill, no stroke nor width
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;

    selectWidget.setActive(true);
    selectWidget.select([pink]);
    drawer.setStrokeColor('#2f9e44');
    drawer.setStrokeWidth(12);
    expect([pink.fill(), pink.stroke(), pink.strokeWidth()]).toEqual(['#2f9e44', undefined, 0]);

    const svg = await readText(await drawer.exportImage('svg', { background: false }));

    expect(svg).toContain('mix-blend-mode:multiply');
  });
});

describe('Pointer actions', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  /** Mouse event out of the canvas (app bar, page...) */
  const outside = (type: string, init: MouseEventInit = {}) =>
    document.body.dispatchEvent(new MouseEvent(type, { bubbles: true, ...init }));
  const pointerEvents = (drawer: ReturnType<typeof createDrawer>) =>
    drawer.$drawerContainer.style.getPropertyValue('--drawer-pointer-events');

  it('Pointer moved and released out of the canvas: shape follows it and ends there', () => {
    const drawer = createDrawer({ keepTool: true });
    drawer.getWidget<BaseWidget>('square')!.setActive(true);

    fireMouse(drawer, 'mousedown', 10, 10);
    outside('mousemove', { clientX: 900, clientY: 700, buttons: 1 });
    expect(drawer.getDrawingShapes()[0].width()).toBe(890);

    outside('mouseup', { clientX: 950, clientY: 750 });
    expect(drawer._duringAction()).toBe(false);
    expect(pointerEvents(drawer)).toBe('all');
    expect(drawer.getDrawingShapes()[0].size()).toEqual({ width: 940, height: 740 });
    expect(drawer.undoRedo.entries).toHaveLength(1);
    // pointer forgotten out of the canvas: not the place of a paste
    expect(drawer._hasPointer()).toBe(false);

    // released on the canvas: konva tells it, nothing sent twice
    drag(drawer, [10, 10], [50, 50]);
    outside('mouseup');
    expect(drawer.getDrawingShapes()).toHaveLength(2);
    expect(drawer.undoRedo.entries).toHaveLength(2);
  });

  it('Second finger during a drawing: ignored, the drawing ends where its own finger is lifted', () => {
    const drawer = createDrawer({ keepTool: true });
    type Finger = { identifier: number; clientX: number; clientY: number };
    const finger = (identifier: number, clientX: number, clientY: number): Finger => ({ identifier, clientX, clientY });
    /** Touch event: konva points the first finger on the screen, changed fingers give the lifted one */
    const touch = (type: string, touches: Finger[], changed: Finger[]) => {
      const { clientX, clientY } = touches[0] ?? changed[0];

      fireMouse(drawer, type, clientX, clientY, { touches, changedTouches: changed } as unknown as Partial<MouseEvent>);
    };

    // second finger lifted first
    drawer.getWidget<BaseWidget>('square')!.setActive(true);
    touch('touchstart', [finger(0, 10, 10)], [finger(0, 10, 10)]);
    touch('touchmove', [finger(0, 60, 40)], [finger(0, 60, 40)]);
    touch('touchstart', [finger(0, 60, 40), finger(1, 300, 300)], [finger(1, 300, 300)]);
    touch('touchend', [finger(0, 60, 40)], [finger(1, 300, 300)]);
    expect(drawer._duringAction()).toBe(true);
    touch('touchmove', [finger(0, 110, 70)], [finger(0, 110, 70)]);
    touch('touchend', [], [finger(0, 110, 70)]);
    expect(drawer._duringAction()).toBe(false);
    expect(drawer.getDrawingShapes().map((shape) => shape.size())).toEqual([{ width: 100, height: 60 }]);

    // finger of the drawing lifted first: ended where it is lifted, not where the other one is
    drawer.getWidget<BaseWidget>('brush')!.setActive(true);
    touch('touchstart', [finger(2, 200, 200)], [finger(2, 200, 200)]);
    touch('touchstart', [finger(2, 200, 200), finger(3, 600, 600)], [finger(3, 600, 600)]);
    touch('touchmove', [finger(2, 250, 220), finger(3, 600, 600)], [finger(2, 250, 220)]);
    touch('touchend', [finger(3, 600, 600)], [finger(2, 260, 230)]);
    expect(drawer._duringAction()).toBe(false);
    touch('touchend', [], [finger(3, 600, 600)]);
    const stroke = drawer.getDrawingShapes()[1].getClientRect();
    expect(drawer.getDrawingShapes()).toHaveLength(2);
    expect(stroke.x + stroke.width).toBeLessThan(300);
  });

  it('Two fingers on the canvas: drawing of the first one cancelled, pinch zooms and moves the view', () => {
    const drawer = createDrawer({ keepTool: true });
    const touch = (type: string, fingers: ReturnType<typeof finger>[], changed = fingers) =>
      fireTouch(drawer, type, fingers, changed);
    const live = vi.fn();

    drawer.getWidget<BaseWidget>('square')!.setActive(true);
    touch('touchstart', [finger(0, 100, 100)]);
    touch('touchmove', [finger(0, 140, 120)]);
    expect(drawer.getDrawingShapes()).toHaveLength(1);
    drawer.on('change', live);

    // second finger: square being drawn removed, no change
    touch('touchstart', [finger(0, 140, 120), finger(1, 240, 120)], [finger(1, 240, 120)]);
    expect(drawer.getDrawingShapes()).toHaveLength(0);
    expect(drawer._duringAction()).toBe(false);
    expect(drawer.gestures.active).toBe(true);

    // fingers twice as far apart: zoom 2, drawing point under their middle (190, 120) kept under it
    touch('touchmove', [finger(0, 90, 120), finger(1, 290, 120)]);
    expect(drawer.getZoomLevel()).toBe(2);
    expect(drawer.stage.position()).toEqual({ x: -190, y: -120 });
    // moved together: view moved
    touch('touchmove', [finger(0, 100, 150), finger(1, 300, 150)]);
    expect(drawer.stage.position()).toEqual({ x: -180, y: -90 });

    // fingers lifted: the last one draws nothing
    touch('touchend', [finger(1, 300, 150)], [finger(0, 100, 150)]);
    touch('touchmove', [finger(1, 320, 200)]);
    touch('touchend', [], [finger(1, 320, 200)]);
    expect(drawer.gestures.active).toBe(false);
    expect(drawer.getDrawingShapes()).toHaveLength(0);
    expect(live).not.toHaveBeenCalled();

    // one finger again: drawing
    touch('touchstart', [finger(2, 100, 100)]);
    touch('touchmove', [finger(2, 160, 140)]);
    touch('touchend', [], [finger(2, 160, 140)]);
    expect(drawer.getDrawingShapes()).toHaveLength(1);
  });

  it('Two fingers on the canvas: stroke of the brush removed, shapes faded by the eraser kept', () => {
    const drawer = createDrawer({ keepTool: true });
    const touch = (type: string, fingers: ReturnType<typeof finger>[], changed = fingers) =>
      fireTouch(drawer, type, fingers, changed);
    const live = vi.fn();

    drawer.getWidget<BaseWidget>('brush')!.setActive(true);
    touch('touchstart', [finger(0, 100, 100)]);
    touch('touchmove', [finger(0, 150, 120)]);
    expect(drawer.getDrawingShapes()).toHaveLength(1);
    drawer.on('change', live);
    touch('touchstart', [finger(0, 150, 120), finger(1, 300, 300)], [finger(1, 300, 300)]);
    expect(drawer.getDrawingShapes()).toHaveLength(0);
    touch('touchend', [], [finger(0, 150, 120), finger(1, 300, 300)]);
    expect(drawer.getDrawingShapes()).toHaveLength(0);
    expect(live).not.toHaveBeenCalled();

    // shape faded while erased: opacity back, kept
    const square = drawer.addShape(new Rect({ x: 0, y: 0, width: 50, height: 50, opacity: 0.8 }));

    drawer.getWidget<BaseWidget>('eraser')!.setActive(true);
    // no hit canvas in jsdom
    vi.spyOn(drawer.drawLayer, 'getIntersection').mockReturnValue(square as Shape);
    touch('touchstart', [finger(2, 20, 20)]);
    expect(square.opacity()).toBeLessThan(0.8);
    touch('touchstart', [finger(2, 20, 20), finger(3, 300, 300)], [finger(3, 300, 300)]);
    expect(square.opacity()).toBe(0.8);
    touch('touchend', [], [finger(2, 20, 20), finger(3, 300, 300)]);
    expect(square.opacity()).toBe(0.8);
    expect(drawer.getDrawingShapes()).toEqual([square]);
    expect(live).not.toHaveBeenCalled();
  });

  it('Two fingers on the canvas with zoom option off: view moved, zoom kept', () => {
    const drawer = createDrawer({ zoom: false });
    const touch = (type: string, fingers: ReturnType<typeof finger>[], changed = fingers) =>
      fireTouch(drawer, type, fingers, changed);

    touch('touchstart', [finger(0, 100, 100), finger(1, 200, 100)]);
    touch('touchmove', [finger(0, 50, 130), finger(1, 250, 130)]);
    expect(drawer.getZoomLevel()).toBe(1);
    expect(drawer.stage.position()).toEqual({ x: 0, y: 30 });
    touch('touchend', [], [finger(0, 50, 130), finger(1, 250, 130)]);
  });

  it('Pointer released with an event of the window (not a node): action ended there', () => {
    const drawer = createDrawer({ keepTool: true });
    drawer.getWidget<BaseWidget>('square')!.setActive(true);

    fireMouse(drawer, 'mousedown', 10, 10);
    window.dispatchEvent(new MouseEvent('mouseup', { clientX: 60, clientY: 40 }));
    expect(drawer._duringAction()).toBe(false);
    expect(drawer.getDrawingShapes()[0].size()).toEqual({ width: 50, height: 30 });
  });

  it('Released unseen (window left) or touch cancelled: action ended, next stroke without the previous one', () => {
    const drawer = createDrawer({ keepTool: true });
    const brush = drawer.getWidget<BaseWidget>('brush')!;
    brush.setActive(true);

    fireMouse(drawer, 'mousedown', 10, 10);
    fireMouse(drawer, 'mousemove', 50, 50);
    // back on the canvas, button released elsewhere
    drawer.stage.content.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 60, clientY: 60 }));
    expect(brush.inAction).toBe(false);
    expect(drawer.undoRedo.entries).toHaveLength(1);

    fireMouse(drawer, 'touchstart', 10, 10);
    window.dispatchEvent(new TouchEvent('touchcancel'));
    expect(brush.inAction).toBe(false);
    expect(drawer.undoRedo.entries).toHaveLength(2);

    // stroke ended by a tool change: next one starts empty
    fireMouse(drawer, 'mousedown', 10, 10);
    fireMouse(drawer, 'mousemove', 50, 50);
    drawer.getWidget<BaseWidget>('square')!.setActive(true);
    brush.setActive(true);
    drag(drawer, [300, 300], [320, 310]);
    const { x } = drawer.getDrawingShapes().at(-1)!.getClientRect({ skipTransform: true });
    expect(x).toBeGreaterThan(250);
  });
});
