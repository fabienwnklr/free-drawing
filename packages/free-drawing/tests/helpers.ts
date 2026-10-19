import { Drawer } from '@/Drawer';
import type { DrawerOptions } from '@/@types/drawer';

/**
 * Drawer isolated from other tests: no saved state loaded, nothing saved (unless options say so)
 */
export const createDrawer = (options: Partial<DrawerOptions> = {}) =>
  new Drawer(document.getElementById('test') as HTMLDivElement, {
    autoSave: false,
    localStorageKey: `test-${Math.random()}`,
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
export const fireMouse = (drawer: Drawer, type: string, x: number, y: number, evt: Partial<MouseEvent> = {}) => {
  setPointer(drawer, x, y);
  drawer.stage.fire(type, { evt: { button: 0, preventDefault() {}, ...evt } });
};

/**
 * Drag on stage with active tool
 */
export const drag = (drawer: Drawer, from: [number, number], to: [number, number], evt: Partial<MouseEvent> = {}) => {
  fireMouse(drawer, 'mousedown', ...from, evt);
  fireMouse(drawer, 'mousemove', ...to, evt);
  fireMouse(drawer, 'mouseup', ...to, evt);
};
