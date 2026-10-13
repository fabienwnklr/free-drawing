import { Drawer } from '../src/Drawer';
import type { DrawerOptions } from '../src/@types/drawer';

/**
 * Drawer isolated from other tests: no saved state loaded, nothing saved (unless options say so)
 */
export const createDrawer = (options: Partial<DrawerOptions> = {}) =>
  new Drawer(document.getElementById('test') as HTMLDivElement, {
    autoSave: false,
    localStorageKey: 'test-' + Math.random(),
    ...options,
  });

/**
 * Dispatch keydown on drawer, returns false if default was prevented
 */
export const keydown = (drawer: Drawer, init: KeyboardEventInit) =>
  drawer.$drawerContainer.dispatchEvent(new KeyboardEvent('keydown', { cancelable: true, ...init }));

export const setPointer = (drawer: Drawer, clientX: number, clientY: number) =>
  drawer.stage.setPointersPositions(new MouseEvent('mousemove', { clientX, clientY }));

/**
 * Fire konva mouse event on stage at given position
 */
export const fireMouse = (drawer: Drawer, type: string, x: number, y: number) => {
  setPointer(drawer, x, y);
  drawer.stage.fire(type, { evt: { button: 0, preventDefault() {} } });
};
