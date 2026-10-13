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

    this.$toolbarContent.append(this.$toolbarRoot);
    this.drawer.$footerContainer.append(this.$toolbarContent);
    this.init();
  }

  init() {
    // widgets option (list or object), in given order
    getWidgetNames(this.drawer.options.widgets).forEach((name) => this.addWidget(new widgetClasses[name](this.drawer)));
  }

  addWidget(widget: BaseWidget) {
    this.widgets.set(widget.id, widget);
    widget.addTo(this.$toolbarRoot);
  }

  setActiveWidget(widget: BaseWidget) {
    this.drawer.activeWidget = widget;
    this.drawer.activeTool = widget.id;
  }

  getWidget<T>(name: AvailableTools): T | undefined {
    return this.widgets.get(name) as T;
  }
}
