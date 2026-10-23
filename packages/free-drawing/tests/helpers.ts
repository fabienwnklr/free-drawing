import { Drawer } from '@/Drawer';
import type { DrawerOptions } from '@/@types/drawer';

/** Drawers of `createDrawer` in the current test file: destroyed after it (memory, listeners of the page) */
export const drawers = new Set<Drawer>();

/**
 * Drawer isolated from other tests: no saved state loaded, nothing saved (unless options say so), destroyed after the
 * test file (see `vitest.setup.ts`)
 */
export const createDrawer = (options: Partial<DrawerOptions> = {}) => {
  const drawer = new Drawer(document.getElementById('test') as HTMLDivElement, {
    autoSave: false,
    localStorageKey: `test-${Math.random()}`,
    ...options,
  });

  drawers.add(drawer);
  return drawer;
};

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

/**
 * Finger of a touch event (jsdom has no `Touch`)
 */
export const finger = (identifier: number, clientX: number, clientY: number) => ({ identifier, clientX, clientY });

/**
 * Dispatch a touch event of the page on the canvas: konva and tools first, then touch gestures
 * (`fingers`: fingers on the canvas after it, `changed`: fingers pressed, moved or lifted)
 */
export const fireTouch = (
  drawer: Drawer,
  type: string,
  fingers: ReturnType<typeof finger>[],
  changed: ReturnType<typeof finger>[]
) => {
  const event = new Event(type, { bubbles: true, cancelable: true });

  Object.defineProperties(event, {
    touches: { value: fingers },
    targetTouches: { value: fingers },
    changedTouches: { value: changed },
  });
  drawer.stage.content.dispatchEvent(event);
};
