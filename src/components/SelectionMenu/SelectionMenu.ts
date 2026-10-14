import './selection-menu.scss';
import type { Drawer } from '@/Drawer';
import type { IRect } from 'konva/lib/types';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import DuplicateIcon from '@/icons/duplicate.svg?raw';
import SendBackwardIcon from '@/icons/send-backward.svg?raw';
import BringForwardIcon from '@/icons/bring-forward.svg?raw';
import TrashIcon from '@/icons/trash.svg?raw';
import { arrowNavigation, createButton, setLabel } from '@/utils/dom';

/** Space between selection and menu, between menu and drawer edges (px) */
const gap = 12;

/**
 * Menu next to selected shapes: duplicate, bring forward, send backward, delete.
 * Under selection (rotation anchor is above), above it when there is no room, hidden while shapes are moved
 */
export class SelectionMenu {
  drawer: Drawer;
  $menu: HTMLDivElement;
  $duplicateBtn: HTMLButtonElement;
  $backwardBtn: HTMLButtonElement;
  $forwardBtn: HTMLButtonElement;
  $deleteBtn: HTMLButtonElement;

  constructor(drawer: Drawer) {
    this.drawer = drawer;

    this.$menu = document.createElement('div');
    this.$menu.classList.add('drawer-selection-menu', 'tool');
    this.$menu.setAttribute('role', 'toolbar');
    this.$menu.setAttribute('aria-label', 'Selection actions');

    this.$duplicateBtn = this._createButton(DuplicateIcon, 'Duplicate', 'Ctrl+D', () => this.drawer.duplicateShapes());
    this.$backwardBtn = this._createButton(SendBackwardIcon, 'Send backward', 'Ctrl+Down', () =>
      this.drawer.reorderShapes('backward')
    );
    this.$forwardBtn = this._createButton(BringForwardIcon, 'Bring forward', 'Ctrl+Up', () =>
      this.drawer.reorderShapes('forward')
    );
    this.$deleteBtn = this._createButton(TrashIcon, 'Delete', 'Delete', () => this.drawer.deleteShapes());
    this.$deleteBtn.classList.add('drawer-selection-menu-delete');

    const $separator = document.createElement('span');

    $separator.classList.add('drawer-selection-menu-separator');
    $separator.setAttribute('aria-hidden', 'true');

    this.$menu.append(this.$duplicateBtn, this.$backwardBtn, this.$forwardBtn, $separator, this.$deleteBtn);
    arrowNavigation(this.$menu, () => [...this.$menu.querySelectorAll('button')], 'horizontal');
    this.drawer.$drawerContainer.append(this.$menu);

    // selection layer is drawn when selection changes or moves (drag, transform, pan, zoom, changes of other users...)
    this.drawer.selectionLayer.on('draw.selectionmenu', () => this.update());
    // end of move: no draw after it
    this.drawer.drawLayer.on('dragend.selectionmenu', () => this.update());
    this.transformer?.on('transformend.selectionmenu', () => this.update());
    this.drawer.on('fd.readonly.change', () => this.update());
  }

  private get transformer() {
    return this.drawer.getWidget<SelectWidget>('selection')?.transformer;
  }

  /**
   * Action button, named by its label, shortcut in tooltip
   */
  private _createButton(icon: string, label: string, shortcut: string, action: () => void) {
    const $btn = createButton('drawer-button', 'drawer-button-neutral');

    $btn.innerHTML = icon;
    setLabel($btn, label);
    $btn.title = `${label} (${shortcut})`;
    $btn.setAttribute('aria-keyshortcuts', shortcut.replace('Ctrl', 'Control').replace(/Up|Down/, 'Arrow$&'));
    $btn.addEventListener('click', action);

    return $btn;
  }

  /**
   * Box of selected shapes in view, null if menu is not shown (no selection, shapes moved or edited...)
   */
  private _getSelectionBox(): IRect | null {
    const transformer = this.transformer;
    const nodes = transformer?.nodes() ?? [];

    if (
      !transformer ||
      !nodes.length ||
      !transformer.isVisible() ||
      this.drawer.readOnly ||
      this.drawer._duringAction() ||
      transformer.isTransforming() ||
      nodes.some((node) => node.isDragging())
    ) {
      return null;
    }

    const boxes = nodes.map((node) => node.getClientRect());
    const x = Math.min(...boxes.map((box) => box.x));
    const y = Math.min(...boxes.map((box) => box.y));

    return {
      x,
      y,
      width: Math.max(...boxes.map((box) => box.x + box.width)) - x,
      height: Math.max(...boxes.map((box) => box.y + box.height)) - y,
    };
  }

  /**
   * Show menu next to selection, or hide it
   */
  update() {
    const box = this._getSelectionBox();
    const { stage } = this.drawer;

    // selection out of view
    if (!box || box.x > stage.width() || box.y > stage.height() || box.x + box.width < 0 || box.y + box.height < 0) {
      this.hide();
      return;
    }

    this.$menu.classList.add('show');

    const { offsetWidth: width, offsetHeight: height } = this.$menu;
    // above toolbar of footer
    const bottom = stage.height() - this.drawer.$footerContainer.offsetHeight - gap;
    const transformer = this.transformer!;
    const rotateAnchor = transformer.rotateEnabled() ? transformer.rotateAnchorOffset() : 0;
    let top = box.y + box.height + gap;

    if (top + height > bottom) top = box.y - rotateAnchor - gap - height;

    const left = Math.min(Math.max(gap, box.x + box.width / 2 - width / 2), stage.width() - width - gap);
    // view in drawer
    const view = this.drawer.$stageContainer.getBoundingClientRect();
    const container = this.drawer.$drawerContainer.getBoundingClientRect();

    this.$menu.style.left = `${left + view.left - container.left}px`;
    this.$menu.style.top = `${Math.min(Math.max(gap, top), bottom - height) + view.top - container.top}px`;
  }

  /**
   * Hide menu, focus back on drawer if it was in menu (e.g. selection deleted)
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
