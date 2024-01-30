import type { Drawer } from '@/Drawer';
import { Shape, ShapeConfig } from 'konva/lib/Shape';
import { Stage } from 'konva/lib/Stage';

export class ContextMenu {
  drawer: Drawer;
  currentShape: Shape<ShapeConfig> | null = null;
  $menu: HTMLDivElement;

  constructor(drawer: Drawer) {
    this.drawer = drawer;
    this.$menu = document.createElement('div');
    this.$menu.classList.add('drawer-context-menu');

    this.drawer.$container.append(this.$menu);
    this._initEvents();
  }

  private _initEvents() {
    this.drawer.stage.on('contextmenu', (e) => {
      // prevent default behavior
      e.evt.preventDefault();
      if (e.target instanceof Stage) {
        // if we are on empty place of the this.drawer.stage we will do nothing
        return;
      }
      this.currentShape = e.target;
      // show menu
      this.$menu.style.display = 'initial';
      const containerRect = this.drawer.stage.container().getBoundingClientRect();
      this.$menu.style.top = containerRect.top + this.drawer._getPointerPos().y + 4 + 'px';
      this.$menu.style.left = containerRect.left + this.drawer._getPointerPos().x + 4 + 'px';
    });
  }
}
