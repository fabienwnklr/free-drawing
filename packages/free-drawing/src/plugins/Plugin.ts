import type { PluginTranslations, TranslationKey, TranslationParams } from '@/@types/i18n';
import type {
  ListenedTarget,
  PluginClass,
  PluginCommand,
  PluginListener,
  PluginRequirement,
  WidgetClass,
} from '@/@types/plugin';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import { drawerEvents } from '@/constants';
import type { Drawer } from '@/Drawer';

/**
 * Base of plugins: features added to a drawer by other developers (`plugins` drawer option). A plugin class has a
 * static `pluginName` and may `requires` other plugins, created and initialized before it. Lifecycle:
 * - constructor: created with the drawer, before its toolbar: `addWidget`, `addTranslations` (interface not created);
 * - `init`: drawer created (toolbar, menus...): `addCommand`, `listenTo`... a promise is waited before the next plugin
 * (`drawer.ready` waits for every plugin);
 * - `afterInit`: every plugin initialized (links between plugins);
 * - `destroy`: listeners of `listenTo` removed (`drawer.plugins.destroy()`).
 */
export abstract class Plugin {
  /** Unique name of the plugin (class names are changed by minification), required */
  static readonly pluginName: string = '';
  /** Plugins required by this one: classes (added when missing) or names of plugins given to the drawer */
  static readonly requires: readonly PluginRequirement[] = [];

  /** Drawer of the plugin */
  readonly drawer: Drawer;
  /** Listeners added by `listenTo`, removed by `destroy` */
  #listeners: PluginListener[] = [];
  /** Reasons disabling the plugin, see `forceDisabled` */
  #disabledBy = new Set<string>();
  /** Ids of the widgets of the plugin (`addWidget`), disabled with it */
  #widgets: string[] = [];

  /**
   * Plugin of a drawer, created before its toolbar: add widgets and translations here, the rest in `init`
   * @param drawer Drawer of the plugin
   */
  constructor(drawer: Drawer) {
    this.drawer = drawer;
    // widgets disabled by read only are enabled again after it, not the ones of a disabled plugin
    this.listenTo(drawer, drawerEvents.readOnlyChange, () => this._updateWidgets());
  }

  /**
   * Name of the plugin
   * @returns static `pluginName` of its class
   */
  get name(): string {
    return (this.constructor as PluginClass).pluginName;
  }

  /**
   * Second step of the plugin, drawer created (toolbar, menus...): commands, listeners. Nothing by default
   * @returns nothing, or a promise waited before the next plugin and by `drawer.ready`
   */
  init(): void | Promise<void> {}

  /**
   * Last step of the plugin, every plugin initialized. Nothing by default
   * @returns nothing, or a promise waited by `drawer.ready`
   */
  afterInit(): void | Promise<void> {}

  /**
   * Remove listeners of `listenTo` (call it when overriding `destroy`)
   * @returns nothing, or a promise when overridden
   */
  destroy(): void | Promise<void> {
    for (const remove of this.#listeners.splice(0)) remove();
  }

  /**
   * Plugin can modify the drawing: not in read only, nor disabled by `forceDisabled`
   * @returns true while its widgets and commands modifying the drawing are available
   */
  get isEnabled(): boolean {
    return !this.drawer.readOnly && !this.#disabledBy.size;
  }

  /**
   * Plugin disabled by `forceDisabled`, whatever read only
   * @returns true while a reason disables it
   */
  get isForceDisabled(): boolean {
    return this.#disabledBy.size > 0;
  }

  /**
   * Disable the plugin (its widgets, its commands modifying the drawing) for a reason, until `clearForceDisabled` with
   * the same id. Several reasons disable it until all of them are cleared
   * @param id Reason disabling it (name of a feature...)
   */
  forceDisabled(id: string) {
    const disabled = this.isForceDisabled;

    this.#disabledBy.add(id);
    if (!disabled) this._changed();
  }

  /**
   * Remove a reason given to `forceDisabled`: enabled again once no reason is left
   * @param id Reason given to `forceDisabled`
   */
  clearForceDisabled(id: string) {
    if (!this.#disabledBy.delete(id) || this.#disabledBy.size) return;
    this._changed();
  }

  /**
   * Options of the plugin: defaults of the plugin replaced by the ones the app gives with its class in the `plugins`
   * drawer option (`plugins: [[StampsPlugin, { max: 20 }]]`)
   * @template T options of the plugin
   * @param defaults Default value of every option
   * @returns defaults with the options of the app (merged one level deep)
   */
  getOptions<T extends object>(defaults: T): T {
    return { ...defaults, ...(this.drawer.plugins._getOptions(this.name) as Partial<T>) };
  }

  /**
   * Text of a key in the language of the drawer: texts of the plugin (`addTranslations`), of the app or of the library
   * @param key Key of the text (e.g. `stamps.insert`)
   * @param params Values of `{name}` placeholders
   * @returns text in current language, in English when missing, else the key
   */
  t(key: string, params?: TranslationParams): string {
    return this.drawer.i18n.t(key as TranslationKey, params);
  }

  /**
   * Texts of the plugin, by language (its own keys; `tools.<widget id>` for the title of a widget). Add them in the
   * constructor: titles of widgets are translated when the toolbar is created. The `translations` drawer option can
   * replace them
   * @param translations Texts by language, English used for missing ones
   */
  addTranslations(translations: PluginTranslations) {
    this.drawer.i18n.extend(translations);
  }

  /**
   * Widget added to the toolbar, at its place in the `widgets` and `widgetGroups` drawer options, else at the end.
   * Call it in the constructor (the toolbar is created after plugins). Its title is the text of `tools.<id>`, its
   * shortcut the one given to its class (a letter, also in help and command palette)
   * @param id Id of the widget, given to the constructor of `BaseWidget` by its class: unique
   * @param widget Class of the widget (extends `BaseWidget`, `ShapeWidget`...), created by the toolbar
   */
  addWidget(id: string, widget: WidgetClass) {
    this.drawer.plugins._addWidget(this, id, widget);
    this.#widgets.push(id);
  }

  /**
   * Action of the plugin: command of the palette, shortcut (shown in help), item of the context menu. Call it in
   * `init`: the context menu and help get the commands of plugins once they are initialized
   * @param command Id, label, shortcut, menu, availability and action of the command
   */
  addCommand(command: PluginCommand) {
    this.drawer.plugins._addCommand(this, command);
  }

  /**
   * Listen an event until the plugin is destroyed: of the drawer (`drawerEvents`), of a konva node (stage, layers,
   * shapes...) or of a DOM element
   * @param target Drawer, konva node or DOM element
   * @param event Name of the event (several ones separated by spaces for the drawer and konva nodes)
   * @param handler Function called with the arguments of the event
   */
  listenTo(target: ListenedTarget, event: string, handler: (...args: never[]) => unknown) {
    if (target instanceof EventTarget) {
      target.addEventListener(event, handler as EventListener);
      this.#listeners.push(() => target.removeEventListener(event, handler as EventListener));
    } else {
      target.on(event, handler as never);
      this.#listeners.push(() => target.off(event, handler as never));
    }
  }

  /**
   * Enabled state changed: widgets of the plugin disabled or enabled, `drawer.plugin.change` triggered
   */
  private _changed() {
    this._updateWidgets();
    this.drawer.trigger(drawerEvents.pluginChange, this);
  }

  /**
   * Widgets of the plugin disabled while it is disabled (or in read only)
   */
  private _updateWidgets() {
    for (const id of this.#widgets) this.drawer.getWidget<BaseWidget>(id)?.setDisabled(!this.isEnabled);
  }
}
