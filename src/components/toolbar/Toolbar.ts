import { Drawer } from '@/Drawer';
import { BaseWidget } from './widgets/BaseWidget';
import { BrushWidget } from './widgets/brush/brush';
import { EraserWidget } from './widgets/eraser/eraser';
import { SelectWidget } from './widgets/select/select';
import { AvailableTools } from '../../@types/toolbar';
import { PanWidget } from './widgets/pan/pan';

export class Toolbar {
  drawer: Drawer;
  $toolbarContainer: HTMLElement;
  widgets: Map<AvailableTools, BaseWidget> = new Map();
  activeWidget!: BaseWidget;

  constructor(drawer: Drawer) {
    this.drawer = drawer;

    this.$toolbarContainer = document.createElement('div');
    this.$toolbarContainer.style.maxWidth = this.drawer.stage.width() + 'px';
    this.$toolbarContainer.classList.add(`drawer-toolbar-root`, 'tool');
    this.$toolbarContainer.setAttribute('role', 'toolbar');

    this.drawer.$drawerContainer.prepend(this.$toolbarContainer);
    this.init();
  }

  init() {
    this.addWidget(new PanWidget(this.drawer));
    this.addWidget(new SelectWidget(this.drawer));
    this.addWidget(new BrushWidget(this.drawer));
    this.addWidget(new EraserWidget(this.drawer));
  }

  addWidget(widget: BaseWidget) {
    this.widgets.set(widget.id, widget);
    widget.addTo(this.$toolbarContainer);
  }

  setActiveWidget(widget: BaseWidget) {
    this.activeWidget = widget;
    this.drawer.activeTool = widget.id;
  }

  getWidget(name: AvailableTools): BaseWidget | undefined {
    return this.widgets.get(name);
  }
}
