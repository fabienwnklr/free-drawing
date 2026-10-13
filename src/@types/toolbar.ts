export enum Tools {
  pan = 'pan',
  selection = 'selection',
  brush = 'brush',
  eraser = 'eraser',
  undo = 'undo',
  redo = 'redo',
  text = 'text',
  rect = 'rect',
  circle = 'circle',
  ellipse = 'ellipse',
  square = 'square',
  arrow = 'arrow',
  line = 'line',
  star = 'star',
  triangle = 'triangle',
  polygon = 'polygon',
}

export type AvailableTools = keyof typeof Tools;

/**
 * Widgets of toolbar
 */
export type WidgetName = 'pan' | 'selection' | 'brush' | 'eraser' | 'text' | 'line' | 'square' | 'circle' | 'arrow';

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
 * Widgets option: list of widgets or object of widgets options, toolbar keeps the given order
 */
export type WidgetsOptions = WidgetName[] | (Partial<Record<WidgetName, WidgetOptions>> & { brush?: BrushWidgetOptions });
