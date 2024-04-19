import './toolbar.scss';
import { Drawer } from '@/Drawer';
import { BaseWidget } from './widgets/BaseWidget';
import { BrushWidget } from './widgets/Brush/Brush';
import { EraserWidget } from './widgets/Eraser/Eraser';
import { SelectWidget } from './widgets/Select/Select';
import { AvailableTools } from '../../@types/toolbar';
import { PanWidget } from './widgets/Pan/Pan';
import { TextWidget } from './widgets/Text/Text';
import { LineWidget } from './widgets/Line/Line';
import { SquareWidget } from './widgets/Square/Square';
import { CircleWidget } from './widgets/Circle/Circle';
import { ArrowWidget } from './widgets/Arrow/Arrow';

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
    this.addWidget(new PanWidget(this.drawer));
    this.addWidget(new SelectWidget(this.drawer));
    this.addWidget(new BrushWidget(this.drawer));
    this.addWidget(new EraserWidget(this.drawer));
    this.addWidget(new TextWidget(this.drawer));
    this.addWidget(new LineWidget(this.drawer));
    this.addWidget(new SquareWidget(this.drawer));
    this.addWidget(new CircleWidget(this.drawer));
    this.addWidget(new ArrowWidget(this.drawer));
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
