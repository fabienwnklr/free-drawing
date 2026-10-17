import '@/components/toolbar/toolbar.scss';
import { Drawer } from '@/Drawer';
import { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import { BrushWidget } from '@/components/toolbar/widgets/Brush/Brush';
import { EraserWidget } from '@/components/toolbar/widgets/Eraser/Eraser';
import { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { AvailableTools, WidgetGroupOptions, WidgetName } from '@/@types/toolbar';
import { PanWidget } from '@/components/toolbar/widgets/Pan/Pan';
import { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import { LineWidget } from '@/components/toolbar/widgets/Line/Line';
import { SquareWidget } from '@/components/toolbar/widgets/Square/Square';
import { CircleWidget } from '@/components/toolbar/widgets/Circle/Circle';
import { ArrowWidget } from '@/components/toolbar/widgets/Arrow/Arrow';
import { TriangleWidget } from '@/components/toolbar/widgets/Triangle/Triangle';
import { DiamondWidget } from '@/components/toolbar/widgets/Diamond/Diamond';
import { HeartWidget } from '@/components/toolbar/widgets/Heart/Heart';
import { CloudWidget } from '@/components/toolbar/widgets/Cloud/Cloud';
import { HighlighterWidget } from '@/components/toolbar/widgets/Highlighter/Highlighter';
import { LaserWidget } from '@/components/toolbar/widgets/Laser/Laser';
import { FrameWidget } from '@/components/toolbar/widgets/Frame/Frame';
import { GroupWidget } from '@/components/toolbar/widgets/GroupWidget';
import { getWidgetGroups, getWidgetNames } from '@/utils/widgets';
import { arrowNavigation, createButton, setLabel, setPressed } from '@/utils/dom';
import { stringToNode } from '@/utils/functions';
import { drawerEvents } from '@/constants';
import PinIcon from '@/icons/pin.svg?raw';

const widgetClasses: Record<WidgetName, new (drawer: Drawer) => BaseWidget> = {
  pan: PanWidget,
  selection: SelectWidget,
  brush: BrushWidget,
  eraser: EraserWidget,
  text: TextWidget,
  line: LineWidget,
  square: SquareWidget,
  circle: CircleWidget,
  arrow: ArrowWidget,
  triangle: TriangleWidget,
  diamond: DiamondWidget,
  heart: HeartWidget,
  cloud: CloudWidget,
  highlighter: HighlighterWidget,
  laser: LaserWidget,
  frame: FrameWidget,
};

/**
 * Toolbar of the footer: buttons of widgets (tools) and groups of widgets, created from `widgets` and `widgetGroups`
 * options. Buttons are reached with Tab once (roving tabindex), arrow keys move between them.
 */
export class Toolbar {
  /** Drawer of this toolbar */
  drawer: Drawer;
  /** Element with role `toolbar` holding buttons of widgets and groups */
  $toolbarRoot: HTMLElement;
  /** Widgets of toolbar, also those of groups */
  widgets: Map<AvailableTools, BaseWidget> = new Map();
  /** Groups of widgets, in toolbar order */
  groups: GroupWidget[] = [];
  /** Container of the toolbar, added to the `footer` region of the layout */
  $toolbarContent: HTMLDivElement;
  /** Keep tool after drawing (`keepTool` preference), first button, with selection widget only */
  $keepToolButton: HTMLButtonElement | null = null;

  /**
   * Create the toolbar in the footer with widgets and groups of drawer options
   * @param drawer Drawer whose tools the toolbar shows
   */
  constructor(drawer: Drawer) {
    this.drawer = drawer;

    this.$toolbarContent = document.createElement('div');
    this.$toolbarContent.classList.add('drawer-toolbar-container');
    this.$toolbarRoot = document.createElement('div');
    this.$toolbarRoot.classList.add(`drawer-toolbar-root`, 'tool');
    this.$toolbarRoot.setAttribute('role', 'toolbar');
    this.drawer.i18n.translate((t) => this.$toolbarRoot.setAttribute('aria-label', t('toolbar.label')));

    this.$toolbarContent.append(this.$toolbarRoot);
    this.drawer.layout.add('footer', this.$toolbarContent);
    this.init();
    // tool replaced by selection after drawing: useless without it
    if (this.widgets.has('selection')) this._addKeepTool();

    // buttons of toolbar: widgets and groups (widgets of a group: arrow keys once it is open)
    arrowNavigation(
      this.$toolbarRoot,
      () => this._getButtons(),
      'horizontal',
      ($button) => this.setTabStop($button)
    );
    // widgets disabled in read only
    this.drawer.on(drawerEvents.readOnlyChange, () => this.update());
  }

  /**
   * Create widgets of `widgets` option, in its order, and groups of `widgetGroups` option at the place of their first
   * widget. Called by the constructor.
   */
  init() {
    // widgets option (list or object), in given order, a group at the place of its first widget
    const names = getWidgetNames(this.drawer.options.widgets);
    const groups = getWidgetGroups(this.drawer.options.widgetGroups ?? [], names);
    const added = new Set<WidgetGroupOptions>();

    names.forEach((name) => {
      const group = groups.find(({ widgets }) => widgets.includes(name));

      if (!group) {
        this.addWidget(new widgetClasses[name](this.drawer));
      } else if (!added.has(group)) {
        added.add(group);
        this.addGroup(
          new GroupWidget(this.drawer, {
            ...group,
            widgets: group.widgets.map((n) => new widgetClasses[n](this.drawer)),
          })
        );
      }
    });
  }

  /**
   * Add a widget at the end of toolbar, out of groups
   * @param widget Widget whose button is added, registered by its id
   */
  addWidget(widget: BaseWidget) {
    this.widgets.set(widget.id, widget);
    widget.addTo(this.$toolbarRoot);
    this._initTabStop();
  }

  /**
   * Add a group of widgets (created by the app or the library), its widgets become widgets of toolbar
   * @param group Group whose button is added at the end of toolbar
   */
  addGroup(group: GroupWidget) {
    for (const widget of group.widgets) this.widgets.set(widget.id, widget);
    this.groups.push(group);
    group.addTo(this.$toolbarRoot);
    this._initTabStop();
  }

  /**
   * Make a widget the active tool of drawer (`activeWidget`, `activeTool`), its button (or group) the tab stop.
   * Called by `BaseWidget.setActive`, which activates a widget: call that one instead.
   * @param widget Widget becoming the active tool
   */
  setActiveWidget(widget: BaseWidget) {
    this.drawer.activeWidget = widget;
    this.drawer.activeTool = widget.id;
    this.setTabStop(this.getButton(widget));
    this.update();
  }

  /**
   * Button of a widget in toolbar: its own, or the button of its group
   * @param widget Widget of toolbar
   * @returns Button of the group holding the widget, else the button of the widget
   */
  getButton(widget: BaseWidget): HTMLButtonElement {
    return this.groups.find((group) => group.widgets.includes(widget))?.$button ?? widget.$button;
  }

  /**
   * State of groups buttons: highlighted while one of their widgets is active, disabled with them
   */
  update() {
    for (const group of this.groups) group.update();
  }

  /**
   * Only given button of toolbar is reached with Tab (roving tabindex), arrow keys move between them
   * @param $button Top button (widget or group) getting tabindex 0, others get -1
   */
  setTabStop($button: HTMLElement) {
    for (const $btn of this._getButtons()) $btn.tabIndex = $btn === $button ? 0 : -1;
    // widgets of groups reached with arrow keys
    for (const group of this.groups) {
      for (const widget of group.widgets) widget.$button.tabIndex = -1;
    }
  }

  /**
   * Toggle button keeping drawing tool after drawing (Q), separated from widgets
   */
  private _addKeepTool() {
    const $container = document.createElement('div');
    const $button = createButton('drawer-button', 'drawer-button-neutral');
    const $shortcut = document.createElement('div');
    const $separator = document.createElement('div');

    $container.classList.add('drawer-tool-container', 'drawer-tool-button-container', 'drawer-tool-keep');
    $button.setAttribute('aria-keyshortcuts', 'Q');
    $shortcut.classList.add('tool-key-shortcut');
    // announced with aria-keyshortcuts
    $shortcut.setAttribute('aria-hidden', 'true');
    $shortcut.textContent = 'q';
    $button.append(stringToNode<SVGElement>(PinIcon), $shortcut);
    $button.addEventListener('click', () => this.drawer.setKeepTool(!this.drawer.options.keepTool));
    $separator.classList.add('drawer-toolbar-separator');
    $separator.setAttribute('role', 'separator');
    $separator.setAttribute('aria-orientation', 'vertical');
    $container.append($button);
    this.$toolbarRoot.prepend($container, $separator);
    this.$keepToolButton = $button;

    this.drawer.i18n.translate((t) => setLabel($button, t('toolbar.keepTool')));
    setPressed($button, this.drawer.options.keepTool);
    this.drawer.on(drawerEvents.preferencesChange, () => setPressed($button, this.drawer.options.keepTool));
    this._initTabStop();
  }

  /**
   * Buttons of toolbar in order: widgets and groups, not widgets of groups
   * @returns Top buttons of toolbar, keep tool button first when shown
   */
  private _getButtons() {
    return [...this.$toolbarRoot.children]
      .map(($item) => $item.querySelector<HTMLButtonElement>(':scope > button'))
      .filter(($button): $button is HTMLButtonElement => !!$button);
  }

  /**
   * First button is the tab stop until a tool is active
   */
  private _initTabStop() {
    const { activeWidget } = this.drawer;

    this.setTabStop(activeWidget ? this.getButton(activeWidget) : this._getButtons()[0]);
  }

  /**
   * Widget of toolbar (also of a group) by its id
   * @param name Id of the widget
   * @returns The widget cast to `T`, undefined if toolbar has no such widget
   */
  getWidget<T>(name: AvailableTools): T | undefined {
    return this.widgets.get(name) as T;
  }
}
