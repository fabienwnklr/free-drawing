import { Group } from 'konva/lib/Group';
import type { KonvaEventObject } from 'konva/lib/Node';
import { Ellipse } from 'konva/lib/shapes/Ellipse';
import { Text } from 'konva/lib/shapes/Text';
import type { Vector2d } from 'konva/lib/types';
import {
  Plugin,
  drawerEvents,
  shapeName,
  type Drawer,
  type DrawingShape,
  type SelectWidget,
} from '@fabwcie/free-drawing';
import { selectStampsIcon, stampIcon } from './icons';
import { translations } from './translations';
import type { StampsOptions } from './types';
import { StampWidget } from './widgets/StampWidget';
import { ZoneWidget } from './widgets/ZoneWidget';

/**
 * Name marking stamps among the names of the library. Shapes of plugins are shapes of the library (here a group of an
 * ellipse and a text): files, links, history, export and collaboration handle them without anything else to do. Names
 * of the library (`shapeName.group`, `shapeName.ellipse`, `shapeName.text`) keep their behavior: options panel, text
 * edited by double click...
 */
export const stampName = 'stamp';

/**
 * Template plugin: stamps (circles with a symbol) placed with a tool or a command, a tool drawing zones, a limit of
 * stamps given by the app. It shows every part of a plugin:
 * 1. static `pluginName` and `requires`;
 * 2. options of the app (`getOptions`);
 * 3. constructor, before the toolbar: texts (`addTranslations`) and tools (`addWidget`);
 * 4. `init`, once the drawer is created (may be asynchronous): commands (`addCommand`) and listeners (`listenTo`);
 * 5. `afterInit`, `destroy`;
 * 6. enabled state (`isEnabled`, `forceDisabled`, `clearForceDisabled`), texts (`t`);
 * 7. methods used by its tools, its commands and other plugins (`StampCounterPlugin`).
 */
export class StampsPlugin extends Plugin {
  // 1. Static members ---------------------------------------------------------------------------------------------

  /**
   * Unique name of the plugin (class names are changed by minification): `drawer.plugins.get('Stamps')`,
   * `requires: ['Stamps']` of other plugins, `pluginOptions: { Stamps: {...} }` of the app
   */
  static readonly pluginName = 'Stamps';

  /**
   * Plugins required, created and initialized before this one: classes (added when the app does not give them) or
   * names (the app gives them). None here, see `StampCounterPlugin`
   */
  static readonly requires = [];

  // 2. Options of the app -----------------------------------------------------------------------------------------

  /** Options: these defaults replaced by the ones of the app (`pluginOptions.Stamps` of the drawer) */
  readonly options = this.getOptions<StampsOptions>({
    symbols: ['✓', '★', '!'],
    colors: ['#b2f2bb', '#a5d8ff', '#ffec99', '#ffc9c9'],
    size: 48,
    max: 0,
  });

  /** Plugin disabled by the limit of stamps (`max` option) */
  #limited = false;

  // 3. Constructor: before the toolbar ----------------------------------------------------------------------------

  /**
   * Texts and tools of the plugin. The interface of the drawer (toolbar, menus, help) is not created yet: only
   * register here, use it in `init`
   * @param drawer drawer of the plugin
   */
  constructor(drawer: Drawer) {
    super(drawer);
    // texts by language: `tools.<id>` gives the titles of the tools added below
    this.addTranslations(translations);
    // tools: at their place in the `widgets` (and `widgetGroups`) drawer option, else at the end of the toolbar
    this.addWidget('stamp', StampWidget);
    this.addWidget('zone', ZoneWidget);
  }

  // 4. Init: drawer created ---------------------------------------------------------------------------------------

  /**
   * Commands and listeners. Asynchronous here to show it: `drawer.ready` waits for it, the next plugins are
   * initialized once it is done (a font, data of a server...)
   * @returns promise resolved once the plugin is initialized
   */
  async init() {
    // symbols drawn with the fonts of the page (nothing to wait without the font API)
    await document.fonts?.ready;

    // command of the command palette, run by its shortcut (shown in help), item of the context menu of the drawing
    this.addCommand({
      id: 'stamp middle center view',
      label: 'stamps.center',
      icon: stampIcon,
      // Ctrl is also Cmd; avoid the shortcuts of the library (listed in help): plugins run first
      shortcut: 'Alt+P',
      contextMenu: 'drawing',
      run: () => this.stamp(this._viewCenter()),
    });
    // command shown only when it can run. Selecting does not modify the drawing (`readOnly`): available while the
    // plugin is disabled (limit: select stamps to remove some), but not in read only, which has no selection
    this.addCommand({
      id: 'stamps select all',
      label: 'stamps.selectAll',
      icon: selectStampsIcon,
      readOnly: true,
      isAvailable: () => this.getStamps().length > 0 && !!this._selectWidget() && !this.drawer.readOnly,
      run: () => this._selectWidget()?.select(this.getStamps()),
    });
    // item of the context menu of selected shapes
    this.addCommand({
      id: 'stamps remove delete selected',
      label: 'stamps.removeSelected',
      contextMenu: 'selection',
      isAvailable: () => this._selectedStamps().length > 0,
      run: () => this.drawer.deleteShapes(this._selectedStamps()),
    });
    // does not modify the drawing: also available in read only and while the plugin is disabled (limit)
    this.addCommand({
      id: 'stamps count number',
      label: 'stamps.count',
      readOnly: true,
      contextMenu: 'drawing',
      run: () => this.drawer.toast(this.t('stamps.counted', { count: this.getStamps().length }), 'info'),
    });

    // listeners removed by `destroy`: event of the drawer (`drawerEvents`)...
    this.listenTo(this.drawer, drawerEvents.change, () => this._checkLimit());
    // ... of a konva node: double click on the circle of a stamp gives its next color
    this.listenTo(this.drawer.drawLayer, 'dblclick dbltap', (e: KonvaEventObject<MouseEvent>) => this._nextColor(e));
    // (and of a DOM element, see `StampCounterPlugin`)

    // drawing loaded before the plugin
    this._checkLimit();
  }

  // 5. After init, destroy ----------------------------------------------------------------------------------------

  /**
   * Every plugin initialized: other plugins can be used (see `StampCounterPlugin`). Nothing to do here
   */
  afterInit() {}

  /**
   * Plugin destroyed (`drawer.plugins.destroy()`): remove what the plugin added out of `listenTo` (elements, timers),
   * then call `super.destroy()`, which removes its listeners
   * @returns nothing, or a promise
   */
  destroy() {
    return super.destroy();
  }

  // 7. Methods of the plugin --------------------------------------------------------------------------------------

  /**
   * Stamps of the drawing, also in frames and groups
   * @returns groups of the stamps, bottom first
   */
  getStamps(): Group[] {
    return this.drawer.drawLayer.find<Group>(`.${stampName}`);
  }

  /**
   * Stamp added to the drawing: circle of the first color, first symbol
   * @param point center of the stamp, in drawing coordinates
   * @param save change saved (history, storage, collaboration) and stamp placed in the frame under it; false while it
   * is still moved (see `StampWidget`)
   * @returns the stamp, null when the plugin is disabled (read only, limit of stamps)
   */
  stamp(point: Vector2d, save: boolean = true): Group | null {
    // 6. enabled: not in read only, not disabled by `forceDisabled`
    if (!this.isEnabled) return null;

    const { size, symbols, colors } = this.options;
    // name in the layers panel (`label` attribute), in the language of the drawer
    const stamp = new Group({
      name: `${shapeName.group} ${stampName}`,
      x: point.x,
      y: point.y,
      label: this.t('tools.stamp'),
    });

    stamp.add(
      new Ellipse({
        name: shapeName.ellipse,
        radiusX: size / 2,
        radiusY: size / 2,
        fill: colors[0],
        stroke: '#1e1e1e',
        strokeWidth: 2,
      }),
      new Text({
        name: shapeName.text,
        text: symbols[0],
        fontFamily: 'Ubuntu',
        fontSize: Math.round(size / 2),
        fill: '#1e1e1e',
        // box of the symbol only: the ring around it is the circle (double click: next color)
        width: size / 2,
        height: size / 2,
        offsetX: size / 4,
        offsetY: size / 4,
        align: 'center',
        verticalAlign: 'middle',
      })
    );
    // drawing shapes are added with `addShape` (ids, hit regions, draggable with the selection tool)
    this.drawer.addShape(stamp);
    if (save) this.save([stamp]);

    return stamp;
  }

  /**
   * Shapes added or changed by the plugin saved: put in the frame under them, then the `change` of the drawer (history,
   * storage, collaboration, events)
   * @param shapes shapes added or moved
   */
  save(shapes: DrawingShape[]) {
    this.drawer.placeInFrames(shapes);
    this.drawer.stage.fire('change');
  }

  /**
   * Middle of the view, in drawing coordinates (zoom and position of the view)
   * @returns point of the drawing in the middle of the view
   */
  private _viewCenter(): Vector2d {
    const { stage } = this.drawer;

    return stage
      .getAbsoluteTransform()
      .copy()
      .invert()
      .point({ x: stage.width() / 2, y: stage.height() / 2 });
  }

  /**
   * Selection tool of the drawer (it may be left out by the `widgets` option)
   * @returns the selection widget, undefined without it
   */
  private _selectWidget() {
    return this.drawer.getWidget<SelectWidget>('selection');
  }

  /**
   * Stamps among the selected shapes
   * @returns selected stamps
   */
  private _selectedStamps(): DrawingShape[] {
    return this.drawer.getSelectedShapes().filter((shape) => shape.hasName(stampName));
  }

  /**
   * Plugin disabled while the drawing has the most stamps (`max` option), told once; enabled again below it. Its
   * tools are disabled with it, `drawer.plugin.change` tells other plugins (`StampCounterPlugin`)
   */
  private _checkLimit() {
    const { max } = this.options;
    const limited = max > 0 && this.getStamps().length >= max;

    if (limited === this.#limited) return;
    this.#limited = limited;
    if (limited) {
      // 6. disabled for a reason, until `clearForceDisabled` with the same reason (other reasons may remain)
      this.forceDisabled('limit');
      this.drawer.toast(this.t('stamps.limit', { max }), 'warning');
    } else {
      this.clearForceDisabled('limit');
    }
  }

  /**
   * Double click on the circle of a stamp: next color (a double click on its symbol edits it, as any text)
   * @param e double click on the draw layer
   */
  private _nextColor(e: KonvaEventObject<MouseEvent>) {
    const circle = e.target;

    if (!this.isEnabled || !(circle instanceof Ellipse) || !circle.findAncestor(`.${stampName}`)) return;

    const { colors } = this.options;

    circle.fill(colors[(colors.indexOf(circle.fill() as string) + 1) % colors.length]);
    this.drawer.stage.fire('change');
  }
}
