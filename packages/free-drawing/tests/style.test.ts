import { describe, expect, it, vi } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import { Ellipse } from 'konva/lib/shapes/Ellipse';
import { Text } from 'konva/lib/shapes/Text';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { BaseOverlay } from '@/components/tools/Overlay/BaseOverlay';
import type { EyeDropperWindow } from '@/@types/ui';
import { shapeName } from '@/constants';
import { fromDarkColor } from '@/utils/color';
import { toDarkColor } from '@/utils/export';
import { getDash } from '@/utils/stroke';
import { getShapesStyle } from '@/utils/style';
import { createDrawer, keydown } from './helpers';

/** Ctrl + Alt + a letter on the drawer */
const ctrlAlt = (drawer: ReturnType<typeof createDrawer>, letter: string) =>
  keydown(drawer, { key: letter, code: `Key${letter.toUpperCase()}`, ctrlKey: true, altKey: true });

/** Channels of a `#rrggbb` color */
const channels = (color: string) => [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));

describe('Styles: copy, paste, eyedropper', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Style of shapes: each part from the first shape it applies to, parts applying to none left out', () => {
    const note = new Rect({ name: `${shapeName.rect} ${shapeName.note}`, fill: '#ffec99' });
    const rect = new Rect({ name: shapeName.rect, stroke: '#e03131', strokeWidth: 8, dash: getDash('dashed', 8) });
    const text = new Text({ name: shapeName.text, text: 'Hi', fill: '#2f9e44', fontSize: 24, fontStyle: 'bold' });

    // color, width and style of the stroke of the rectangle (the note has no stroke), background of the note
    expect(getShapesStyle([note, rect])).toEqual({
      strokeColor: '#e03131',
      fillColor: '#ffec99',
      strokeWidth: 8,
      strokeStyle: 'dashed',
      edges: 'sharp',
      opacity: 1,
    });
    // text: its color and text style, no background nor stroke width
    expect(getShapesStyle([text])).toEqual({
      strokeColor: '#2f9e44',
      textStyle: expect.objectContaining({ fontSize: 24, fontStyle: 'bold' }),
      opacity: 1,
    });
  });

  it('Copied style pasted on other shapes where each part applies, one step of history, new shapes take it', () => {
    const drawer = createDrawer();
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
    const source = drawer.addShape(
      new Rect({
        name: shapeName.rect,
        width: 100,
        height: 50,
        stroke: '#e03131',
        fill: '#a5d8ff',
        strokeWidth: 8,
        dash: getDash('dashed', 8),
        cornerRadius: 12,
        opacity: 0.5,
      })
    );
    const ellipse = drawer.addShape(
      new Ellipse({ name: shapeName.ellipse, x: 300, y: 300, radiusX: 40, radiusY: 20, stroke: '#000', strokeWidth: 3 })
    );
    const text = drawer.addShape(new Text({ name: shapeName.text, x: 500, text: 'Hi', fill: '#000' }));

    drawer.stage.fire('change');
    selectWidget.setActive(true);
    // nothing selected: nothing copied
    ctrlAlt(drawer, 'c');
    expect(drawer.copiedStyle).toBeNull();
    selectWidget.select([source]);
    ctrlAlt(drawer, 'c');
    expect(drawer.copiedStyle).toEqual({
      strokeColor: '#e03131',
      fillColor: '#a5d8ff',
      strokeWidth: 8,
      strokeStyle: 'dashed',
      edges: 12,
      opacity: 0.5,
    });

    selectWidget.select([ellipse, text]);
    ctrlAlt(drawer, 'v');
    expect(ellipse.attrs).toMatchObject({ stroke: '#e03131', fill: '#a5d8ff', strokeWidth: 8, opacity: 0.5 });
    expect(ellipse.dash()).toEqual(getDash('dashed', 8));
    // corners of rectangles only, text: its color and opacity
    expect(ellipse.getAttr('cornerRadius')).toBeUndefined();
    expect(text.attrs).toMatchObject({ fill: '#e03131', opacity: 0.5 });
    expect(text.stroke()).toBeFalsy();
    expect(drawer.options).toMatchObject({ strokeColor: '#e03131', fillColor: '#a5d8ff', strokeWidth: 8, edges: 12 });

    // one step of history
    drawer.undoRedo.undo();
    const [, before, textBefore] = drawer.getDrawingShapes();
    expect(before.attrs).toMatchObject({ stroke: '#000', strokeWidth: 3 });
    expect(before.attrs.fill).toBeUndefined();
    expect(textBefore.attrs.fill).toBe('#000');
  });

  it('Locked selection and read only keep their style; palette commands once a style is copied', () => {
    const drawer = createDrawer();
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
    const source = drawer.addShape(new Rect({ name: shapeName.rect, width: 50, height: 50, stroke: '#e03131' }));
    const other = drawer.addShape(new Rect({ name: shapeName.rect, x: 100, width: 50, height: 50, stroke: '#000' }));
    const labels = () => {
      drawer.showCommandPalette();
      const palette = drawer.commandPalette!;
      const found = [...palette.$list.querySelectorAll('.drawer-commands-label')].map(($label) => $label.textContent);

      palette.hide();
      return found;
    };

    selectWidget.setActive(true);
    selectWidget.select([source]);
    expect(labels()).toContain('Copy style');
    expect(labels()).not.toContain('Paste style');
    drawer.copyStyle();
    expect(labels()).toContain('Paste style');

    drawer.setShapesLocked(true, [other]);
    selectWidget.select([other]);
    ctrlAlt(drawer, 'v');
    expect(other.stroke()).toBe('#000');
    drawer.setShapesLocked(false, [other]);
    drawer.setReadOnly(true);
    ctrlAlt(drawer, 'v');
    expect(other.stroke()).toBe('#000');
    drawer.setReadOnly(false);
  });

  it('Eyedropper of color pickers: color picked on the screen, the color of the drawing in dark mode', async () => {
    const open = vi.fn().mockResolvedValue({ sRGBHex: '#e03131' });
    const eyeDropperWindow = window as EyeDropperWindow;

    eyeDropperWindow.EyeDropper = class {
      open = open;
    };

    const drawer = createDrawer();

    delete eyeDropperWindow.EyeDropper;

    const overlay = drawer.getWidget<BaseWidget>('brush')!.overlay as BaseOverlay;
    const $pick = overlay.strokeColorPicker.$pickButton!;

    expect($pick.getAttribute('aria-label')).toBe('Pick a color on the screen');
    $pick.click();
    await vi.waitFor(() => expect(drawer.options.strokeColor).toBe('#e03131'));

    // dark mode: the drawing is shown inverted, its color picked
    drawer.setTheme('dark');
    open.mockResolvedValue({ sRGBHex: toDarkColor('#1971c2') });
    $pick.click();
    await vi.waitFor(() => expect(drawer.options.strokeColor).not.toBe('#e03131'));
    const picked = channels(drawer.options.strokeColor);
    expect(channels('#1971c2').every((value, i) => Math.abs(value - picked[i]) <= 2)).toBe(true);
    drawer.setTheme('light');

    // cancelled: color kept
    open.mockRejectedValue(new DOMException('cancelled', 'AbortError'));
    $pick.click();
    await new Promise((resolve) => setTimeout(resolve));
    expect(drawer.options.strokeColor).toBe(fromDarkColor(toDarkColor('#1971c2')));
    // no button without the api
    expect(createDrawer().getWidget<BaseWidget>('brush')!.overlay as BaseOverlay).toMatchObject({
      strokeColorPicker: expect.objectContaining({ $pickButton: undefined }),
    });
  });

  it('Colors of dark mode taken back to the colors of the drawing (not clamped by the filter)', () => {
    for (const color of ['#000000', '#ffffff', '#1971c2', '#868e96']) {
      const back = channels(fromDarkColor(toDarkColor(color)));

      expect(channels(color).every((value, i) => Math.abs(value - back[i]) <= 2)).toBe(true);
    }
  });
});
