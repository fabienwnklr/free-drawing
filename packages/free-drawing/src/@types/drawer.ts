import type { AvailableTools, WidgetGroupOptions, WidgetsOptions } from '@/@types/toolbar';
import type { Shape, ShapeConfig } from 'konva/lib/Shape';
import type { Group } from 'konva/lib/Group';
import type { CustomTranslations, Language } from '@/@types/i18n';
import type { DrawingFile } from '@/@types/file';
import type { CollaborationOptions } from '@/@types/collaboration';
import type { PluginClass, PluginOptions } from '@/@types/plugin';

/**
 * Node of drawing: a shape or a group of drawing nodes
 */
export type DrawingShape = Shape<ShapeConfig> | Group;

/**
 * Options of `new Drawer($el, options)`, all optional (merged with defaults), see `defaultOptions`
 */
export type DrawerOptions = {
  /** Id of drawer, unique for each drawer of a page: prefix of links to drawings (`#<id>=...`) */
  id: string;
  /** Tool activated on init (default 'brush'), the last one used is restored with a drawing saved in localStorage */
  tool: AvailableTools;
  /** Width of drawer (px, default window width) */
  width: number;
  /** Height of drawer (px, default window height) */
  height: number;
  /** Stroke width of new shapes (px, default 5) */
  strokeWidth: number;
  /** Stroke style of lines, arrows, rectangles and ellipses (default 'solid'), dashes and dots follow stroke width */
  strokeStyle: StrokeStyle;
  /** @deprecated use `strokeStyle` (a dash array gives 'dashed') */
  strokeDash?: number[];
  /** Stroke color of new shapes (default '#000') */
  strokeColor: ColorLike;
  /** Background color of new rectangles and ellipses, `'transparent'` for none (default) */
  fillColor: ColorLike;
  /** Corners of rectangles: 'sharp' (default), 'round' (radius following rectangle size) or radius (px) */
  edges: Edges;
  /** Opacity of new shapes, from 0 to 1 (default 1) */
  opacity: number;
  /** Style of new texts (font, size, style, decoration, alignment) */
  textStyle: TextStyle;
  /** Real time collaboration with socket.io server: false (default), true (same origin), server url or options */
  collaboration: boolean | string | CollaborationOptions;
  /** Widgets of toolbar: list (e.g. `['brush', 'eraser']`) or object with widget options (e.g. `{ brush: {} }`) */
  widgets: WidgetsOptions;
  /** Groups of toolbar widgets, e.g. `[{ widgets: ['line', 'square', 'circle', 'arrow'], title: 'Shapes' }]` */
  widgetGroups: WidgetGroupOptions[];
  /** Zoom with Ctrl + mouse wheel (or trackpad pinch) around pointer and two finger pinch on touch screens (default true) */
  zoom: boolean;
  /** Zoom buttons and level in footer (default true) */
  zoomWidget: boolean;
  /** Show view position (x / y) with a button back to origin, not to get lost when moving (default true) */
  positionWidget: boolean;
  /** Show a menu next to selected shapes: duplicate, rotate, bring forward, send backward, lock, delete (default true) */
  selectionMenu: boolean;
  /** Command palette in menu and with Ctrl / Cmd + K: search and run tools and commands (default true) */
  commandPalette: boolean;
  /** Theme: 'light' (default), 'dark' or 'system' (device one), the one chosen in menu is saved and used instead */
  theme: Theme;
  /** Language of interface: 'auto' (browser one, default), 'en', 'fr', 'es' or 'de', the one chosen in menu is saved */
  language: Language | 'auto';
  /** Texts replacing default ones, by language (e.g. `{ fr: { 'menu.open': 'Ouvrir un dessin' } }`) */
  translations: CustomTranslations;
  /** Layers panel listing shapes (select, rename, reorder, lock, hide, delete), button in header (default true) */
  layersPanel: boolean;
  /** Button in header saving the drawing while auto save is off, a dot shows unsaved changes (default true) */
  saveButton: boolean;
  /** Drawing can't be modified by user (only pan, zoom, view options, export), API methods still modify it (default false) */
  readOnly: boolean;
  /** Zoom factor of one wheel step (default 1.11) */
  scaling: number;
  /** Drawing saved on each change, else with "Save now" (default true, user preference) */
  autoSave: boolean;
  /** Drawing tool kept after drawing a shape, else selection tool activated, nothing selected (user preference) */
  keepTool: boolean;
  /** Key of the drawing in localStorage and prefix of other saved data (tool, preferences...), unique for each drawer */
  localStorageKey: string;
  /** User of the app (e.g. logged in): id and name used in collaboration sessions instead of ones kept in browser */
  user: DrawerUser | null;
  /** Storage of drawing instead of localStorage (e.g. server of the app), see `DrawerStorage` */
  storage: DrawerStorage | null;
  /** Plugins added to the drawer (classes extending `Plugin`), plugins they require are added too */
  plugins: PluginClass[];
  /** Options of plugins by plugin name (e.g. `{ Stamps: { max: 20 } }`), read by `Plugin.getOptions` */
  pluginOptions: PluginOptions;
};

/**
 * User of the app, see `user` option and `setUser`
 */
export type DrawerUser = {
  /** Id of user in the app, identifies the user in collaboration sessions (owner, rights, links) */
  id: string;
  /** Name shown to other users, user can change it for current visit */
  name?: string;
};

/**
 * Drawing saved somewhere else than localStorage (`storage` option)
 */
export type DrawerStorage = {
  /** Saved drawing, null if none: loaded on init (see `ready`) and by `loadFromStorage` */
  load: () => DrawingFile | string | null | Promise<DrawingFile | string | null>;
  /** Save drawing (on each change with `autoSave`): one call at a time, last drawing saved once current call ends */
  save: (file: DrawingFile) => void | Promise<void>;
};

/**
 * Interface settings of user, saved in browser (`<localStorageKey>-preferences`),
 * see `getPreferences` / `setPreferences` and `drawer.preferences.change` event
 */
export type Preferences = {
  /** Theme chosen: light, dark or the one of device */
  theme: Theme;
  /** Language chosen, 'auto' for browser one */
  language: Language | 'auto';
  /** Grid shown (grid and snapping to objects exclude each other) */
  grid: boolean;
  /** Snapping to objects */
  snapping: boolean;
  /** Zen mode: interface hidden except toolbar and menu */
  zen: boolean;
  /** Drawing saved on each change, else with `saveNow` (menu, command palette) */
  autoSave: boolean;
  /** Drawing tool kept after drawing a shape, else selection tool activated, nothing selected */
  keepTool: boolean;
};

/**
 * Stroke style of shapes: dash and dots computed from stroke width (`getDash`), read back from shape dash
 */
export type StrokeStyle = 'solid' | 'dashed' | 'dotted';

/**
 * Theme of drawer: light, dark, or the one of device
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Corners of shapes having some (rectangles): sharp, round (radius following shape size) or radius (px)
 */
export type Edges = 'sharp' | 'round' | number;

/**
 * Move of shapes in stacking order: one step (above / below next shape they overlap) or above / below all shapes
 */
export type ShapeOrder = 'forward' | 'backward' | 'front' | 'back';

/**
 * Text node style, keys match konva Text attributes
 */
export type TextStyle = {
  /** Font family (default 'Ubuntu', font of the library) */
  fontFamily: string;
  /** Font size (px, default 16) */
  fontSize: number;
  /** Weight and slant of text */
  fontStyle: 'normal' | 'bold' | 'italic' | 'italic bold';
  /** Lines under and through text, '' for none */
  textDecoration: '' | 'underline' | 'line-through' | 'underline line-through';
  /** Horizontal alignment of lines in text width */
  align: 'left' | 'center' | 'right';
};

/**
 * Options changed by Drawer setters, sent with `drawer.options.change` event (only changed keys)
 */
export type OptionsChange = Partial<
  Pick<DrawerOptions, 'strokeColor' | 'fillColor' | 'strokeWidth' | 'strokeStyle' | 'edges' | 'opacity'>
> & {
  /** Changed keys of text style */
  textStyle?: Partial<TextStyle>;
};

/**
 * CSS rgb color, e.g. `rgb(255, 0, 0)`
 */
export type RGB = `rgb(${number}, ${number}, ${number})`;
/**
 * CSS rgba color (alpha from 0 to 1), e.g. `rgba(255, 0, 0, 0.5)`
 */
export type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;
/**
 * CSS hexadecimal color, e.g. `#f00` or `#ff0000`
 */
export type HEX = `#${string}`;
/**
 * CSS named colors
 */
export type CssColorNames =
  | 'AliceBlue'
  | 'AntiqueWhite'
  | 'Aqua'
  | 'Aquamarine'
  | 'Azure'
  | 'Beige'
  | 'Bisque'
  | 'Black'
  | 'BlanchedAlmond'
  | 'Blue'
  | 'BlueViolet'
  | 'Brown'
  | 'BurlyWood'
  | 'CadetBlue'
  | 'Chartreuse'
  | 'Chocolate'
  | 'Coral'
  | 'CornflowerBlue'
  | 'Cornsilk'
  | 'Crimson'
  | 'Cyan'
  | 'DarkBlue'
  | 'DarkCyan'
  | 'DarkGoldenRod'
  | 'DarkGray'
  | 'DarkGrey'
  | 'DarkGreen'
  | 'DarkKhaki'
  | 'DarkMagenta'
  | 'DarkOliveGreen'
  | 'DarkOrange'
  | 'DarkOrchid'
  | 'DarkRed'
  | 'DarkSalmon'
  | 'DarkSeaGreen'
  | 'DarkSlateBlue'
  | 'DarkSlateGray'
  | 'DarkSlateGrey'
  | 'DarkTurquoise'
  | 'DarkViolet'
  | 'DeepPink'
  | 'DeepSkyBlue'
  | 'DimGray'
  | 'DimGrey'
  | 'DodgerBlue'
  | 'FireBrick'
  | 'FloralWhite'
  | 'ForestGreen'
  | 'Fuchsia'
  | 'Gainsboro'
  | 'GhostWhite'
  | 'Gold'
  | 'GoldenRod'
  | 'Gray'
  | 'Grey'
  | 'Green'
  | 'GreenYellow'
  | 'HoneyDew'
  | 'HotPink'
  | 'IndianRed'
  | 'Indigo'
  | 'Ivory'
  | 'Khaki'
  | 'Lavender'
  | 'LavenderBlush'
  | 'LawnGreen'
  | 'LemonChiffon'
  | 'LightBlue'
  | 'LightCoral'
  | 'LightCyan'
  | 'LightGoldenRodYellow'
  | 'LightGray'
  | 'LightGrey'
  | 'LightGreen'
  | 'LightPink'
  | 'LightSalmon'
  | 'LightSeaGreen'
  | 'LightSkyBlue'
  | 'LightSlateGray'
  | 'LightSlateGrey'
  | 'LightSteelBlue'
  | 'LightYellow'
  | 'Lime'
  | 'LimeGreen'
  | 'Linen'
  | 'Magenta'
  | 'Maroon'
  | 'MediumAquaMarine'
  | 'MediumBlue'
  | 'MediumOrchid'
  | 'MediumPurple'
  | 'MediumSeaGreen'
  | 'MediumSlateBlue'
  | 'MediumSpringGreen'
  | 'MediumTurquoise'
  | 'MediumVioletRed'
  | 'MidnightBlue'
  | 'MintCream'
  | 'MistyRose'
  | 'Moccasin'
  | 'NavajoWhite'
  | 'Navy'
  | 'OldLace'
  | 'Olive'
  | 'OliveDrab'
  | 'Orange'
  | 'OrangeRed'
  | 'Orchid'
  | 'PaleGoldenRod'
  | 'PaleGreen'
  | 'PaleTurquoise'
  | 'PaleVioletRed'
  | 'PapayaWhip'
  | 'PeachPuff'
  | 'Peru'
  | 'Pink'
  | 'Plum'
  | 'PowderBlue'
  | 'Purple'
  | 'RebeccaPurple'
  | 'Red'
  | 'RosyBrown'
  | 'RoyalBlue'
  | 'SaddleBrown'
  | 'Salmon'
  | 'SandyBrown'
  | 'SeaGreen'
  | 'SeaShell'
  | 'Sienna'
  | 'Silver'
  | 'SkyBlue'
  | 'SlateBlue'
  | 'SlateGray'
  | 'SlateGrey'
  | 'Snow'
  | 'SpringGreen'
  | 'SteelBlue'
  | 'Tan'
  | 'Teal'
  | 'Thistle'
  | 'Tomato'
  | 'Turquoise'
  | 'Violet'
  | 'Wheat'
  | 'White'
  | 'WhiteSmoke'
  | 'Yellow'
  | 'YellowGreen';

/**
 * Color of shapes and background: any CSS color (rgb, rgba, hexadecimal, name) or transparent (no fill)
 */
export type ColorLike = RGB | RGBA | HEX | CssColorNames | 'transparent';
