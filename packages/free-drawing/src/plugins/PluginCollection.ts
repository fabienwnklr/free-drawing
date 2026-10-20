import type { TranslationKey } from '@/@types/i18n';
import type { PluginClass, PluginCommandMenu, RegisteredCommand, WidgetClass } from '@/@types/plugin';
import type { Command } from '@/@types/ui';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { widgetNames } from '@/constants';
import type { Drawer } from '@/Drawer';
import type { Plugin } from '@/plugins/Plugin';
import { matchesShortcut } from '@/utils/HotKey';

/**
 * Plugin classes in creation order: required plugins before the ones requiring them, classes required by others added
 * @param classes Classes of the `plugins` drawer option
 * @returns every plugin class once, required ones first
 * @throws {Error} plugin without name, two plugins of the same name, required plugin missing, plugins requiring each
 * other
 */
export function resolvePlugins(classes: readonly PluginClass[]): PluginClass[] {
  const byName = new Map<string, PluginClass>();
  // given classes and classes they require, by name
  const collect = (plugin: PluginClass) => {
    if (!plugin.pluginName) throw new Error(`[free-drawing] plugin ${plugin.name} has no static pluginName`);

    const known = byName.get(plugin.pluginName);

    if (known === plugin) return;
    if (known) throw new Error(`[free-drawing] two plugins are named "${plugin.pluginName}"`);
    byName.set(plugin.pluginName, plugin);
    for (const required of plugin.requires ?? []) if (typeof required !== 'string') collect(required);
  };

  for (const plugin of classes) collect(plugin);

  const ordered: PluginClass[] = [];
  // names of plugins being ordered (with their required plugins)
  const path: string[] = [];
  const visit = (plugin: PluginClass) => {
    if (ordered.includes(plugin)) return;
    if (path.includes(plugin.pluginName)) {
      const loop = [...path.slice(path.indexOf(plugin.pluginName)), plugin.pluginName];

      throw new Error(`[free-drawing] plugins require each other: ${loop.join(' → ')}`);
    }
    path.push(plugin.pluginName);
    for (const required of plugin.requires ?? []) {
      const requiredPlugin = typeof required === 'string' ? byName.get(required) : required;

      if (!requiredPlugin) {
        throw new Error(
          `[free-drawing] plugin "${required}" required by "${plugin.pluginName}" is missing: add it to the plugins option`
        );
      }
      visit(requiredPlugin);
    }
    path.pop();
    ordered.push(plugin);
  };

  for (const plugin of byName.values()) visit(plugin);

  return ordered;
}

/**
 * Tasks run in order, synchronously until one returns a promise: the next ones run once it is settled
 * @param tasks Functions returning nothing or a promise (never rejected)
 * @returns promise of the last tasks, null when every task was synchronous
 */
function runInOrder(tasks: (() => void | Promise<void>)[]): Promise<void> | null {
  for (const [index, task] of tasks.entries()) {
    const result = task();

    if (result instanceof Promise) return result.then(() => runInOrder(tasks.slice(index + 1)) ?? undefined);
  }

  return null;
}

/**
 * Plugins of a drawer (`drawer.plugins`): created from the `plugins` option before the toolbar, after the plugins they
 * require, initialized once the drawer is created. Holds widgets and commands added by plugins
 */
export class PluginCollection {
  /** Drawer of the plugins */
  drawer: Drawer;
  /** Plugins in creation order, required ones first */
  #plugins: Plugin[] = [];
  /** Widgets added by plugins (`Plugin.addWidget`), by id, created by the toolbar */
  widgets = new Map<string, WidgetClass>();
  /** Commands added by plugins (`Plugin.addCommand`) */
  commands: RegisteredCommand[] = [];
  /** Resolved once every plugin is initialized (`init`, `afterInit`), waited by `drawer.ready` */
  ready: Promise<void> = Promise.resolve();

  /**
   * Plugins of a drawer, created by `_create`
   * @param drawer Drawer of the plugins
   */
  constructor(drawer: Drawer) {
    this.drawer = drawer;
  }

  /**
   * Create the plugins of the `plugins` option and the ones they require, required ones first (their constructor can
   * use `drawer.plugins`). Called by the drawer
   * @param classes Classes of the `plugins` option
   * @throws {Error} invalid plugins (see `resolvePlugins`)
   */
  _create(classes: readonly PluginClass[]) {
    for (const PluginType of resolvePlugins(classes)) this.#plugins.push(new PluginType(this.drawer));
  }

  /**
   * Plugin of the drawer
   * @param plugin Class of the plugin or its name
   * @returns the plugin, undefined when the drawer does not have it
   */
  get<T extends Plugin>(plugin: PluginClass<T> | string): T | undefined {
    return this.#plugins.find((p) => (typeof plugin === 'string' ? p.name === plugin : p.constructor === plugin)) as
      | T
      | undefined;
  }

  /**
   * Drawer has a plugin
   * @param plugin Class of the plugin or its name
   * @returns true when the plugin was created
   */
  has(plugin: PluginClass | string): boolean {
    return !!this.get(plugin);
  }

  /**
   * Plugins of the drawer, required ones first
   * @returns iterator of the plugins
   */
  [Symbol.iterator](): IterableIterator<Plugin> {
    return this.#plugins[Symbol.iterator]();
  }

  /**
   * Initialize plugins once the drawer is created: `init` of each plugin (in creation order, a promise is waited
   * before the next one), then `afterInit`, then their commands added to the context menu and help. Errors are
   * logged, other plugins are still initialized. Called by the drawer
   */
  _init() {
    const step = (plugin: Plugin, name: 'init' | 'afterInit') => () => {
      const failed = (error: unknown) =>
        console.error(`[free-drawing] ${name} of plugin "${plugin.name}" failed`, error);

      try {
        const result = plugin[name]();

        return result instanceof Promise ? result.catch(failed) : undefined;
      } catch (error) {
        failed(error);
      }
    };

    this.ready =
      runInOrder([
        ...this.#plugins.map((plugin) => step(plugin, 'init')),
        ...this.#plugins.map((plugin) => step(plugin, 'afterInit')),
        () => this._addToMenus(),
      ]) ?? Promise.resolve();
  }

  /**
   * Destroy plugins, last created first (listeners of `listenTo` removed), e.g. when the app removes the drawer
   * @returns promise resolved once every plugin is destroyed
   */
  async destroy() {
    for (const plugin of [...this.#plugins].reverse()) {
      try {
        await plugin.destroy();
      } catch (error) {
        console.error(`[free-drawing] destroy of plugin "${plugin.name}" failed`, error);
      }
    }
  }

  /**
   * Register a widget of a plugin, created by the toolbar (see `Plugin.addWidget`)
   * @param plugin Plugin adding it
   * @param id Id of the widget
   * @param widget Class of the widget
   * @throws {Error} id of another widget
   */
  _addWidget(plugin: Plugin, id: string, widget: WidgetClass) {
    if (this.widgets.has(id) || (widgetNames as string[]).includes(id)) {
      throw new Error(`[free-drawing] widget "${id}" of plugin "${plugin.name}" already exists`);
    }
    this.widgets.set(id, widget);
  }

  /**
   * Register a command of a plugin (see `Plugin.addCommand`), a second command of the same id is ignored
   * @param plugin Plugin adding it
   * @param command The command
   */
  _addCommand(plugin: Plugin, command: RegisteredCommand['command']) {
    if (this.commands.some((registered) => registered.command.id === command.id)) {
      console.warn(`[free-drawing] command "${command.id}" of plugin "${plugin.name}" ignored: its id is taken`);
      return;
    }
    this.commands.push({ plugin, command });
  }

  /**
   * Command can be run now: its plugin is enabled (not read only, not disabled by `forceDisabled`), unless the command
   * does not modify the drawing (`readOnly`), and it is available for the command
   * @param registered Command and its plugin
   * @returns true when the command is shown and its shortcut runs it
   */
  _isAvailable({ plugin, command }: RegisteredCommand): boolean {
    return (!!command.readOnly || plugin.isEnabled) && (command.isAvailable?.() ?? true);
  }

  /**
   * Available commands of plugins for the command palette, labels translated
   * @returns commands without group (added to the editor one by the palette)
   */
  _getPaletteCommands(): Omit<Command, 'group'>[] {
    return this.commands
      .filter((registered) => this._isAvailable(registered))
      .map(({ command: { id, label, icon, shortcut, run } }) => ({
        id,
        label: this.drawer.i18n.t(label as TranslationKey),
        icon,
        shortcut,
        run,
      }));
  }

  /**
   * Run the available command of plugins whose shortcut is pressed
   * @param e Key pressed in the drawer (not in a field)
   * @returns true if a command ran
   */
  _runShortcut(e: KeyboardEvent): boolean {
    const registered = this.commands.find(
      (registered) =>
        !!registered.command.shortcut &&
        matchesShortcut(e, registered.command.shortcut) &&
        this._isAvailable(registered)
    );

    registered?.command.run();

    return !!registered;
  }

  /**
   * Commands of plugins in the context menu (one section) and help, once plugins are initialized
   */
  _addToMenus() {
    const items = this.commands
      .filter(({ command }) => command.contextMenu)
      .map((registered) => ({
        label: registered.command.label,
        shortcut: registered.command.shortcut,
        visible: () => this._isAvailable(registered) && this._fitsMenu(registered.command.contextMenu!),
        run: registered.command.run,
      }));

    if (items.length) this.drawer.contextMenu.addSection(items);
    this.drawer.help.refresh();
  }

  /**
   * Context menu shown for the selection or for the drawing
   * @param menu Menu of a command
   * @returns true for `selection` with shapes selected (not locked), for `drawing` without selection
   */
  private _fitsMenu(menu: PluginCommandMenu): boolean {
    const selected = this.drawer.getSelectedShapes().length > 0;

    return menu === 'selection' ? selected && !this.drawer.getWidget<SelectWidget>('selection')?.isLocked() : !selected;
  }
}
