import { DrawerOptions } from '@/@types/drawer';
import type { WidgetName } from '@/@types/toolbar';
import type { TranslationKey } from '@/i18n/en';

/**
 * Widgets of toolbar, default order
 */
export const widgetNames: WidgetName[] = [
  'pan',
  'selection',
  'brush',
  'eraser',
  'text',
  'line',
  'square',
  'circle',
  'arrow',
  'triangle',
  'diamond',
  'heart',
  'cloud',
  'highlighter',
  'laser',
  'frame',
];

export const defaultOptions: DrawerOptions = {
  id: 'drawer-' + Date.now(),
  tool: 'brush',
  width: window.innerWidth,
  height: window.innerHeight,
  strokeWidth: 5,
  strokeStyle: 'solid',
  edges: 'sharp',
  strokeColor: '#000',
  fillColor: 'transparent',
  zoom: true,
  zoomWidget: true,
  positionWidget: true,
  selectionMenu: true,
  commandPalette: true,
  theme: 'light',
  language: 'auto',
  translations: {},
  layersPanel: true,
  readOnly: false,
  scaling: 1.11,
  autoSave: true,
  keepTool: true,
  localStorageKey: 'free-drawing',
  opacity: 1,
  collaboration: false,
  user: null,
  storage: null,
  widgets: widgetNames,
  // more tools in one button
  widgetGroups: [{ widgets: ['triangle', 'diamond', 'heart', 'cloud', 'highlighter', 'laser', 'frame'], icon: 'more' }],
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

/**
 * Hand cursors of pan tool, white with black outline (system ones are hardly visible on white canvas)
 */
export const grabCursor = `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='-1 -1 18 18'><defs><filter id='s' x='-30%' y='-30%' width='160%' height='160%'><feDropShadow dx='.4' dy='.6' stdDeviation='.5' flood-opacity='.45'/></filter></defs><g filter='url(%23s)'><path fill='white' d='M13.5 2.4c-.4-.4-1-.5-1.5-.3c0-.3-.1-.6-.4-.9c-.2-.2-.6-.4-1.1-.4c-.3 0-.5.1-.7.1c0-.2-.1-.3-.2-.5c-.5-.6-1.5-.6-2 0c-.2.2-.4.4-.4.6C7 1 6.8.9 6.6.9c-.5 0-.8.2-1.1.5C5 1.9 5 2.7 5 2.7v3.8c-.3-.3-.8-.8-1.5-.8c-.2 0-.5.1-.7.2c-.4.2-.6.5-.7.9c-.3 1 .6 2.4.6 2.5c.1.1 1.2 2.7 2.2 3.8C5.9 14.3 7 15 9.8 15c2.9 0 4.2-1.6 4.2-5.1V4.4c0-.1.1-1.3-.5-2'/><path fill='black' d='M13.5 2.4c-.4-.4-1-.5-1.5-.3c0-.3-.1-.6-.4-.9c-.2-.2-.6-.4-1.1-.4c-.3 0-.5.1-.7.1c0-.2-.1-.3-.2-.5c-.5-.6-1.5-.6-2 0c-.2.2-.4.4-.4.6C7 1 6.8.9 6.6.9c-.5 0-.8.2-1.1.5C5 1.9 5 2.7 5 2.7v3.8c-.3-.3-.8-.8-1.5-.8c-.2 0-.5.1-.7.2c-.4.2-.6.5-.7.9c-.3 1 .6 2.4.6 2.5c.1.1 1.2 2.7 2.2 3.8C5.9 14.3 7 15 9.8 15c2.9 0 4.2-1.6 4.2-5.1V4.4c0-.1.1-1.3-.5-2M8 2c0-.3-.1-1 .5-1c.5 0 .5.5.5 1v4c0 .3.2.5.5.5s.5-.2.5-.5V2.2s0-.4.5-.4c.6 0 .5.9.5.9V6c0 .3.2.5.5.5s.5-.2.5-.5V3.6c0-.1 0-.6.5-.6s.5 1 .5 1v5.9c0 3.4-1.3 4.1-3.2 4.1c-2.4 0-3.3-.5-4.1-1.6c-.9-1-2.1-3.6-2.1-3.7c-.3-.3-.7-1.2-.6-1.6c0-.1.1-.2.2-.3c.1 0 .2-.1.2-.1c.4 0 .8.5.9.7l.6.9c.1.2.4.3.6.2c.4 0 .5-.2.5-.4V2.9c0-.4 0-1 .5-1c.4 0 .5.3.5.8V6c0 .3.2.5.5.5S8 6.3 8 6z'/></g></svg>") 12 12, grab`;

export const grabbingCursor = `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='-1 -1 18 18'><defs><filter id='s' x='-30%' y='-30%' width='160%' height='160%'><feDropShadow dx='.4' dy='.6' stdDeviation='.5' flood-opacity='.45'/></filter></defs><g filter='url(%23s)' fill='white' stroke='black' stroke-width='1' stroke-linejoin='round'><rect x='4.5' y='5' width='2.3' height='4' rx='1.15'/><rect x='6.8' y='5' width='2.3' height='4' rx='1.15'/><rect x='9.1' y='5' width='2.3' height='4' rx='1.15'/><rect x='11.4' y='5' width='2.3' height='4' rx='1.15'/><path d='M4.5 7.5H13.7V10.2c0 2.6-1.7 4.3-4.3 4.3H8.6c-2 0-3.1-.9-4-2.3L3 9.7c-.4-.7-.2-1.5.5-1.8c.6-.3 1.2-.1 1.6.4l.6.8V7.5z'/></g></svg>") 12 12, grabbing`;

/**
 * Grid cell size, used for drawing and snapping
 */
export const gridSize = 40;

/**
 * Max undo / redo states kept
 */
export const historyLimit = 100;

export const zoomLimits = {
  min: 0.1,
  max: 30,
};

export const shapeName = {
  line: 'drawer-line',
  straightLine: 'drawer-straight-line',
  rect: 'drawer-rect',
  ellipse: 'drawer-ellipse',
  arrow: 'drawer-arrow',
  triangle: 'drawer-triangle',
  diamond: 'drawer-diamond',
  heart: 'drawer-heart',
  cloud: 'drawer-cloud',
  highlighter: 'drawer-highlighter',
  frame: 'drawer-frame',
  text: 'drawer-text',
  group: 'drawer-group',
  selection: 'drawer-selection',
  guideLine: 'drawer-guide-line',
  gridLine: 'drawer-grid-line',
  background: 'drawer-background',
};

/**
 * Shapes drawn with an outline, which can be dashed (brush line is a filled outline)
 */
/**
 * Closed shapes drawn by path (see `PathShapeWidget`)
 */
export const pathShapes = [shapeName.triangle, shapeName.diamond, shapeName.heart, shapeName.cloud];

export const strokeStyleShapes = [
  shapeName.straightLine,
  shapeName.rect,
  shapeName.ellipse,
  shapeName.arrow,
  ...pathShapes,
];

/**
 * Shapes with a background color (fill), other shapes fill is their color (brush line, text) or none
 */
export const fillShapes = [shapeName.rect, shapeName.ellipse, ...pathShapes];

/**
 * Shapes with corners, sharp or round (see `edges` option)
 */
export const edgesShapes = [shapeName.rect];

/**
 * Type names of drawing shapes (layers panel), keys of their translation
 */
export const shapeLabels: Record<string, TranslationKey> = {
  [shapeName.line]: 'shapes.freehand',
  [shapeName.straightLine]: 'shapes.line',
  [shapeName.rect]: 'shapes.rect',
  [shapeName.ellipse]: 'shapes.ellipse',
  [shapeName.arrow]: 'shapes.arrow',
  [shapeName.triangle]: 'shapes.triangle',
  [shapeName.diamond]: 'shapes.diamond',
  [shapeName.heart]: 'shapes.heart',
  [shapeName.cloud]: 'shapes.cloud',
  [shapeName.highlighter]: 'shapes.highlighter',
  [shapeName.frame]: 'shapes.frame',
  [shapeName.text]: 'shapes.text',
  [shapeName.group]: 'shapes.group',
};

/**
 * Events of drawer (`drawer.on(event, callback)`) and of its components, named `drawer.<subject>.<action>`
 */
export const drawerEvents = {
  /** Drawing changed (shapes, background...), with drawer */
  change: 'drawer.change',
  /** Drawing options changed (setters, overlays...), with changed options */
  optionsChange: 'drawer.options.change',
  /** Read only mode changed, with read only state */
  readOnlyChange: 'drawer.readonly.change',
  /** Selected shapes changed, with selected shapes */
  selectionChange: 'drawer.selection.change',
  /** Collaboration started or stopped, users or rights changed */
  collaborationChange: 'drawer.collaboration.change',
  /** Light or dark theme shown, with dark state */
  themeChange: 'drawer.theme.change',
  /** Language of interface changed, with language */
  languageChange: 'drawer.language.change',
  /** Interface settings changed (theme, language, grid, snapping), with preferences: once for several ones */
  preferencesChange: 'drawer.preferences.change',
  /** Drawing has changes not saved yet (without auto save) or is saved, with unsaved state */
  unsavedChange: 'drawer.unsaved.change',
  /** Dropdown menu hidden (event of dropdown) */
  dropdownHide: 'drawer.dropdown.hide',
  /** Toast hidden (event of toast) */
  toastHide: 'drawer.toast.hide',
} as const;

/**
 * Event names of previous versions (deprecated), listened and triggered as current ones
 */
export const deprecatedEvents: Record<string, string> = {
  change: drawerEvents.change,
  'fd.options.change': drawerEvents.optionsChange,
  'fd.readonly.change': drawerEvents.readOnlyChange,
  'fd.selection.change': drawerEvents.selectionChange,
  'fd.collaboration.change': drawerEvents.collaborationChange,
  'fd.dropdown.hide': drawerEvents.dropdownHide,
  'fd.toast.hide': drawerEvents.toastHide,
};

export const dataAttributes = {
  strokeWidth: 'data-stroke-width',
  strokeColor: 'data-stroke-color',
  fillColor: 'data-fill-color',
  strokeStyle: 'data-stroke-style',
  edges: 'data-edges',
  fontSize: 'data-font-size',
  fontStyle: 'data-font-style',
  textDecoration: 'data-text-decoration',
  textAlign: 'data-text-align',
  order: 'data-order',
};
