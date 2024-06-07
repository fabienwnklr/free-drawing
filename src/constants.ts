import { DrawerOptions } from './@types/drawer';

export const defaultOptions: DrawerOptions = {
  id: 'drawer-' + Date.now(),
  tool: 'brush',
  width: window.innerWidth,
  height: window.innerHeight,
  strokeWidth: 5,
  strokeDash: undefined,
  strokeColor: '#000',
  zoom: true,
  zoomWidget: true,
  scaling: 1.11,
  autoSave: true,
  localStorageKey: 'free-drawing',
  opacity: 1,
};

export const shapeName = {
  line: 'drawer-line',
  text: 'drawer-text',
  selection: 'drawer-selection',
  guideLine: 'drawer-guide-line',
  gridLine: 'drawer-grid-line',
  background: 'drawer-background',
};

export const dataAttributes = {
  strokeWidth: 'data-stroke-width',
  strokeColor: 'data-stroke-color',
  strokeStyle: 'data-stroke-style',
  fontSize: 'data-font-size',
};
