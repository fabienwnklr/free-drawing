import type { Drawer } from '@/Drawer';
import type { Node } from 'konva/lib/Node';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Vector2d } from 'konva/lib/types';
import type { DrawingShape, ShapeOrder } from '@/@types/drawer';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import '@/components/ContextMenu/context-menu.scss';
import { arrowNavigation, createButton, setPressed } from '@/utils/dom';
import { getDrawingShape } from '@/utils/frame';
import { getTexts } from '@/utils/text';
import type { TranslationKey } from '@/@types/i18n';
import { getErrorText } from '@/utils/errors';
import { ariaShortcut, formatShortcut } from '@/utils/shortcut';
import type { ContextMenuItem, ContextMenuItemOptions, ContextMenuSection } from '@/@types/ui';

/**
 * Menu of right click (or context menu key, Shift + F10): actions on selection when a shape is under pointer
 * or selected (order, rotate, flip, fit width of texts, duplicate, link, lock, delete, copy as image; unlock for locked
 * shapes), else actions on
 * drawing (paste, select all, copy as image, snapping, grid), with their shortcuts
 */
export class ContextMenu {
  /** Drawer the menu acts on */
  drawer: Drawer;
  /** Menu element (`role="menu"`), placed at the pointer or in the drawer center */
  $menu!: HTMLDivElement;
  /** Sections of items of the menu */
  $list!: HTMLDivElement;
  /** Item pasting text of the clipboard at the place of the right click (needs clipboard permission) */
  $pasteBtn!: HTMLButtonElement;
  /** Checkbox item of snapping (Alt+S), checked by the selection widget when snapping changes */
  $snappingBtn!: HTMLButtonElement;
  /** Checkbox item of the grid (Alt+G), checked by the drawer when the grid is shown or hidden */
  $gridBtn!: HTMLButtonElement;
  /** Groups of items, separated when several are shown */
  #sections: ContextMenuSection[] = [];
  /** Place of right click in drawing: pasted text goes there (pointer is on menu then) */
  #position: Vector2d | null = null;

  /**
   * Create the menu (hidden) in the floating region and listen to right clicks and the context menu key
   * @param drawer Drawer the menu acts on
   */
  constructor(drawer: Drawer) {
    this.drawer = drawer;
    this._init();
    this._initEvents();
  }

  /**
   * Selection widget, undefined when it is not in the toolbar
   */
  private get selectWidget() {
    return this.drawer.getWidget<SelectWidget>('selection');
  }

  /**
   * Creates the menu and its sections of items (action, condition to be shown), each item hides the menu then runs
   */
  private _init() {
    const { drawer } = this;
    const edit = () => !drawer.readOnly;
    // locked shapes are selected to be unlocked, not modified
    const locked = () => edit() && !!this.selectWidget?.isLocked();
    const selection = () => edit() && drawer.getSelectedShapes().length > 0 && !locked();
    const canvas = () => drawer.getSelectedShapes().length === 0;
    const hasShapes = () => drawer.getDrawingShapes().length > 0;
    const order = (label: TranslationKey, value: ShapeOrder, shortcut: string): ContextMenuItem => ({
      $item: this._createItem(label, shortcut),
      visible: selection,
      run: () => drawer.reorderShapes(value),
    });
    const paste: ContextMenuItem = {
      $item: this._createItem('context.paste', 'Ctrl+V'),
      visible: () => edit() && canvas() && !!drawer.getWidget('text'),
      run: () => this._paste(),
    };
    const snapping: ContextMenuItem = {
      $item: this._createItem('context.snap', 'Alt+S', 'menuitemcheckbox'),
      visible: () => canvas() && !!this.selectWidget,
      run: () => drawer.setting.toggleSnapping(),
    };
    const grid: ContextMenuItem = {
      $item: this._createItem('menu.showGrid', 'Alt+G', 'menuitemcheckbox'),
      visible: canvas,
      run: () => drawer.setting.toggleGrid(),
    };
    const remove: ContextMenuItem = {
      $item: this._createItem('action.delete', 'Delete'),
      visible: selection,
      run: () => drawer.deleteShapes(),
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

    const sections: ContextMenuItem[][] = [
      [paste],
      [
        {
          $item: this._createItem('action.duplicate', 'Ctrl+D'),
          visible: selection,
          run: () => drawer.duplicateShapes(),
        },
        {
          // link editor above the selection
          $item: this._createItem('action.link', ''),
          visible: () => selection() && !!drawer.linkEditor,
          run: () => drawer.linkEditor?.edit(),
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
        remove,
      ],
      [
        order('action.bringToFront', 'front', 'Ctrl+Shift+Up'),
        order('action.bringForward', 'forward', 'Ctrl+Up'),
        order('action.sendBackward', 'backward', 'Ctrl+Down'),
        order('action.sendToBack', 'back', 'Ctrl+Shift+Down'),
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
        {
          $item: this._createItem('action.fitTextWidth', 'Shift+W'),
          visible: () => selection() && getTexts(drawer.getSelectedShapes()).length > 0,
          run: () => drawer.fitTextWidth(),
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

    for (const items of sections) this._addSection(items);

    this.drawer.layout.add('floating', this.$menu);
  }

  /**
   * Section of items at the end of the menu, each item hides the menu then runs its action
   * @param items Items of the section
   */
  private _addSection(items: ContextMenuItem[]) {
    const $section = document.createElement('div');

    $section.className = 'drawer-context-menu-section';
    $section.setAttribute('role', 'group');
    $section.append(...items.map(({ $item }) => $item));
    this.$list.append($section);
    for (const { $item, run } of items) {
      $item.addEventListener('click', () => {
        this.hide();
        run();
      });
    }
    this.#sections.push({ $section, items });
  }

  /**
   * Section of items added at the end of the menu (commands of plugins)
   * @param items Text (key or text), shortcut, condition to be shown and action of each item
   */
  addSection(items: ContextMenuItemOptions[]) {
    this._addSection(
      items.map(({ label, shortcut, visible, run }) => ({
        $item: this._createItem(label as TranslationKey, shortcut ?? ''),
        visible,
        run,
      }))
    );
  }

  /**
   * Menu item, focused with arrow keys, shortcut shown at its end
   * @param label Key of the item text (translated again when language changes)
   * @param shortcut Keys of the item (`Ctrl+Shift+Up`, `Delete`), shown at its end (`formatShortcut`, hidden to assistive
   * technologies) and set as `aria-keyshortcuts`, empty without one
   * @param role `menuitemcheckbox` for a toggle (snapping, grid), else `menuitem`
   * @returns Item button (not in tab order), its click listener is added by `_init`
   */
  private _createItem(label: TranslationKey, shortcut: string, role: 'menuitem' | 'menuitemcheckbox' = 'menuitem') {
    const $item = createButton('drawer-button', 'drawer-button-neutral', 'drawer-context-menu-list-item');
    const $label = document.createElement('span');
    const $shortcut = document.createElement('kbd');

    $label.className = 'drawer-context-menu-item__label';
    $shortcut.className = 'drawer-context-menu-item__shortcut';
    $shortcut.setAttribute('aria-hidden', 'true');
    $item.append($label, $shortcut);
    this.drawer.i18n.translate((t) => {
      $label.textContent = t(label);
      $shortcut.textContent = formatShortcut(shortcut, t);
    });
    $item.setAttribute('role', role);
    if (shortcut) $item.setAttribute('aria-keyshortcuts', ariaShortcut(shortcut));
    $item.tabIndex = -1;

    return $item;
  }

  /**
   * Shown items, in menu order
   * @returns Items not hidden, navigated with arrow keys
   */
  private _getItems() {
    return Array.from(this.$list.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([hidden])'));
  }

  /**
   * Right click on stage or context menu key on drawer shows the menu, a click anywhere, Escape or Tab hide it
   */
  private _initEvents() {
    window.addEventListener('click', () => this.hide(), { signal: this.drawer.signal });
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
      this.#position = null;
      this.show();

      const { clientWidth, clientHeight } = this.drawer.$drawerContainer;

      this._moveTo((clientWidth - this.$menu.offsetWidth) / 2, (clientHeight - this.$menu.offsetHeight) / 2);
    });

    this.drawer.stage.on('contextmenu', (e) => {
      e.evt.preventDefault();
      this.#position = this.drawer._getRelativePointerPos();
      this._selectAt(e);
      this.show();

      const container = this.drawer.$drawerContainer.getBoundingClientRect();

      this._moveTo(e.evt.clientX - container.left, e.evt.clientY - container.top);
    });
  }

  /**
   * Shape under pointer selected (its group, with selection tool) unless it is selected,
   * selection kept in its box, removed elsewhere
   * @param e Konva contextmenu event of the stage, its target is the hit node
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
   * @param node Node hit by the right click
   * @returns Drawing shape holding the node
   */
  private _getDrawingShape(node: Node): DrawingShape {
    return getDrawingShape(node, this.drawer.drawLayer);
  }

  /**
   * Menu at a position of drawer, kept in it (taller than the drawer: its height is limited, the rest scrolls)
   * @param left Wanted left of the menu from the drawer container left (px)
   * @param top Wanted top of the menu from the drawer container top (px)
   */
  private _moveTo(left: number, top: number) {
    const { clientWidth, clientHeight } = this.drawer.$drawerContainer;
    const margin = 4;

    // no layout (tests): no limit
    this.$menu.style.maxHeight = clientHeight > 2 * margin ? `${clientHeight - 2 * margin}px` : '';
    this.$menu.style.left = `${Math.max(margin, Math.min(left, clientWidth - this.$menu.offsetWidth - margin))}px`;
    this.$menu.style.top = `${Math.max(margin, Math.min(top, clientHeight - this.$menu.offsetHeight - margin))}px`;
  }

  /**
   * Adds text of the clipboard as a text node at the place of the right click (menu opened with keyboard: pointer
   * position, center of view when out of canvas), warns when the clipboard cannot be read
   */
  private async _paste() {
    try {
      // needs clipboard permission (asked by browser), Ctrl / Cmd + V does not
      const text = await navigator.clipboard.readText();

      if (!text) return;

      this.drawer.getWidget<TextWidget>('text')?.addTextNode(text, this.#position ?? undefined);
      this.drawer.stage.fire('change');
    } catch (error) {
      this.drawer.toast(
        this.drawer.t('toast.clipboardUnavailable', { error: getErrorText(error, this.drawer.i18n.t) }),
        'warning'
      );
    }
  }

  /**
   * Selects all shapes with the selection tool (activated if needed)
   */
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
      for (const { $item, visible } of items) $item.hidden = !visible();

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

  /**
   * Whether the menu is shown
   * @returns True while the menu is shown
   */
  isVisible() {
    return this.$menu.classList.contains('show');
  }
}
