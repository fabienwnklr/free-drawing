import type { Drawer } from '@/Drawer';
import { Shape, ShapeConfig } from 'konva/lib/Shape';
import { Stage } from 'konva/lib/Stage';
import './context-menu.scss';
import { Text } from 'konva/lib/shapes/Text';

export class ContextMenu {
  drawer: Drawer;
  currentShape: Shape<ShapeConfig> | null = null;
  $menu: HTMLDivElement;
  $pasteBtn: HTMLButtonElement;
  $list: HTMLUListElement;

  constructor(drawer: Drawer) {
    this.drawer = drawer;
    this.$menu = document.createElement('div');
    this.$menu.classList.add('drawer-context-menu');

    this.$list = document.createElement('ul');

    this.$pasteBtn = document.createElement('button');
    this.$pasteBtn.classList.add('drawer-button', 'drawer-button-neutral', 'drawer-context-menu-list-item');
    this.$pasteBtn.innerHTML =
      '<span class="drawer-context-menu-item__label">Paste</span><kbd class="drawer-context-menu-item__shortcut">Ctrl+V</kbd>';
    this.$pasteBtn.role = 'button';

    this.$list.append(...[this.$pasteBtn]);

    this.$menu.append(this.$list);
    this.drawer.$drawerContainer.append(this.$menu);
    this._initEvents();
  }

  private _initEvents() {
    window.addEventListener('click', () => {
      this.hide();
    });

    // Disable native context menu on my own context menu.. contextmenuception
    this.$menu.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    this.$pasteBtn.addEventListener('click', async () => {
      const text = await navigator.clipboard.readText();
      const draggable = this.drawer.activeTool === 'selection';
      this.drawer.layer.add(
        new Text({
          x: this.drawer.stage.width() / 2,
          y: this.drawer.stage.height() / 2,
          text,
          fontSize: 20,
          name: 'text',
          draggable
        })
      );
    });

    this.drawer.stage.on('contextmenu', (e) => {
      // prevent default behavior
      e.evt.preventDefault();
      if (e.target instanceof Stage) {
        // if we are on empty place of the this.drawer.stage we will do nothing

        const containerRect = this.drawer.stage.container().getBoundingClientRect();
        this.$menu.style.top = containerRect.top + this.drawer._getPointerPos().y + 4 + 'px';
        this.$menu.style.left = containerRect.left + this.drawer._getPointerPos().x + 4 + 'px';
        // show menu
        this.show();
        return;
      } else {
        // if we are on empty place of the this.drawer.stage we will do nothing

        const containerRect = this.drawer.stage.container().getBoundingClientRect();
        this.$menu.style.top = containerRect.top + this.drawer._getPointerPos().y + 4 + 'px';
        this.$menu.style.left = containerRect.left + this.drawer._getPointerPos().x + 4 + 'px';
        // show menu
        this.show();
      }
    });
  }

  show() {
    this.$menu.classList.add('show');
  }

  hide() {
    this.$menu.classList.remove('show');
  }
}
