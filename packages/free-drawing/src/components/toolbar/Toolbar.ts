import '@/components/toolbar/toolbar.scss';
import { Drawer } from '@/Drawer';
import { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import { BrushWidget } from '@/components/toolbar/widgets/Brush/Brush';
import { EraserWidget } from '@/components/toolbar/widgets/Eraser/Eraser';
import { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { AvailableTools, WidgetName } from '@/@types/toolbar';
import { PanWidget } from '@/components/toolbar/widgets/Pan/Pan';
import { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import { LineWidget } from '@/components/toolbar/widgets/Line/Line';
import { SquareWidget } from '@/components/toolbar/widgets/Square/Square';
import { CircleWidget } from '@/components/toolbar/widgets/Circle/Circle';
import { ArrowWidget } from '@/components/toolbar/widgets/Arrow/Arrow';
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
    this.drawer.i18n.translate((t) => this.$toolbarRoot.setAttribute('aria-label', t('toolbar.label')));

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
