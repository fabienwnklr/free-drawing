import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import type { Drawer } from '@/Drawer';
import type { Plugin } from '@/plugins/Plugin';

/**
 * Class of a plugin, given to the `plugins` drawer option: created with the drawer, named and with its dependencies
 */
export type PluginClass<T extends Plugin = Plugin> = (new (drawer: Drawer) => T) & {
  /** Unique name of the plugin (class names are changed by minification): key of `drawer.plugins.get`, `requires` */
  readonly pluginName: string;
  /** Plugins required, created and initialized before it: classes (added when missing) or names of given plugins */
  readonly requires?: readonly (PluginClass | string)[];
};

/**
 * Plugin given to the `plugins` drawer option: its class, or its class with its options (`[StampsPlugin, { max: 20 }]`),
 * read by `Plugin.getOptions`
 */
export type PluginEntry = PluginClass | readonly [plugin: PluginClass, options?: object];

/** Options of plugins given by the app (`pluginOptions` drawer option), by plugin name, read by `Plugin.getOptions` */
export type PluginOptions = Record<string, object>;

/** Plugin required by another one: its class, or its name (plugin given to the `plugins` option) */
export type PluginRequirement = PluginClass | string;

/** Class of a toolbar widget added by a plugin (`Plugin.addWidget`), created by the toolbar */
export type WidgetClass = new (drawer: Drawer) => BaseWidget;

/** Where a command of a plugin is shown in the context menu */
export type PluginCommandMenu = 'selection' | 'drawing';

/**
 * Action of a plugin (`Plugin.addCommand`): command of the palette, shortcut shown in help, item of the context menu
 */
export type PluginCommand = {
  /** English words, unique, searched in the command palette with the label */
  id: string;
  /** Key of its text (translations of the plugin), or text */
  label: string;
  /** SVG markup of its icon, shown in the command palette */
  icon?: string;
  /** Keys running it (`Ctrl+Shift+M`, `Alt+P`: Ctrl is also Cmd), shown in palette, context menu and help (⇧⌘M, ⌥P on Apple devices) */
  shortcut?: string;
  /** Item of the context menu for selected shapes, or for the drawing (nothing selected) */
  contextMenu?: PluginCommandMenu;
  /** Does not modify the drawing (export, count...): also available in read only and while the plugin is disabled */
  readOnly?: boolean;
  /** Command available now (shown and run by its shortcut), always by default */
  isAvailable?: () => boolean;
  /** Action, run once the palette or the menu is closed */
  run: () => void;
};

/** Command added by a plugin, with its plugin (availability: plugin enabled) */
export type RegisteredCommand = {
  /** Plugin adding it */
  plugin: Plugin;
  /** The command */
  command: PluginCommand;
};

/** Listener of a plugin removed by `Plugin.destroy` */
export type PluginListener = () => void;

/** Object listened by a plugin (`Plugin.listenTo`): drawer (its events), konva node, or DOM element */
export type ListenedTarget =
  | { on: (event: string, handler: never) => unknown; off: (event: string, handler: never) => unknown }
  | EventTarget;
