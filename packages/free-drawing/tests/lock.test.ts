import { afterEach, describe, expect, it } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import type { Drawer } from '@/Drawer';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { CommandPalette } from '@/components/CommandPalette/CommandPalette';
import { shapeName } from '@/constants';
import { createDrawer, fireMouse, keydown, setPointer } from './helpers';

/** Drawer with selection tool, a big locked rectangle and a small one on it */
const createLocked = () => {
  const drawer = createDrawer({ language: 'en' });
  const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
  const locked = drawer.addShape(
    new Rect({ name: shapeName.rect, x: 0, y: 0, width: 300, height: 200, stroke: '#000', fill: '#eee' })
  );
  const small = drawer.addShape(
    new Rect({ name: shapeName.rect, x: 20, y: 20, width: 50, height: 50, stroke: '#000' })
  );

  drawer.setShapesLocked(true, [locked]);
  selectWidget.setActive(true);

  return { drawer, selectWidget, locked, small };
};

/** Click on stage (konva hit not available in jsdom: shapes found by their box) */
const click = (drawer: Drawer, x: number, y: number, evt: Partial<MouseEvent> = {}) => {
  fireMouse(drawer, 'mousedown', x, y, evt);
  fireMouse(drawer, 'mouseup', x, y, evt);
};

const palettes = new Set<CommandPalette>();

describe('Locked shapes', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  afterEach(() => palettes.forEach((palette) => palette.hide()));

  it('Click selects a locked shape alone, without anchors: not moved nor modified', () => {
    const { drawer, selectWidget, locked } = createLocked();
    const { transformer } = selectWidget;

    click(drawer, 200, 150);
    expect(drawer.getSelectedShapes()).toEqual([locked]);
    expect(selectWidget.isLocked()).toBe(true);
    // still locked after hit test
    expect(locked.listening()).toBe(false);
    expect(transformer.enabledAnchors()).toEqual([]);
    expect(transformer.rotateEnabled()).toBe(false);
    expect(transformer.borderDash()).toEqual([4, 4]);
    expect(transformer.padding()).toBe(4);
    expect(selectWidget.overlay.$overlayContainer.classList.contains('show')).toBe(false);

    // shortcuts and options modifying selection do nothing
    keydown(drawer, { key: 'Delete' });
    keydown(drawer, { key: 'ArrowRight' });
    keydown(drawer, { key: 'H', code: 'KeyH', shiftKey: true });
    keydown(drawer, { key: 'd', ctrlKey: true });
    keydown(drawer, { key: 'ArrowUp', ctrlKey: true });
    drawer.setStrokeColor('#f00');
    expect(drawer.getDrawingShapes()).toHaveLength(2);
    expect(drawer.getDrawingShapes()[0]).toBe(locked);
    expect([locked.x(), locked.scaleX(), locked.stroke()]).toEqual([0, 1, '#000']);

    // Ctrl + Shift + L unlocks it, still selected with anchors
    keydown(drawer, { key: 'L', code: 'KeyL', ctrlKey: true, shiftKey: true });
    expect(locked.listening()).toBe(true);
    expect(drawer.getSelectedShapes()).toEqual([locked]);
    expect(selectWidget.isLocked()).toBe(false);
    expect(transformer.enabledAnchors()).toHaveLength(8);
    expect(transformer.rotateEnabled()).toBe(true);
    expect(transformer.borderDash()).toEqual([]);
    expect(transformer.padding()).toBe(0);

    // locked again, still selected
    keydown(drawer, { key: 'L', code: 'KeyL', ctrlKey: true, shiftKey: true });
    expect(locked.listening()).toBe(false);
    expect(drawer.getSelectedShapes()).toEqual([locked]);
    expect(selectWidget.isLocked()).toBe(true);

    // press in its box: not dragged, selection rectangle
    fireMouse(drawer, 'mousedown', 200, 150);
    expect(selectWidget.inAction).toBe(true);
    fireMouse(drawer, 'mouseup', 200, 150);
  });

  it('Locked shapes come after other shapes, never selected with them', () => {
    const { drawer, selectWidget, locked, small } = createLocked();

    // in small rectangle: small one, Alt cycles to locked one behind
    click(drawer, 40, 40);
    expect(drawer.getSelectedShapes()).toEqual([small]);
    click(drawer, 40, 40, { altKey: true });
    expect(drawer.getSelectedShapes()).toEqual([locked]);

    // Shift + click does not add it to other shapes
    selectWidget.select([small]);
    click(drawer, 200, 150, { shiftKey: true });
    expect(drawer.getSelectedShapes()).toEqual([small]);
    selectWidget.select([small, locked]);
    expect(drawer.getSelectedShapes()).toEqual([small]);

    // select all: unlocked shapes, locked ones when all are
    selectWidget.selectAll();
    expect(drawer.getSelectedShapes()).toEqual([small]);
    drawer.setShapesLocked(true, [small]);
    // locked while selected alone: still selected
    expect(drawer.getSelectedShapes()).toEqual([small]);
    selectWidget.selectAll();
    expect(drawer.getSelectedShapes()).toEqual([locked, small]);
    expect(drawer.setShapesLocked(false)).toBe(true);
    expect(selectWidget.isLocked()).toBe(false);
    expect(drawer.getSelectedShapes()).toEqual([locked, small]);

    // click out of shapes clears selection
    click(drawer, 500, 400);
    expect(drawer.getSelectedShapes()).toEqual([]);
  });

  it('Shape of a locked group selects the group', () => {
    const { drawer, selectWidget, small } = createLocked();
    const other = drawer.addShape(
      new Rect({ name: shapeName.rect, x: 400, y: 20, width: 50, height: 50, stroke: '#000' })
    );
    const group = drawer.groupShapes([small, other])!;

    drawer.setShapesLocked(true, [group]);
    expect(drawer.getSelectedShapes()).toEqual([group]);
    selectWidget.select([other]);
    expect(drawer.getSelectedShapes()).toEqual([group]);
    // Ctrl + click on a shape of the group
    selectWidget.clearSelection();
    click(drawer, 420, 40, { ctrlKey: true });
    expect(drawer.getSelectedShapes()).toEqual([group]);
  });

  it('Unlock from selection menu, context menu and command palette', () => {
    const { drawer, selectWidget, locked } = createLocked();
    const menu = drawer.selectionMenu!;
    const contextItems = () =>
      [...drawer.contextMenu.$menu.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([hidden])')].map(
        ($item) => $item.querySelector('.drawer-context-menu-item__label')!.textContent
      );

    // selection menu: unlock only
    selectWidget.select([locked]);
    menu.update();
    const shown = () => [...menu.$menu.querySelectorAll<HTMLElement>('button:not([hidden])')];
    expect(shown()).toEqual([menu.$unlockBtn]);
    expect(menu.$unlockBtn.getAttribute('aria-label')).toBe('Unlock');
    expect(menu.$separator.hidden).toBe(true);
    menu.$unlockBtn.click();
    expect(locked.listening()).toBe(true);
    menu.update();
    expect(menu.$unlockBtn.hidden).toBe(true);
    expect(menu.$deleteBtn.hidden).toBe(false);

    // context menu: right click selects it, unlock and copy
    drawer.setShapesLocked(true, [locked]);
    selectWidget.clearSelection();
    setPointer(drawer, 200, 150);
    drawer.stage.fire('contextmenu', { evt: { clientX: 200, clientY: 150, preventDefault() {} } });
    expect(drawer.getSelectedShapes()).toEqual([locked]);
    expect(contextItems()).toEqual(['Unlock', 'Copy as PNG', 'Copy as SVG', 'Select all']);
    [...drawer.contextMenu.$menu.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([hidden])')][0].click();
    expect(locked.listening()).toBe(true);

    // command palette
    drawer.setShapesLocked(true, [locked]);
    drawer.showCommandPalette();
    const palette = drawer.commandPalette!;

    palettes.add(palette);
    const commands = [...palette.$list.querySelectorAll<HTMLElement>('[role="option"]')].map(
      ($option) => $option.querySelector('.drawer-commands-label')!.textContent
    );
    expect(commands).toContain('Unlock');
    expect(commands).not.toContain('Lock');
    expect(commands).not.toContain('Delete');
    expect(commands).not.toContain('Duplicate');
  });
});
