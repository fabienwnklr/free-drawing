import { describe, expect, it, vi } from 'vitest';
import type { Drawer } from '@/Drawer';
import type { BrushWidget } from '@/components/toolbar/widgets/Brush/Brush';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import { createDrawer, fireMouse, keydown, setPointer } from './helpers';

/**
 * Wheel event on the canvas, at the pointer
 * @param drawer Drawer of the test
 * @param init Delta and modifier keys
 * @returns true when its default was prevented
 */
const wheel = (drawer: Drawer, init: WheelEventInit) => {
  const evt = new WheelEvent('wheel', { cancelable: true, ...init });

  setPointer(drawer, 400, 300);
  drawer.stage.fire('wheel', { evt });

  return evt.defaultPrevented;
};

/**
 * Ctrl key pressed or released in the page
 * @param type keydown or keyup
 */
const control = (type: 'keydown' | 'keyup') => window.dispatchEvent(new KeyboardEvent(type, { key: 'Control' }));

describe('Mouse wheel and Space', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Wheel zooms around the pointer, Ctrl + wheel moves the view up and down, Shift + wheel left and right', () => {
    const drawer = createDrawer();

    expect(drawer.options.wheelAction).toBe('zoom');
    // a notch of a mouse wheel: one step of the scaling option, page not scrolled
    expect(wheel(drawer, { deltaY: -100 })).toBe(true);
    expect(drawer.getZoomLevel()).toBeCloseTo(drawer.options.scaling);
    wheel(drawer, { deltaY: 100 });
    expect(drawer.getZoomLevel()).toBeCloseTo(1);

    control('keydown');
    wheel(drawer, { deltaY: 120, ctrlKey: true });
    control('keyup');
    expect(drawer.stage.position()).toEqual({ x: 0, y: -120 });
    expect(drawer.getZoomLevel()).toBeCloseTo(1);

    // Firefox: lines
    wheel(drawer, { deltaY: 3, deltaMode: 1, shiftKey: true });
    expect(drawer.stage.position()).toEqual({ x: -99, y: -120 });
  });

  it('Pinch of a trackpad (Ctrl not pressed) zooms by its small steps; the other action of the wheel as preference', async () => {
    const drawer = createDrawer({ language: 'en' });

    wheel(drawer, { deltaY: -10, ctrlKey: true });
    expect(drawer.getZoomLevel()).toBeCloseTo(drawer.options.scaling ** 0.1);
    expect(drawer.stage.y()).not.toBe(0);

    drawer.setWheelAction('pan');
    drawer.setZoomLevel(1);
    drawer.stage.position({ x: 0, y: 0 });
    wheel(drawer, { deltaY: 50 });
    expect(drawer.stage.position()).toEqual({ x: 0, y: -50 });
    control('keydown');
    wheel(drawer, { deltaY: -100, ctrlKey: true });
    control('keyup');
    expect(drawer.getZoomLevel()).toBeCloseTo(drawer.options.scaling);
    // pinch zooms too
    wheel(drawer, { deltaY: 100, ctrlKey: true });
    expect(drawer.getZoomLevel()).toBeCloseTo(1);

    // help follows it, preference saved and read again
    expect(drawer.help.$modalBody.textContent).toContain('Move the view');
    expect(drawer.getPreferences().wheelAction).toBe('pan');
    await Promise.resolve();
    expect(createDrawer({ localStorageKey: drawer.options.localStorageKey }).options.wheelAction).toBe('pan');

    // dialog and palette
    drawer.showPreferences();
    expect([...drawer.preferencesModal!.$wheelAction.options].map(($o) => $o.text)).toEqual(['Zoom', 'Move the view']);
    drawer.preferencesModal!.$wheelAction.value = 'zoom';
    drawer.preferencesModal!.save();
    expect(drawer.options.wheelAction).toBe('zoom');
    drawer.showCommandPalette();
    const option = [...drawer.commandPalette!.$list.querySelectorAll<HTMLElement>('[role="option"]')].find(
      ($o) => $o.textContent?.includes('Mouse wheel: Move the view')
    )!;
    option.click();
    expect(drawer.options.wheelAction).toBe('pan');
    drawer.commandPalette!.hide();
  });

  it('Without zoom option: the wheel does not zoom, Ctrl + wheel still moves the view', () => {
    const drawer = createDrawer({ zoom: false });

    wheel(drawer, { deltaY: -100 });
    expect(drawer.getZoomLevel()).toBe(1);
    control('keydown');
    wheel(drawer, { deltaY: 40, ctrlKey: true });
    control('keyup');
    expect(drawer.stage.y()).toBe(-40);
  });

  it('Space held: a drag moves the view whatever the tool, the tool and its stroke untouched, view saved on release', () => {
    const drawer = createDrawer();
    const brush = drawer.getWidget<BrushWidget>('brush')!;
    const change = vi.fn();

    brush.setActive(true);
    drawer.on('change', change);
    expect(keydown(drawer, { key: ' ' })).toBe(false);
    expect(drawer.spacePan.active).toBe(true);
    expect([drawer.stage.draggable(), drawer.drawLayer.listening()]).toEqual([true, false]);
    // repeats kept from the page
    expect(keydown(drawer, { key: ' ', repeat: true })).toBe(false);

    // brush ignores the pointer: nothing drawn
    fireMouse(drawer, 'mousedown', 100, 100);
    fireMouse(drawer, 'mousemove', 150, 120);
    drawer.stage.position({ x: 50, y: 20 });
    drawer.stage.fire('dragmove', { target: drawer.stage });
    fireMouse(drawer, 'mouseup', 150, 120);
    expect(drawer.getDrawingShapes()).toEqual([]);
    expect(brush.inAction).toBe(false);

    drawer.$drawerContainer.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', cancelable: true }));
    expect(drawer.spacePan.active).toBe(false);
    expect([drawer.stage.draggable(), drawer.drawLayer.listening(), drawer.activeTool]).toEqual([false, true, 'brush']);
    expect(change).toHaveBeenCalledTimes(1);

    // stopped once the page loses focus (Space released out of it)
    keydown(drawer, { key: ' ' });
    window.dispatchEvent(new Event('blur'));
    expect(drawer.spacePan.active).toBe(false);
  });

  it('Tool changed while Space is held: the view still moved, then the stage draggable with the pan tool only', () => {
    const drawer = createDrawer();
    const space = (type: 'keydown' | 'keyup') =>
      drawer.$drawerContainer.dispatchEvent(new KeyboardEvent(type, { key: ' ', cancelable: true }));

    drawer.getWidget<BaseWidget>('pan')!.setActive(true);
    space('keydown');
    drawer.getWidget<BaseWidget>('selection')!.setActive(true);
    expect(drawer.stage.draggable()).toBe(true);
    space('keyup');
    // the selection tool does not move the view
    expect([drawer.stage.draggable(), drawer.activeTool]).toEqual([false, 'selection']);

    space('keydown');
    drawer.getWidget<BaseWidget>('pan')!.setActive(true);
    space('keyup');
    // the pan tool moves it
    expect(drawer.stage.draggable()).toBe(true);
  });

  it('Space on a button of the drawer, pointer on the canvas: view moved once the button was clicked, pressed when reached by keyboard', () => {
    const drawer = createDrawer();
    const $button = drawer.toolbar.getButton(drawer.getWidget('brush')!);
    const space = () =>
      $button.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));

    vi.spyOn(drawer, '_hasPointer').mockReturnValue(true);
    // reached by keyboard: pressed (default of the button kept)
    expect(space()).toBe(true);
    expect(drawer.spacePan.active).toBe(false);
    // clicked (tool chosen with the mouse): view moved
    $button.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    expect(space()).toBe(false);
    expect(drawer.spacePan.active).toBe(true);
    drawer.$drawerContainer.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', cancelable: true }));
    expect(drawer.spacePan.active).toBe(false);
  });

  it('Space kept by fields, and by buttons of the drawer with the pointer out of the canvas', () => {
    const drawer = createDrawer();
    const $input = document.createElement('input');
    const $button = drawer.toolbar.getButton(drawer.getWidget('brush')!);

    drawer.$drawerContainer.append($input);
    $input.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    $button.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    expect(drawer.spacePan.active).toBe(false);
    $input.remove();
  });
});

describe('Middle button', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  /** Middle button pressed on the canvas */
  const press = (drawer: Drawer, clientX: number, clientY: number) => {
    const evt = new MouseEvent('mousedown', {
      button: 1,
      buttons: 4,
      clientX,
      clientY,
      bubbles: true,
      cancelable: true,
    });

    drawer.stage.content.dispatchEvent(evt);
    return evt;
  };
  /** Pointer moved in the page */
  const move = (clientX: number, clientY: number, buttons = 4) =>
    window.dispatchEvent(new MouseEvent('mousemove', { buttons, clientX, clientY }));

  it('Dragged on the canvas: the view moves whatever the tool, nothing drawn, change once released', () => {
    const drawer = createDrawer();
    const brush = drawer.getWidget<BrushWidget>('brush')!;
    const change = vi.fn();
    const { x, y } = drawer.stage.position();

    brush.setActive(true);
    drawer.on('change', change);
    // no autoscroll of the browser
    expect(press(drawer, 100, 100).defaultPrevented).toBe(true);
    expect(brush.inAction).toBe(false);
    move(130, 90);
    move(150, 80);
    expect(drawer.stage.position()).toEqual({ x: x + 50, y: y - 20 });
    expect(change).not.toHaveBeenCalled();
    window.dispatchEvent(new MouseEvent('mouseup', { button: 1, clientX: 150, clientY: 80 }));
    expect(change).toHaveBeenCalledTimes(1);
    expect(drawer.getDrawingShapes()).toEqual([]);

    // released out of the window: the next move without the button ends it, view not moved
    press(drawer, 100, 100);
    move(300, 300, 0);
    move(320, 300);
    expect(drawer.stage.position()).toEqual({ x: x + 50, y: y - 20 });
    expect(change).toHaveBeenCalledTimes(1);
  });
});
