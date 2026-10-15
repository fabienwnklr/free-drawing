import { describe, expect, it } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import { Text } from 'konva/lib/shapes/Text';
import type { Drawer } from '@/Drawer';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { createFrame, getFrameTitle } from '@/utils/frame';
import { createDrawer, keydown } from './helpers';

// jsdom canvas mock measures one pixel per character
const addText = (drawer: Drawer, text: string, attrs = {}) =>
  drawer.addShape(new Text({ x: 100, y: 100, text, width: 50, fontSize: 16, ...attrs })) as Text;

const select = (drawer: Drawer, shapes: (Text | Rect)[]) => {
  drawer.getWidget<SelectWidget>('selection')!.select(shapes);
  drawer.selectionMenu!.update();
};

describe('Fit width of texts', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Width of selected texts fitted to their longest line, change saved once', () => {
    const drawer = createDrawer();
    const text = addText(drawer, 'hello\nhi');
    // wrapped in its box
    const wrapped = addText(drawer, 'hello world', { width: 8 });

    expect(wrapped.textArr).toHaveLength(2);
    drawer.stage.fire('change');
    select(drawer, [text, wrapped]);
    const changes = drawer.undoRedo.appHistory.length;

    expect(drawer.fitTextWidth()).toBe(true);
    expect([text.width(), wrapped.width()]).toEqual([5, 11]);
    expect(wrapped.textArr).toHaveLength(1);
    // left aligned: not moved
    expect(text.position()).toEqual({ x: 100, y: 100 });
    expect(drawer.undoRedo.appHistory.length).toBe(changes + 1);

    // already fitted
    expect(drawer.fitTextWidth()).toBe(false);
    expect(drawer.undoRedo.appHistory.length).toBe(changes + 1);

    drawer.undoRedo.undo();
    expect(drawer.getDrawingShapes().map((shape) => shape.width())).toEqual([50, 8]);
  });

  it('Centered and right aligned lines stay in place, also rotated or scaled', () => {
    const drawer = createDrawer();
    const center = addText(drawer, 'abc', { align: 'center' });
    const right = addText(drawer, 'abc', { align: 'right' });
    const rotated = addText(drawer, 'abc', { align: 'right', rotation: 90 });
    const scaled = addText(drawer, 'abc', { align: 'right', scaleX: 2, scaleY: 2 });

    drawer.fitTextWidth([center, right, rotated, scaled]);
    expect(center.position()).toEqual({ x: 123.5, y: 100 });
    expect(right.position()).toEqual({ x: 147, y: 100 });
    expect(rotated.x()).toBeCloseTo(100);
    expect(rotated.y()).toBeCloseTo(147);
    expect(scaled.position()).toEqual({ x: 194, y: 100 });
    expect([center, right, rotated, scaled].map((text) => text.width())).toEqual([3, 3, 3, 3]);
  });

  it('Texts of groups too, not other shapes nor titles of frames', () => {
    const drawer = createDrawer();
    const text = addText(drawer, 'abc');
    const rect = drawer.addShape(new Rect({ x: 0, y: 0, width: 50, height: 50 })) as Rect;

    drawer.getWidget<SelectWidget>('selection')!.select([text, rect]);
    const group = drawer.groupShapes()!;

    expect(drawer.fitTextWidth([group])).toBe(true);
    expect([text.width(), rect.width()]).toEqual([3, 50]);

    const frame = createFrame({ x: 300, y: 300, width: 200, height: 200, label: 'Frame' });

    drawer.addShape(frame);
    const title = getFrameTitle(frame);
    const width = title.width();

    expect(drawer.fitTextWidth([frame])).toBe(false);
    expect(title.width()).toBe(width);
  });

  it('Selection menu, context menu, command palette and Shift+W for texts only, not locked ones', () => {
    const drawer = createDrawer({ language: 'en' });
    const menu = drawer.selectionMenu!;
    const text = addText(drawer, 'abc');
    const rect = drawer.addShape(new Rect({ x: 0, y: 0, width: 50, height: 50 })) as Rect;
    const fitItem = () =>
      [...drawer.contextMenu.$menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')].find(
        ($item) => $item.textContent === 'Fit width to textShift+W'
      )!;
    const command = () => {
      drawer.showCommandPalette();
      const found = drawer.commandPalette!.commands.find(({ id }) => id.startsWith('fit text width'));

      drawer.commandPalette!.hide();
      return found;
    };

    select(drawer, [rect]);
    expect(menu.$fitWidthBtn.hidden).toBe(true);
    drawer.contextMenu.show();
    expect(fitItem().hidden).toBe(true);
    drawer.contextMenu.hide();
    expect(command()).toBeUndefined();

    select(drawer, [text]);
    expect(menu.$fitWidthBtn.hidden).toBe(false);
    expect(menu.$fitWidthBtn.title).toBe('Fit width to text (Shift+W)');
    drawer.contextMenu.show();
    expect(fitItem().hidden).toBe(false);
    drawer.contextMenu.hide();
    expect(command()).toMatchObject({ label: 'Fit width to text', shortcut: 'Shift+W' });
    expect(drawer.help.$modal.textContent).toContain('Fit width to text');

    menu.$fitWidthBtn.click();
    expect(text.width()).toBe(3);

    text.width(50);
    keydown(drawer, { key: 'W', code: 'KeyW', shiftKey: true });
    expect(text.width()).toBe(3);

    // locked: only unlocked
    text.width(50);
    drawer.setShapesLocked(true, [text]);
    select(drawer, [text]);
    expect(menu.$fitWidthBtn.hidden).toBe(true);
    keydown(drawer, { key: 'W', code: 'KeyW', shiftKey: true });
    expect(text.width()).toBe(50);
    expect(command()).toBeUndefined();
  });
});
