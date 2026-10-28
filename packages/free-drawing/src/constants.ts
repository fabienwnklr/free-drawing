import type { DrawerOptions } from '@/@types/drawer';
import type { WidgetName } from '@/@types/toolbar';
import type { RecognizedKind } from '@/@types/shapes';
import type { TranslationKey } from '@/@types/i18n';
import type {
  Arrowhead,
  ArrowType,
  Direction,
  GridStyle,
  ShapeAlignment,
  ShapeOrder,
  WheelAction,
} from '@/@types/drawer';
import type { Choice, IconChoice, ShortcutChoice } from '@/@types/ui';
import SendToBackIcon from '@/icons/send-to-back.svg?raw';
import SendBackwardIcon from '@/icons/send-backward.svg?raw';
import BringForwardIcon from '@/icons/bring-forward.svg?raw';
import BringToFrontIcon from '@/icons/bring-to-front.svg?raw';
import AlignLeftIcon from '@/icons/align-shapes-left.svg?raw';
import AlignCenterIcon from '@/icons/align-shapes-center.svg?raw';
import AlignRightIcon from '@/icons/align-shapes-right.svg?raw';
import AlignTopIcon from '@/icons/align-shapes-top.svg?raw';
import AlignMiddleIcon from '@/icons/align-shapes-middle.svg?raw';
import AlignBottomIcon from '@/icons/align-shapes-bottom.svg?raw';
import DistributeHorizontalIcon from '@/icons/distribute-horizontal.svg?raw';
import DistributeVerticalIcon from '@/icons/distribute-vertical.svg?raw';
import StackHorizontalIcon from '@/icons/stack-horizontal.svg?raw';
import StackVerticalIcon from '@/icons/stack-vertical.svg?raw';
import ArrowStraightIcon from '@/icons/arrow-straight.svg?raw';
import ArrowCurvedIcon from '@/icons/arrow-curved.svg?raw';
import ArrowElbowIcon from '@/icons/arrow-elbow.svg?raw';
import ArrowheadNoneIcon from '@/icons/arrowhead-none.svg?raw';
import ArrowheadArrowIcon from '@/icons/arrowhead-arrow.svg?raw';
import ArrowheadTriangleIcon from '@/icons/arrowhead-triangle.svg?raw';
import ArrowheadDotIcon from '@/icons/arrowhead-dot.svg?raw';
import ArrowheadBarIcon from '@/icons/arrowhead-bar.svg?raw';

/**
 * Widgets of toolbar, default order
 */
export const widgetNames: WidgetName[] = [
  'pan',
  'selection',
  'brush',
  'eraser',
  'text',
  'note',
  'line',
  'square',
  'circle',
  'arrow',
  'image',
  'triangle',
  'diamond',
  'heart',
  'cloud',
  'star',
  'hexagon',
  'blockArrow',
  'bubble',
  'checkbox',
  'highlighter',
  'laser',
  'frame',
];

/**
 * Default options of a drawer, merged with options given to `new Drawer($el, options)` (see `DrawerOptions`)
 */
export const defaultOptions: DrawerOptions = {
  id: `drawer-${Date.now()}`,
  tool: 'brush',
  width: window.innerWidth,
  height: window.innerHeight,
  strokeWidth: 5,
  strokeStyle: 'solid',
  edges: 'sharp',
  arrowType: 'straight',
  arrowheads: { start: 'none', end: 'triangle' },
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
  library: true,
  slideshow: true,
  saveButton: true,
  readOnly: false,
  scaling: 1.11,
  autoSave: true,
  keepTool: true,
  shapeRecognition: false,
  gridStyle: 'squares',
  wheelAction: 'zoom',
  localStorageKey: 'free-drawing',
  opacity: 1,
  collaboration: false,
  user: null,
  storage: null,
  plugins: [],
  widgets: widgetNames,
  // more tools in one button
  widgetGroups: [
    {
      widgets: [
        'triangle',
        'diamond',
        'heart',
        'cloud',
        'star',
        'hexagon',
        'blockArrow',
        'bubble',
        'checkbox',
        'highlighter',
        'laser',
        'frame',
      ],
      icon: 'more',
    },
  ],
  textStyle: {
    fontFamily: 'Ubuntu',
    fontSize: 16,
    fontStyle: 'normal',
    textDecoration: '',
    align: 'left',
  },
};

/** Pointer move on screen (px, whatever the zoom) under which a press is a click: selection, nothing drawn by shape tools */
export const clickTolerance = 3;

/**
 * Crosshair cursor of drawing tools (brush, line, eraser)
 */
export const crosshairCursor = `url("data:image/svg+xml,<svg height='32' width='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg' style='color: black;'><defs><filter id='shadow' y='-40%' x='-40%' width='180px' height='180%' color-interpolation-filters='sRGB'><feDropShadow dx='1' dy='1' stdDeviation='1.2' flood-opacity='.5'/></filter></defs><g fill='none' transform='rotate(0 16 16)' filter='url(%23shadow)'><path d='m25 16h-6.01v-6h-2.98v6h-6.01v3h6.01v6h2.98v-6h6.01z' fill='white'/><path d='m23.9902 17.0103h-6v-6.01h-.98v6.01h-6v.98h6v6.01h.98v-6.01h6z' fill='%23231f1f'/></g></svg>") 16 16, crosshair`;

/**
 * Hand cursors of pan tool, white with black outline (system ones are hardly visible on white canvas)
 */
export const grabCursor = `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='-1 -1 18 18'><defs><filter id='s' x='-30%' y='-30%' width='160%' height='160%'><feDropShadow dx='.4' dy='.6' stdDeviation='.5' flood-opacity='.45'/></filter></defs><g filter='url(%23s)'><path fill='white' d='M13.5 2.4c-.4-.4-1-.5-1.5-.3c0-.3-.1-.6-.4-.9c-.2-.2-.6-.4-1.1-.4c-.3 0-.5.1-.7.1c0-.2-.1-.3-.2-.5c-.5-.6-1.5-.6-2 0c-.2.2-.4.4-.4.6C7 1 6.8.9 6.6.9c-.5 0-.8.2-1.1.5C5 1.9 5 2.7 5 2.7v3.8c-.3-.3-.8-.8-1.5-.8c-.2 0-.5.1-.7.2c-.4.2-.6.5-.7.9c-.3 1 .6 2.4.6 2.5c.1.1 1.2 2.7 2.2 3.8C5.9 14.3 7 15 9.8 15c2.9 0 4.2-1.6 4.2-5.1V4.4c0-.1.1-1.3-.5-2'/><path fill='black' d='M13.5 2.4c-.4-.4-1-.5-1.5-.3c0-.3-.1-.6-.4-.9c-.2-.2-.6-.4-1.1-.4c-.3 0-.5.1-.7.1c0-.2-.1-.3-.2-.5c-.5-.6-1.5-.6-2 0c-.2.2-.4.4-.4.6C7 1 6.8.9 6.6.9c-.5 0-.8.2-1.1.5C5 1.9 5 2.7 5 2.7v3.8c-.3-.3-.8-.8-1.5-.8c-.2 0-.5.1-.7.2c-.4.2-.6.5-.7.9c-.3 1 .6 2.4.6 2.5c.1.1 1.2 2.7 2.2 3.8C5.9 14.3 7 15 9.8 15c2.9 0 4.2-1.6 4.2-5.1V4.4c0-.1.1-1.3-.5-2M8 2c0-.3-.1-1 .5-1c.5 0 .5.5.5 1v4c0 .3.2.5.5.5s.5-.2.5-.5V2.2s0-.4.5-.4c.6 0 .5.9.5.9V6c0 .3.2.5.5.5s.5-.2.5-.5V3.6c0-.1 0-.6.5-.6s.5 1 .5 1v5.9c0 3.4-1.3 4.1-3.2 4.1c-2.4 0-3.3-.5-4.1-1.6c-.9-1-2.1-3.6-2.1-3.7c-.3-.3-.7-1.2-.6-1.6c0-.1.1-.2.2-.3c.1 0 .2-.1.2-.1c.4 0 .8.5.9.7l.6.9c.1.2.4.3.6.2c.4 0 .5-.2.5-.4V2.9c0-.4 0-1 .5-1c.4 0 .5.3.5.8V6c0 .3.2.5.5.5S8 6.3 8 6z'/></g></svg>") 12 12, grab`;

/**
 * Closed hand cursor of pan tool, while the view is dragged
 */
export const grabbingCursor = `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='-1 -1 18 18'><defs><filter id='s' x='-30%' y='-30%' width='160%' height='160%'><feDropShadow dx='.4' dy='.6' stdDeviation='.5' flood-opacity='.45'/></filter></defs><g filter='url(%23s)' fill='white' stroke='black' stroke-width='1' stroke-linejoin='round'><rect x='4.5' y='5' width='2.3' height='4' rx='1.15'/><rect x='6.8' y='5' width='2.3' height='4' rx='1.15'/><rect x='9.1' y='5' width='2.3' height='4' rx='1.15'/><rect x='11.4' y='5' width='2.3' height='4' rx='1.15'/><path d='M4.5 7.5H13.7V10.2c0 2.6-1.7 4.3-4.3 4.3H8.6c-2 0-3.1-.9-4-2.3L3 9.7c-.4-.7-.2-1.5.5-1.8c.6-.3 1.2-.1 1.6.4l.6.8V7.5z'/></g></svg>") 12 12, grabbing`;

/**
 * Grid cell size, used for drawing and snapping
 */
export const gridSize = 40;

/** Actions of the mouse wheel (preferences dialog, command palette) */
export const wheelActions: Choice<WheelAction>[] = [
  { value: 'zoom', label: 'wheel.zoom' },
  { value: 'pan', label: 'wheel.pan' },
];

/** Styles of the grid (preferences dialog, command palette) */
export const gridStyles: Choice<GridStyle>[] = [
  { value: 'squares', label: 'grid.squares' },
  { value: 'dots', label: 'grid.dots' },
  { value: 'lines', label: 'grid.lines' },
  { value: 'isometric', label: 'grid.isometric' },
];

/**
 * Max undo / redo states kept
 */
export const historyLimit = 100;

/**
 * Zoom levels allowed (scale of stage, 1 is 100%)
 */
export const zoomLimits = {
  /** Smallest zoom level (10%) */
  min: 0.1,
  /** Largest zoom level (3000%) */
  max: 30,
};

/**
 * Konva names of drawer nodes: type of drawing shapes (`shape.hasName(shapeName.text)`) and nodes of the interface
 */
export const shapeName = {
  /** Freehand stroke of brush */
  line: 'drawer-line',
  /** Straight line of line tool */
  straightLine: 'drawer-straight-line',
  /** Rectangle (square tool) */
  rect: 'drawer-rect',
  /** Ellipse (circle tool) */
  ellipse: 'drawer-ellipse',
  /** Arrow, its ends can be linked to shapes */
  arrow: 'drawer-arrow',
  /** Triangle path */
  triangle: 'drawer-triangle',
  /** Diamond path */
  diamond: 'drawer-diamond',
  /** Heart path */
  heart: 'drawer-heart',
  /** Cloud path */
  cloud: 'drawer-cloud',
  /** Star of 5 points path */
  star: 'drawer-star',
  /** Hexagon path */
  hexagon: 'drawer-hexagon',
  /** Block arrow path (pointing right) */
  blockArrow: 'drawer-block-arrow',
  /** Speech bubble path */
  bubble: 'drawer-bubble',
  /** Check box path (square and check mark) */
  checkbox: 'drawer-checkbox',
  /** Freehand stroke of highlighter */
  highlighter: 'drawer-highlighter',
  /** Frame holding shapes (see `Frame`) */
  frame: 'drawer-frame',
  /** Text */
  text: 'drawer-text',
  /** Sticky note: a rectangle (also named `rect`) of a light color holding a text, with a shadow (see utils/note) */
  note: 'drawer-note',
  /** Group of shapes */
  group: 'drawer-group',
  /** Image, its file in the files of the drawing (`fileId` attribute, see `drawer.files`) */
  image: 'drawer-image',
  /** Selection rectangle of selection tool (selection layer) */
  selection: 'drawer-selection',
  /** Snapping guide (selection layer) */
  guideLine: 'drawer-guide-line',
  /** Shape drawing the grid (grid layer) */
  gridLine: 'drawer-grid-line',
  /** Background rectangle (background layer) */
  background: 'drawer-background',
};

/**
 * Closed shapes drawn by path (see `PathShapeWidget`)
 */
export const pathShapes = [
  shapeName.triangle,
  shapeName.diamond,
  shapeName.heart,
  shapeName.cloud,
  shapeName.star,
  shapeName.hexagon,
  shapeName.blockArrow,
  shapeName.bubble,
  shapeName.checkbox,
];

/**
 * Paths of path shapes in a box of width and height 1 (see `scalePath`), by shape name: tools of the toolbar, shapes
 * of other apps opened
 */
export const pathShapeData: Record<string, string> = {
  [shapeName.triangle]: 'M0.5 0L1 1L0 1Z',
  [shapeName.diamond]: 'M0.5 0L1 0.5L0.5 1L0 0.5Z',
  // from bottom tip: left lobe, dip, right lobe
  [shapeName.heart]:
    'M0.5 1C0.18 0.78 0 0.56 0 0.3C0 0.11 0.14 0 0.29 0C0.4 0 0.47 0.06 0.5 0.16C0.53 0.06 0.6 0 0.71 0' +
    'C0.86 0 1 0.11 1 0.3C1 0.56 0.82 0.78 0.5 1Z',
  // flat bottom, bumps on left, top and right
  [shapeName.cloud]:
    'M0.22 1C0.08 1 0 0.88 0 0.74C0 0.6 0.1 0.5 0.22 0.49C0.21 0.24 0.36 0 0.55 0C0.7 0 0.8 0.12 0.83 0.27' +
    'C0.93 0.3 1 0.42 1 0.6C1 0.82 0.9 1 0.76 1Z',
  // from the top point, clockwise, inner points between
  [shapeName.star]: 'M0.5 0L0.618 0.382L1 0.382L0.691 0.618L0.809 1L0.5 0.764L0.191 1L0.309 0.618L0 0.382L0.382 0.382Z',
  // flat top and bottom
  [shapeName.hexagon]: 'M0.25 0L0.75 0L1 0.5L0.75 1L0.25 1L0 0.5Z',
  // shaft on the left, head on the right
  [shapeName.blockArrow]: 'M0 0.3L0.6 0.3L0.6 0L1 0.5L0.6 1L0.6 0.7L0 0.7Z',
  // box in the top 80 %, tail below its left part
  [shapeName.bubble]:
    'M0.1 0L0.9 0C0.96 0 1 0.04 1 0.1L1 0.7C1 0.76 0.96 0.8 0.9 0.8L0.45 0.8L0.22 1L0.27 0.8L0.1 0.8' +
    'C0.04 0.8 0 0.76 0 0.7L0 0.1C0 0.04 0.04 0 0.1 0Z',
  // rounded square, then the check mark (open, drawn by the stroke; turning as the square: inside the filled square,
  // not a hole)
  [shapeName.checkbox]:
    'M0.12 0L0.88 0C0.95 0 1 0.05 1 0.12L1 0.88C1 0.95 0.95 1 0.88 1L0.12 1C0.05 1 0 0.95 0 0.88L0 0.12' +
    'C0 0.05 0.05 0 0.12 0ZM0.76 0.3L0.42 0.7L0.25 0.52',
};

/**
 * Shapes drawn with an outline, which can be dashed (brush line is a filled outline)
 */
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

/** Space kept around an area the view moves to (text found, shape reached with the keyboard), on screen in px */
export const viewMargin = 64;

/** Diagonal of a brush stroke recognized as a shape, at least, on screen in px (smaller ones, as letters, are kept) */
export const recognitionMinSize = 32;

/** Tools drawing the shapes recognized in brush strokes */
export const recognizedTools: Record<RecognizedKind, WidgetName> = {
  rect: 'square',
  ellipse: 'circle',
  triangle: 'triangle',
  diamond: 'diamond',
  line: 'line',
  arrow: 'arrow',
};

/**
 * Type names of drawing shapes (layers panel), keys of their translation
 */
export const shapeLabels: Record<string, TranslationKey> = {
  // before rectangles: notes are rectangles too
  [shapeName.note]: 'shapes.note',
  [shapeName.line]: 'shapes.freehand',
  [shapeName.straightLine]: 'shapes.line',
  [shapeName.rect]: 'shapes.rect',
  [shapeName.ellipse]: 'shapes.ellipse',
  [shapeName.arrow]: 'shapes.arrow',
  [shapeName.triangle]: 'shapes.triangle',
  [shapeName.diamond]: 'shapes.diamond',
  [shapeName.heart]: 'shapes.heart',
  [shapeName.cloud]: 'shapes.cloud',
  [shapeName.star]: 'shapes.star',
  [shapeName.hexagon]: 'shapes.hexagon',
  [shapeName.blockArrow]: 'shapes.blockArrow',
  [shapeName.bubble]: 'shapes.bubble',
  [shapeName.checkbox]: 'shapes.checkbox',
  [shapeName.highlighter]: 'shapes.highlighter',
  [shapeName.frame]: 'shapes.frame',
  [shapeName.text]: 'shapes.text',
  [shapeName.group]: 'shapes.group',
  [shapeName.image]: 'shapes.image',
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
  /** Items of the library added, removed, renamed or imported (see `drawer.library`), with the items */
  libraryChange: 'drawer.library.change',
  /** Dropdown menu hidden (event of dropdown) */
  dropdownHide: 'drawer.dropdown.hide',
  /** Toast hidden (event of toast) */
  toastHide: 'drawer.toast.hide',
  /** Plugin disabled or enabled again (`forceDisabled`), with the plugin */
  pluginChange: 'drawer.plugin.change',
  /** Slideshow started, stopped or showing another slide (see `drawer.slideshow`), with the index of the slide shown */
  slideshowChange: 'drawer.slideshow.change',
  /** Replay of the drawing started, stopped or showing another shape (see `drawer.replay`), with the index of the shape */
  replayChange: 'drawer.replay.change',
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

/**
 * Attributes of option buttons of overlays holding the value they set: button of current value found by it
 */
export const dataAttributes = {
  /** Stroke width (px) */
  strokeWidth: 'data-stroke-width',
  /** Stroke color */
  strokeColor: 'data-stroke-color',
  /** Background color */
  fillColor: 'data-fill-color',
  /** Stroke style: solid, dashed or dotted */
  strokeStyle: 'data-stroke-style',
  /** Corners of rectangles: sharp or round */
  edges: 'data-edges',
  /** Path of arrows: straight, curved or elbow */
  arrowType: 'data-arrow-type',
  /** Head of an end of arrows: none, arrow, triangle, dot or bar */
  arrowhead: 'data-arrowhead',
  /** Font size of texts (px) */
  fontSize: 'data-font-size',
  /** Font style of texts: bold or italic */
  fontStyle: 'data-font-style',
  /** Decoration of texts: underline or line-through */
  textDecoration: 'data-text-decoration',
  /** Alignment of texts: left, center or right */
  textAlign: 'data-text-align',
  /** Stacking order move of selected shapes (`ShapeOrder`) */
  order: 'data-order',
};

/**
 * Stacking orders of the selection, from bottom to top: buttons of options panels, commands of the palette
 */
export const shapeOrders: ShortcutChoice<ShapeOrder>[] = [
  { value: 'back', label: 'action.sendToBack', icon: SendToBackIcon, shortcut: 'Ctrl+Shift+Down' },
  { value: 'backward', label: 'action.sendBackward', icon: SendBackwardIcon, shortcut: 'Ctrl+Down' },
  { value: 'forward', label: 'action.bringForward', icon: BringForwardIcon, shortcut: 'Ctrl+Up' },
  { value: 'front', label: 'action.bringToFront', icon: BringToFrontIcon, shortcut: 'Ctrl+Shift+Up' },
];

/**
 * Alignments of the selection on a side or the center of its box: buttons of options panels, commands of the palette
 */
export const shapeAlignments: IconChoice<ShapeAlignment>[] = [
  { value: 'left', label: 'action.alignLeft', icon: AlignLeftIcon },
  { value: 'center', label: 'action.alignCenter', icon: AlignCenterIcon },
  { value: 'right', label: 'action.alignRight', icon: AlignRightIcon },
  { value: 'top', label: 'action.alignTop', icon: AlignTopIcon },
  { value: 'middle', label: 'action.alignMiddle', icon: AlignMiddleIcon },
  { value: 'bottom', label: 'action.alignBottom', icon: AlignBottomIcon },
];

/** Same space between selected shapes along an axis (3 at least): buttons of options panels, commands of the palette */
export const shapeDistributions: IconChoice<Direction>[] = [
  { value: 'horizontal', label: 'action.distributeHorizontal', icon: DistributeHorizontalIcon },
  { value: 'vertical', label: 'action.distributeVertical', icon: DistributeVerticalIcon },
];

/** Paths of arrows: buttons of options panels */
export const arrowTypeChoices: IconChoice<ArrowType>[] = [
  { value: 'straight', label: 'arrow.straight', icon: ArrowStraightIcon },
  { value: 'curved', label: 'arrow.curved', icon: ArrowCurvedIcon },
  { value: 'elbow', label: 'arrow.elbow', icon: ArrowElbowIcon },
];

/** Heads of the ends of arrows: buttons of options panels (icons of end heads, mirrored for start heads) */
export const arrowheadChoices: IconChoice<Arrowhead>[] = [
  { value: 'none', label: 'arrowhead.none', icon: ArrowheadNoneIcon },
  { value: 'arrow', label: 'arrowhead.arrow', icon: ArrowheadArrowIcon },
  { value: 'triangle', label: 'arrowhead.triangle', icon: ArrowheadTriangleIcon },
  { value: 'dot', label: 'arrowhead.dot', icon: ArrowheadDotIcon },
  { value: 'bar', label: 'arrowhead.bar', icon: ArrowheadBarIcon },
];

/** Selected shapes one after the other along an axis: buttons of options panels, commands of the palette */
export const shapeStacks: IconChoice<Direction>[] = [
  { value: 'horizontal', label: 'action.stackHorizontal', icon: StackHorizontalIcon },
  { value: 'vertical', label: 'action.stackVertical', icon: StackVerticalIcon },
];
