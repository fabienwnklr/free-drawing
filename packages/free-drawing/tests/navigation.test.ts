import { describe, expect, it, vi } from 'vitest';
import { Arrow } from 'konva/lib/shapes/Arrow';
import { Rect } from 'konva/lib/shapes/Rect';
import { Text } from 'konva/lib/shapes/Text';
import type { Drawer } from '@/Drawer';
import type { DrawingShape } from '@/@types/drawer';
import { shapeName } from '@/constants';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { createFrame, type Frame } from '@/utils/frame';
import { navigationOutlineName } from '@/utils/shapeNavigation';
import { createDrawer, keydown } from './helpers';

/**
 * Rectangle of the drawing
 * @param drawer Drawer of the test
 * @param x Left of the rectangle
 * @param y Top of the rectangle
 * @returns rectangle added
 */
const addRect = (drawer: Drawer, x: number, y: number) =>
  drawer.addShape(new Rect({ name: shapeName.rect, x, y, width: 100, height: 60, stroke: '#000' })) as Rect;

/** Shapes selected */
const selected = (drawer: Drawer) => drawer.getWidget<SelectWidget>('selection')!.transformer.nodes();

/** Key pressed on the drawer itself */
const press = (drawer: Drawer, key: string, shiftKey = false) => keydown(drawer, { key, shiftKey });

describe('Keyboard navigation between shapes', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Keys described to screen readers with the name of the drawer', () => {
    const drawer = createDrawer({ language: 'en' });
    const id = drawer.$drawerContainer.getAttribute('aria-describedby')!;

    expect(drawer.navigation.$description.id).toBe(id);
    expect(document.getElementById(id)!.textContent).toContain('Tab, Shift + Tab: next, previous shape');
    drawer.setLanguage('fr');
    expect(drawer.navigation.$description.textContent).toContain('Maj + Tab : forme suivante, précédente');
  });

  it('Enter reaches the first shape, Tab / Shift + Tab the next / previous one in reading order, Escape leaves them', () => {
    const drawer = createDrawer({ language: 'en' });
    // added out of reading order
    const third = addRect(drawer, 0, 200);
    const second = addRect(drawer, 300, 10);
    const first = addRect(drawer, 0, 0);
    const announce = vi.spyOn(drawer, '_announce');

    drawer.getWidget<BaseWidget>('brush')!.setActive(true);
    // nothing reached: Tab goes to the interface
    expect(press(drawer, 'Tab')).toBe(true);
    expect(selected(drawer)).toEqual([]);

    expect(press(drawer, 'Enter')).toBe(false);
    expect(drawer.activeTool).toBe('selection');
    expect(selected(drawer)).toEqual([first]);
    expect(announce).toHaveBeenLastCalledWith('Rectangle, 1 of 3');

    expect(press(drawer, 'Tab')).toBe(false);
    expect(selected(drawer)).toEqual([second]);
    press(drawer, 'Tab');
    expect(selected(drawer)).toEqual([third]);
    // around
    press(drawer, 'Tab');
    expect(selected(drawer)).toEqual([first]);
    press(drawer, 'Tab', true);
    expect(selected(drawer)).toEqual([third]);
    expect(announce).toHaveBeenLastCalledWith('Rectangle, 3 of 3');

    // keys of a button of the drawer: not the shapes
    drawer.toolbar.$keepToolButton!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(selected(drawer)).toEqual([third]);

    expect(press(drawer, 'Escape')).toBe(false);
    expect(selected(drawer)).toEqual([]);
    expect(announce).toHaveBeenLastCalledWith('No shape selected');
    expect(press(drawer, 'Escape')).toBe(true);
  });

  it('Shape out of the view: view moved to it, zoom kept', () => {
    const drawer = createDrawer();
    const far = addRect(drawer, 5000, 4000);

    drawer.setZoomLevel(1.5);
    press(drawer, 'Enter');
    expect(selected(drawer)).toEqual([far]);

    const view = drawer.getViewArea();

    expect(drawer.getZoomLevel()).toBe(1.5);
    expect(view.x).toBeLessThan(5000);
    expect(view.x + view.width).toBeGreaterThan(5100);
    expect(view.y).toBeLessThan(4000);
  });

  it('Description: name, text of the shape (not reached alone), shapes linked by an arrow, link, locked', () => {
    const drawer = createDrawer({ language: 'en' });
    const start = addRect(drawer, 0, 0);
    const end = addRect(drawer, 400, 0);
    const arrow = drawer.addShape(
      new Arrow({ name: shapeName.arrow, points: [100, 30, 400, 30], startBinding: start.id(), endBinding: end.id() })
    ) as Arrow;
    const label = drawer.addShape(
      new Text({ name: shapeName.text, text: 'Start\nhere', containerId: start.id() })
    ) as Text;

    drawer.setShapeLabel(end, 'Goal');
    drawer.setShapeLink('https://example.com', [end]);
    drawer.setShapesLocked(true, [arrow]);

    const { navigation } = drawer;

    expect(navigation.getShapes()).not.toContain(label);
    expect(navigation.describe(start)).toBe('Rectangle, text: Start, here, 1 of 3');
    expect(navigation.describe(end)).toBe('Goal, Rectangle, link: https://example.com/, 3 of 3');
    expect(navigation.describe(arrow)).toBe('Arrow, from Start, to Goal, locked, 2 of 3');

    drawer.setLanguage('fr');
    expect(navigation.describe(arrow)).toBe('Flèche, depuis Start, vers Goal, verrouillé, 2 sur 3');
  });

  it('Enter reaches the shapes of a group or frame, Shift + Enter their group or frame', () => {
    const drawer = createDrawer({ language: 'en' });
    const frame = drawer.addShape(createFrame({ x: 0, y: 0, width: 400, height: 300, label: 'Plan' })) as Frame;
    const inFrame = addRect(drawer, 200, 100);
    const a = addRect(drawer, 600, 0);
    const b = addRect(drawer, 800, 0);
    const announce = vi.spyOn(drawer, '_announce');

    drawer.placeInFrames([inFrame]);
    const group = drawer.groupShapes([a, b])!;

    expect(drawer.navigation.getShapes()).toEqual([frame, group]);
    expect(drawer.navigation.describe(frame)).toBe('Plan, Frame, shapes inside: 1, 1 of 2');
    // group selected once created
    press(drawer, 'Escape');

    press(drawer, 'Enter');
    expect(selected(drawer)).toEqual([frame]);
    press(drawer, 'Enter');
    expect(selected(drawer)).toEqual([inFrame]);
    expect(announce).toHaveBeenLastCalledWith('Rectangle, in Plan, 1 of 1');
    press(drawer, 'Enter', true);
    expect(selected(drawer)).toEqual([frame]);

    press(drawer, 'Tab');
    expect(selected(drawer)).toEqual([group]);
    press(drawer, 'Enter');
    expect(selected(drawer)).toEqual([a]);
    press(drawer, 'Tab');
    expect(selected(drawer)).toEqual([b]);
    expect(announce).toHaveBeenLastCalledWith('Rectangle, in Group, 2 of 2');
    press(drawer, 'Enter', true);
    expect(selected(drawer)).toEqual([group]);
    // shape of the drawing: no parent to reach, nothing done
    expect(press(drawer, 'Enter', true)).toBe(true);
  });

  it('Enter edits the text of a shape reached (as a double click), the shape selected again', () => {
    const drawer = createDrawer();
    const rect = addRect(drawer, 0, 0);

    press(drawer, 'Enter');
    expect(press(drawer, 'Enter')).toBe(false);

    const textarea = drawer.$drawerContainer.querySelector('textarea')!;

    expect(textarea).not.toBeNull();
    // left empty: text removed, its shape selected again
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(drawer.$drawerContainer.querySelector('textarea')).toBeNull();
    expect(selected(drawer)).toEqual([rect]);
    expect(drawer.getDrawingShapes()).toEqual([rect]);
  });

  it('Read only: shape reached outlined (no selection), outline removed by Escape and once editable again', () => {
    const drawer = createDrawer({ readOnly: true, language: 'en' });
    const first = addRect(drawer, 0, 0);
    const second = addRect(drawer, 300, 0);
    const outline = () => drawer.selectionLayer.findOne(`.${navigationOutlineName}`);

    press(drawer, 'Enter');
    expect(drawer.navigation.current).toBe(first);
    expect(selected(drawer)).toEqual([]);
    expect(outline()!.x()).toBeLessThan(0);
    press(drawer, 'Tab');
    expect(drawer.navigation.current).toBe(second);
    expect(outline()!.x()).toBeGreaterThan(290);

    // its shape removed by another user
    second.destroy();
    drawer.stage.fire('change');
    expect(outline()).toBeUndefined();
    expect(drawer.navigation.current).toBeNull();

    press(drawer, 'Enter');
    expect(outline()).toBeDefined();
    press(drawer, 'Escape');
    expect(outline()).toBeUndefined();

    press(drawer, 'Enter');
    drawer.setReadOnly(false);
    expect(outline()).toBeUndefined();
    expect(drawer.navigation.current as DrawingShape | null).toBeNull();
  });
});
