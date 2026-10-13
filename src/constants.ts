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
  collaboration: false,
  textStyle: {
    fontFamily: 'Ubuntu',
    fontSize: 16,
    fontStyle: 'normal',
    textDecoration: '',
    align: 'left',
  },
};

/**
 * Crosshair cursor of drawing tools (brush, line, eraser)
 */
export const crosshairCursor = `url("data:image/svg+xml,<svg height='32' width='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg' style='color: black;'><defs><filter id='shadow' y='-40%' x='-40%' width='180px' height='180%' color-interpolation-filters='sRGB'><feDropShadow dx='1' dy='1' stdDeviation='1.2' flood-opacity='.5'/></filter></defs><g fill='none' transform='rotate(0 16 16)' filter='url(%23shadow)'><path d='m25 16h-6.01v-6h-2.98v6h-6.01v3h6.01v6h2.98v-6h6.01z' fill='white'/><path d='m23.9902 17.0103h-6v-6.01h-.98v6.01h-6v.98h6v6.01h.98v-6.01h6z' fill='%23231f1f'/></g></svg>") 16 16, crosshair`;

export const zoomLimits = {
  min: 0.1,
  max: 30,
};

export const shapeName = {
  line: 'drawer-line',
  text: 'drawer-text',
  selection: 'drawer-selection',
  guideLine: 'drawer-guide-line',
  gridLine: 'drawer-grid-line',
  background: 'drawer-background',
};

/**
 * Collaboration events, same as server/socket-events.js
 */
export const socketEvents = {
  DRAW: 'DRAW',
  DRAW_BEGIN_PATH: 'DRAW_BEGIN_PATH',
};

export const dataAttributes = {
  strokeWidth: 'data-stroke-width',
  strokeColor: 'data-stroke-color',
  strokeStyle: 'data-stroke-style',
  fontSize: 'data-font-size',
  fontStyle: 'data-font-style',
  textDecoration: 'data-text-decoration',
  textAlign: 'data-text-align',
};
