import './toolbar.scss'
import { Drawer } from '../../Drawer';

export class Toolbar {
  drawer: Drawer;
  private toolbarContainer: HTMLElement;

  constructor(drawer: Drawer) {
    this.drawer = drawer;

    this.toolbarContainer = document.createElement('div');
    this.toolbarContainer.classList.add(`drawer-toolbar-root`);
    this.toolbarContainer.setAttribute('role', 'toolbar');

    this.drawer.$container.prepend(this.toolbarContainer);
  }

  init() {
    console.log('Toolbar init');
  }

  addWidget(widget: BaseWidget) {}
}
