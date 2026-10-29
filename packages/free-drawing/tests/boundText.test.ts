import { describe, expect, it } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import { Ellipse } from 'konva/lib/shapes/Ellipse';
import { Arrow } from 'konva/lib/shapes/Arrow';
import { Text } from 'konva/lib/shapes/Text';
import { Group } from 'konva/lib/Group';
import type { Drawer } from '@/Drawer';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import { shapeName } from '@/constants';
import { findBindingTarget } from '@/utils/binding';
import { getBoundText, updateBoundTexts } from '@/utils/boundText';
import { parseDrawingFile } from '@/utils/drawingFile';
import { renderSvg } from '@/utils/export';
import { createFrame, getFrameContent, type Frame } from '@/utils/frame';
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

describe('Copies', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Copy of a group added: its texts in its shapes, its arrows linked to them, not to the originals', () => {
    const drawer = createDrawer();
    const group = drawer.addShape(
      new Group({ name: shapeName.group }).add(
        new Rect({ id: 'r', name: shapeName.rect, width: 100, height: 50, stroke: '#000' }),
        new Ellipse({ id: 'e', name: shapeName.ellipse, x: 300, y: 25, radiusX: 50, radiusY: 25, stroke: '#000' }),
        new Text({ id: 't', name: shapeName.text, text: 'T', containerId: 'r' }),
        new Arrow({ id: 'a', name: shapeName.arrow, points: [100, 25, 250, 25], startBinding: 'r', endBinding: 'e' })
      )
    );
    const copy = drawer.addShape(group.clone() as Group);
    const [rect, ellipse, text, arrow] = copy.getChildren();

    expect(rect.id()).not.toBe('r');
    expect(text.attrs.containerId).toBe(rect.id());
    expect([arrow.attrs.startBinding, arrow.attrs.endBinding]).toEqual([rect.id(), ellipse.id()]);
    // original unchanged
    expect(group.getChildren()[2].attrs.containerId).toBe('r');
  });
});

describe('Texts of shapes', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Field of a text being typed follows the view moved or zoomed meanwhile (wheel, pinch, Space)', () => {
    const drawer = createDrawer();
    const textWidget = drawer.getWidget<TextWidget>('text')!;
    const text = textWidget.addTextNode('Hi', { x: 100, y: 100 });

    textWidget.editTextNode(text);
    const textarea = document.querySelector<HTMLTextAreaElement>('.drawer-text-editor')!;
    const [size, left, top] = [parseFloat(textarea.style.fontSize), textarea.style.left, textarea.style.top];

    drawer.stage.scale({ x: 2, y: 2 });
    drawer.stage.position({ x: 30, y: 10 });
    drawer._update();
    expect(parseFloat(textarea.style.fontSize)).toBe(size * 2);
    expect([textarea.style.left, textarea.style.top]).not.toEqual([left, top]);
    write('Hello');
    expect(text.text()).toBe('Hello');
  });

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

  it('Text of a flipped shape readable: not upside down, not mirrored in a flipped group', () => {
    const drawer = createDrawer();
    const rect = createRect(drawer);
    const text = drawer.addShape(
      new Text({ name: shapeName.text, text: 'Hi', align: 'center', containerId: rect.id() })
    ) as Text;
    const centers = () =>
      [text, rect].map((node) => {
        const box = node.getClientRect({ relativeTo: drawer.drawLayer });

        return [Math.round(box.x + box.width / 2), Math.round(box.y + box.height / 2)];
      });
    const mirrored = () => {
      const [a, b, c, d] = text.getAbsoluteTransform().getMatrix();

      return a * d - b * c < 0;
    };

    drawer.stage.fire('change');
    drawer.flipShapes('horizontal', [rect, text]);
    expect([text.rotation(), text.scaleX(), mirrored()]).toEqual([0, 1, false]);
    expect(centers()[0]).toEqual(centers()[1]);
    drawer.flipShapes('vertical', [rect, text]);
    expect([text.rotation(), mirrored()]).toEqual([0, false]);

    // group flipped: text mirrored again, also after a move of the group
    const group = drawer.groupShapes([rect, text])!;

    drawer.flipShapes('horizontal', [group]);
    expect(mirrored()).toBe(false);
    group.x(group.x() + 50);
    drawer.stage.fire('change');
    expect(mirrored()).toBe(false);
    expect(centers()[0]).toEqual(centers()[1]);
  });

  it('Text of a shape placed in frames with its shape, above it', () => {
    const drawer = createDrawer();
    const frame = drawer.addShape(createFrame({ x: 0, y: 0, width: 400, height: 300, label: 'F' })) as Frame;
    // center out of the frame
    const rect = drawer.addShape(
      new Rect({ name: shapeName.rect, x: 350, y: 100, width: 200, height: 100, stroke: '#000' })
    ) as Rect;
    const text = drawer.addShape(new Text({ name: shapeName.text, text: 'Hi', containerId: rect.id() })) as Text;
    const content = getFrameContent(frame);

    drawer.stage.fire('change');
    // text alone over the frame (typed in the shape, aligned...): with its shape
    text.x(100);
    drawer.placeInFrames([text]);
    expect(text.getParent()).toBe(drawer.drawLayer);

    // shape moved into the frame: its text with it, above it
    rect.x(50);
    drawer.placeInFrames([rect]);
    expect([rect.getParent(), text.getParent()]).toEqual([content, content]);
    expect(text.zIndex()).toBe(rect.zIndex() + 1);

    // frame fitted around the text only: none taken
    rect.x(350);
    drawer.placeInFrames([rect]);
    expect([rect.getParent(), text.getParent()]).toEqual([drawer.drawLayer, drawer.drawLayer]);
    text.position({ x: 20, y: 20 });
    drawer.fitFrame(frame);
    expect(text.getParent()).toBe(drawer.drawLayer);
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

  it('Undo and redo move the texts of their shapes too: redo kept (text of another user in a shape moved back)', () => {
    const drawer = createDrawer();
    const rect = createRect(drawer);

    drawer.stage.fire('change');
    rect.x(400);
    drawer.stage.fire('change');
    // text written by another user (collaboration) after the move, placed by them: not a change of this user
    const text = drawer.addShape(
      new Text({ name: shapeName.text, text: 'Hi', align: 'center', containerId: rect.id() })
    ) as Text;

    updateBoundTexts(drawer.drawLayer, '#fff');
    drawer.undoRedo.ignoreChanges([text.id()]);
    drawer.stage.fire('change');
    const placed = centerOf(text);

    drawer.undoRedo.undo();
    drawer.stage.fire('change');
    expect(centerOf(text)).toEqual({ x: placed.x - 300, y: placed.y });
    expect(drawer.undoRedo.canRedo()).toBe(true);

    drawer.undoRedo.redo();
    drawer.stage.fire('change');
    expect(centerOf(text)).toEqual(placed);
  });
});
