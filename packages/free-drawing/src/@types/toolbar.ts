/**
 * Names of tools: widgets of toolbar (see `WidgetName`) and names kept for other tools
 */
export enum Tools {
  /** Move the view by dragging */
  pan = 'pan',
  /** Select, move, resize and rotate shapes */
  selection = 'selection',
  /** Freehand stroke */
  brush = 'brush',
  /** Erase shapes touched by pointer (erased on pointer up) */
  eraser = 'eraser',
  /** Undo (not a widget: undo / redo buttons of footer) */
  undo = 'undo',
  /** Redo (not a widget: undo / redo buttons of footer) */
  redo = 'redo',
  /** Text, edited in place */
  text = 'text',
  /** Rectangle (not a widget: `square` draws rectangles) */
  rect = 'rect',
  /** Ellipse, circle with Shift */
  circle = 'circle',
  /** Ellipse (not a widget: `circle` draws ellipses) */
  ellipse = 'ellipse',
  /** Rectangle, square with Shift */
  square = 'square',
  /** Arrow, its ends can be linked to shapes */
  arrow = 'arrow',
  /** Straight line */
  line = 'line',
  /** Star (no widget) */
  star = 'star',
  /** Triangle */
  triangle = 'triangle',
  /** Polygon (no widget) */
  polygon = 'polygon',
  /** Diamond */
  diamond = 'diamond',
  /** Heart */
  heart = 'heart',
  /** Cloud */
  cloud = 'cloud',
  /** Wide freehand stroke multiplied with the drawing under it */
  highlighter = 'highlighter',
  /** Laser pointer: trail following pointer, not saved in drawing */
  laser = 'laser',
  /** Frame holding shapes, with a title */
  frame = 'frame',
}

/**
 * Name of a tool (`tool` option, `getWidget`), name of a `Tools` member
 */
export type AvailableTools = keyof typeof Tools;

/**
 * Widgets of toolbar
 */
export type WidgetName =
  | 'pan'
  | 'selection'
  | 'brush'
  | 'eraser'
  | 'text'
  | 'line'
  | 'square'
  | 'circle'
  | 'arrow'
  | 'triangle'
  | 'diamond'
  | 'heart'
  | 'cloud'
  | 'highlighter'
  | 'laser'
  | 'frame';

/**
 * Options of every widget
 */
export type WidgetOptions = {
  /** Button tooltip (e.g. translation) */
  title?: string;
  /** Keyboard shortcut (a key), false to disable it */
  shortcut?: string | false;
};

/**
 * Brush options, freehand stroke settings of perfect-freehand
 */
export type BrushWidgetOptions = WidgetOptions & {
  /** Effect of drawing speed on stroke width, from -1 to 1 (0.6 by default, 0 for constant width) */
  thinning?: number;
  /** Softness of stroke edges, from 0 to 1 (1 by default) */
  smoothing?: number;
  /** How much stroke is stabilized (follows pointer less closely), from 0 to 1 (0.5 by default) */
  streamline?: number;
};

/**
 * Group of toolbar widgets (`widgetGroups` option): one button showing its widgets, at the place of the first one
 */
export type WidgetGroupOptions = {
  /** Widgets of the group, in this order: widgets of `widgets` option only, each one in one group */
  widgets: WidgetName[];
  /** Icon: 'shapes' (default), 'more', 'grid', 'plus', name of a widget (e.g. 'square') or svg code */
  icon?: string;
  /** Button tooltip, "More tools" translated by default */
  title?: string;
};

/**
 * Widgets option: list of widgets or object of widgets options, toolbar keeps the given order
 */
export type WidgetsOptions =
  | WidgetName[]
  | (Partial<Record<WidgetName, WidgetOptions>> & {
      /** Brush options, with freehand stroke settings */
      brush?: BrushWidgetOptions;
    });
