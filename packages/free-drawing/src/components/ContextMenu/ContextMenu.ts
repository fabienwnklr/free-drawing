import type { Drawer } from '@/Drawer';
import type { Node } from 'konva/lib/Node';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { DrawingShape, ShapeOrder } from '@/@types/drawer';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import '@/components/ContextMenu/context-menu.scss';
import { arrowNavigation, createButton, setPressed } from '@/utils/dom';
import { getDrawingShape } from '@/utils/frame';
import type { TranslationKey } from '@/i18n/en';

/** Item of menu: shown in a context, action run once menu is hidden */
type Item = { $item: HTMLButtonElement; visible: () => boolean; run: () => void };

/**
 * Menu of right click (or context menu key, Shift + F10): actions on selection when a shape is under pointer
 * or selected (order, rotate, flip, duplicate, lock, delete, copy as image; unlock for locked shapes), else actions on
 * drawing (paste, select all, copy as image, snapping, grid), with their shortcuts
 */
export class ContextMenu {
  drawer: Drawer;
  $menu!: HTMLDivElement;
  $list!: HTMLDivElement;
  $pasteBtn!: HTMLButtonElement;
  $snappingBtn!: HTMLButtonElement;
  $gridBtn!: HTMLButtonElement;
  /** Groups of items, separated when several are shown */
  #sections: { $section: HTMLElement; items: Item[] }[] = [];

  constructor(drawer: Drawer) {
    this.drawer = drawer;
    this._init();
    this._initEvents();
  }

  private get selectWidget() {
    return this.drawer.getWidget<SelectWidget>('selection');
  }

  private _init() {
    const { drawer } = this;
    const edit = () => !drawer.readOnly;
    // locked shapes are selected to be unlocked, not modified
    const locked = () => edit() && !!this.selectWidget?.isLocked();
    const selection = () => edit() && drawer.getSelectedShapes().length > 0 && !locked();
    const canvas = () => drawer.getSelectedShapes().length === 0;
    const hasShapes = () => drawer.getDrawingShapes().length > 0;
    const order = (label: TranslationKey, value: ShapeOrder, shortcut: string): Item => ({
      $item: this._createItem(label, shortcut),
      visible: selection,
      run: () => drawer.reorderShapes(value),
    });
    const paste: Item = {
      $item: this._createItem('context.paste', 'Ctrl+V'),
      visible: () => edit() && canvas() && !!drawer.getWidget('text'),
      run: () => this._paste(),
    };
    const snapping: Item = {
      $item: this._createItem('context.snap', 'Alt+S', 'menuitemcheckbox'),
      visible: () => canvas() && !!this.selectWidget,
      run: () => drawer.setting.toggleSnapping(),
    };
    const grid: Item = {
      $item: this._createItem('menu.showGrid', 'Alt+G', 'menuitemcheckbox'),
      visible: canvas,
      run: () => drawer.setting.toggleGrid(),
    };

    this.$pasteBtn = paste.$item;
    this.$snappingBtn = snapping.$item;
    this.$gridBtn = grid.$item;
    setPressed(this.$snappingBtn, false);
    setPressed(this.$gridBtn, false);

    this.$menu = document.createElement('div');
    this.$menu.classList.add('drawer-context-menu');
    this.$menu.setAttribute('role', 'menu');
    this.$list = document.createElement('div');
    this.$list.className = 'drawer-context-menu-list';
    this.$menu.append(this.$list);

    const sections: Item[][] = [
      [paste],
      [
        {
          $item: this._createItem('action.duplicate', 'Ctrl+D'),
          visible: selection,
          run: () => drawer.duplicateShapes(),
        },
        {
          $item: this._createItem('context.lock', 'Ctrl+Shift+L'),
          visible: selection,
          run: () => drawer.setShapesLocked(true),
        },
        {
          $item: this._createItem('context.unlock', 'Ctrl+Shift+L'),
          visible: locked,
          run: () => drawer.setShapesLocked(false),
        },
        {
          $item: this._createItem('action.delete', drawer.t('key.delete'), 'menuitem', 'Delete'),
          visible: selection,
          run: () => drawer.deleteShapes(),
        },
      ],
      [
        order('action.bringToFront', 'front', 'Ctrl+Shift+↑'),
        order('action.bringForward', 'forward', 'Ctrl+↑'),
        order('action.sendBackward', 'backward', 'Ctrl+↓'),
        order('action.sendToBack', 'back', 'Ctrl+Shift+↓'),
      ],
      [
        {
          $item: this._createItem('action.rotateRight', 'Shift+R'),
          visible: selection,
          run: () => drawer.rotateShapes(90),
        },
        {
          $item: this._createItem('action.rotateLeft', 'Shift+L'),
          visible: selection,
          run: () => drawer.rotateShapes(-90),
        },
        {
          $item: this._createItem('action.flipHorizontal', 'Shift+H'),
          visible: selection,
          run: () => drawer.flipShapes('horizontal'),
        },
        {
          $item: this._createItem('action.flipVertical', 'Shift+V'),
          visible: selection,
          run: () => drawer.flipShapes('vertical'),
        },
      ],
      [
        {
          $item: this._createItem('action.copyPng', 'Shift+Alt+C'),
          visible: hasShapes,
          run: () => drawer.copyImage('png'),
        },
        {
          $item: this._createItem('action.copySvg', 'Shift+Alt+S'),
          visible: hasShapes,
          run: () => drawer.copyImage('svg'),
        },
      ],
      [
        {
          $item: this._createItem('help.selectAll', 'Ctrl+A'),
          visible: () => edit() && hasShapes() && !!this.selectWidget,
          run: () => this._selectAll(),
        },
      ],
      [snapping, grid],
    ];

    this.#sections = sections.map((items) => {
      const $section = document.createElement('div');

      $section.className = 'drawer-context-menu-section';
      $section.setAttribute('role', 'group');
      $section.append(...items.map(({ $item }) => $item));
      this.$list.append($section);
      items.forEach(({ $item, run }) =>
        $item.addEventListener('click', () => {
          this.hide();
          run();
        })
      );

      return { $section, items };
    });
    // Delete key name in language
    drawer.i18n.translate((t) => {
      const $delete = this.#sections[1].items[3].$item.querySelector('kbd')!;

      $delete.textContent = t('key.delete');
    });

    this.drawer.layout.add('floating', this.$menu);
  }

  /**
   * Menu item, focused with arrow keys, shortcut shown at its end
   * @param keyshortcuts `aria-keyshortcuts` when shown shortcut is not one
   */
  private _createItem(
    label: TranslationKey,
    shortcut: string,
    role: 'menuitem' | 'menuitemcheckbox' = 'menuitem',
    keyshortcuts = shortcut.replace('Ctrl', 'Control').replace('↑', 'ArrowUp').replace('↓', 'ArrowDown')
  ) {
    const $item = createButton('drawer-button', 'drawer-button-neutral', 'drawer-context-menu-list-item');
    const $label = document.createElement('span');
    const $shortcut = document.createElement('kbd');

    $label.className = 'drawer-context-menu-item__label';
    $shortcut.className = 'drawer-context-menu-item__shortcut';
    $shortcut.setAttribute('aria-hidden', 'true');
    $shortcut.textContent = shortcut;
    $item.append($label, $shortcut);
    this.drawer.i18n.translate((t) => ($label.textContent = t(label)));
    $item.setAttribute('role', role);
    $item.setAttribute('aria-keyshortcuts', keyshortcuts);
    $item.tabIndex = -1;

    return $item;
  }

  /**
   * Shown items, in menu order
   */
  private _getItems() {
    return Array.from(this.$list.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([hidden])'));
  }

  private _initEvents() {
    window.addEventListener('click', () => this.hide());
    // no native menu on this one
    this.$menu.addEventListener('contextmenu', (e) => e.preventDefault());
    arrowNavigation(this.$menu, () => this._getItems(), 'vertical');
    this.$menu.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' && e.key !== 'Tab') return;

      e.preventDefault();
      e.stopPropagation();
      this.hide();
    });

    // keyboard (context menu key, Shift+F10) on focused drawer: menu of selection or drawing, in drawer center
    this.drawer.$drawerContainer.addEventListener('contextmenu', (e) => {
      if (e.target !== this.drawer.$drawerContainer) return;

      e.preventDefault();
      this.show();

      const { clientWidth, clientHeight } = this.drawer.$drawerContainer;

      this._moveTo((clientWidth - this.$menu.offsetWidth) / 2, (clientHeight - this.$menu.offsetHeight) / 2);
    });

    this.drawer.stage.on('contextmenu', (e) => {
      e.evt.preventDefault();
      this._selectAt(e);
      this.show();

      const container = this.drawer.$drawerContainer.getBoundingClientRect();

      this._moveTo(e.evt.clientX - container.left, e.evt.clientY - container.top);
    });
  }

  /**
   * Shape under pointer selected (its group, with selection tool) unless it is selected,
   * selection kept in its box, removed elsewhere
   */
  private _selectAt(e: KonvaEventObject<PointerEvent>) {
    const { drawer, selectWidget } = this;

    if (!selectWidget || drawer.readOnly) return;

    const pos = drawer._getPointerPos();
    const hit = e.target.getLayer() === drawer.drawLayer ? this._getDrawingShape(e.target) : null;
    const [shape] = selectWidget.getShapesAt(pos, hit);
    const selected = drawer.getSelectedShapes();

    if (shape && selected.includes(shape)) return;
    if (!shape) {
      const box = selectWidget.transformer.getClientRect();
      const inBox = pos.x >= box.x && pos.x <= box.x + box.width && pos.y >= box.y && pos.y <= box.y + box.height;

      if (!selected.length || inBox) return;
    }
    if (shape && drawer.activeWidget !== selectWidget) selectWidget.setActive(true);
    selectWidget.select(shape ? [shape] : []);
  }

  /**
   * Drawing shape of a node of draw layer: the node itself or its top group, in drawing or in a frame
   */
  private _getDrawingShape(node: Node): DrawingShape {
    return getDrawingShape(node, this.drawer.drawLayer);
  }

  /**
   * Menu at a position of drawer, kept in it
   */
  private _moveTo(left: number, top: number) {
    const { clientWidth, clientHeight } = this.drawer.$drawerContainer;
    const margin = 4;

    this.$menu.style.left = Math.max(margin, Math.min(left, clientWidth - this.$menu.offsetWidth - margin)) + 'px';
    this.$menu.style.top = Math.max(margin, Math.min(top, clientHeight - this.$menu.offsetHeight - margin)) + 'px';
  }

  private async _paste() {
    try {
      // needs clipboard permission (asked by browser), Ctrl / Cmd + V does not
      const text = await navigator.clipboard.readText();

      if (!text) return;

      this.drawer.getWidget<TextWidget>('text')?.addTextNode(text);
      this.drawer.stage.fire('change');
    } catch (error) {
      this.drawer.toast(this.drawer.t('toast.clipboardUnavailable', { error: (error as Error).message }), 'warning');
    }
  }

  private _selectAll() {
    const { selectWidget } = this;

    if (!selectWidget) return;
    if (this.drawer.activeWidget !== selectWidget) selectWidget.setActive(true);
    selectWidget.selectAll();
  }

  /**
   * Show items of selection or drawing, first one focused (keyboard navigation)
   */
  show() {
    let first = true;

    this.#sections.forEach(({ $section, items }) => {
      items.forEach(({ $item, visible }) => ($item.hidden = !visible()));

      const shown = items.some(({ $item }) => !$item.hidden);

      $section.hidden = !shown;
      // separator before every shown section but the first one
      $section.classList.toggle('is-separated', shown && !first);
      if (shown) first = false;
    });
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

  isVisible() {
    return this.$menu.classList.contains('show');
  }
}
