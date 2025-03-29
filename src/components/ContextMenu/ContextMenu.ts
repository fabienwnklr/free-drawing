import type { Drawer } from '@/Drawer';
import { Shape, ShapeConfig } from 'konva/lib/Shape';
import { TextWidget } from '../toolbar/widgets/Text/Text';
import './context-menu.scss';
import { Stage } from 'konva/lib/Stage';

export class ContextMenu {
  drawer: Drawer;
  currentShape: Shape<ShapeConfig> | null = null;
  $menu!: HTMLDivElement;
  $list!: HTMLUListElement;
  $pasteBtn!: HTMLButtonElement;
  $snappingBtn!: HTMLButtonElement;
  $gridBtn!: HTMLButtonElement;
  $lockShapeBtn!: HTMLButtonElement;
  focusedShape: Stage | Shape<ShapeConfig> | null = null;

  constructor(drawer: Drawer) {
    this.drawer = drawer;
    this._init();
    this._initEvents();
  }

  private _init() {
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
      '<span class="drawer-context-menu-item__label">Snap to object</span><kbd class="drawer-context-menu-item__shortcut">Alt+S</kbd>';
    this.$snappingBtn.role = 'button';

    this.$gridBtn = document.createElement('button');
    this.$gridBtn.classList.add('drawer-button', 'drawer-button-neutral', 'drawer-context-menu-list-item');
    this.$gridBtn.innerHTML =
      '<span class="drawer-context-menu-item__label">Show grid</span><kbd class="drawer-context-menu-item__shortcut">Alt+G</kbd>';
    this.$gridBtn.role = 'button';

    this.$lockShapeBtn = document.createElement('button');
    this.$lockShapeBtn.classList.add('drawer-button', 'drawer-button-neutral', 'drawer-context-menu-list-item');
    this.$lockShapeBtn.innerHTML =
      '<span class="drawer-context-menu-item__label">Lock</span><kbd class="drawer-context-menu-item__shortcut"></kbd>';
    this.$lockShapeBtn.role = 'button';

    this.$list.append(...[this.$pasteBtn, this.$snappingBtn, this.$gridBtn]);

    this.$menu.append(this.$list);
    this.drawer.$drawerContainer.append(this.$menu);
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

    this.$lockShapeBtn.addEventListener('click', () => {
      this.focusedShape?.listening(false);
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

      // if (e.target !== this.drawer.stage) {
      //   this.focusedShape = e.target;
      //   if (e.target.listening()) {
      //     this.$list.append(this.$lockShapeBtn);
      //   } else {
      //     this.$lockShapeBtn.remove();
      //   }
      // }else {
      //   this.$lockShapeBtn.remove();
      // }
      // show menu
      this.show();
    });
  }

  /**
   * Show the context menu
   */
  show() {
    this.$menu.classList.add('show');
  }

  /**
   * Hide the context menu
   */
  hide() {
    this.$menu.classList.remove('show');
  }
}
