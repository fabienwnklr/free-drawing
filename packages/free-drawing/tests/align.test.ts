import { describe, expect, it } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import { Group } from 'konva/lib/Group';
import { Text } from 'konva/lib/shapes/Text';
import type { Drawer } from '@/Drawer';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { shapeName } from '@/constants';
import { createDrawer } from './helpers';

/** Rectangles 0..100 x 0..50, 200..250 x 100..150, 500..600 x 300..400 (no stroke: box as drawn) */
const createShapes = () => {
  const drawer = createDrawer({ language: 'en' });
  const rect = (x: number, y: number, width: number, height: number) =>
    drawer.addShape(new Rect({ name: shapeName.rect, x, y, width, height }));

  return { drawer, a: rect(0, 0, 100, 50), b: rect(200, 100, 50, 50), c: rect(500, 300, 100, 100) };
};

/** Position of each shape */
const positions = (...shapes: Rect[]) => shapes.map((shape) => [shape.x(), shape.y()]);

/** Ids of the commands of the palette now */
const commandIds = (drawer: Drawer) => {
  drawer.showCommandPalette();
  const ids = drawer.commandPalette!.commands.map(({ id }) => id);

  drawer.commandPalette!.hide();
  return ids;
};

describe('Align, distribute and stack shapes', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Align on a side or the center of the box of the shapes', () => {
    const { drawer, a, b, c } = createShapes();
    const shapes = [a, b, c];

    drawer.alignShapes('left', shapes);
    expect(positions(a, b, c)).toEqual([
      [0, 0],
      [0, 100],
      [0, 300],
    ]);
    drawer.alignShapes('right', shapes);
    expect(positions(a, b, c).map(([x]) => x)).toEqual([0, 50, 0]);
    drawer.alignShapes('center', shapes);
    expect(positions(a, b, c).map(([x]) => x)).toEqual([0, 25, 0]);

    drawer.alignShapes('top', shapes);
    expect(positions(a, b, c).map(([, y]) => y)).toEqual([0, 0, 0]);
    drawer.alignShapes('bottom', shapes);
    expect(positions(a, b, c).map(([, y]) => y)).toEqual([50, 50, 0]);
    drawer.alignShapes('middle', shapes);
    expect(positions(a, b, c).map(([, y]) => y)).toEqual([25, 25, 0]);

    // one shape: nothing to align
    drawer.alignShapes('left', [b]);
    expect(b.x()).toBe(25);
  });

  it('Distribute: same spaces between the shapes, first and last ones kept; stack: one after the other', () => {
    const { drawer, a, b, c } = createShapes();

    // free length 600 - 250 = 350: 175 between each shape
    drawer.distributeShapes('horizontal', [c, a, b]);
    expect(positions(a, b, c)).toEqual([
      [0, 0],
      [275, 100],
      [500, 300],
    ]);
    // 2 shapes: nothing to distribute
    drawer.distributeShapes('vertical', [a, b]);
    expect(b.y()).toBe(100);
    // free height 400 - 200 = 200: 100 between each shape
    drawer.distributeShapes('vertical', [a, b, c]);
    expect(positions(a, b, c).map(([, y]) => y)).toEqual([0, 150, 300]);

    // a row from the left one, 16 between them, places on the other axis kept
    drawer.stackShapes('horizontal', [a, b, c]);
    expect(positions(a, b, c)).toEqual([
      [0, 0],
      [116, 150],
      [182, 300],
    ]);
    drawer.stackShapes('vertical', [a, b, c]);
    expect(positions(a, b, c).map(([, y]) => y)).toEqual([0, 66, 132]);
  });

  it('Shapes of a moved group by their box in the drawing, one change undone at once', () => {
    const { drawer, a, b } = createShapes();
    const group = new Group({ x: 1000, y: 0, name: shapeName.group });
    const inner = new Rect({ name: shapeName.rect, x: 0, y: 40, width: 30, height: 30 });

    group.add(inner);
    drawer.addShape(group);
    drawer.alignShapes('left', [a, inner]);
    expect(inner.x()).toBe(-1000);
    expect(inner.getClientRect({ relativeTo: drawer.drawLayer }).x).toBe(0);

    drawer.alignShapes('top', [a, b]);
    expect(b.y()).toBe(0);
    drawer.undoRedo.undo();
    // put back from history: node created again
    expect(drawer.drawLayer.findOne(`#${b.id()}`)!.y()).toBe(100);
  });

  it('Sections of the options panel and commands of the palette for 2 shapes and more (distribute: 3)', () => {
    const { drawer, a, b, c } = createShapes();
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
    const { overlay } = selectWidget;
    const shown = ($el: HTMLElement) => $el.style.display !== 'none';

    selectWidget.select([a]);
    expect(shown(overlay.$alignContainer)).toBe(false);
    expect(commandIds(drawer)).not.toContain('align shapes left');

    selectWidget.select([a, b]);
    expect(shown(overlay.$alignContainer)).toBe(true);
    expect(shown(overlay.$distributeContainer)).toBe(true);
    expect(overlay.$distributeBtns.every(($btn) => $btn.disabled)).toBe(true);
    expect(commandIds(drawer)).toEqual(expect.arrayContaining(['align shapes left', 'stack shapes vertical']));
    expect(commandIds(drawer)).not.toContain('distribute shapes spacing horizontal');

    // text of a shape (selected with it) follows it: not counted
    const text = drawer.addShape(new Text({ name: shapeName.text, text: 'A', containerId: a.id() }));

    selectWidget.select([a]);
    expect(drawer.getSelectedShapes()).toEqual([a, text]);
    expect(shown(overlay.$alignContainer)).toBe(false);
    expect(commandIds(drawer)).not.toContain('align shapes left');
    selectWidget.select([a, b]);
    expect(overlay.$distributeBtns.every(($btn) => $btn.disabled)).toBe(true);
    expect(commandIds(drawer)).not.toContain('distribute shapes spacing horizontal');
    drawer.distributeShapes('horizontal');
    expect(positions(a, b)).toEqual([
      [0, 0],
      [200, 100],
    ]);
    text.destroy();

    selectWidget.select([a, b, c]);
    expect(overlay.$distributeBtns.some(($btn) => $btn.disabled)).toBe(false);
    expect(commandIds(drawer)).toContain('distribute shapes spacing horizontal');

    // button of the panel
    overlay.$alignContainer.querySelector<HTMLButtonElement>('button[title="Align top"]')!.click();
    expect(positions(a, b, c).map(([, y]) => y)).toEqual([0, 0, 0]);

    // read only: nothing modifying the drawing
    drawer.setReadOnly(true);
    expect(commandIds(drawer)).not.toContain('align shapes left');
  });
});
