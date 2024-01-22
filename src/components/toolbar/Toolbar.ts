import './toolbar.scss';
import { Drawer } from '../../Drawer';
import { BaseWidget } from './widgets/BaseWidget';
import { BrushWidget } from './widgets/brush/brush';
import { EraserWidget } from './widgets/eraser/eraser';

export class Toolbar {
  drawer: Drawer;
  private $toolbarContainer: HTMLElement;
  widgets: Map<'brush' | 'eraser', BaseWidget> = new Map();
  activeWidget: BaseWidget | null;

  constructor(drawer: Drawer) {
    this.drawer = drawer;

    this.$toolbarContainer = document.createElement('div');
    this.$toolbarContainer.classList.add(`drawer-toolbar-root`);
    this.$toolbarContainer.setAttribute('role', 'toolbar');
    this.activeWidget = null;

    this.drawer.$container.prepend(this.$toolbarContainer);
    this.init();
  }

  init() {
    this.addWidget(new BrushWidget(this.drawer));
    this.addWidget(new EraserWidget(this.drawer));
  }

  addWidget(widget: BaseWidget) {
    this.widgets.set(widget.toolName, widget);
    widget.addTo(this.$toolbarContainer);
  }

  setActiveWidget(widget: BaseWidget) {
    this.activeWidget = widget;
    this.drawer.activeTool = widget.toolName;
  }

  getWidget(name: 'brush' | 'eraser'): BaseWidget | undefined {
    return this.widgets.get(name);
  }
}
