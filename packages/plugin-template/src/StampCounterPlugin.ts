import { Plugin, createButton, drawerEvents, setLabel, type Drawer } from '@fabwcie/free-drawing';
import { stampIcon } from './icons';
import { StampsPlugin } from './StampsPlugin';

/**
 * Template of a plugin using another one: a button of the header shows the number of stamps of `StampsPlugin`, a
 * click tells it. Shows `requires` with a class, `afterInit`, an element added to a region of the layout, listeners of
 * a DOM element and of drawer events, `destroy` removing its element.
 */
export class StampCounterPlugin extends Plugin {
  /** Unique name of the plugin */
  static readonly pluginName = 'StampCounter';

  /**
   * Plugin required: its class, created and initialized before this one, added when the app does not give it. With
   * its name (`['Stamps']`), the app must give it in the `plugins` option
   */
  static readonly requires = [StampsPlugin];

  /** Element of the header: `tool` class gives the surface of the panels of the drawer (background, shadow) */
  readonly $container = document.createElement('div');
  /** Button of the header: icon and number of stamps, named by the counter text */
  readonly $button = createButton('drawer-button', 'drawer-button-neutral', 'stamp-counter');
  /** Number of stamps in the button */
  readonly $count = document.createElement('span');
  /** Stamps plugin, available once every plugin is initialized (`afterInit`) */
  #stamps: StampsPlugin | null = null;

  /**
   * Counter plugin: its texts are in the translations of the stamps plugin (a plugin can add its own)
   * @param drawer drawer of the plugin
   */
  constructor(drawer: Drawer) {
    super(drawer);
    this.$container.classList.add('stamp-counter-container', 'tool');
    this.$button.innerHTML = stampIcon;
    this.$button.append(this.$count);
    this.$container.append(this.$button);
  }

  /**
   * Button added to the header (regions: `header`, `footerStart`, `footer`, `floating`), hidden in zen mode, and
   * listeners: DOM element, drawer events
   */
  init() {
    this.drawer.layout.add('header', this.$container, { hideInZen: true });
    // DOM element: removed by `destroy`, as the listeners of the drawer and of konva nodes
    this.listenTo(this.$button, 'click', () =>
      this.drawer.toast(this.t('stamps.counted', { count: this.#stamps?.getStamps().length ?? 0 }), 'info')
    );
    this.listenTo(this.drawer, drawerEvents.change, () => this.update());
    this.listenTo(this.drawer, drawerEvents.languageChange, () => this.update());
    // another plugin disabled or enabled again (limit of stamps)
    this.listenTo(this.drawer, drawerEvents.pluginChange, (plugin: Plugin) => {
      if (plugin === this.#stamps) this.update();
    });
  }

  /**
   * Every plugin initialized: the stamps plugin is ready (its asynchronous `init` is done)
   */
  afterInit() {
    this.#stamps = this.drawer.plugins.get(StampsPlugin) ?? null;
    this.update();
  }

  /**
   * Number of stamps and name of the button, dimmed while stamps are disabled (limit, read only)
   */
  update() {
    const count = this.#stamps?.getStamps().length ?? 0;

    this.$count.textContent = String(count);
    setLabel(this.$button, this.t('stamps.counter', { count }));
    this.$button.classList.toggle('is-off', !this.#stamps?.isEnabled);
  }

  /**
   * Element of the header removed, then listeners (`super.destroy()`)
   * @returns nothing, or a promise
   */
  destroy() {
    this.$container.remove();

    return super.destroy();
  }
}
