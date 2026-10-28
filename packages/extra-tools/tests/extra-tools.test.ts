import { describe, expect, it } from 'vitest';
import type { Line } from 'konva/lib/shapes/Line';
import type { Path } from 'konva/lib/shapes/Path';
import { shapeName, type BaseWidget, type Drawer } from '@fabwcie/free-drawing';
import { getAnchorPoints } from '@/utils/binding';
import { parseDrawingFile } from '@/utils/drawingFile';
import { createDrawer, drag } from '../../free-drawing/tests/helpers';
import { ExtraShapesPlugin, HighlighterPlugin, type HighlighterWidget } from '../src/index.js';

/** Tools of the extra shapes */
const shapes = ['heart', 'cloud', 'star', 'hexagon', 'blockArrow', 'bubble', 'checkbox'];

/**
 * Shape drawn with a tool in a box from the origin
 * @param drawer Drawer of the test
 * @param tool Id of the tool
 * @param to Corner of the box
 * @param from Other corner of the box
 * @returns Shape drawn
 */
const draw = (drawer: Drawer, tool: string, to: [number, number], from: [number, number] = [0, 0]) => {
  drawer.getWidget<BaseWidget>(tool)!.setActive(true);
  drag(drawer, from, to);
  return drawer.getDrawingShapes().at(-1) as Path;
};

describe('Extra shapes', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Tools of the plugin in "More tools", named in the language of the drawer, without shortcut', () => {
    const drawer = createDrawer({ language: 'fr', plugins: [ExtraShapesPlugin] });
    const [group] = drawer.toolbar.groups;

    expect(group.widgets.map(({ id }) => id)).toEqual(['triangle', 'diamond', ...shapes, 'laser', 'frame']);
    expect(shapes.map((tool) => drawer.getWidget<BaseWidget>(tool)!.$button.getAttribute('aria-label'))).toEqual([
      'Cœur',
      'Nuage',
      'Étoile',
      'Hexagone',
      'Flèche pleine',
      'Bulle',
      'Case cochée',
    ]);
    expect(shapes.map((tool) => drawer.getWidget<BaseWidget>(tool)!.shortcut)).toEqual(shapes.map(() => undefined));
  });

  it('Shapes drawn in the dragged box, outline as drawn, named in the layers panel; a click draws nothing', () => {
    const drawer = createDrawer({ language: 'en', plugins: [ExtraShapesPlugin] });
    const layer = drawer.drawLayer;

    expect(draw(drawer, 'heart', [40, 40]).hasName(shapeName.heart)).toBe(true);
    expect(draw(drawer, 'cloud', [40, 40]).hasName(shapeName.cloud)).toBe(true);
    expect(draw(drawer, 'hexagon', [100, 50]).data()).toBe('M25 0L75 0L100 25L75 50L25 50L0 25Z');
    expect(draw(drawer, 'blockArrow', [100, 100]).data()).toBe('M0 30L60 30L60 0L100 50L60 100L60 70L0 70Z');

    const star = draw(drawer, 'star', [200, 200]);
    const bubble = draw(drawer, 'bubble', [200, 100]);
    const checkbox = draw(drawer, 'checkbox', [200, 200]);

    expect([star, bubble, checkbox].map((shape) => shape.name())).toEqual([
      shapeName.star,
      shapeName.bubble,
      shapeName.checkbox,
    ]);
    expect(drawer.getShapeLabel(star)).toBe('Star');
    // sides on the outline: top point of the star, side of the check box (its check mark is not an outline)
    expect(getAnchorPoints(star, layer).top).toEqual({ x: 100, y: 0 });

    const right = getAnchorPoints(checkbox, layer).right;

    expect([Math.round(right.x), Math.round(right.y)]).toEqual([200, 100]);
    draw(drawer, 'cloud', [500, 500], [500, 500]);
    expect(drawer.getDrawingShapes()).toHaveLength(7);
  });
});

describe('Highlighter', () => {
  it('Wide fluorescent strokes multiplied with drawing, its own colors and widths, disabled in read only', () => {
    const drawer = createDrawer({ language: 'en', plugins: [HighlighterPlugin] });
    const highlighter = drawer.getWidget<HighlighterWidget>('highlighter')!;
    const strokeColor = drawer.options.strokeColor;
    const stroke = () => {
      highlighter.setActive(true);
      drag(drawer, [100, 100], [300, 100]);
      return drawer.getDrawingShapes().at(-1) as Line;
    };

    expect([highlighter.shortcut, highlighter.$button.getAttribute('aria-label')]).toEqual(['m', 'Highlighter']);
    expect(drawer.toolbar.groups[0].widgets.map(({ id }) => id)).toContain('highlighter');

    const yellow = stroke();

    expect(yellow.hasName(shapeName.highlighter)).toBe(true);
    expect([yellow.fill(), yellow.stroke(), yellow.globalCompositeOperation()]).toEqual([
      '#ffe066',
      undefined,
      'multiply',
    ]);
    // medium width (20)
    expect(Math.round(yellow.getClientRect().height)).toBeGreaterThanOrEqual(19);

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

    const pink = stroke();

    expect(pink.fill()).toBe('#faa2c1');
    expect(Math.round(pink.getClientRect().height)).toBeGreaterThanOrEqual(31);
    expect(drawer.options.strokeColor).toBe(strokeColor);

    drawer.setLanguage('de');
    expect(overlay.$overlayContainer.getAttribute('aria-label')).toBe('Textmarker-Optionen');

    drawer.setReadOnly(true);
    expect(highlighter.isDisabled).toBe(true);
  });
});

describe('Drawings of the extra tools', () => {
  it('Read back unchanged; opened by a drawer without the plugins, drawn and kept there', () => {
    const drawer = createDrawer({ plugins: [ExtraShapesPlugin, HighlighterPlugin] });

    drawer.setStrokeStyle('dashed');
    drawer.setFillColor('#ffec99');
    drawer.setOpacity(0.5);
    for (const [index, tool] of [...shapes, 'highlighter'].entries()) {
      drawer.getWidget<BaseWidget>(tool)!.setActive(true);
      drag(drawer, [10, 10 + index * 60], [80, 50 + index * 60]);
    }

    const file = drawer.getDrawingFile();

    expect(file.shapes).toHaveLength(shapes.length + 1);
    expect(parseDrawingFile(JSON.stringify(file))).toEqual(file);

    const other = createDrawer();

    other.loadDrawing(file);
    expect(other.getDrawingFile()).toEqual(file);
  });
});
