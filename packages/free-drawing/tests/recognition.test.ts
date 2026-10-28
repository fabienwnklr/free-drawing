import { describe, expect, it } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import type { Vector2d } from 'konva/lib/types';
import type { Drawer } from '@/Drawer';
import { shapeName } from '@/constants';
import type { BrushOverlay } from '@/components/tools/Overlay/BrushOverlay/BrushOverlay';
import type { BrushWidget } from '@/components/toolbar/widgets/Brush/Brush';
import { recognizeShape, resample, simplifyPath } from '@/utils/recognition';
import { createDrawer, fireMouse } from './helpers';

/**
 * Random numbers always the same (tests repeatable)
 * @param seed Start of the sequence
 * @returns Function giving numbers between -1 and 1
 */
const random = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed / 2147483647) * 2 - 1;
};

/**
 * Stroke drawn by hand along a path: points every 4 units, shaking of the hand (smooth noise)
 * @param path Corners of the path
 * @param shake Size of the noise, in units
 * @param seed Seed of the noise
 * @returns Points of the stroke
 */
const drawn = (path: Vector2d[], shake = 3, seed = 7): Vector2d[] => {
  const next = random(seed);
  const length = path.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - path[i].x, p.y - path[i].y), 0);
  let dx = 0;
  let dy = 0;

  return resample(path, Math.ceil(length / 4)).map((p) => {
    // drifts slowly, as a hand
    dx = dx * 0.8 + next() * shake * 0.4;
    dy = dy * 0.8 + next() * shake * 0.4;
    return { x: p.x + dx, y: p.y + dy };
  });
};

/**
 * Points of an ellipse, from its right, overshooting a little
 * @param cx Center x
 * @param cy Center y
 * @param rx Radius x
 * @param ry Radius y
 * @returns Points of the outline
 */
const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  Array.from({ length: 70 }, (_, i) => ({
    x: cx + Math.cos((i / 64) * 2 * Math.PI) * rx,
    y: cy + Math.sin((i / 64) * 2 * Math.PI) * ry,
  }));

describe('Shape recognition', () => {
  it('Closed strokes: rectangle, ellipse, triangle, diamond in the box of the stroke', () => {
    const rect = drawn([
      { x: 10, y: 10 },
      { x: 310, y: 12 },
      { x: 308, y: 180 },
      { x: 12, y: 178 },
      { x: 14, y: 20 },
    ]);
    const circle = drawn(ellipse(200, 150, 120, 80));
    const triangle = drawn([
      { x: 150, y: 0 },
      { x: 300, y: 200 },
      { x: 0, y: 200 },
      { x: 140, y: 10 },
    ]);
    const diamond = drawn([
      { x: 100, y: 0 },
      { x: 200, y: 100 },
      { x: 100, y: 200 },
      { x: 0, y: 100 },
      { x: 95, y: 5 },
    ]);

    expect(recognizeShape(rect)?.kind).toBe('rect');
    expect(recognizeShape(circle)?.kind).toBe('ellipse');
    expect(recognizeShape(triangle)?.kind).toBe('triangle');
    expect(recognizeShape(diamond)?.kind).toBe('diamond');

    // box of the stroke
    const { start, end } = recognizeShape(rect)!;

    expect(start.x).toBeCloseTo(Math.min(...rect.map((p) => p.x)));
    expect(end.y).toBeCloseTo(Math.max(...rect.map((p) => p.y)));
    // a circle is not taken for a square
    expect(recognizeShape(drawn(ellipse(100, 100, 80, 80), 2, 3))?.kind).toBe('ellipse');
    expect(
      recognizeShape(
        drawn([
          { x: 0, y: 0 },
          { x: 160, y: 0 },
          { x: 160, y: 160 },
          { x: 0, y: 160 },
          { x: 0, y: 5 },
        ])
      )?.kind
    ).toBe('rect');
  });

  it('Open strokes: straight line, arrow with its head after or before the shaft', () => {
    const line = drawn([
      { x: 0, y: 0 },
      { x: 300, y: 100 },
    ]);
    const arrow = drawn([
      { x: 0, y: 100 },
      { x: 300, y: 100 },
      { x: 250, y: 70 },
      { x: 300, y: 100 },
      { x: 250, y: 130 },
    ]);
    const headFirst = drawn([
      { x: 50, y: 30 },
      { x: 0, y: 0 },
      { x: 60, y: -10 },
      { x: 0, y: 0 },
      { x: 300, y: 200 },
    ]);

    expect(recognizeShape(line)).toEqual({ kind: 'line', start: line[0], end: line.at(-1) });
    expect(recognizeShape(arrow)).toMatchObject({ kind: 'arrow' });
    // from its tail to its tip
    const { start, end } = recognizeShape(arrow)!;

    expect(start.x).toBeLessThan(20);
    expect(end.x).toBeGreaterThan(280);
    expect(recognizeShape(headFirst)).toMatchObject({ kind: 'arrow' });
    expect(recognizeShape(headFirst)!.end.x).toBeLessThan(20);
  });

  it('Other strokes kept: check mark, zigzag, arc, flick at the end of a line, too small', () => {
    const check = drawn([
      { x: 0, y: 100 },
      { x: 60, y: 160 },
      { x: 220, y: 0 },
    ]);
    const zigzag = drawn([
      { x: 0, y: 0 },
      { x: 60, y: 100 },
      { x: 120, y: 0 },
      { x: 180, y: 100 },
      { x: 240, y: 0 },
    ]);
    const arc = drawn(ellipse(100, 100, 100, 100).slice(0, 36));
    const flick = drawn([
      { x: 0, y: 0 },
      { x: 300, y: 0 },
      { x: 292, y: 8 },
    ]);
    const letter = drawn(ellipse(10, 10, 8, 10), 0.5);

    expect(recognizeShape(check)).toBeNull();
    expect(recognizeShape(zigzag)).toBeNull();
    expect(recognizeShape(arc)).toBeNull();
    expect(recognizeShape(flick)?.kind).toBe('line');
    expect(recognizeShape(letter)?.kind).toBe('ellipse');
    expect(recognizeShape(letter, 40)).toBeNull();
  });

  it('Path simplified: corners farther than the tolerance kept', () => {
    const path = [
      { x: 0, y: 0 },
      { x: 50, y: 1 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ];

    expect(simplifyPath(path, 5)).toEqual([path[0], path[2], path[3]]);
    expect(resample(path, 5).map((p) => Math.round(p.x))).toEqual([0, 50, 100, 100, 100]);
  });
});

/**
 * Brush stroke along points: pressed at the first one, moved to the others, released at the last one
 * @param drawer Drawer of the test
 * @param points Points of the stroke, in drawing coordinates (view at origin, 100 %)
 * @param shiftKey Shift pressed: straight stroke
 */
const brushStroke = (drawer: Drawer, points: Vector2d[], shiftKey = false) => {
  drawer.getWidget<BrushWidget>('brush')!.setActive(true);
  fireMouse(drawer, 'mousedown', points[0].x, points[0].y);
  for (const p of points.slice(1)) fireMouse(drawer, 'mousemove', p.x, p.y, { shiftKey });
  fireMouse(drawer, 'mouseup', points.at(-1)!.x, points.at(-1)!.y, { shiftKey });
};

/** Rectangle drawn by hand */
const rectStroke = drawn([
  { x: 100, y: 100 },
  { x: 300, y: 102 },
  { x: 298, y: 220 },
  { x: 102, y: 218 },
  { x: 104, y: 108 },
]);

describe('Shapes recognized in brush strokes', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Off by default: strokes kept as drawn', () => {
    const drawer = createDrawer();

    expect(drawer.options.shapeRecognition).toBe(false);
    brushStroke(drawer, rectStroke);
    expect(drawer.getDrawingShapes().map((shape) => shape.name())).toEqual([shapeName.line]);
  });

  it('Stroke replaced by the shape of its tool, after the stroke in history; straight, small strokes kept', () => {
    const drawer = createDrawer({ shapeRecognition: true, strokeColor: '#1971c2', strokeWidth: 3 });

    brushStroke(drawer, rectStroke);

    const [rect] = drawer.getDrawingShapes() as Rect[];

    expect(drawer.getDrawingShapes()).toHaveLength(1);
    expect(rect.name()).toBe(shapeName.rect);
    expect(rect.x()).toBeCloseTo(Math.min(...rectStroke.map((p) => p.x)));
    expect(rect.width()).toBeGreaterThan(190);
    // style of the options, as drawn by the rectangle tool
    expect([rect.stroke(), rect.strokeWidth()]).toEqual(['#1971c2', 3]);
    expect(drawer.activeTool).toBe('brush');

    // undo gives back the stroke, then nothing
    drawer.undoRedo.undo();
    expect(drawer.getDrawingShapes().map((shape) => shape.name())).toEqual([shapeName.line]);
    drawer.undoRedo.undo();
    expect(drawer.getDrawingShapes()).toEqual([]);

    // Shift: straight stroke, never recognized
    brushStroke(drawer, rectStroke, true);
    // small: letters kept
    brushStroke(
      drawer,
      rectStroke.map((p) => ({ x: p.x / 10, y: p.y / 10 }))
    );
    expect(drawer.getDrawingShapes().map((shape) => shape.name())).toEqual([shapeName.line, shapeName.line]);
  });

  it('Arrow drawn from a shape to another one: linked to them', () => {
    const drawer = createDrawer({ shapeRecognition: true });
    const start = drawer.addShape(new Rect({ name: shapeName.rect, x: 0, y: 60, width: 80, height: 80, fill: '#fff' }));
    const end = drawer.addShape(new Rect({ name: shapeName.rect, x: 400, y: 60, width: 80, height: 80, fill: '#fff' }));

    brushStroke(
      drawer,
      drawn([
        { x: 40, y: 100 },
        { x: 410, y: 100 },
        { x: 370, y: 75 },
        { x: 410, y: 100 },
        { x: 370, y: 125 },
      ])
    );

    const arrow = drawer.getDrawingShapes().at(-1)!;

    expect(arrow.name()).toBe(shapeName.arrow);
    expect([arrow.attrs.startBinding, arrow.attrs.endBinding]).toEqual([start.id(), end.id()]);
  });

  it('Shape tool missing (widgets option): stroke kept', () => {
    const drawer = createDrawer({ shapeRecognition: true, widgets: ['selection', 'brush', 'circle'] });

    brushStroke(drawer, rectStroke);
    expect(drawer.getDrawingShapes().map((shape) => shape.name())).toEqual([shapeName.line]);
  });

  it('Preference: brush panel switch, preferences dialog, command palette, saved in the browser', async () => {
    const drawer = createDrawer({ language: 'en' });
    const overlay = drawer.getWidget<BrushWidget>('brush')!.overlay as BrushOverlay;

    expect(overlay.$recognition.checked).toBe(false);
    // named by its label, shapes recognized described
    expect(overlay.$recognition.closest('label')!.querySelector('span')!.textContent).toBe('Recognize shapes');
    expect(document.getElementById(overlay.$recognition.getAttribute('aria-describedby')!)!.textContent).toContain(
      'undo gives back the stroke'
    );
    overlay.$recognition.checked = true;
    overlay.$recognition.dispatchEvent(new Event('change'));
    expect(drawer.options.shapeRecognition).toBe(true);
    expect(drawer.getPreferences().shapeRecognition).toBe(true);
    await Promise.resolve();
    expect(JSON.parse(localStorage.getItem(`${drawer.options.localStorageKey}-preferences`)!).shapeRecognition).toBe(
      true
    );

    drawer.setPreferences({ shapeRecognition: false });
    await Promise.resolve();
    expect(overlay.$recognition.checked).toBe(false);

    drawer.showPreferences();
    drawer.preferencesModal!.$shapeRecognition!.checked = true;
    drawer.preferencesModal!.save();
    expect(drawer.options.shapeRecognition).toBe(true);

    drawer.showCommandPalette();
    const option = [...drawer.commandPalette!.$list.querySelectorAll('[role="option"]')].find(
      ($o) => $o.textContent?.includes('Recognize shapes')
    )!;
    expect(option.getAttribute('aria-checked')).toBe('true');
    drawer.commandPalette!.hide();

    // read again by a drawer of the same key
    expect(createDrawer({ localStorageKey: drawer.options.localStorageKey }).options.shapeRecognition).toBe(true);
  });
});
