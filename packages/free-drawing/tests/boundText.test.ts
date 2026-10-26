import { describe, expect, it } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import { Ellipse } from 'konva/lib/shapes/Ellipse';
import { Arrow } from 'konva/lib/shapes/Arrow';
import { Text } from 'konva/lib/shapes/Text';
import type { Drawer } from '@/Drawer';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { shapeName } from '@/constants';
import { findBindingTarget } from '@/utils/binding';
import { getBoundText } from '@/utils/boundText';
import { parseDrawingFile } from '@/utils/drawingFile';
import { renderSvg } from '@/utils/export';
import { createDrawer, fireMouse, setPointer } from './helpers';

/** Rectangle 100..300 x 100..200, without background */
const createRect = (drawer: Drawer) =>
  drawer.addShape(new Rect({ name: shapeName.rect, x: 100, y: 100, width: 200, height: 100, stroke: '#000' })) as Rect;

/**
 * Text written in the textarea of the edited text, validated with Enter
 * @param value Text written
 */
const write = (value: string) => {
  const textarea = document.querySelector<HTMLTextAreaElement>('.drawer-text-editor')!;

  textarea.value = value;
  textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter' }));
};

/** Center of a text (not turned), rounded */
const centerOf = (text: Text) => ({
  x: Math.round(text.x() + text.width() / 2),
  y: Math.round(text.y() + text.height() / 2),
});

/** Double click on a shape (or on the stage at a point of the drawing) */
const doubleClick = (drawer: Drawer, target: Rect | Arrow | null, x = 0, y = 0) => {
  setPointer(drawer, x, y);
  (target ?? drawer.stage).fire('dblclick', { evt: { button: 0 } }, true);
};

describe('Texts of shapes', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Text tool click on a shape writes in it: centered, as wide as its inside', () => {
    const drawer = createDrawer({ keepTool: true });
    const rect = createRect(drawer);

    drawer.getWidget<BaseWidget>('text')!.setActive(true);
    fireMouse(drawer, 'mousedown', 150, 150);
    fireMouse(drawer, 'click', 150, 150);
    write('Hello');

    const text = getBoundText(rect, drawer.drawLayer)!;

    expect(text.getAttr('containerId')).toBe(rect.id());
    expect(text.text()).toBe('Hello');
    expect(text.align()).toBe('center');
    // inside less padding (8)
    expect(text.width()).toBe(184);
    expect(centerOf(text)).toEqual({ x: 200, y: 150 });
  });

  it('Double click with the selection tool, also in the empty inside; not with a drawing tool', () => {
    const drawer = createDrawer();
    const rect = createRect(drawer);

    drawer.getWidget<BaseWidget>('square')!.setActive(true);
    doubleClick(drawer, null, 200, 150);
    expect(document.querySelector('.drawer-text-editor')).toBeNull();

    drawer.getWidget<BaseWidget>('selection')!.setActive(true);
    doubleClick(drawer, null, 200, 150);
    write('Inside');
    expect(getBoundText(rect, drawer.drawLayer)?.text()).toBe('Inside');

    // again: the same text edited
    doubleClick(drawer, rect);
    write('Changed');
    expect(drawer.drawLayer.find('Text')).toHaveLength(1);
    expect(getBoundText(rect, drawer.drawLayer)?.text()).toBe('Changed');
  });

  it('Text follows its shape: moved, turned, resized without being scaled; inner box of ellipses', () => {
    const drawer = createDrawer();
    const rect = createRect(drawer);
    const text = drawer.addShape(
      new Text({ name: shapeName.text, text: 'Hi', fontSize: 16, align: 'center', containerId: rect.id() })
    ) as Text;

    drawer.stage.fire('change');
    expect(centerOf(text)).toEqual({ x: 200, y: 150 });

    rect.setAttrs({ x: 400 });
    drawer.stage.fire('change');
    expect(centerOf(text)).toEqual({ x: 500, y: 150 });

    // resized by the transformer: wider text box, letters not scaled
    rect.scaleX(2);
    text.scaleX(2);
    drawer.stage.fire('change');
    expect([text.width(), text.scaleX()]).toEqual([384, 1]);

    // turned with it, around the center of the shape
    rect.setAttrs({ scaleX: 1, rotation: 90 });
    drawer.stage.fire('change');
    expect(text.rotation()).toBe(90);

    const ellipse = drawer.addShape(new Ellipse({ name: shapeName.ellipse, x: 0, y: 0, radiusX: 100, radiusY: 50 }));
    const inEllipse = drawer.addShape(
      new Text({ name: shapeName.text, text: 'E', align: 'center', containerId: ellipse.id() })
    ) as Text;

    drawer.stage.fire('change');
    // inner rectangle (200 / √2) less padding
    expect(Math.round(inEllipse.width())).toBe(125);
  });

  it('Selected, removed and copied with its shape; free text once its shape is removed alone', () => {
    const drawer = createDrawer();
    const rect = createRect(drawer);
    const text = drawer.addShape(
      new Text({ name: shapeName.text, text: 'Hi', align: 'center', containerId: rect.id() })
    ) as Text;
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;

    selectWidget.select([rect]);
    expect(drawer.getSelectedShapes()).toEqual([rect, text]);
    selectWidget.select([text]);
    expect(drawer.getSelectedShapes()).toEqual([text, rect]);

    // copies: the copied text in the copied shape
    const [copyRect, copyText] = drawer.duplicateShapes([rect, text]);

    expect(copyText.attrs.containerId).toBe(copyRect.id());

    // removed with its shape (API: shape only)
    drawer.deleteShapes([copyRect]);
    expect(copyText.getLayer()).toBeNull();

    // shape removed without its text: the text stays, free
    rect.destroy();
    drawer.stage.fire('change');
    expect(text.getLayer()).not.toBeNull();
    expect(text.getAttr('containerId')).toBeUndefined();
  });

  it('Label of an arrow: on its middle, as wide as its lines, halo of the background; arrows link to its shape', () => {
    const drawer = createDrawer({ language: 'en' });
    const arrow = drawer.addShape(new Arrow({ name: shapeName.arrow, points: [0, 0, 200, 0] })) as Arrow;

    drawer.getWidget<BaseWidget>('selection')!.setActive(true);
    doubleClick(drawer, arrow, 100, 0);
    write('Yes');

    const label = getBoundText(arrow, drawer.drawLayer)!;

    // automatic width: as wide as its lines
    expect(label.attrs.width).toBeUndefined();
    expect(centerOf(label)).toEqual({ x: 100, y: 0 });
    expect([label.stroke(), label.fillAfterStrokeEnabled()]).toEqual(['#fff', true]);

    drawer.setBgColor('#ffe8cc');
    expect(label.stroke()).toBe('#ffe8cc');

    // halo in svg exports too
    expect(renderSvg([label], { x: 0, y: -20, width: 200, height: 40 })).toContain('paint-order="stroke"');

    // text of a shape: arrows are linked to its shape
    const rect = createRect(drawer);
    const text = drawer.addShape(
      new Text({ name: shapeName.text, text: 'Hi', align: 'center', containerId: rect.id() })
    ) as Text;

    drawer.stage.fire('change');
    // in the box of its text, near the outline of the shape: the shape, not its (smaller) text
    expect(text.x()).toBeLessThan(110);
    expect(findBindingTarget(drawer.getDrawingShapes(), { x: 110, y: 150 })).toBe(rect);
  });

  it('Edit ended at once (Enter before timers run): the next click of the text tool still writes', async () => {
    const drawer = createDrawer({ keepTool: true });
    const rect = createRect(drawer);

    drawer.getWidget<BaseWidget>('selection')!.setActive(true);
    doubleClick(drawer, rect);
    // typed before the listeners of clicks out of the field are added
    write('Fast');
    await new Promise((resolve) => setTimeout(resolve));

    drawer.getWidget<BaseWidget>('text')!.setActive(true);
    // press on the canvas then click: a new text written (no edit left to end)
    drawer.stage.content.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fireMouse(drawer, 'mousedown', 600, 600);
    fireMouse(drawer, 'click', 600, 600);
    expect(document.querySelector('.drawer-text-editor')).not.toBeNull();
    write('Next');
    expect(drawer.drawLayer.find('Text').map((text) => (text as Text).text())).toEqual(['Fast', 'Next']);
  });

  it('Text of a shape kept in drawing files', () => {
    const drawer = createDrawer();
    const rect = createRect(drawer);

    drawer.addShape(new Text({ name: shapeName.text, text: 'Hi', align: 'center', containerId: rect.id() }));

    const file = parseDrawingFile(JSON.stringify(drawer.getDrawingFile()));

    expect(file.shapes[1].attrs.containerId).toBe(rect.id());
  });
});
