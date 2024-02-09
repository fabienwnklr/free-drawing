import type { Drawer } from '@/Drawer';
import { Shape, ShapeConfig } from 'konva/lib/Shape';
import { TextWidget } from '../toolbar/widgets/Text/Text';
import './context-menu.scss';

export class ContextMenu {
  drawer: Drawer;
  currentShape: Shape<ShapeConfig> | null = null;
  $menu: HTMLDivElement;
  $list: HTMLUListElement;

  $pasteBtn: HTMLButtonElement;
  $snappingBtn: HTMLButtonElement;
  $gridBtn: HTMLButtonElement;

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

    this.$snappingBtn = document.createElement('button');
    this.$snappingBtn.classList.add('drawer-button', 'drawer-button-neutral', 'drawer-context-menu-list-item');
    this.$snappingBtn.innerHTML =
      '<span class="drawer-context-menu-item__label">Toggle snapping</span><kbd class="drawer-context-menu-item__shortcut">Alt+S</kbd>';
    this.$snappingBtn.role = 'button';

    this.$gridBtn = document.createElement('button');
    this.$gridBtn.classList.add('drawer-button', 'drawer-button-neutral', 'drawer-context-menu-list-item');
    this.$gridBtn.innerHTML =
      '<span class="drawer-context-menu-item__label">Toggle grid</span><kbd class="drawer-context-menu-item__shortcut">Alt+G</kbd>';
    this.$gridBtn.role = 'button';

    this.$list.append(...[this.$pasteBtn, this.$snappingBtn, this.$gridBtn]);

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
      const textWidget = this.drawer.getWidget<TextWidget>('text');

      textWidget?.addTextNode(text);
    });

    this.$snappingBtn.addEventListener('click', () => {
      this.drawer.setting.toggleSnapping();
    });

    this.$gridBtn.addEventListener('click', () => {
      this.drawer.setting.toggleGrid();
    });

    this.drawer.stage.on('contextmenu', (e) => {
      // prevent default behavior
      e.evt.preventDefault();
      const scope = this.drawer.$drawerContainer;
      const { left: scopeOffsetX, top: scopeOffsetY } = scope.getBoundingClientRect();

      const scopeX = this.drawer._getPointerPos().x - scopeOffsetX;
      const scopeY = this.drawer._getPointerPos().y - scopeOffsetY;

      // ? check if the element will go out of bounds
      const outOfBoundsOnX = scopeX + this.$menu.clientWidth > scope.clientWidth;

      const outOfBoundsOnY = scopeY + this.$menu.clientHeight > scope.clientHeight;

      let normalizedX = this.drawer._getPointerPos().x;
      let normalizedY = this.drawer._getPointerPos().y;

      // ? normalzie on X
      if (outOfBoundsOnX) {
        normalizedX = scopeOffsetX + scope.clientWidth - this.$menu.clientWidth - 4;
      }

      // ? normalize on Y
      if (outOfBoundsOnY) {
        normalizedY = scopeOffsetY + scope.clientHeight - this.$menu.clientHeight - 4;
      }

      this.$menu.style.top = normalizedY + 'px';
      this.$menu.style.left = normalizedX + 'px';
      // show menu
      this.show();
    });
  }

  show() {
    this.$menu.classList.add('show');
  }

  hide() {
    this.$menu.classList.remove('show');
  }
}
