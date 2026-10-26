import '@/components/LayersPanel/layers-panel.scss';
import type { Drawer } from '@/Drawer';
import { Group } from 'konva/lib/Group';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { DrawingShape } from '@/@types/drawer';
import { drawerEvents, shapeName } from '@/constants';
import type { TranslationKey } from '@/@types/i18n';
import {
  arrowNavigation,
  createButton,
  disableElement,
  enableElement,
  isComposing,
  setLabel,
  setPressed,
  uniqueId,
} from '@/utils/dom';
import { ariaShortcut, formatShortcut } from '@/utils/shortcut';
import LayersIcon from '@/icons/layers.svg?raw';
import CloseIcon from '@/icons/close.svg?raw';
import GripIcon from '@/icons/grip.svg?raw';
import ChevronIcon from '@/icons/chevron.svg?raw';
import EyeIcon from '@/icons/eye.svg?raw';
import EyeOffIcon from '@/icons/eye-off.svg?raw';
import LockIcon from '@/icons/lock.svg?raw';
import UnlockIcon from '@/icons/unlock.svg?raw';
import TrashIcon from '@/icons/trash.svg?raw';
import GroupIcon from '@/icons/group.svg?raw';
import UngroupIcon from '@/icons/ungroup.svg?raw';
import BrushIcon from '@/icons/brush.svg?raw';
import LineIcon from '@/icons/line2.svg?raw';
import SquareIcon from '@/icons/square.svg?raw';
import CircleIcon from '@/icons/circle.svg?raw';
import ArrowIcon from '@/icons/arrow.svg?raw';
import TextIcon from '@/icons/text.svg?raw';
import TriangleIcon from '@/icons/triangle.svg?raw';
import DiamondIcon from '@/icons/diamond.svg?raw';
import HeartIcon from '@/icons/heart.svg?raw';
import CloudIcon from '@/icons/cloud.svg?raw';
import StarIcon from '@/icons/star.svg?raw';
import HexagonIcon from '@/icons/hexagon.svg?raw';
import BlockArrowIcon from '@/icons/block-arrow.svg?raw';
import BubbleIcon from '@/icons/bubble.svg?raw';
import CheckboxIcon from '@/icons/checkbox.svg?raw';
import FrameIcon from '@/icons/frame.svg?raw';
import { getFrameShapes, isFrame } from '@/utils/frame';
import HighlighterIcon from '@/icons/highlighter.svg?raw';
import NoteIcon from '@/icons/note.svg?raw';

/** Icons of shape types, as their tools */
const typeIcons: Record<string, string> = {
  // before rectangles: notes are rectangles too
  [shapeName.note]: NoteIcon,
  [shapeName.line]: BrushIcon,
  [shapeName.straightLine]: LineIcon,
  [shapeName.rect]: SquareIcon,
  [shapeName.ellipse]: CircleIcon,
  [shapeName.arrow]: ArrowIcon,
  [shapeName.triangle]: TriangleIcon,
  [shapeName.diamond]: DiamondIcon,
  [shapeName.heart]: HeartIcon,
  [shapeName.cloud]: CloudIcon,
  [shapeName.star]: StarIcon,
  [shapeName.hexagon]: HexagonIcon,
  [shapeName.blockArrow]: BlockArrowIcon,
  [shapeName.bubble]: BubbleIcon,
  [shapeName.checkbox]: CheckboxIcon,
  [shapeName.frame]: FrameIcon,
  [shapeName.highlighter]: HighlighterIcon,
  [shapeName.text]: TextIcon,
  [shapeName.group]: GroupIcon,
};

/**
 * Panel listing drawing shapes, top one first, shapes of groups under them (expanded): select them (Shift adds),
 * rename (double click, F2), reorder in their group (drag handle, Alt + arrows), hide, lock and delete them,
 * group and ungroup selection
 */
export class LayersPanel {
  /** Drawer whose shapes are listed */
  drawer: Drawer;
  /** Container of the header button, added after the settings menu (hidden in zen mode) */
  $buttonContainer: HTMLDivElement;
  /** Header button showing / hiding the panel (Alt+L) */
  $button: HTMLButtonElement;
  /** Panel element (`region` named by its title): header, list of rows, empty message, hint */
  $panel: HTMLDivElement;
  /** Header button grouping selected shapes (Ctrl+G), enabled when they can be grouped */
  $groupButton: HTMLButtonElement;
  /** Header button ungrouping selected groups (Ctrl+Shift+G), enabled when a group is selected */
  $ungroupButton: HTMLButtonElement;
  /** Header button closing the panel, focus back on the panel button */
  $closeButton: HTMLButtonElement;
  /** List of rows of shapes, top one first (arrow keys move between names) */
  $list: HTMLUListElement;
  /** Message shown when the drawing has no shapes */
  $empty: HTMLParagraphElement;
  /** Shortcuts selecting several rows */
  $hint: HTMLParagraphElement;
  /** Rename or drag in progress: list updated after it */
  #busy = false;
  /** Drawing changed while busy: list updated at the end */
  #outdated = false;
  /** Ids of expanded groups */
  #expanded = new Set<string>();
  /** Shapes of rows, by id */
  #shapes = new Map<string, DrawingShape>();
  /** Row from which Shift selects a range: last one selected alone or added */
  #anchor: string | null = null;

  /**
   * Add the header button and the hidden panel, listen to drawing, selection, read only and language changes
   * @param drawer Drawer whose shapes are listed
   */
  constructor(drawer: Drawer) {
    this.drawer = drawer;

    // header button, next to menu
    this.$buttonContainer = document.createElement('div');
    this.$buttonContainer.classList.add('drawer-layers-button-container', 'tool');
    this.$button = createButton('drawer-button', 'drawer-button-neutral');
    this.$button.innerHTML = LayersIcon;
    this.$button.setAttribute('aria-keyshortcuts', ariaShortcut('Alt+L'));
    this.$button.setAttribute('aria-expanded', 'false');
    setPressed(this.$button, false);
    this.$button.addEventListener('click', () => this.toggle());
    this.$buttonContainer.append(this.$button);
    // next to settings menu
    this.drawer.layout.add('header', this.$buttonContainer, {
      hideInZen: true,
      after: this.drawer.setting.$dropdownContainer,
    });

    this.$panel = document.createElement('div');
    this.$panel.id = uniqueId('layers');
    this.$panel.classList.add('drawer-layers-panel', 'tool');
    this.$panel.setAttribute('role', 'region');
    this.$button.setAttribute('aria-controls', this.$panel.id);

    const $header = document.createElement('div');
    const $title = document.createElement('h2');
    const $actions = document.createElement('div');

    $header.classList.add('drawer-layers-header');
    $title.classList.add('drawer-layers-title');
    $title.id = uniqueId('layers-title');
    this.$panel.setAttribute('aria-labelledby', $title.id);
    this.$groupButton = this._createHeaderButton(GroupIcon, 'layers.group', 'Ctrl+G', () => this.drawer.groupShapes());
    this.$ungroupButton = this._createHeaderButton(UngroupIcon, 'action.ungroup', 'Ctrl+Shift+G', () =>
      this.drawer.ungroupShapes()
    );
    this.$closeButton = this._createHeaderButton(CloseIcon, 'layers.close', '', () => this._close());
    $actions.classList.add('drawer-layers-header-actions');
    $actions.append(this.$groupButton, this.$ungroupButton, this.$closeButton);
    $header.append($title, $actions);

    this.$list = document.createElement('ul');
    this.$list.classList.add('drawer-layers-list');
    this.$list.setAttribute('aria-labelledby', $title.id);
    this.$empty = document.createElement('p');
    this.$empty.classList.add('drawer-layers-empty', 'text-muted');
    // shortcuts selecting several rows, also description of rows
    this.$hint = document.createElement('p');
    this.$hint.id = uniqueId('layers-hint');
    this.$hint.classList.add('drawer-layers-hint', 'text-muted');
    this.drawer.i18n.translate((t) => {
      const kbd = (keys: string) =>
        Object.assign(document.createElement('kbd'), { textContent: formatShortcut(keys, t) });
      // action, then its keys (wrapped at the end when too long)
      const line = (text: string, ...keys: string[]) => {
        const $line = document.createElement('span');
        const $keys = document.createElement('span');

        $line.className = 'drawer-layers-hint-line';
        $keys.className = 'drawer-layers-hint-keys';
        $keys.append(...keys.map(kbd));
        $line.append(text, $keys);
        return $line;
      };

      setLabel(this.$button, t('layers.title'));
      this.$button.title = `${t('layers.title')} (${formatShortcut('Alt+L', t)})`;
      $title.textContent = t('layers.title');
      this.$empty.textContent = t('layers.empty');
      this.$hint.replaceChildren(
        line(t('layers.toggle'), 'Ctrl+Click', 'Ctrl+Space'),
        line(t('layers.range'), 'Shift+Click', 'Shift+Arrows')
      );
    });

    this.$panel.append($header, this.$list, this.$empty, this.$hint);
    this.drawer.layout.add('floating', this.$panel, { hideInZen: true });

    arrowNavigation(this.$list, () => [...this.$list.querySelectorAll<HTMLElement>('.drawer-layers-name')], 'vertical');
    // Tab goes to actions of current row only
    this.$list.addEventListener('focusin', (e) => this._setCurrent((e.target as HTMLElement).closest('li')));
    this.$panel.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || (e.target as HTMLElement).matches('input')) return;

      e.stopPropagation();
      this._close();
    });

    this.drawer.on(drawerEvents.change, () => this.update());
    this.drawer.on(drawerEvents.selectionChange, () => this._onSelectionChange());
    this.drawer.on(drawerEvents.readOnlyChange, () => this.update());
    // rows in new language
    this.drawer.on(drawerEvents.languageChange, () => this.update());
  }

  /**
   * Whether the panel is shown
   * @returns True while the panel is shown
   */
  isVisible() {
    return this.$panel.classList.contains('show');
  }

  /**
   * Show or hide panel (the library panel, at the same place, is hidden)
   * @param show Toggle by default
   */
  toggle(show: boolean = !this.isVisible()) {
    // library panel at the same place
    if (show) this.drawer.libraryPanel?.toggle(false);
    this.$panel.classList.toggle('show', show);
    setPressed(this.$button, show);
    this.$button.setAttribute('aria-expanded', String(show));
    if (show) this.update();
  }

  /**
   * Hides the panel, focus back on its header button (close button, Escape)
   */
  private _close() {
    this.toggle(false);
    this.$button.focus();
  }

  /**
   * Icon button of the panel header, named by its translated label, shortcut in tooltip (if any)
   * @param icon SVG markup of the icon
   * @param label Key of the accessible name (translated again when language changes)
   * @param shortcut Keys of the same action (`Ctrl+G`), shown in tooltip and `aria-keyshortcuts`, empty for none
   * @param action Run on click
   * @returns Header button, to add to the header actions
   */
  private _createHeaderButton(icon: string, label: TranslationKey, shortcut: string, action: () => void) {
    const $btn = createButton('drawer-button', 'drawer-button-neutral');

    $btn.innerHTML = icon;
    this.drawer.i18n.translate((t) => {
      setLabel($btn, t(label));
      if (shortcut) $btn.title = `${t(label)} (${formatShortcut(shortcut, t)})`;
    });
    if (shortcut) $btn.setAttribute('aria-keyshortcuts', ariaShortcut(shortcut));
    $btn.addEventListener('click', action);

    return $btn;
  }

  /**
   * Expand or collapse a group
   * @param group Group (or frame) whose shapes are listed under its row
   * @param expanded True to list its shapes, false to hide them
   */
  setExpanded(group: Group, expanded: boolean) {
    if (expanded) this.#expanded.add(group.id());
    else this.#expanded.delete(group.id());
    this.update();
  }

  /**
   * List shapes again (after drawing changes), focus kept on same control
   */
  update() {
    if (!this.isVisible()) return;
    if (this.#busy) {
      this.#outdated = true;
      return;
    }

    const $focused = this.$list.contains(document.activeElement) ? (document.activeElement as HTMLElement) : null;
    const $focusedItem = $focused?.closest('li');
    const focusedIndex = $focusedItem ? [...this.$list.children].indexOf($focusedItem) : -1;
    this.#shapes.clear();

    const $items = this._createItems(this.drawer.getDrawingShapes(), 0);

    this.#outdated = false;
    this.$panel.classList.toggle('read-only', this.drawer.readOnly);
    this.$list.replaceChildren(...$items);
    this.$empty.hidden = $items.length > 0;
    this.$hint.hidden = !$items.length || this.drawer.readOnly;
    this.updateSelection();

    if (!$focusedItem) return;

    // same control of same shape, else row at same place (shape removed)
    const $item = $items.find(($el) => $el.dataset.id === $focusedItem.dataset.id);
    const $target = $item
      ? $item.querySelector<HTMLElement>(`[data-part="${$focused?.dataset.part}"]`)
      : $items[Math.min(focusedIndex, $items.length - 1)]?.querySelector<HTMLElement>('[data-part="name"]');

    ($target ?? this.$closeButton).focus();
  }

  /**
   * Rows of selected shapes highlighted, first one scrolled into view, group buttons enabled
   */
  updateSelection() {
    const shapes = this.drawer.getSelectedShapes();
    const selected = shapes.map((shape) => shape.id());
    const $items = [...this.$list.children] as HTMLElement[];
    const edit = !this.drawer.readOnly;

    $items.forEach(($item) => {
      const isSelected = selected.includes($item.dataset.id!);

      $item.classList.toggle('is-selected', isSelected);
      setPressed($item.querySelector('.drawer-layers-name')!, isSelected);
    });

    (edit && this.drawer.canGroupShapes(shapes) ? enableElement : disableElement)(this.$groupButton);
    (edit && shapes.some((shape) => shape instanceof Group && !isFrame(shape)) ? enableElement : disableElement)(
      this.$ungroupButton
    );

    const $selected = $items.find(($item) => $item.classList.contains('is-selected'));

    if (!this.$list.contains(document.activeElement)) this._setCurrent($selected ?? $items[0]);
    if ($selected) {
      const { offsetTop, offsetHeight } = $selected;
      const { scrollTop, clientHeight } = this.$list;

      if (offsetTop < scrollTop) this.$list.scrollTop = offsetTop;
      else if (offsetTop + offsetHeight > scrollTop + clientHeight) {
        this.$list.scrollTop = offsetTop + offsetHeight - clientHeight;
      }
    }
  }

  /**
   * Groups of shapes selected in a group (Ctrl + click on canvas) expanded
   */
  private _onSelectionChange() {
    const count = this.#expanded.size;
    const selected = this.drawer.getSelectedShapes();

    // range from shape selected alone on canvas too
    if (selected.length < 2) this.#anchor = selected[0]?.id() ?? null;
    selected.forEach((shape) => {
      let parent = shape.getParent();

      while (parent instanceof Group) {
        this.#expanded.add(parent.id());
        parent = parent.getParent();
      }
    });

    if (this.#expanded.size !== count) this.update();
    else this.updateSelection();
  }

  /**
   * Row reached with Tab (roving tab index), others with arrows
   * @param $current Row whose buttons are in tab order, none when not a row
   */
  private _setCurrent($current: Element | null | undefined) {
    [...this.$list.children].forEach(($item) => {
      for (const $btn of $item.querySelectorAll<HTMLElement>('button')) {
        $btn.tabIndex = $item === $current ? 0 : -1;
      }
    });
  }

  /**
   * Rows of shapes, top one first, followed by rows of shapes of expanded groups
   * @param shapes Shapes of the drawing or of a group, bottom one first (stacking order)
   * @param depth Nesting level of the shapes (0 in drawing), indents their rows
   * @returns Rows in list order
   */
  private _createItems(shapes: DrawingShape[], depth: number): HTMLLIElement[] {
    return [...shapes].reverse().flatMap((shape) => {
      const $item = this._createItem(shape, depth);

      if (!(shape instanceof Group) || !this.#expanded.has(shape.id())) return [$item];

      // shapes of frames, not their title and border
      const children = isFrame(shape) ? getFrameShapes(shape) : (shape.getChildren() as DrawingShape[]);

      return [$item, ...this._createItems(children, depth + 1)];
    });
  }

  /**
   * Row of a shape, indented by `depth`: drag handle, expand button (groups), name with type icon (selects,
   * renames), hide, lock and delete buttons
   * @param shape Shape of the row, recorded in `#shapes`
   * @param depth Nesting level of the shape (0 in drawing)
   * @returns Row of the shape
   */
  private _createItem(shape: DrawingShape, depth: number) {
    const label = this.drawer.getShapeLabel(shape);
    const hidden = !shape.visible();
    const locked = !shape.listening();
    const parent = shape.getParent();
    const type = Object.keys(typeIcons).find((name) => shape.hasName(name));
    const $item = document.createElement('li');
    const $grip = document.createElement('span');
    const $name = createButton('drawer-layers-name');
    const $label = document.createElement('span');

    $item.classList.add('drawer-layers-item');
    $item.classList.toggle('is-hidden', hidden);
    $item.classList.toggle('is-locked', locked);
    // hidden or locked with its group
    $item.classList.toggle('is-muted', !shape.isVisible() || !shape.isListening());
    $item.dataset.id = shape.id();
    this.#shapes.set(shape.id(), shape);
    $item.dataset.parent = parent === this.drawer.drawLayer ? '' : parent?.id();
    $item.style.setProperty('--depth', String(depth));

    // pointer only, Alt + arrows with keyboard
    $grip.classList.add('drawer-layers-grip');
    $grip.innerHTML = GripIcon;
    $grip.setAttribute('aria-hidden', 'true');
    $grip.title = this.drawer.t('layers.drag');
    $grip.addEventListener('pointerdown', (e) => this._drag(e, shape, $item));
    $item.append($grip);

    if (shape instanceof Group) {
      const $toggle = createButton('drawer-layers-toggle');
      const expanded = this.#expanded.has(shape.id());

      $toggle.dataset.part = 'toggle';
      $toggle.innerHTML = ChevronIcon;
      setLabel($toggle, this.drawer.t('layers.shapesOf', { name: label }));
      $toggle.setAttribute('aria-expanded', String(expanded));
      $toggle.addEventListener('click', () => this.setExpanded(shape, !expanded));
      $item.append($toggle);
    } else {
      // aligned with groups names
      const $space = document.createElement('span');

      $space.classList.add('drawer-layers-toggle');
      $item.append($space);
    }

    $name.dataset.part = 'name';
    $name.title = label;
    $name.innerHTML = `<span class="drawer-layers-icon" aria-hidden="true">${type ? typeIcons[type] : ''}</span>`;
    $label.classList.add('drawer-layers-label');
    $label.textContent = label;
    $name.append($label);
    $name.setAttribute('aria-describedby', this.$hint.id);
    $name.addEventListener('click', (e) =>
      this._select(shape, e.shiftKey ? 'range' : e.ctrlKey || e.metaKey ? 'toggle' : 'one')
    );
    $name.addEventListener('dblclick', () => this._rename(shape, $name));
    $name.addEventListener('keydown', (e) => this._onNameKeydown(e, shape, $name));

    const t = this.drawer.t.bind(this.drawer);
    const $visibility = this._createAction(
      'visibility',
      hidden ? EyeOffIcon : EyeIcon,
      t('layers.hide', { name: label }),
      hidden,
      () => this.drawer.setShapesHidden(shape.visible(), [shape])
    );
    const $lock = this._createAction(
      'lock',
      locked ? LockIcon : UnlockIcon,
      t('layers.lock', { name: label }),
      locked,
      () => this.drawer.setShapesLocked(shape.listening(), [shape])
    );
    const $delete = this._createAction('delete', TrashIcon, t('layers.delete', { name: label }), null, () =>
      this.drawer.deleteShapes([shape])
    );

    $item.append($name, $visibility, $lock, $delete);

    return $item;
  }

  /**
   * Action of a row, toggle when `pressed` is a boolean
   * @param part `data-part` of the button (visibility, lock, delete): focus kept on it after update
   * @param icon SVG markup of the icon
   * @param label Accessible name, already translated
   * @param pressed State of a toggle, null for a plain button
   * @param action Run on click
   * @returns Action button, disabled in read only
   */
  private _createAction(part: string, icon: string, label: string, pressed: boolean | null, action: () => void) {
    const $btn = createButton('drawer-button', 'drawer-button-neutral', 'drawer-layers-action');

    $btn.dataset.part = part;
    $btn.innerHTML = icon;
    setLabel($btn, label);
    if (pressed !== null) setPressed($btn, pressed);
    if (this.drawer.readOnly) disableElement($btn);
    $btn.addEventListener('click', action);

    return $btn;
  }

  /**
   * Row of a shape
   * @param shape Shape listed in the panel
   * @returns Its row, undefined when it is not listed (collapsed group)
   */
  private _getItem(shape: DrawingShape) {
    return ([...this.$list.children] as HTMLElement[]).find(($item) => $item.dataset.id === shape.id());
  }

  /**
   * Keys of a row name: F2 renames, Shift + arrows select a range, Ctrl + Space adds or removes, Alt + arrows
   * reorder, Right / Left expand / collapse a group (Left then goes to its group), Delete or Backspace deletes
   * @param e Keydown of the name button, stopped when handled
   * @param shape Shape of the row
   * @param $name Name button of the row (replaced by a field to rename)
   */
  private _onNameKeydown(e: KeyboardEvent, shape: DrawingShape, $name: HTMLButtonElement) {
    const siblings = shape.getParent()?.children.length ?? 0;
    const parent = shape.getParent();
    const expanded = shape instanceof Group && this.#expanded.has(shape.id());

    if (e.key === 'F2') {
      this._rename(shape, $name);
    } else if (e.shiftKey && !e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      // next row focused, range selected up to it
      const $names = [...this.$list.querySelectorAll<HTMLElement>('.drawer-layers-name')];
      const $next = $names[$names.indexOf($name) + (e.key === 'ArrowUp' ? -1 : 1)];
      const next = $next && this.#shapes.get($next.closest('li')!.dataset.id!);

      if (next) {
        this.#anchor ??= shape.id();
        $next.focus();
        this._select(next, 'range');
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === ' ') {
      this._select(shape, 'toggle');
    } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      this.moveShape(shape, siblings - 1 - shape.zIndex() + (e.key === 'ArrowUp' ? -1 : 1));
    } else if (e.key === 'ArrowRight' && shape instanceof Group && !expanded) {
      this.setExpanded(shape, true);
    } else if (e.key === 'ArrowLeft' && expanded) {
      this.setExpanded(shape as Group, false);
    } else if (e.key === 'ArrowLeft' && parent instanceof Group) {
      // row of its group or frame (shapes of a frame are in its content)
      const row = isFrame(parent.getParent()) ? parent.getParent()! : parent;

      this._getItem(row as Group)
        ?.querySelector<HTMLElement>('[data-part="name"]')
        ?.focus();
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && !this.drawer.readOnly) {
      this.drawer.deleteShapes([shape]);
    } else {
      return;
    }

    // not handled by list (focus move) nor drawer (shortcuts)
    e.preventDefault();
    e.stopPropagation();
  }

  /**
   * Select shape of a row with selection tool (hidden shapes are not, locked ones only without others): `one` alone,
   * `toggle` added or removed (Ctrl + click, Ctrl + Space), `range` with rows from anchor (Shift + click, Shift + arrows)
   * @param shape Shape of the row
   * @param mode How the selection changes: `one`, `toggle` or `range`
   */
  private _select(shape: DrawingShape, mode: 'one' | 'toggle' | 'range') {
    const selectWidget = this.drawer.getWidget<SelectWidget>('selection');

    if (!selectWidget || this.drawer.readOnly || !shape.isVisible()) return;

    const selected = this.drawer.getSelectedShapes();
    const range = mode === 'range' ? this._getRange(shape) : null;

    if (this.drawer.activeWidget !== selectWidget) selectWidget.setActive(true);
    if (range) {
      selectWidget.select(range);
    } else if (mode === 'toggle') {
      this.#anchor = shape.id();
      selectWidget.select(selected.includes(shape) ? selected.filter((s) => s !== shape) : [...selected, shape]);
    } else {
      this.#anchor = shape.id();
      selectWidget.select([shape]);
    }
  }

  /**
   * Selectable shapes of rows from anchor to this one, in same group (null without anchor in it)
   * @param shape Shape of the row ending the range
   * @returns Visible shapes of the range in list order, null when the anchor is missing or in another group
   */
  private _getRange(shape: DrawingShape): DrawingShape[] | null {
    const ids = ([...this.$list.children] as HTMLElement[]).map(($item) => $item.dataset.id!);
    const anchor = this.#anchor ? this.#shapes.get(this.#anchor) : undefined;
    const from = this.#anchor ? ids.indexOf(this.#anchor) : -1;
    const to = ids.indexOf(shape.id());

    if (!anchor || from === -1 || to === -1 || anchor.getParent() !== shape.getParent()) return null;

    return ids
      .slice(Math.min(from, to), Math.max(from, to) + 1)
      .map((id) => this.#shapes.get(id)!)
      .filter((row) => row.getParent() === shape.getParent() && row.isVisible());
  }

  /**
   * Name field instead of name of a row: Enter or leaving it saves, Escape cancels, empty gives back default name
   * @param shape Shape renamed (its `label`)
   * @param $name Name button of the row, replaced by the field
   */
  private _rename(shape: DrawingShape, $name: HTMLButtonElement) {
    if (this.drawer.readOnly) return;

    const $input = document.createElement('input');
    let done = false;
    const end = (save: boolean) => {
      if (done) return;

      done = true;
      this.#busy = false;
      // list updated by change, else now
      if (!save || !this.drawer.setShapeLabel(shape, $input.value)) this.update();
    };

    $input.type = 'text';
    $input.classList.add('drawer-layers-input');
    $input.dataset.part = 'name';
    $input.value = this.drawer.getShapeLabel(shape);
    $input.setAttribute('aria-label', this.drawer.t('layers.name'));
    $input.addEventListener('keydown', (e) => {
      // typed letters are not shortcuts
      e.stopPropagation();
      if ((e.key === 'Enter' || e.key === 'Escape') && !isComposing(e)) {
        e.preventDefault();
        end(e.key === 'Enter');
      }
    });
    // pasted text is not added to drawing
    $input.addEventListener('paste', (e) => e.stopPropagation());
    $input.addEventListener('blur', () => end(true));

    this.#busy = true;
    $name.replaceWith($input);
    $input.focus();
    $input.select();
  }

  /**
   * Move a shape to a place of its group (or drawing): 0 is top
   * @param shape Shape moved among the shapes of its parent
   * @param index Place from the top (row order), clamped to the shapes of the parent
   * @returns true if it moved (change saved)
   */
  moveShape(shape: DrawingShape, index: number): boolean {
    const count = shape.getParent()?.children.length ?? 0;
    const zIndex = Math.min(Math.max(count - 1 - index, 0), count - 1);

    if (!shape.getLayer() || shape.zIndex() === zIndex) return false;

    shape.zIndex(zIndex);
    this.drawer.stage.fire('change');

    return true;
  }

  /**
   * Drag of a row by its handle, among rows of the same group: drop place shown between rows
   * @param e Pointer down on the handle (main button only)
   * @param shape Shape of the dragged row, moved on drop
   * @param $item Dragged row
   */
  private _drag(e: PointerEvent, shape: DrawingShape, $item: HTMLElement) {
    if (this.drawer.readOnly || e.button !== 0) return;

    e.preventDefault();

    const $items = ([...this.$list.children] as HTMLElement[]).filter(
      ($el) => $el.dataset.parent === $item.dataset.parent
    );
    const from = $items.indexOf($item);
    let to = from;

    const move = (event: PointerEvent) => {
      // before first row whose middle is under pointer
      const index = $items.findIndex(($el) => {
        const { top, height } = $el.getBoundingClientRect();

        return event.clientY < top + height / 2;
      });

      to = index === -1 ? $items.length : index;
      $items.forEach(($el, i) => {
        $el.classList.toggle('drop-before', i === to && to !== from && to !== from + 1);
        $el.classList.toggle('drop-after', i === $items.length - 1 && to === $items.length && from !== i);
      });
    };
    const end = (event: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      for (const $el of $items) $el.classList.remove('drop-before', 'drop-after', 'is-dragged');
      this.#busy = false;

      // place once removed from list
      const index = to > from ? to - 1 : to;
      const moved = event.type === 'pointerup' && this.moveShape(shape, index);

      if (!moved && this.#outdated) this.update();
    };

    this.#busy = true;
    $item.classList.add('is-dragged');
    const { signal } = this.drawer;

    window.addEventListener('pointermove', move, { signal });
    window.addEventListener('pointerup', end, { signal });
    window.addEventListener('pointercancel', end, { signal });
  }
}
