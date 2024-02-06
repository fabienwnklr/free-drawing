import { DrawerOptions } from './@types/drawer';

export const defaultOptions: DrawerOptions = {
  id: 'drawer-' + Date.now(),
  tool: 'brush',
  width: window.innerWidth,
  height: window.innerHeight,
  strokeWidth: 8,
  strokeColor: '#000',
  zoom: true,
  zoomWidget: true,
  scaling: 1.11,
  autoSave: false,
  localStorageKey: 'free-drawing',
};
