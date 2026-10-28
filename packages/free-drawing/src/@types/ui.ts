import type { ColorLike, DrawingShape } from '@/@types/drawer';
import type { TranslationKey } from '@/@types/i18n';
import type { I18n } from '@/i18n/I18n';
import type { ConfirmModal } from '@/components/Modal/ConfirmModal';
import type { Vector2d } from 'konva/lib/types';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';

/**
 * Choice of a group of buttons (options panels, menus, dialogs): its value and accessible name
 * @template T Value given by the button (color, width, style...)
 */
export type Choice<T> = {
  /** Value given by the button */
  value: T;
  /** Translation key of its accessible name (label, tooltip) */
  label: TranslationKey;
};

/**
 * Choice shown by an icon
 * @template T Value given by the button
 */
export type IconChoice<T> = Choice<T> & {
  /** SVG markup of its icon */
  icon: string;
};

/**
 * Choice shown by a short text (e.g. `B` for bold, `XL` for a font size)
 * @template T Value given by the button
 */
export type TextChoice<T> = Choice<T> & {
  /** Text of the button */
  text: string;
};

/**
 * Choice shown by an icon, with the keys doing the same (e.g. stacking order)
 * @template T Value given by the button
 */
export type ShortcutChoice<T> = IconChoice<T> & {
  /** Keys doing the same (`Ctrl+Up`), shown in its tooltip (`formatShortcut`) */
  shortcut: string;
};

/**
 * Type of a toast message (`drawer.toast(message, type)`): `neutral` (default, no icon), `info`, `warning` and `error`
 * (with their icon, warnings and errors announced at once by screen readers), `danger` (same as `error`)
 */
export type AvailableTypes = 'neutral' | 'info' | 'warning' | 'danger' | 'error';

/**
 * Options of `Modal` dialogs, merged with `defaultOptionsModal`
 */
export type ModalOptions = {
  /** Identifier of the dialog (creation time by default), not used by the dialog itself */
  id?: string;
  /** Title shown in header, names the dialog */
  title?: string;
  /** Header with title and close button (default true), else header removed */
  showHeader?: boolean;
  /** HTML content of body */
  bodyContent?: string;
  /** HTML content of footer (e.g. buttons) */
  footerContent?: string;
  /** Click out of the dialog hides it (default true) */
  closeOnClickOutside?: boolean;
  /** Escape key hides the dialog (default true) */
  closeOnEsc?: boolean;
  /** Dialog shown over a backdrop covering the drawer (default true) */
  backdrop?: boolean;
};

/**
 * Options of `ConfirmModal`: message, button labels and actions of its buttons
 */
export type ConfirmModalOptions = {
  /** Translated texts by default */
  message?: string;
  /** Label of cancel button (focused on show) */
  cancelLabel?: string;
  /** Label of confirm button */
  confirmLabel?: string;
  /** Click on cancel button, hides the dialog by default */
  onCancel: (modal: ConfirmModal) => void;
  /** Click on confirm button, clears the drawing and hides the dialog by default */
  onConfirm: (modal: ConfirmModal) => void;
};

/**
 * Regions of the interface of a drawer:
 * - `header`: top left (settings menu, layers button, position)
 * - `footerStart`: bottom left (zoom, undo / redo)
 * - `footer`: bottom, after its start (toolbar in the middle, help on the right)
 * - `floating`: over the canvas, placed by their component (menus, panels, overlays, dialogs, toasts, text editor)
 */
export type LayoutRegion = 'header' | 'footerStart' | 'footer' | 'floating';

/**
 * Options of an element added to a region of the interface (`layout.add`)
 */
export type LayoutItemOptions = {
  /** Hidden in zen mode */
  hideInZen?: boolean;
  /** Placed right after this element of the region, else last */
  after?: Element;
};

/**
 * Options of a `ColorPicker`
 */
export type ColorPickerOptions = {
  /** Palette: color of each button, with the translation of its accessible name */
  colors: Choice<ColorLike>[];
  /** Attribute of palette buttons, its value is the color */
  attr: string;
  /** Class of palette buttons */
  buttonClass: string;
  /** Transparent button (default false) */
  transparent?: boolean;
  /** Color chosen with a button or the custom input */
  onChange: (color: ColorLike) => void;
  /** Texts of drawer */
  i18n: I18n;
};

/** Color picked on the screen by the EyeDropper API */
export type EyeDropperResult = {
  /** Color picked, `#rrggbb` */
  sRGBHex: string;
};

/** EyeDropper API of Chromium (not in the types of the dom): picks a color anywhere on the screen */
export type EyeDropperConstructor = new () => {
  /** Lets the user pick a color, rejected when cancelled (Escape) */
  open(): Promise<EyeDropperResult>;
};

/** Window of a browser with the EyeDropper API */
export type EyeDropperWindow = Window & {
  /** EyeDropper API, undefined without (Firefox, Safari) */
  EyeDropper?: EyeDropperConstructor;
};

/**
 * Command of palette
 */
export type Command = {
  /** English words, also searched */
  id: string;
  /** Translated name */
  label: string;
  /** Title of its group */
  group: TranslationKey;
  /** SVG markup of its icon, shown before the label */
  icon?: string;
  /** Keys doing the same (`Ctrl+Shift+Z`), shown at the end of the option (`formatShortcut`: ⇧⌘Z on Apple devices) */
  shortcut?: string;
  /** State of a toggle (grid, zen mode...) or current choice (tool, language) */
  checked?: boolean;
  /** Action, run once the palette is closed */
  run: () => void;
};

/**
 * Group of the command palette: its title and its commands, absent ones (false, null, undefined) not available
 */
export type CommandGroup = [TranslationKey, (Omit<Command, 'group'> | false | null | undefined)[]];

/**
 * Item of the context menu: shown in a context, action run once the menu is hidden
 */
export type ContextMenuItem = {
  /** Button of the item */
  $item: HTMLButtonElement;
  /** Item shown for the current selection or drawing */
  visible: () => boolean;
  /** Action of the item */
  run: () => void;
};

/**
 * Section of the context menu: its items, separated from the next section
 */
export type ContextMenuSection = {
  /** Element of the section */
  $section: HTMLElement;
  /** Items of the section */
  items: ContextMenuItem[];
};

/** Item added to the context menu (`ContextMenu.addSection`: commands of plugins) */
export type ContextMenuItemOptions = {
  /** Key of its text, or text */
  label: string;
  /** Keys doing the same (`Alt+P`), shown at its end (`formatShortcut`: ⌥P on Apple devices) */
  shortcut?: string;
  /** Item shown for the current selection or drawing */
  visible: () => boolean;
  /** Action, run once the menu is hidden */
  run: () => void;
};

/** Shortcut: action, keys (several: alternatives or second action), text after keys */
export type Shortcut = {
  /** Translated action */
  label: string;
  /**
   * Keys shown, each in a `kbd` element (alternatives with `or`, else a second action such as ungroup), written in
   * English (`Ctrl+Click`, `Delete`): see `formatShortcut`
   */
  keys: string[];
  /** Keys are alternatives, separated by translated "or" */
  or?: boolean;
  /** Translated text after keys, e.g. while drawing */
  after?: string;
};

/** Navigator with the Keyboard API (Chromium, not typed by TypeScript): characters of the keys of the layout */
export type KeyboardLayoutNavigator = Navigator & {
  /** Keyboard of the device, undefined out of Chromium */
  keyboard?: {
    /** Character of each physical key on the current layout (`KeyQ`: 'a' on AZERTY...) */
    getLayoutMap?: () => Promise<Iterable<[string, string]>>;
  };
};

/** Part of the view where elements next to the selection are placed (selection menu, link editor), in px */
export type ViewArea = {
  /** Left edge */
  left: number;
  /** Top edge */
  top: number;
  /** Right edge */
  right: number;
  /** Bottom edge, above the toolbar of the footer */
  bottom: number;
};

/** Options of a slideshow (see `Slideshow.start`) */
export type SlideshowOptions = {
  /** Drawer shown on the whole screen while presenting, when the browser allows it (true by default) */
  fullscreen?: boolean;
};

/** State of a drawer before its slideshow, given back once it stops */
export type SlideshowState = {
  /** Position of the stage (px) */
  position: Vector2d;
  /** Zoom level */
  scale: number;
  /** Active tool, null without */
  tool: BaseWidget | null;
  /** Size of the stage (px), changed on the whole screen */
  size: { width: number; height: number };
};

/** Shape drawn again by the replay of a drawing (see `Replay`) */
export type ReplayStep = {
  /** Shape of the drawing */
  shape: DrawingShape;
  /** Its copy in the selection layer, shown by the replay */
  copy: DrawingShape;
  /** Time of its appearance at speed 1 (ms) */
  duration: number;
  /** Shows the copy at a progress of its appearance: 0 hidden, 1 as in the drawing */
  apply: (progress: number) => void;
};

/** State of a drawer before its replay, given back once it stops */
export type ReplayState = {
  /** Position of the stage (px) */
  position: Vector2d;
  /** Zoom level */
  scale: number;
  /** Active tool, null without */
  tool: BaseWidget | null;
};

/** Events of a dropdown menu with the arguments of their listeners */
export type DropdownEventMap = {
  /** Menu hidden */
  'drawer.dropdown.hide': [];
  /** @deprecated use `drawer.dropdown.hide` */
  'fd.dropdown.hide': [];
};

/** Events of a toast with the arguments of their listeners */
export type ToastEventMap = {
  /** Toast hidden */
  'drawer.toast.hide': [];
  /** @deprecated use `drawer.toast.hide` */
  'fd.toast.hide': [];
};
