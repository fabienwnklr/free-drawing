import type { AvailableTools, WidgetsOptions } from './toolbar';

export type DrawerOptions = {
  id: string;
  tool: AvailableTools;
  width: number;
  height: number;
  strokeWidth: number;
  /** Stroke style of lines, arrows, rectangles and ellipses (default 'solid'), dashes and dots follow stroke width */
  strokeStyle: StrokeStyle;
  /** @deprecated use `strokeStyle` (a dash array gives 'dashed') */
  strokeDash?: number[];
  strokeColor: ColorLike;
  /** Background color of new rectangles and ellipses, `'transparent'` for none (default) */
  fillColor: ColorLike;
  opacity: number;
  textStyle: TextStyle;
  /** Real time collaboration with socket.io server: false (default), true (same origin) or server url */
  collaboration: boolean | string;
  /** Widgets of toolbar: list (e.g. `['brush', 'eraser']`) or object with widget options (e.g. `{ brush: {} }`) */
  widgets: WidgetsOptions;
  zoom: boolean;
  zoomWidget: boolean;
  /** Show view position (x / y) with a button back to origin, not to get lost when moving (default true) */
  positionWidget: boolean;
  /** Drawing can't be modified by user (only pan, zoom, view options, export), API methods still modify it (default false) */
  readOnly: boolean;
  scaling: number;
  autoSave: boolean;
  localStorageKey: string;
};

export type StrokeStyle = 'solid' | 'dashed' | 'dotted';

/**
 * Text node style, keys match konva Text attributes
 */
export type TextStyle = {
  fontFamily: string;
  fontSize: number;
  fontStyle: 'normal' | 'bold' | 'italic' | 'italic bold';
  textDecoration: '' | 'underline' | 'line-through' | 'underline line-through';
  align: 'left' | 'center' | 'right';
};

/**
 * Options changed by Drawer setters, sent with `fd.options.change` event (only changed keys)
 */
export type OptionsChange = Partial<
  Pick<DrawerOptions, 'strokeColor' | 'fillColor' | 'strokeWidth' | 'strokeStyle' | 'opacity'>
> & {
  textStyle?: Partial<TextStyle>;
};

type RGB = `rgb(${number}, ${number}, ${number})`;
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;
type HEX = `#${string}`;
type CssColorNames =
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

export type ColorLike = RGB | RGBA | HEX | CssColorNames | 'transparent';
