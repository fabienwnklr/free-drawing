import type { Drawer } from '@/Drawer';
import { Shape, ShapeConfig } from 'konva/lib/Shape';
import { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import '@/components/ContextMenu/context-menu.scss';
import { Stage } from 'konva/lib/Stage';
import { arrowNavigation, createButton, disableElement, enableElement, setPressed } from '@/utils/dom';

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
    this.$menu.setAttribute('role', 'menu');

    this.$list = document.createElement('ul');
    this.$list.setAttribute('role', 'none');

    this.$pasteBtn = this._createItem('Paste', 'Ctrl+V');
    this.$snappingBtn = this._createItem('Snap to object', 'Alt+S', 'menuitemcheckbox');
    this.$gridBtn = this._createItem('Show grid', 'Alt+G', 'menuitemcheckbox');
    this.$lockShapeBtn = this._createItem('Lock', '');

    this.$list.append(...[this.$pasteBtn, this.$snappingBtn, this.$gridBtn]);

    this.$menu.append(this.$list);
    this.drawer.$drawerContainer.append(this.$menu);
  }

  /**
   * Menu item, focused with arrow keys
   */
  private _createItem(label: string, shortcut: string, role: 'menuitem' | 'menuitemcheckbox' = 'menuitem') {
    const $item = createButton('drawer-button', 'drawer-button-neutral', 'drawer-context-menu-list-item');

    $item.innerHTML = `<span class="drawer-context-menu-item__label">${label}</span><kbd class="drawer-context-menu-item__shortcut" aria-hidden="true">${shortcut}</kbd>`;
    $item.setAttribute('role', role);
    $item.tabIndex = -1;
    if (shortcut) $item.setAttribute('aria-keyshortcuts', shortcut.replace('Ctrl', 'Control'));
    if (role === 'menuitemcheckbox') setPressed($item, false);

    return $item;
  }

  private _getItems() {
    return Array.from(this.$list.querySelectorAll<HTMLElement>('[role^="menuitem"]'));
  }

  private _initEvents() {
    window.addEventListener('click', () => {
      this.hide();
    });

    // Disable native context menu on my own context menu.. contextmenuception
    this.$menu.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    arrowNavigation(this.$menu, () => this._getItems(), 'vertical');

    this.$menu.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' && e.key !== 'Tab') return;

      e.preventDefault();
      e.stopPropagation();
      this.hide();
    });

    // keyboard (context menu key, Shift+F10) on focused drawer, menu in drawer center
    this.drawer.$drawerContainer.addEventListener('contextmenu', (e) => {
      if (e.target !== this.drawer.$drawerContainer) return;

      e.preventDefault();
      const scope = this.drawer.$drawerContainer;

      this.$menu.style.top = Math.max(0, (scope.clientHeight - this.$menu.clientHeight) / 2) + 'px';
      this.$menu.style.left = Math.max(0, (scope.clientWidth - this.$menu.clientWidth) / 2) + 'px';
      this.show();
    });

    // read only: no paste
    this.drawer.on('fd.readonly.change', (readOnly: boolean) =>
      readOnly ? disableElement(this.$pasteBtn) : enableElement(this.$pasteBtn)
    );

    this.$pasteBtn.addEventListener('click', async () => {
      try {
        // needs clipboard permission (asked by browser), Ctrl / Cmd + V does not
        const text = await navigator.clipboard.readText();

        if (!text) return;

        this.drawer.getWidget<TextWidget>('text')?.addTextNode(text);
        this.drawer.stage.fire('change');
      } catch (error) {
        this.drawer.toast(`Clipboard unavailable: ${(error as Error).message}`, 'warning');
      }
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
   * Show the context menu, first item focused (keyboard navigation)
   */
  show() {
    this.$menu.classList.add('show');
    this._getItems()[0]?.focus();
  }

  /**
   * Hide the context menu, focus back on drawer if it was in menu
   */
  hide() {
    const hadFocus = this.$menu.contains(document.activeElement);

    this.$menu.classList.remove('show');
    if (hadFocus) this.drawer.focus();
  }
}
