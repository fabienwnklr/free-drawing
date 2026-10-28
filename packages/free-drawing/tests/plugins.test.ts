import { describe, expect, it, vi } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import { BaseWidget, Plugin, drawerEvents, shapeName, type Drawer, type PluginClass } from '@/index';
import { resolvePlugins } from '@/plugins/PluginCollection';
import { createDrawer, keydown } from './helpers';

/** Steps of plugins, in the order they ran */
const steps: string[] = [];

/** Plugin required by the stamps plugin */
class Base extends Plugin {
  static readonly pluginName = 'Base';

  /**
   * Step recorded
   */
  init() {
    steps.push('Base.init');
  }

  /**
   * Step recorded
   */
  afterInit() {
    steps.push('Base.afterInit');
  }
}

/** Tool of the stamps plugin: shortcut P */
class StampWidget extends BaseWidget {
  /**
   * Stamp tool
   * @param drawer drawer of the tool
   */
  constructor(drawer: Drawer) {
    super(drawer, 'stamp', 'Stamp', '<svg aria-hidden="true" focusable="false"></svg>', 'p');
  }
}

/** Plugin adding a tool, texts, a command, listening to changes */
class Stamps extends Plugin {
  static readonly pluginName = 'Stamps';
  static readonly requires = [Base];
  /** Stamps inserted */
  stamps = 0;
  /** Changes of the drawing listened */
  changes = 0;

  /**
   * Tool and texts, before the toolbar
   * @param drawer drawer of the plugin
   */
  constructor(drawer: Drawer) {
    super(drawer);
    steps.push('Stamps.constructor');
    this.addTranslations({
      en: { 'tools.stamp': 'Stamp', 'stamps.insert': 'Insert a stamp' },
      fr: { 'tools.stamp': 'Tampon', 'stamps.insert': 'Insérer un tampon' },
    });
    this.addWidget('stamp', StampWidget);
  }

  /**
   * Command and listener, drawer created
   */
  init() {
    steps.push('Stamps.init');
    this.addCommand({
      id: 'stamp insert',
      label: 'stamps.insert',
      shortcut: 'Alt+P',
      contextMenu: 'drawing',
      run: () => this.insert(),
    });
    this.listenTo(this.drawer, drawerEvents.change, () => this.changes++);
  }

  /**
   * Stamp added to the drawing
   */
  insert() {
    this.drawer.addShape(new Rect({ name: shapeName.rect, width: 20, height: 20, stroke: '#000' }));
    this.drawer.stage.fire('change');
    this.stamps++;
  }
}

/** Ids of toolbar widgets, in toolbar order */
const toolbar = (drawer: Drawer) => [...drawer.toolbar.widgets.keys()];

describe('Plugins', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Created after the plugins they require (added when missing), initialized once the drawer is created', () => {
    steps.length = 0;

    const drawer = createDrawer({ language: 'en', plugins: [Stamps] });

    expect(steps).toEqual(['Stamps.constructor', 'Base.init', 'Stamps.init', 'Base.afterInit']);
    expect([...drawer.plugins].map((plugin) => plugin.name)).toEqual(['Base', 'Stamps']);
    expect(drawer.plugins.get(Stamps)).toBeInstanceOf(Stamps);
    expect(drawer.plugins.get('Base')).toBeInstanceOf(Base);
    expect([drawer.plugins.has(Base), drawer.plugins.has('Other')]).toEqual([true, false]);

    // given by name: plugin of the option
    class ByName extends Plugin {
      static readonly pluginName = 'ByName';
      static readonly requires = ['Base'];
    }
    expect(resolvePlugins([ByName, Base])).toEqual([Base, ByName]);
  });

  it('Invalid plugins: without name, missing, of the same name, requiring each other', () => {
    class NoName extends Plugin {}
    class Missing extends Plugin {
      static readonly pluginName = 'Missing';
      static readonly requires = ['Absent'];
    }
    class Twin extends Plugin {
      static readonly pluginName = 'Base';
    }
    class A extends Plugin {
      static readonly pluginName = 'A';
      static readonly requires = ['B'];
    }
    class B extends Plugin {
      static readonly pluginName = 'B';
      static readonly requires = [A];
    }

    expect(() => resolvePlugins([NoName])).toThrow('plugin NoName has no static pluginName');
    expect(() => resolvePlugins([Missing])).toThrow('plugin "Absent" required by "Missing" is missing');
    expect(() => resolvePlugins([Base, Twin])).toThrow('two plugins are named "Base"');
    expect(() => resolvePlugins([B])).toThrow('plugins require each other: B → A → B');
    expect(() => createDrawer({ plugins: [Missing as PluginClass] })).toThrow('is missing');
  });

  it('Widget of a plugin: at the end of toolbar or at its place in the widgets option, translated title, shortcut', () => {
    const drawer = createDrawer({ language: 'en', plugins: [Stamps] });
    const stamp = drawer.getWidget<BaseWidget>('stamp')!;

    expect(toolbar(drawer).at(-1)).toBe('stamp');
    expect(stamp.$button.getAttribute('aria-label')).toBe('Stamp');
    drawer.setLanguage('fr');
    expect(stamp.$button.getAttribute('aria-label')).toBe('Tampon');

    keydown(drawer, { key: 'p' });
    expect(drawer.activeTool).toBe('stamp');

    // placed by the widgets option, also in a group
    const placed = createDrawer({ plugins: [Stamps], widgets: ['selection', 'stamp', 'brush'] });
    const grouped = createDrawer({
      plugins: [Stamps],
      widgets: ['selection', 'brush'],
      widgetGroups: [{ widgets: ['brush', 'stamp'] }],
    });

    expect(toolbar(placed)).toEqual(['selection', 'stamp', 'brush']);
    expect(grouped.toolbar.groups[0].widgets.map((widget) => widget.id)).toEqual(['brush', 'stamp']);

    // id of a widget of the library
    class Brushes extends Plugin {
      static readonly pluginName = 'Brushes';

      /**
       * Widget of an existing id
       * @param drawer drawer of the plugin
       */
      constructor(drawer: Drawer) {
        super(drawer);
        this.addWidget('brush', StampWidget);
      }
    }
    expect(() => createDrawer({ plugins: [Brushes] })).toThrow('widget "brush" of plugin "Brushes" already exists');
  });

  it('Commands of a plugin: palette, shortcut, context menu and help; not in read only nor when disabled', () => {
    const drawer = createDrawer({ language: 'en', plugins: [Stamps] });
    const stamps = drawer.plugins.get(Stamps)!;
    const pluginChange = vi.fn();
    const altP = () => keydown(drawer, { key: 'π', code: 'KeyP', altKey: true });
    const paletteLabels = () => {
      drawer.showCommandPalette();

      const labels = drawer.commandPalette!.commands.map((command) => `${command.label} ${command.shortcut ?? ''}`);

      drawer.commandPalette!.hide();

      return labels;
    };
    const menuItems = () => {
      drawer.contextMenu.show();

      const items = [...drawer.contextMenu.$menu.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([hidden])')].map(
        ($item) => $item.textContent
      );

      drawer.contextMenu.hide();

      return items;
    };

    // Alt changes the character: key by its place
    expect(altP()).toBe(false);
    expect([stamps.stamps, stamps.changes]).toEqual([1, 1]);
    expect(paletteLabels()).toContain('Insert a stamp Alt+P');
    expect(menuItems()).toContain('Insert a stampAlt+P');
    expect(drawer.help.$modalBody.textContent).toContain('Insert a stamp');

    // read only: command and widget unavailable
    drawer.setReadOnly(true);
    altP();
    expect(stamps.stamps).toBe(1);
    expect(paletteLabels()).not.toContain('Insert a stamp Alt+P');
    expect(drawer.getWidget<BaseWidget>('stamp')!.isDisabled).toBe(true);
    drawer.setReadOnly(false);

    // disabled for a reason, until every reason is cleared
    drawer.on(drawerEvents.pluginChange, pluginChange);
    stamps.forceDisabled('test');
    stamps.forceDisabled('other');
    expect([stamps.isEnabled, drawer.getWidget<BaseWidget>('stamp')!.isDisabled]).toEqual([false, true]);
    expect(menuItems()).not.toContain('Insert a stampAlt+P');
    altP();
    expect(stamps.stamps).toBe(1);
    // read only left: widget of a disabled plugin stays disabled
    drawer.setReadOnly(true);
    drawer.setReadOnly(false);
    expect(drawer.getWidget<BaseWidget>('stamp')!.isDisabled).toBe(true);
    stamps.clearForceDisabled('test');
    expect(stamps.isEnabled).toBe(false);
    stamps.clearForceDisabled('other');
    expect([stamps.isEnabled, drawer.getWidget<BaseWidget>('stamp')!.isDisabled]).toEqual([true, false]);
    expect(pluginChange.mock.calls).toEqual([[stamps], [stamps]]);
    altP();
    expect(stamps.stamps).toBe(2);
  });

  it('Options of a plugin: its defaults replaced by the ones given with its class, deprecated pluginOptions under it', () => {
    class Limited extends Plugin {
      static readonly pluginName = 'Limited';
      /** Options of the plugin */
      options = this.getOptions({ max: 10, color: '#f08c00' });
    }
    class Counter extends Plugin {
      static readonly pluginName = 'Counter';
      static readonly requires = [Limited];
    }
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const configured = createDrawer({ plugins: [[Limited, { max: 3 }]] });
    const defaults = createDrawer({ plugins: [Limited] });

    expect(configured.plugins.get(Limited)!.options).toEqual({ max: 3, color: '#f08c00' });
    expect(defaults.plugins.get(Limited)!.options).toEqual({ max: 10, color: '#f08c00' });
    // deprecated option: no default
    expect(defaults.options.pluginOptions).toBeUndefined();

    // required plugin given with its options: created once, before the plugin requiring it
    const required = createDrawer({ plugins: [Counter, [Limited, { color: '#000' }]] });

    expect([...required.plugins].map((plugin) => plugin.name)).toEqual(['Limited', 'Counter']);
    expect(required.plugins.get(Limited)!.options).toEqual({ max: 10, color: '#000' });
    expect(resolvePlugins([[Limited], Counter])).toEqual([Limited, Counter]);
    expect(warn).not.toHaveBeenCalled();

    // previous versions: options by name, under the ones given with the class
    const deprecated = createDrawer({
      plugins: [[Limited, { max: 5 }]],
      pluginOptions: { Limited: { max: 3, color: '#fff' } },
    });

    expect(deprecated.plugins.get(Limited)!.options).toEqual({ max: 5, color: '#fff' });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('pluginOptions option is deprecated'));
    warn.mockRestore();
  });

  it('Pointer position in drawing coordinates for plugins, view moved and zoomed', () => {
    const drawer = createDrawer();

    drawer.stage.scale({ x: 2, y: 2 });
    drawer.stage.position({ x: 10, y: 20 });
    drawer.stage.setPointersPositions(new MouseEvent('mousemove', { clientX: 50, clientY: 60 }));
    expect(drawer.getPointerPosition()).toEqual({ x: 20, y: 20 });
  });

  it('Asynchronous init waited by drawer.ready, errors logged without stopping other plugins, listeners destroyed', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const clicks = vi.fn();

    class Fonts extends Plugin {
      static readonly pluginName = 'Fonts';
      /** Fonts loaded */
      loaded = false;

      /**
       * Fonts loaded later
       */
      async init() {
        await new Promise((resolve) => setTimeout(resolve));
        this.loaded = true;
      }
    }
    class Broken extends Plugin {
      static readonly pluginName = 'Broken';

      /**
       * Init failing
       */
      init() {
        throw new Error('broken');
      }
    }
    class Listener extends Plugin {
      static readonly pluginName = 'Listener';
      static readonly requires = [Fonts, Broken];

      /**
       * Listeners of the drawer, of konva and of the DOM
       */
      init() {
        this.listenTo(this.drawer.stage, 'click', clicks);
        this.listenTo(this.drawer.$drawerContainer, 'click', clicks);
        this.listenTo(this.drawer, drawerEvents.change, clicks);
      }
    }

    const drawer = createDrawer({ plugins: [Listener] });

    expect(drawer.plugins.get(Fonts)!.loaded).toBe(false);
    await drawer.ready;
    expect(drawer.plugins.get(Fonts)!.loaded).toBe(true);
    expect(error).toHaveBeenCalledWith('[free-drawing] init of plugin "Broken" failed', expect.any(Error));

    // initialized after the ones it requires, even waiting for them
    drawer.stage.fire('click');
    drawer.$drawerContainer.click();
    drawer.stage.fire('change');
    expect(clicks).toHaveBeenCalledTimes(3);
    await drawer.plugins.destroy();
    drawer.stage.fire('click');
    drawer.$drawerContainer.click();
    drawer.stage.fire('change');
    expect(clicks).toHaveBeenCalledTimes(3);
    error.mockRestore();
  });

  it('Drawer removed during an asynchronous init: its listeners not added, next plugins not initialized', async () => {
    const changes = vi.fn();
    let loaded: () => void = () => {};

    class Slow extends Plugin {
      static readonly pluginName = 'Slow';

      /**
       * Listener added once loaded
       */
      async init() {
        await new Promise<void>((resolve) => (loaded = resolve));
        this.listenTo(this.drawer, drawerEvents.change, changes);
      }
    }
    class Next extends Plugin {
      static readonly pluginName = 'Next';
      static readonly requires = [Slow];
      /** Initialized */
      initialized = false;

      /**
       * Step recorded
       */
      init() {
        this.initialized = true;
      }
    }

    const drawer = createDrawer({ plugins: [Next] });

    await drawer.destroy();
    loaded();
    await drawer.ready;
    drawer.trigger(drawerEvents.change, drawer);
    expect(changes).not.toHaveBeenCalled();
    expect(drawer.plugins.get(Next)!.initialized).toBe(false);
  });

  it('Tool of a plugin disabled while active: the selection tool instead, not activated again after read only', () => {
    const drawer = createDrawer({ plugins: [Stamps] });
    const stamps = drawer.plugins.get(Stamps)!;

    drawer.getWidget<BaseWidget>('stamp')!.setActive(true);
    stamps.forceDisabled('test');
    expect(drawer.activeTool).toBe('selection');

    // active before read only, disabled meanwhile
    stamps.clearForceDisabled('test');
    drawer.getWidget<BaseWidget>('stamp')!.setActive(true);
    drawer.setReadOnly(true);
    stamps.forceDisabled('test');
    drawer.setReadOnly(false);
    expect(drawer.activeTool).toBe('selection');
    expect(drawer.getWidget<BaseWidget>('stamp')!.isDisabled).toBe(true);
  });
});
