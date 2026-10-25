import { describe, expect, it } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import type { Drawer } from '@/Drawer';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { shapeName } from '@/constants';
import { createDrawer, keydown } from './helpers';

/** Drawer of 1000 x 800 with a rectangle 0..200 x 0..100 and a small one far from it */
const createShapes = (options = {}) => {
  const drawer = createDrawer({ width: 1000, height: 800, ...options });
  const rect = drawer.addShape(new Rect({ name: shapeName.rect, x: 0, y: 0, width: 200, height: 100 }));
  const far = drawer.addShape(new Rect({ name: shapeName.rect, x: 1800, y: 900, width: 200, height: 100 }));

  return { drawer, rect, far };
};

/** Center of the view, in drawing coordinates, rounded */
const viewCenter = (drawer: Drawer) => {
  const { x, y, width, height } = drawer.getViewArea();

  return { x: Math.round(x + width / 2), y: Math.round(y + height / 2) };
};

/** Shift + digit key (code of the key: Shift types digits on AZERTY, other characters on QWERTY) */
const shiftDigit = (drawer: Drawer, digit: number) =>
  keydown(drawer, { key: String(digit), code: `Digit${digit}`, shiftKey: true });

/** Ids of the commands of the palette now */
const commandIds = (drawer: Drawer) => {
  drawer.showCommandPalette();
  const ids = drawer.commandPalette!.commands.map(({ id }) => id);

  drawer.commandPalette!.hide();
  return ids;
};

describe('Zoom to fit, to selection and to 100 %', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Whole drawing in the view, never beyond 100 %; selection filling it, 200 % at most', () => {
    const { drawer, rect } = createShapes();

    // box 0..2000 x 0..1000 with padding (16), margin of 64 for the interface: (1000 - 128) / 2032
    drawer.zoomToFit();
    expect(drawer.getZoomLevel()).toBeCloseTo(872 / 2032);
    expect(viewCenter(drawer)).toEqual({ x: 1000, y: 500 });

    // small selection: 200 %, centered
    drawer.getWidget<SelectWidget>('selection')!.select([rect]);
    drawer.zoomToSelection();
    expect(drawer.getZoomLevel()).toBe(2);
    expect(viewCenter(drawer)).toEqual({ x: 100, y: 50 });

    // without selection: view kept
    drawer.getWidget<SelectWidget>('selection')!.clearSelection();
    drawer.zoomToSelection();
    expect(drawer.getZoomLevel()).toBe(2);
  });

  it('100 % keeps the center of the view (zoom widget and Shift + 0)', () => {
    const { drawer } = createShapes();

    drawer.zoomToFit();
    drawer.zoom!.resetZoom();
    expect(drawer.getZoomLevel()).toBe(1);
    expect(viewCenter(drawer)).toEqual({ x: 1000, y: 500 });

    drawer.setZoomLevel(3);
    shiftDigit(drawer, 0);
    expect(drawer.getZoomLevel()).toBe(1);
    expect(viewCenter(drawer)).toEqual({ x: 1000, y: 500 });
  });

  it('Shift + 1 and Shift + 2 by the place of the key, not in fields nor with the zoom option off', () => {
    const { drawer, rect } = createShapes();

    shiftDigit(drawer, 1);
    expect(drawer.getZoomLevel()).toBeCloseTo(872 / 2032);

    drawer.getWidget<SelectWidget>('selection')!.select([rect]);
    shiftDigit(drawer, 2);
    expect(drawer.getZoomLevel()).toBe(2);

    // typed in a field of the drawer
    const $input = document.createElement('input');

    drawer.$drawerContainer.append($input);
    $input.dispatchEvent(new KeyboardEvent('keydown', { key: '!', code: 'Digit1', shiftKey: true, bubbles: true }));
    expect(drawer.getZoomLevel()).toBe(2);
    $input.remove();

    const { drawer: fixed } = createShapes({ zoom: false });

    shiftDigit(fixed, 1);
    expect(fixed.getZoomLevel()).toBe(1);
  });

  it('Commands of the palette and items of the context menu when available, also in read only', () => {
    const { drawer, rect } = createShapes();
    const shown = (label: string) =>
      [...drawer.contextMenu.$menu.querySelectorAll<HTMLElement>('[role="menuitem"]')].some(
        ($item) => !$item.hidden && $item.textContent?.startsWith(label)
      );

    expect(commandIds(drawer)).toEqual(expect.arrayContaining(['zoom reset 100', 'zoom fit whole drawing all']));
    expect(commandIds(drawer)).not.toContain('zoom selection');
    drawer.contextMenu.show();
    expect(shown('Zoom to fit')).toBe(true);
    expect(shown('Zoom to selection')).toBe(false);
    drawer.contextMenu.hide();

    drawer.getWidget<SelectWidget>('selection')!.select([rect]);
    expect(commandIds(drawer)).toContain('zoom selection');
    drawer.contextMenu.show();
    expect(shown('Zoom to fit')).toBe(false);
    expect(shown('Zoom to selection')).toBe(true);
    drawer.contextMenu.hide();

    // help lists the shortcuts
    expect(drawer.help.$modalBody.textContent).toContain('Zoom to selection');

    drawer.setReadOnly(true);
    expect(commandIds(drawer)).toContain('zoom fit whole drawing all');
  });
});
