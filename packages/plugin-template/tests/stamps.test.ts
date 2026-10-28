// Tests of a plugin: a drawer in jsdom (canvas mocked by the setup file), events fired on its stage and container
import { describe, expect, it, vi } from 'vitest';
import type { Ellipse } from 'konva/lib/shapes/Ellipse';
import { Drawer, shapeName, type BaseWidget, type DrawerOptions, type SelectWidget } from '@fabwcie/free-drawing';
import { StampCounterPlugin, StampsPlugin, stampName } from '../src';

document.body.innerHTML = `<div id="drawer"></div>`;

/**
 * Drawer of a test: nothing saved, nothing read from other tests
 * @param options options of the drawer
 * @returns the drawer
 */
const createDrawer = (options: Partial<DrawerOptions> = {}) =>
  new Drawer(document.getElementById('drawer') as HTMLDivElement, {
    language: 'en',
    autoSave: false,
    localStorageKey: `stamps-${Math.random()}`,
    ...options,
  });

/**
 * Pointer event on the stage, pointer at a point of the view
 * @param drawer drawer of the test
 * @param type konva event (`mousedown`, `mousemove`, `mouseup`)
 * @param x left of the pointer in the view
 * @param y top of the pointer in the view
 * @param evt fields of the DOM event (`shiftKey`...)
 */
const pointer = (drawer: Drawer, type: string, x: number, y: number, evt: Partial<MouseEvent> = {}) => {
  drawer.stage.setPointersPositions(new MouseEvent('mousemove', { clientX: x, clientY: y }));
  drawer.stage.fire(type, { evt: { button: 0, preventDefault() {}, ...evt } });
};

/**
 * Key pressed in the drawer
 * @param drawer drawer of the test
 * @param init key and modifiers
 */
const key = (drawer: Drawer, init: KeyboardEventInit) =>
  drawer.$drawerContainer.dispatchEvent(new KeyboardEvent('keydown', { cancelable: true, ...init }));

/**
 * Shown items of the context menu
 * @param drawer drawer of the test
 * @returns texts of the items (label and shortcut)
 */
const menuItems = (drawer: Drawer) => {
  drawer.contextMenu.show();

  const items = [...drawer.contextMenu.$menu.querySelectorAll('[role^="menuitem"]:not([hidden])')].map(
    ($item) => $item.textContent
  );

  drawer.contextMenu.hide();

  return items;
};

describe('Stamps plugin (template)', () => {
  it('Tools at the end of the toolbar, translated, activated by their shortcut', async () => {
    const drawer = createDrawer({ language: 'fr', plugins: [StampsPlugin] });

    await drawer.ready;
    expect([...drawer.toolbar.widgets.keys()].slice(-2)).toEqual(['stamp', 'zone']);
    expect(drawer.getWidget<BaseWidget>('stamp')!.$button.getAttribute('aria-label')).toBe('Tampon');
    key(drawer, { key: 'p' });
    expect(drawer.activeTool).toBe('stamp');
    key(drawer, { key: 'z' });
    expect(drawer.activeTool).toBe('zone');
  });

  it('Stamp tool: pressed stamp follows the pointer (Shift: on an axis), saved once released', async () => {
    const drawer = createDrawer({ plugins: [StampsPlugin], keepTool: false });
    const stamps = drawer.plugins.get(StampsPlugin)!;

    await drawer.ready;
    drawer.getWidget<BaseWidget>('stamp')!.setActive(true);
    pointer(drawer, 'mousedown', 100, 100);
    pointer(drawer, 'mousemove', 160, 120, { shiftKey: true });
    expect(drawer.getDrawingShapes()).toHaveLength(1);
    expect(drawer.undoRedo.canUndo()).toBe(false);
    pointer(drawer, 'mouseup', 160, 120);

    const [stamp] = stamps.getStamps();

    // horizontal of the press
    expect(stamp.position()).toEqual({ x: 160, y: 100 });
    // a group of library shapes: saved in the drawing file, undone
    expect(drawer.getDrawingFile().shapes[0].children!.map((child) => child.className)).toEqual(['Ellipse', 'Text']);
    expect(drawer.undoRedo.canUndo()).toBe(true);
    // selection tool back (keepTool off)
    expect(drawer.activeTool).toBe('selection');
  });

  it('Stamp tool: stamp being placed removed when the action is cancelled (second finger: pinch zoom)', async () => {
    const drawer = createDrawer({ plugins: [StampsPlugin] });
    const stamp = drawer.getWidget<BaseWidget>('stamp')!;

    await drawer.ready;
    stamp.setActive(true);
    pointer(drawer, 'mousedown', 100, 100);
    pointer(drawer, 'mousemove', 160, 120);
    stamp.cancelAction();
    expect(drawer.getDrawingShapes()).toHaveLength(0);
    expect(drawer._duringAction()).toBe(false);
    pointer(drawer, 'mouseup', 160, 120);
    expect(drawer.getDrawingShapes()).toHaveLength(0);
    expect(drawer.undoRedo.canUndo()).toBe(false);
  });

  it('Zone tool: shape drawn in the dragged box, named in the layers panel', async () => {
    const drawer = createDrawer({ plugins: [StampsPlugin] });

    await drawer.ready;
    drawer.getWidget<BaseWidget>('zone')!.setActive(true);
    pointer(drawer, 'mousedown', 50, 50);
    pointer(drawer, 'mousemove', 250, 150);
    pointer(drawer, 'mouseup', 250, 150);

    const [zone] = drawer.getDrawingShapes();

    expect([zone.x(), zone.y(), zone.width(), zone.height(), zone.attrs.label]).toEqual([50, 50, 200, 100, 'Zone']);
    expect(zone.hasName('zone')).toBe(true);
  });

  it('Commands: palette, shortcut, context menus; count also in read only', async () => {
    const drawer = createDrawer({ plugins: [StampsPlugin] });
    const stamps = drawer.plugins.get(StampsPlugin)!;
    const toast = vi.spyOn(drawer, 'toast');

    await drawer.ready;
    expect(menuItems(drawer)).toEqual(expect.arrayContaining(['Stamp in the middleAlt+P', 'Count stamps']));

    // Alt changes the character: key by its place
    key(drawer, { key: 'π', code: 'KeyP', altKey: true });
    expect(stamps.getStamps()).toHaveLength(1);

    drawer.showCommandPalette();
    expect(drawer.commandPalette!.commands.map((command) => command.label)).toEqual(
      expect.arrayContaining(['Stamp in the middle', 'Select all stamps', 'Count stamps'])
    );
    drawer.commandPalette!.hide();

    // selected stamps: removed from the context menu of the selection
    drawer.getWidget<SelectWidget>('selection')!.select(stamps.getStamps());
    expect(menuItems(drawer)).toContain('Remove selected stamps');

    // read only: stamping unavailable, counting available
    drawer.setReadOnly(true);
    key(drawer, { key: 'π', code: 'KeyP', altKey: true });
    expect(stamps.getStamps()).toHaveLength(1);
    expect(menuItems(drawer)).toEqual(expect.arrayContaining(['Count stamps']));
    expect(menuItems(drawer)).not.toContain('Stamp in the middleAlt+P');
    expect(toast).not.toHaveBeenCalled();
    toast.mockRestore();
  });

  it('Options of the app: limit of stamps disables the plugin and its tools until stamps are removed', async () => {
    const drawer = createDrawer({ plugins: [[StampsPlugin, { max: 2, symbols: ['A'] }]] });
    const stamps = drawer.plugins.get(StampsPlugin)!;
    const toast = vi.spyOn(drawer, 'toast');

    await drawer.ready;
    expect(stamps.options).toEqual(expect.objectContaining({ max: 2, symbols: ['A'], size: 48 }));
    stamps.stamp({ x: 0, y: 0 });
    stamps.stamp({ x: 100, y: 0 });
    expect(toast).toHaveBeenCalledWith('Limit of 2 stamps reached: remove some to stamp again', 'warning');
    expect([stamps.isEnabled, drawer.getWidget<BaseWidget>('stamp')!.isDisabled]).toEqual([false, true]);
    expect(stamps.stamp({ x: 200, y: 0 })).toBe(null);

    // counting does not modify the drawing: still available
    expect(drawer.plugins.commands.filter((c) => drawer.plugins._isAvailable(c)).map((c) => c.command.id)).toEqual([
      'stamps select all',
      'stamps count number',
    ]);
    drawer.deleteShapes([stamps.getStamps()[0]]);
    expect([stamps.isEnabled, drawer.getWidget<BaseWidget>('stamp')!.isDisabled]).toEqual([true, false]);
    toast.mockRestore();
  });

  it('Double click on the circle of a stamp gives its next color', async () => {
    const drawer = createDrawer({ plugins: [StampsPlugin] });
    const stamps = drawer.plugins.get(StampsPlugin)!;

    await drawer.ready;

    const circle = stamps.stamp({ x: 0, y: 0 })!.findOne<Ellipse>(`.${shapeName.ellipse}`)!;

    circle.fire('dblclick', {}, true);
    expect(circle.fill()).toBe(stamps.options.colors[1]);
    expect(circle.findAncestor(`.${stampName}`)).toBeTruthy();
  });

  it('Counter plugin: requires the stamps plugin (added), button of the header, removed when destroyed', async () => {
    const drawer = createDrawer({ plugins: [StampCounterPlugin] });

    await drawer.ready;

    const counter = drawer.plugins.get(StampCounterPlugin)!;

    expect([...drawer.plugins].map((plugin) => plugin.name)).toEqual(['Stamps', 'StampCounter']);
    expect(drawer.layout.$header.contains(counter.$button)).toBe(true);
    drawer.plugins.get(StampsPlugin)!.stamp({ x: 0, y: 0 });
    expect([counter.$count.textContent, counter.$button.getAttribute('aria-label')]).toEqual(['1', 'Stamps: 1']);
    drawer.setLanguage('de');
    expect(counter.$button.getAttribute('aria-label')).toBe('Stempel: 1');

    await drawer.plugins.destroy();
    expect(counter.$button.isConnected).toBe(false);
    drawer.plugins.get(StampsPlugin)!.stamp({ x: 50, y: 0 });
    expect(counter.$count.textContent).toBe('1');
  });
});
