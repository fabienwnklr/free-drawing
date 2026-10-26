import type { ColorLike, DrawingShape } from '@/@types/drawer';
import type { TranslationKey } from '@/@types/i18n';
import type { TextChoice } from '@/@types/ui';
import type { Vector2d } from 'konva/lib/types';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';

/**
 * Widgets of toolbar: `pan` (move the view), `selection` (select, move, resize, rotate), `brush` (freehand stroke),
 * `eraser`, `text` (edited in place), `line`, `square` (rectangle, square with Shift), `circle` (ellipse, circle with
 * Shift), `arrow` (ends linked to shapes), `triangle`, `diamond`, `heart`, `cloud`, `highlighter` (wide stroke
 * multiplied with the drawing under it), `laser` (trail following pointer, not saved), `frame` (holds shapes, with a
 * title)
 */
export type WidgetName =
  | 'pan'
  | 'selection'
  | 'brush'
  | 'eraser'
  | 'text'
  | 'note'
  | 'line'
  | 'square'
  | 'circle'
  | 'arrow'
  | 'image'
  | 'triangle'
  | 'diamond'
  | 'heart'
  | 'cloud'
  | 'star'
  | 'hexagon'
  | 'blockArrow'
  | 'bubble'
  | 'checkbox'
  | 'highlighter'
  | 'laser'
  | 'frame';

/**
 * Name of a tool (`tool` option, `getWidget`): widgets of toolbar and names kept for other tools, `undo` and `redo`
 * (buttons of footer), `rect` (`square` draws rectangles), `ellipse` (`circle` draws ellipses), `polygon` (no
 * widget)
 */
export type AvailableTools = WidgetName | 'undo' | 'redo' | 'rect' | 'ellipse' | 'polygon' | PluginToolName;

/** Name of a widget added by a plugin (`Plugin.addWidget`): any name, names of the library still suggested */
export type PluginToolName = string & Record<never, never>;

/** Name of a widget of the toolbar: of the library or of a plugin */
export type ToolbarWidgetName = WidgetName | PluginToolName;

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
  /** Widgets of the group, in this order: widgets of `widgets` option (or of plugins) only, each one in one group */
  widgets: ToolbarWidgetName[];
  /** Icon: 'shapes' (default), 'more', 'grid', 'plus', name of a widget (e.g. 'square') or svg code */
  icon?: string;
  /** Button tooltip, "More tools" translated by default */
  title?: string;
};

/**
 * Widgets option: list of widgets or object of widgets options, toolbar keeps the given order
 */
export type WidgetsOptions =
  | ToolbarWidgetName[]
  | (Partial<Record<ToolbarWidgetName, WidgetOptions>> & {
      /** Brush options, with freehand stroke settings */
      brush?: BrushWidgetOptions;
    });

/**
 * Options of a `GroupWidget` created by code (the `widgetGroups` drawer option gives names of widgets instead)
 */
export type GroupWidgetOptions = {
  /** Widgets of the group, in this order (created by the app or the library, not added to toolbar yet) */
  widgets: BaseWidget[];
  /** Name of `groupIcons` or svg code, 'shapes' by default */
  icon?: string;
  /** Button tooltip, "More tools" translated by default */
  title?: string;
};

/**
 * Settings of perfect-freehand: effect of speed on width, softness of edges, stabilization
 */
export type FreehandSettings = {
  /** Effect of drawing speed on stroke width, from -1 to 1 (0 for constant width) */
  thinning: number;
  /** Softness of stroke edges, from 0 to 1 */
  smoothing: number;
  /** How much stroke is stabilized (follows pointer less closely), from 0 to 1 */
  streamline: number;
};

/**
 * Options of a `Trail` (eraser, laser), defaults: translucent black, 8 px, 200 ms, no glow
 */
export type TrailOptions = {
  /** Fill color */
  color: string;
  /** Width at pointer, in screen pixels (same whatever zoom) */
  size: number;
  /** Life time of a point, in ms */
  duration: number;
  /** Color of a glow around trail (laser), none by default */
  glow?: string;
};

/**
 * Point of a `Trail`: position in drawing and time it was added, removed after the duration of the trail
 */
export type TrailPoint = Vector2d & {
  /** Time it was added (ms) */
  time: number;
};

/**
 * Options of a tool, shown while it is active (`BaseOverlay` and others)
 */
export type ToolOverlay = {
  /** Element of the overlay, in the `floating` region of the layout */
  $overlayContainer: HTMLElement;
  /** Show overlay: fields show options of given shapes (selection), else options of drawer */
  show(shapes?: DrawingShape[]): void;
  /** Hide overlay */
  hide(): void;
};

/**
 * Sections shown by an overlay and their titles, given by each subclass
 */
export type OverlayOptions = {
  /** Show stroke style buttons (default false) */
  styleBtns: boolean;
  /** Show stroke width buttons (default true) */
  widthBtns: boolean;
  /** Show background color buttons, for rectangle and ellipse (default false) */
  fillBtns: boolean;
  /** Title of color section (default stroke) */
  colorTitle: TranslationKey;
  /** Accessible name of overlay (default tool options) */
  label: TranslationKey;
};

/**
 * Color or size of highlighter strokes chosen in its overlay
 */
export type HighlighterChange = {
  /** Color chosen */
  color?: ColorLike;
  /** Width chosen */
  size?: number;
};

/**
 * Current choices of highlighter widget, updated by the overlay
 */
export type HighlighterOverlayOptions = {
  /** Color of strokes, one of `highlighterColors` or custom */
  color: ColorLike;
  /** Width of strokes, one of `highlighterSizes` */
  size: number;
  /** Color or size chosen */
  onChange: (change: HighlighterChange) => void;
};

/**
 * Font style button of the text options: style (bold, italic) or decoration (underline, line-through)
 */
export type FontStyleChoice = TextChoice<string> & {
  /** Data attribute of the button: style or decoration */
  attr: string;
};

/** Positions moved or resized shapes snap to (absolute), see `SelectWidget` snapping */
export type SnapStops = {
  /** X of vertical guides */
  vertical: number[];
  /** Y of horizontal guides */
  horizontal: number[];
};
