import { describe, expect, it } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import type { Drawer } from '@/Drawer';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import { createDrawer, keydown } from './helpers';

const addRect = (drawer: Drawer, x = 10, y = 10) =>
  drawer.addShape(new Rect({ x, y, width: 50, height: 50, fill: '#a5d8ff', stroke: '#000', strokeWidth: 5 }));

const ids = (drawer: Drawer) => drawer.getDrawingShapes().map((shape) => shape.id());

const select = (drawer: Drawer, shapes: Rect[]) => {
  drawer.getWidget<SelectWidget>('selection')!.select(shapes);
  drawer.selectionMenu!.update();
};

describe('Selection menu', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Menu of actions is shown next to selected shapes, hidden without selection', () => {
    const drawer = createDrawer();
    const menu = drawer.selectionMenu!;
    const rect = addRect(drawer);

    expect(menu.$menu.getAttribute('role')).toBe('toolbar');
    expect(menu.$menu.getAttribute('aria-label')).toBe('Selection actions');
    expect([...menu.$menu.querySelectorAll('button')].map(($btn) => $btn.getAttribute('aria-label'))).toEqual([
      'Unlock',
      'Duplicate',
      'Group',
      'Ungroup',
      'Rotate 90° left',
      'Rotate 90° right',
      'Fit width to text',
      'Send backward',
      'Bring forward',
      'Lock',
      'Delete',
    ]);
    expect(menu.$duplicateBtn.title).toBe('Duplicate (Ctrl+D)');
    expect(menu.$forwardBtn.getAttribute('aria-keyshortcuts')).toBe('Control+ArrowUp');
    expect(menu.isVisible()).toBe(false);

    // updated when selection layer is drawn (selection changed or moved)
    drawer.getWidget<SelectWidget>('selection')!.select([rect]);
    drawer.selectionLayer.draw();
    expect(menu.isVisible()).toBe(true);
    // under selection
    expect(parseFloat(menu.$menu.style.top)).toBeGreaterThan(rect.getClientRect().y + rect.getClientRect().height);

    drawer.getWidget<SelectWidget>('selection')!.clearSelection();
    drawer.selectionLayer.draw();
    expect(menu.isVisible()).toBe(false);

    // out of view
    select(drawer, [addRect(drawer, 5000, 5000)]);
    expect(menu.isVisible()).toBe(false);
  });

  it('Menu does not cover transformer: rotation anchor wherever rotation puts it, resize anchors', () => {
    const drawer = createDrawer();
    const menu = drawer.selectionMenu!;
    const transformer = drawer.getWidget<SelectWidget>('selection')!.transformer;
    // jsdom has no layout
    Object.defineProperties(menu.$menu, { offsetWidth: { value: 150 }, offsetHeight: { value: 40 } });
    const place = () => {
      const left = parseFloat(menu.$menu.style.left);
      const top = parseFloat(menu.$menu.style.top);

      return { x: left, y: top, width: 150, height: 40 };
    };
    const overlaps = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
      a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

    // rotated: rotation anchor below shape, menu under it
    const rotated = addRect(drawer, 300, 300);

    rotated.rotation(180);
    select(drawer, [rotated]);

    const rotater = transformer.findOne('.rotater')!.getClientRect();

    expect(rotater.y).toBeGreaterThan(rotated.getClientRect().y + rotated.getClientRect().height);
    expect(overlaps(place(), rotater)).toBe(false);
    expect(overlaps(place(), transformer.getClientRect())).toBe(false);
    expect(place().y).toBeGreaterThan(rotater.y + rotater.height);

    // near bottom: above rotation anchor, with margin
    const low = addRect(drawer, 300, drawer.stage.height() - drawer.$footerContainer.offsetHeight - 60);

    select(drawer, [low]);
    expect(place().y + 40 + 12).toBeLessThanOrEqual(transformer.findOne('.rotater')!.getClientRect().y);
  });

  it('Duplicate copies selected shapes a little further, copies are selected', () => {
    const drawer = createDrawer();
    const first = addRect(drawer);
    const second = addRect(drawer, 100, 100);

    select(drawer, [second, first]);
    drawer.selectionMenu!.$duplicateBtn.click();

    const copies = drawer.getSelectedShapes();
    expect(drawer.getDrawingShapes().length).toBe(4);
    // on top, in stacking order of originals, with new ids
    expect(ids(drawer).slice(2)).toEqual(copies.map((copy) => copy.id()));
    expect(copies.map((copy) => copy.position())).toEqual([
      { x: 30, y: 30 },
      { x: 120, y: 120 },
    ]);
    expect(copies[0].id()).not.toBe(first.id());
    expect((copies[0] as Rect).fill()).toBe('#a5d8ff');
    expect(first.position()).toEqual({ x: 10, y: 10 });

    // same offset on screen
    drawer.setZoomLevel(2);
    const [copy] = drawer.duplicateShapes([first]);
    expect(copy.position()).toEqual({ x: 20, y: 20 });

    drawer.undoRedo.undo();
    expect(drawer.getDrawingShapes().length).toBe(4);
  });

  it('Ctrl+D duplicates selection, browser shortcut kept without selection', () => {
    const drawer = createDrawer();
    const rect = addRect(drawer);

    expect(keydown(drawer, { key: 'd', ctrlKey: true })).toBe(true);
    expect(drawer.getDrawingShapes().length).toBe(1);

    select(drawer, [rect]);
    expect(keydown(drawer, { key: 'd', ctrlKey: true })).toBe(false);
    expect(drawer.getDrawingShapes().length).toBe(2);
    expect(drawer.getSelectedShapes()).not.toContain(rect);
  });

  it('Delete removes selected shapes, focus back on drawer', () => {
    const drawer = createDrawer();
    const menu = drawer.selectionMenu!;
    const rect = addRect(drawer);

    // history state
    drawer.stage.fire('change');
    select(drawer, [rect]);
    menu.$deleteBtn.focus();
    menu.$deleteBtn.click();
    menu.update();

    expect(drawer.getDrawingShapes()).toEqual([]);
    expect(drawer.getSelectedShapes()).toEqual([]);
    expect(menu.isVisible()).toBe(false);
    expect(document.activeElement).toBe(drawer.$drawerContainer);

    drawer.undoRedo.undo();
    expect(ids(drawer)).toEqual([rect.id()]);

    // other selected shapes stay selected
    const [restored] = drawer.getDrawingShapes() as Rect[];
    const other = addRect(drawer, 100, 100);
    select(drawer, [restored, other]);
    expect(drawer.deleteShapes([restored])).toBe(true);
    expect(drawer.getSelectedShapes()).toEqual([other]);
    expect(drawer.deleteShapes([restored])).toBe(false);
  });

  it('Bring forward and send backward move selection past overlapping shapes', () => {
    const drawer = createDrawer();
    const rect = addRect(drawer);
    const above = addRect(drawer, 20, 20);

    select(drawer, [rect]);
    drawer.selectionMenu!.$forwardBtn.click();
    expect(ids(drawer)).toEqual([above.id(), rect.id()]);
    drawer.selectionMenu!.$backwardBtn.click();
    expect(ids(drawer)).toEqual([rect.id(), above.id()]);
  });

  it('Hidden while text is edited, in read only mode, or without option', () => {
    const drawer = createDrawer();
    const menu = drawer.selectionMenu!;
    const textWidget = drawer.getWidget<TextWidget>('text')!;
    const text = textWidget.addTextNode('hello');

    drawer.getWidget<SelectWidget>('selection')!.select([text]);
    menu.update();
    expect(menu.isVisible()).toBe(true);

    textWidget.editTextNode(text);
    menu.update();
    expect(menu.isVisible()).toBe(false);
    // validated
    drawer.$drawerContainer
      .querySelector('textarea')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter' }));
    menu.update();
    expect(menu.isVisible()).toBe(true);
    drawer.setReadOnly(true);
    expect(menu.isVisible()).toBe(false);

    const withoutMenu = createDrawer({ selectionMenu: false });
    expect(withoutMenu.selectionMenu).toBeUndefined();
    expect(withoutMenu.$drawerContainer.querySelector('.drawer-selection-menu')).toBeNull();
  });
});
