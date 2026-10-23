import '@/components/SelectionMenu/selection-menu.scss';
import type { Drawer } from '@/Drawer';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import DuplicateIcon from '@/icons/duplicate.svg?raw';
import SendBackwardIcon from '@/icons/send-backward.svg?raw';
import BringForwardIcon from '@/icons/bring-forward.svg?raw';
import TrashIcon from '@/icons/trash.svg?raw';
import GroupIcon from '@/icons/group.svg?raw';
import UngroupIcon from '@/icons/ungroup.svg?raw';
import UnlockIcon from '@/icons/unlock.svg?raw';
import LockIcon from '@/icons/lock.svg?raw';
import RotateLeftIcon from '@/icons/rotate-left.svg?raw';
import RotateRightIcon from '@/icons/rotate-right.svg?raw';
import FitWidthIcon from '@/icons/fit-width.svg?raw';
import { Group } from 'konva/lib/Group';
import { arrowNavigation, createButton, placeInView, setLabel } from '@/utils/dom';
import { ariaShortcut, formatShortcut } from '@/utils/shortcut';
import type { TranslationKey } from '@/@types/i18n';
import { drawerEvents } from '@/constants';
import { isFrame } from '@/utils/frame';
import { getPlacementArea, getSelectionBox, getSelectionSurroundings } from '@/utils/selection';
import { getTexts } from '@/utils/text';

/** Space between selection and menu, between menu and drawer edges (px) */
const gap = 12;

/**
 * Menu next to selected shapes: duplicate, rotate, fit width of texts, bring forward, send backward, lock, delete, or
 * unlock for locked shapes.
 * Out of transformer (below, above, right or left of it), hidden while shapes are moved
 */
export class SelectionMenu {
  /** Drawer whose selection the menu acts on */
  drawer: Drawer;
  /** Menu element (`role="toolbar"`, arrow keys move between buttons), placed next to the selection */
  $menu: HTMLDivElement;
  /** Duplicates selected shapes (Ctrl+D) */
  $duplicateBtn: HTMLButtonElement;
  /** Groups selected shapes (Ctrl+G), shown when they can be grouped (2 shapes at least) */
  $groupBtn: HTMLButtonElement;
  /** Ungroups selected groups (Ctrl+Shift+G), shown when a group is selected */
  $ungroupBtn: HTMLButtonElement;
  /** Rotates selected shapes by 90° counterclockwise (Shift+L), hidden when only frames are selected */
  $rotateLeftBtn: HTMLButtonElement;
  /** Rotates selected shapes by 90° clockwise (Shift+R), hidden when only frames are selected */
  $rotateRightBtn: HTMLButtonElement;
  /** Fits width of selected texts to their content (Shift+W), shown when the selection has texts */
  $fitWidthBtn: HTMLButtonElement;
  /** Sends selected shapes backward (Ctrl+Down) */
  $backwardBtn: HTMLButtonElement;
  /** Brings selected shapes forward (Ctrl+Up) */
  $forwardBtn: HTMLButtonElement;
  /** Deletes selected shapes (Delete), last after the separator */
  $deleteBtn: HTMLButtonElement;
  /** Locks selected shapes (Ctrl+Shift+L), they stay selected */
  $lockBtn: HTMLButtonElement;
  /** Unlocks selected shapes (Ctrl+Shift+L), only button shown for a locked selection */
  $unlockBtn: HTMLButtonElement;
  /** Separator before the delete button */
  $separator: HTMLSpanElement;

  /**
   * Create the menu (hidden) in the floating region, updated when the selection layer is drawn or shapes moved
   * @param drawer Drawer whose selection the menu acts on
   */
  constructor(drawer: Drawer) {
    this.drawer = drawer;

    this.$menu = document.createElement('div');
    this.$menu.classList.add('drawer-selection-menu', 'tool');
    this.$menu.setAttribute('role', 'toolbar');
    drawer.i18n.translate((t) => this.$menu.setAttribute('aria-label', t('selectionMenu.label')));

    this.$duplicateBtn = this._createButton(DuplicateIcon, 'action.duplicate', 'Ctrl+D', () =>
      this.drawer.duplicateShapes()
    );
    this.$rotateLeftBtn = this._createButton(RotateLeftIcon, 'action.rotateLeft', 'Shift+L', () =>
      this.drawer.rotateShapes(-90)
    );
    this.$rotateRightBtn = this._createButton(RotateRightIcon, 'action.rotateRight', 'Shift+R', () =>
      this.drawer.rotateShapes(90)
    );
    this.$fitWidthBtn = this._createButton(FitWidthIcon, 'action.fitTextWidth', 'Shift+W', () =>
      this.drawer.fitTextWidth()
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
    // locked shapes stay selected (unlock button)
    this.$lockBtn = this._createButton(LockIcon, 'context.lock', 'Ctrl+Shift+L', () =>
      this.drawer.setShapesLocked(true)
    );
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
      this.$rotateLeftBtn,
      this.$rotateRightBtn,
      this.$fitWidthBtn,
      this.$backwardBtn,
      this.$forwardBtn,
      this.$lockBtn,
      this.$separator,
      this.$deleteBtn
    );
    arrowNavigation(
      this.$menu,
      () => [...this.$menu.querySelectorAll<HTMLElement>('button:not([hidden])')],
      'horizontal'
    );
    this.drawer.layout.add('floating', this.$menu);

    // selection layer is drawn when selection changes or moves (drag, transform, pan, zoom, changes of other users...)
    this.drawer.selectionLayer.on('draw.selectionmenu', () => this.update());
    // end of move: no draw after it
    this.drawer.drawLayer.on('dragend.selectionmenu', () => this.update());
    this.transformer?.on('transformend.selectionmenu', () => this.update());
    this.drawer.on(drawerEvents.readOnlyChange, () => this.update());
  }

  /**
   * Transformer of the selection widget, undefined without this widget
   */
  private get transformer() {
    return this.drawer.getWidget<SelectWidget>('selection')?.transformer;
  }

  /**
   * Action button, named by its label, shortcut in tooltip
   * @param icon SVG markup of the icon
   * @param label Key of the accessible name (translated again when language changes)
   * @param shortcut Keys of the same action (`Ctrl+D`, `Delete`), shown in tooltip and `aria-keyshortcuts`
   * @param action Run on click
   * @returns Button, to add to the menu
   */
  private _createButton(icon: string, label: TranslationKey, shortcut: string, action: () => void) {
    const $btn = createButton('drawer-button', 'drawer-button-neutral');

    $btn.innerHTML = icon;
    this.drawer.i18n.translate((t) => {
      setLabel($btn, t(label));
      // name of Delete key in language, symbols of Apple keyboards
      $btn.title = `${t(label)} (${formatShortcut(shortcut, t)})`;
    });
    $btn.setAttribute('aria-keyshortcuts', ariaShortcut(shortcut));
    $btn.addEventListener('click', action);

    return $btn;
  }

  /**
   * Show menu next to selection, or hide it (no selection, shapes moved or edited, out of view...)
   */
  update() {
    if (!getSelectionBox(this.drawer)) {
      this.hide();
      return;
    }

    this.$menu.classList.add('show');

    const shapes = this.drawer.getSelectedShapes();
    const locked = !!this.drawer.getWidget<SelectWidget>('selection')?.isLocked();

    // locked shapes are only unlocked
    this.$unlockBtn.hidden = !locked;
    for (const $element of [
      this.$duplicateBtn,
      this.$rotateLeftBtn,
      this.$rotateRightBtn,
      this.$backwardBtn,
      this.$forwardBtn,
      this.$lockBtn,
      this.$separator,
      this.$deleteBtn,
    ]) {
      $element.hidden = locked;
    }
    // group 2 shapes at least, ungroup groups
    this.$groupBtn.hidden = locked || !this.drawer.canGroupShapes(shapes);
    this.$ungroupBtn.hidden = locked || !shapes.some((shape) => shape instanceof Group && !isFrame(shape));
    // frames are not rotated
    this.$rotateLeftBtn.hidden = this.$rotateRightBtn.hidden = locked || shapes.every(isFrame);
    this.$fitWidthBtn.hidden = locked || !getTexts(shapes).length;

    const { left, top } = this._getPlace();

    placeInView(this.drawer, this.$menu, left, top);
  }

  /**
   * Place of menu in view, out of transformer (selection box, resize and rotation anchors, wherever rotation puts them):
   * below, else above, else right, else left, else at bottom of view (selection bigger than view)
   * @returns Left and top of the menu in view (px)
   */
  private _getPlace() {
    const { offsetWidth: width, offsetHeight: height } = this.$menu;
    const around = getSelectionSurroundings(this.drawer);
    // above toolbar of footer
    const area = getPlacementArea(this.drawer, gap);
    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));
    const centerLeft = clamp(around.x + around.width / 2 - width / 2, area.left, area.right - width);
    const centerTop = clamp(around.y + around.height / 2 - height / 2, area.top, area.bottom - height);
    const places = [
      {
        /** Left of the menu in view (px) */
        left: centerLeft,
        /** Top of the menu in view (px) */
        top: around.y + around.height + gap,
      },
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

  /**
   * Whether the menu is shown
   * @returns True while the menu is shown
   */
  isVisible() {
    return this.$menu.classList.contains('show');
  }
}
