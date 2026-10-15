import '@/components/SelectionMenu/selection-menu.scss';
import type { Drawer } from '@/Drawer';
import type { IRect } from 'konva/lib/types';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import DuplicateIcon from '@/icons/duplicate.svg?raw';
import SendBackwardIcon from '@/icons/send-backward.svg?raw';
import BringForwardIcon from '@/icons/bring-forward.svg?raw';
import TrashIcon from '@/icons/trash.svg?raw';
import GroupIcon from '@/icons/group.svg?raw';
import UngroupIcon from '@/icons/ungroup.svg?raw';
import UnlockIcon from '@/icons/unlock.svg?raw';
import { Group } from 'konva/lib/Group';
import { arrowNavigation, createButton, setLabel } from '@/utils/dom';
import type { TranslationKey } from '@/i18n/en';
import { drawerEvents } from '@/constants';

/** Space between selection and menu, between menu and drawer edges (px) */
const gap = 12;

/**
 * Menu next to selected shapes: duplicate, bring forward, send backward, delete, or unlock for locked shapes.
 * Out of transformer (below, above, right or left of it), hidden while shapes are moved
 */
export class SelectionMenu {
  drawer: Drawer;
  $menu: HTMLDivElement;
  $duplicateBtn: HTMLButtonElement;
  $groupBtn: HTMLButtonElement;
  $ungroupBtn: HTMLButtonElement;
  $backwardBtn: HTMLButtonElement;
  $forwardBtn: HTMLButtonElement;
  $deleteBtn: HTMLButtonElement;
  $unlockBtn: HTMLButtonElement;
  $separator: HTMLSpanElement;

  constructor(drawer: Drawer) {
    this.drawer = drawer;

    this.$menu = document.createElement('div');
    this.$menu.classList.add('drawer-selection-menu', 'tool');
    this.$menu.setAttribute('role', 'toolbar');
    drawer.i18n.translate((t) => this.$menu.setAttribute('aria-label', t('selectionMenu.label')));

    this.$duplicateBtn = this._createButton(DuplicateIcon, 'action.duplicate', 'Ctrl+D', () =>
      this.drawer.duplicateShapes()
    );
    this.$backwardBtn = this._createButton(SendBackwardIcon, 'action.sendBackward', 'Ctrl+Down', () =>
      this.drawer.reorderShapes('backward')
    );
    this.$forwardBtn = this._createButton(BringForwardIcon, 'action.bringForward', 'Ctrl+Up', () =>
      this.drawer.reorderShapes('forward')
    );
    this.$groupBtn = this._createButton(GroupIcon, 'action.group', 'Ctrl+G', () => this.drawer.groupShapes());
    this.$ungroupBtn = this._createButton(UngroupIcon, 'action.ungroup', 'Ctrl+Shift+G', () =>
      this.drawer.ungroupShapes()
    );
    this.$deleteBtn = this._createButton(TrashIcon, 'action.delete', 'Delete', () => this.drawer.deleteShapes());
    this.$deleteBtn.classList.add('drawer-selection-menu-delete');
    // only action on locked shapes
    this.$unlockBtn = this._createButton(UnlockIcon, 'context.unlock', 'Ctrl+Shift+L', () =>
      this.drawer.setShapesLocked(false)
    );

    this.$separator = document.createElement('span');
    this.$separator.classList.add('drawer-selection-menu-separator');
    this.$separator.setAttribute('aria-hidden', 'true');

    this.$menu.append(
      this.$unlockBtn,
      this.$duplicateBtn,
      this.$groupBtn,
      this.$ungroupBtn,
      this.$backwardBtn,
      this.$forwardBtn,
      this.$separator,
      this.$deleteBtn
    );
    arrowNavigation(this.$menu, () => [...this.$menu.querySelectorAll<HTMLElement>('button:not([hidden])')], 'horizontal');
    this.drawer.$drawerContainer.append(this.$menu);

    // selection layer is drawn when selection changes or moves (drag, transform, pan, zoom, changes of other users...)
    this.drawer.selectionLayer.on('draw.selectionmenu', () => this.update());
    // end of move: no draw after it
    this.drawer.drawLayer.on('dragend.selectionmenu', () => this.update());
    this.transformer?.on('transformend.selectionmenu', () => this.update());
    this.drawer.on(drawerEvents.readOnlyChange, () => this.update());
  }

  private get transformer() {
    return this.drawer.getWidget<SelectWidget>('selection')?.transformer;
  }

  /**
   * Action button, named by its label, shortcut in tooltip
   */
  private _createButton(icon: string, label: TranslationKey, shortcut: string, action: () => void) {
    const $btn = createButton('drawer-button', 'drawer-button-neutral');

    $btn.innerHTML = icon;
    this.drawer.i18n.translate((t) => {
      setLabel($btn, t(label));
      // name of Delete key in language
      $btn.title = `${t(label)} (${shortcut === 'Delete' ? t('key.delete') : shortcut})`;
    });
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

    const shapes = this.drawer.getSelectedShapes();
    const locked = !!this.drawer.getWidget<SelectWidget>('selection')?.isLocked();

    // locked shapes are only unlocked
    this.$unlockBtn.hidden = !locked;
    [this.$duplicateBtn, this.$backwardBtn, this.$forwardBtn, this.$separator, this.$deleteBtn].forEach(
      ($element) => ($element.hidden = locked)
    );
    // group 2 shapes at least, ungroup groups
    this.$groupBtn.hidden = locked || !this.drawer.canGroupShapes(shapes);
    this.$ungroupBtn.hidden = locked || !shapes.some((shape) => shape instanceof Group);

    const { left, top } = this._getPlace();
    // view in drawer
    const view = this.drawer.$stageContainer.getBoundingClientRect();
    const container = this.drawer.$drawerContainer.getBoundingClientRect();

    this.$menu.style.left = `${left + view.left - container.left}px`;
    this.$menu.style.top = `${top + view.top - container.top}px`;
  }

  /**
   * Place of menu in view, out of transformer (selection box, resize and rotation anchors, wherever rotation puts them):
   * below, else above, else right, else left, else at bottom of view (selection bigger than view)
   */
  private _getPlace() {
    const { stage } = this.drawer;
    const { offsetWidth: width, offsetHeight: height } = this.$menu;
    // hidden anchors are not counted
    const around = this.transformer!.getClientRect();
    // above toolbar of footer
    const area = {
      left: gap,
      top: gap,
      right: stage.width() - gap,
      bottom: stage.height() - this.drawer.$footerContainer.offsetHeight - gap,
    };
    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));
    const centerLeft = clamp(around.x + around.width / 2 - width / 2, area.left, area.right - width);
    const centerTop = clamp(around.y + around.height / 2 - height / 2, area.top, area.bottom - height);
    const places = [
      { left: centerLeft, top: around.y + around.height + gap },
      { left: centerLeft, top: around.y - gap - height },
      { left: around.x + around.width + gap, top: centerTop },
      { left: around.x - gap - width, top: centerTop },
    ];

    return (
      places.find(
        ({ left, top }) =>
          left >= area.left && top >= area.top && left + width <= area.right && top + height <= area.bottom
      ) ?? { left: centerLeft, top: area.bottom - height }
    );
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
