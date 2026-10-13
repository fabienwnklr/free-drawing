import './toolbar.scss';
import { Drawer } from '@/Drawer';
import { BaseWidget } from './widgets/BaseWidget';
import { BrushWidget } from './widgets/Brush/Brush';
import { EraserWidget } from './widgets/Eraser/Eraser';
import { SelectWidget } from './widgets/Select/Select';
import type { AvailableTools, WidgetName } from '../../@types/toolbar';
import { PanWidget } from './widgets/Pan/Pan';
import { TextWidget } from './widgets/Text/Text';
import { LineWidget } from './widgets/Line/Line';
import { SquareWidget } from './widgets/Square/Square';
import { CircleWidget } from './widgets/Circle/Circle';
import { ArrowWidget } from './widgets/Arrow/Arrow';
import { getWidgetNames } from '@/utils/widgets';
import { arrowNavigation } from '@/utils/dom';

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
};

export class Toolbar {
  drawer: Drawer;
  $toolbarRoot: HTMLElement;
  widgets: Map<AvailableTools, BaseWidget> = new Map();
  $toolbarContent: HTMLDivElement;

  constructor(drawer: Drawer) {
    this.drawer = drawer;

    this.$toolbarContent = document.createElement('div');
    this.$toolbarContent.classList.add('drawer-toolbar-container');
    this.$toolbarRoot = document.createElement('div');
    this.$toolbarRoot.classList.add(`drawer-toolbar-root`, 'tool');
    this.$toolbarRoot.setAttribute('role', 'toolbar');
    this.$toolbarRoot.setAttribute('aria-label', 'Tools');

    this.$toolbarContent.append(this.$toolbarRoot);
    this.drawer.$footerContainer.append(this.$toolbarContent);
    this.init();

    arrowNavigation(
      this.$toolbarRoot,
      () => Array.from(this.widgets.values()).map((widget) => widget.$button),
      'horizontal',
      ($button) => this.setTabStop($button)
    );
  }

  init() {
    // widgets option (list or object), in given order
    getWidgetNames(this.drawer.options.widgets).forEach((name) => this.addWidget(new widgetClasses[name](this.drawer)));
  }

  addWidget(widget: BaseWidget) {
    this.widgets.set(widget.id, widget);
    widget.addTo(this.$toolbarRoot);
    // first tool is the tab stop until a tool is active
    widget.$button.tabIndex = this.widgets.size === 1 ? 0 : -1;
  }

  setActiveWidget(widget: BaseWidget) {
    this.drawer.activeWidget = widget;
    this.drawer.activeTool = widget.id;
    this.setTabStop(widget.$button);
  }

  /**
   * Only given tool button is reached with Tab (roving tabindex), arrow keys move between tools
   */
  setTabStop($button: HTMLElement) {
    this.widgets.forEach((widget) => (widget.$button.tabIndex = widget.$button === $button ? 0 : -1));
  }

  getWidget<T>(name: AvailableTools): T | undefined {
    return this.widgets.get(name) as T;
  }
}
