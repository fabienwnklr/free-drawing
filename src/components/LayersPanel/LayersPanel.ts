import './layers-panel.scss';
import type { Drawer } from '@/Drawer';
import type { Shape, ShapeConfig } from 'konva/lib/Shape';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { shapeName } from '@/constants';
import { arrowNavigation, createButton, disableElement, setLabel, setPressed, uniqueId } from '@/utils/dom';
import LayersIcon from '@/icons/layers.svg?raw';
import CloseIcon from '@/icons/close.svg?raw';
import GripIcon from '@/icons/grip.svg?raw';
import EyeIcon from '@/icons/eye.svg?raw';
import EyeOffIcon from '@/icons/eye-off.svg?raw';
import LockIcon from '@/icons/lock.svg?raw';
import UnlockIcon from '@/icons/unlock.svg?raw';
import TrashIcon from '@/icons/trash.svg?raw';
import BrushIcon from '@/icons/brush.svg?raw';
import LineIcon from '@/icons/line2.svg?raw';
import SquareIcon from '@/icons/square.svg?raw';
import CircleIcon from '@/icons/circle.svg?raw';
import ArrowIcon from '@/icons/arrow.svg?raw';
import TextIcon from '@/icons/text.svg?raw';

/** Icons of shape types, as their tools */
const typeIcons: Record<string, string> = {
  [shapeName.line]: BrushIcon,
  [shapeName.straightLine]: LineIcon,
  [shapeName.rect]: SquareIcon,
  [shapeName.ellipse]: CircleIcon,
  [shapeName.arrow]: ArrowIcon,
  [shapeName.text]: TextIcon,
};

/**
 * Panel listing drawing shapes, top one first: select them (Shift adds), rename (double click, F2), reorder (drag
 * handle, Alt + arrows), hide, lock and delete them
 */
export class LayersPanel {
  drawer: Drawer;
  $buttonContainer: HTMLDivElement;
  $button: HTMLButtonElement;
  $panel: HTMLDivElement;
  $closeButton: HTMLButtonElement;
  $list: HTMLUListElement;
  $empty: HTMLParagraphElement;
  /** Rename or drag in progress: list updated after it */
  #busy = false;
  #outdated = false;

  constructor(drawer: Drawer) {
    this.drawer = drawer;

    // header button, next to menu
    this.$buttonContainer = document.createElement('div');
    this.$buttonContainer.classList.add('drawer-layers-button-container', 'tool');
    this.$button = createButton('drawer-button', 'drawer-button-neutral');
    this.$button.innerHTML = LayersIcon;
    setLabel(this.$button, 'Layers');
    this.$button.title = 'Layers (Alt+L)';
    this.$button.setAttribute('aria-keyshortcuts', 'Alt+L');
    this.$button.setAttribute('aria-expanded', 'false');
    setPressed(this.$button, false);
    this.$button.addEventListener('click', () => this.toggle());
    this.$buttonContainer.append(this.$button);
    this.drawer.setting.$dropdownContainer.after(this.$buttonContainer);

    this.$panel = document.createElement('div');
    this.$panel.id = uniqueId('layers');
    this.$panel.classList.add('drawer-layers-panel', 'tool');
    this.$panel.setAttribute('role', 'region');
    this.$button.setAttribute('aria-controls', this.$panel.id);

    const $header = document.createElement('div');
    const $title = document.createElement('h2');

    $header.classList.add('drawer-layers-header');
    $title.classList.add('drawer-layers-title');
    $title.id = uniqueId('layers-title');
    $title.textContent = 'Layers';
    this.$panel.setAttribute('aria-labelledby', $title.id);
    this.$closeButton = createButton('drawer-button', 'drawer-button-neutral');
    this.$closeButton.innerHTML = CloseIcon;
    setLabel(this.$closeButton, 'Close layers');
    this.$closeButton.addEventListener('click', () => this._close());
    $header.append($title, this.$closeButton);

    this.$list = document.createElement('ul');
    this.$list.classList.add('drawer-layers-list');
    this.$list.setAttribute('aria-labelledby', $title.id);
    this.$empty = document.createElement('p');
    this.$empty.classList.add('drawer-layers-empty', 'text-muted');
    this.$empty.textContent = 'No shapes yet';

    this.$panel.append($header, this.$list, this.$empty);
    this.drawer.$drawerContainer.append(this.$panel);

    arrowNavigation(this.$list, () => [...this.$list.querySelectorAll<HTMLElement>('.drawer-layers-name')], 'vertical');
    // Tab goes to actions of current row only
    this.$list.addEventListener('focusin', (e) => this._setCurrent((e.target as HTMLElement).closest('li')));
    this.$panel.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || (e.target as HTMLElement).matches('input')) return;

      e.stopPropagation();
      this._close();
    });

    this.drawer.on('change', () => this.update());
    this.drawer.on('fd.selection.change', () => this.updateSelection());
    this.drawer.on('fd.readonly.change', () => this.update());
  }

  isVisible() {
    return this.$panel.classList.contains('show');
  }

  /**
   * Show or hide panel
   * @param {boolean} show Toggle by default
   */
  toggle(show: boolean = !this.isVisible()) {
    this.$panel.classList.toggle('show', show);
    setPressed(this.$button, show);
    this.$button.setAttribute('aria-expanded', String(show));
    if (show) this.update();
  }

  private _close() {
    this.toggle(false);
    this.$button.focus();
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
    const shapes = this.drawer.getDrawingShapes().reverse();

    this.#outdated = false;
    this.$panel.classList.toggle('read-only', this.drawer.readOnly);
    this.$list.replaceChildren(...shapes.map((shape) => this._createItem(shape)));
    this.$empty.hidden = shapes.length > 0;
    this.updateSelection();

    if (!$focusedItem) return;

    // same control of same shape, else row at same place (shape removed)
    const $items = [...this.$list.children] as HTMLElement[];
    const $item = $items.find(($el) => $el.dataset.id === $focusedItem.dataset.id);
    const $target = $item
      ? $item.querySelector<HTMLElement>(`[data-part="${$focused?.dataset.part}"]`)
      : $items[Math.min(focusedIndex, $items.length - 1)]?.querySelector<HTMLElement>('[data-part="name"]');

    ($target ?? this.$closeButton).focus();
  }

  /**
   * Rows of selected shapes highlighted, first one scrolled into view
   */
  updateSelection() {
    const selected = this.drawer.getSelectedShapes().map((shape) => shape.id());
    const $items = [...this.$list.children] as HTMLElement[];

    $items.forEach(($item) => {
      const isSelected = selected.includes($item.dataset.id!);

      $item.classList.toggle('is-selected', isSelected);
      setPressed($item.querySelector('.drawer-layers-name')!, isSelected);
    });

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
   * Row reached with Tab (roving tab index), others with arrows
   */
  private _setCurrent($current: Element | null | undefined) {
    [...this.$list.children].forEach(($item) => {
      $item.querySelectorAll<HTMLElement>('button').forEach(($btn) => ($btn.tabIndex = $item === $current ? 0 : -1));
    });
  }

  private _createItem(shape: Shape<ShapeConfig>) {
    const label = this.drawer.getShapeLabel(shape);
    const hidden = !shape.visible();
    const locked = !shape.listening();
    const type = Object.keys(typeIcons).find((name) => shape.hasName(name));
    const $item = document.createElement('li');
    const $grip = document.createElement('span');
    const $name = createButton('drawer-layers-name');
    const $label = document.createElement('span');

    $item.classList.add('drawer-layers-item');
    $item.classList.toggle('is-hidden', hidden);
    $item.classList.toggle('is-locked', locked);
    $item.dataset.id = shape.id();

    // pointer only, Alt + arrows with keyboard
    $grip.classList.add('drawer-layers-grip');
    $grip.innerHTML = GripIcon;
    $grip.setAttribute('aria-hidden', 'true');
    $grip.title = 'Drag to reorder';
    $grip.addEventListener('pointerdown', (e) => this._drag(e, shape, $item));

    $name.dataset.part = 'name';
    $name.title = label;
    $name.innerHTML = `<span class="drawer-layers-icon" aria-hidden="true">${type ? typeIcons[type] : ''}</span>`;
    $label.classList.add('drawer-layers-label');
    $label.textContent = label;
    $name.append($label);
    $name.addEventListener('click', (e) => this._select(shape, e.shiftKey));
    $name.addEventListener('dblclick', () => this._rename(shape, $name));
    $name.addEventListener('keydown', (e) => this._onNameKeydown(e, shape, $name));

    const $visibility = this._createAction('visibility', hidden ? EyeOffIcon : EyeIcon, `Hide ${label}`, hidden, () =>
      this.drawer.setShapesHidden(shape.visible(), [shape])
    );
    const $lock = this._createAction('lock', locked ? LockIcon : UnlockIcon, `Lock ${label}`, locked, () =>
      this.drawer.setShapesLocked(shape.listening(), [shape])
    );
    const $delete = this._createAction('delete', TrashIcon, `Delete ${label}`, null, () =>
      this.drawer.deleteShapes([shape])
    );

    $item.append($grip, $name, $visibility, $lock, $delete);

    return $item;
  }

  /**
   * Action of a row, toggle when `pressed` is a boolean
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

  private _onNameKeydown(e: KeyboardEvent, shape: Shape<ShapeConfig>, $name: HTMLButtonElement) {
    const index = this.drawer.getDrawingShapes().length - 1 - shape.zIndex();

    if (e.key === 'F2') {
      this._rename(shape, $name);
    } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      this.moveShape(shape, index + (e.key === 'ArrowUp' ? -1 : 1));
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
   * Select shape of a row (Shift adds or removes it), with selection tool: locked and hidden shapes are not
   */
  private _select(shape: Shape<ShapeConfig>, add: boolean) {
    const selectWidget = this.drawer.getWidget<SelectWidget>('selection');

    if (!selectWidget || this.drawer.readOnly || !shape.listening() || !shape.visible()) return;

    const selected = this.drawer.getSelectedShapes();

    if (this.drawer.activeWidget !== selectWidget) selectWidget.setActive(true);
    if (!add) selectWidget.select([shape]);
    else selectWidget.select(selected.includes(shape) ? selected.filter((s) => s !== shape) : [...selected, shape]);
  }

  /**
   * Name field instead of name of a row: Enter or leaving it saves, Escape cancels, empty gives back default name
   */
  private _rename(shape: Shape<ShapeConfig>, $name: HTMLButtonElement) {
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
    $input.setAttribute('aria-label', 'Name');
    $input.addEventListener('keydown', (e) => {
      // typed letters are not shortcuts
      e.stopPropagation();
      if (e.key === 'Enter' || e.key === 'Escape') {
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
   * Move a shape to a place of the list (0: top of drawing)
   * @returns {boolean} true if it moved (change saved)
   */
  moveShape(shape: Shape<ShapeConfig>, index: number): boolean {
    const count = this.drawer.getDrawingShapes().length;
    const zIndex = Math.min(Math.max(count - 1 - index, 0), count - 1);

    if (!shape.getLayer() || shape.zIndex() === zIndex) return false;

    shape.zIndex(zIndex);
    this.drawer.stage.fire('change');

    return true;
  }

  /**
   * Drag of a row by its handle: drop place shown between rows
   */
  private _drag(e: PointerEvent, shape: Shape<ShapeConfig>, $item: HTMLElement) {
    if (this.drawer.readOnly || e.button !== 0) return;

    e.preventDefault();

    const $items = [...this.$list.children] as HTMLElement[];
    const from = $items.indexOf($item);
    let to = from;

    const move = (event: PointerEvent) => {
      // before first row whose middle is under pointer
      const index = $items.findIndex(($el) => {
        const { top, height } = $el.getBoundingClientRect();

        return event.clientY < top + height / 2;
      });

      to = index === -1 ? $items.length : index;
      $items.forEach(($el, i) => $el.classList.toggle('drop-before', i === to && to !== from && to !== from + 1));
      this.$list.classList.toggle('drop-end', to === $items.length && from !== $items.length - 1);
    };
    const end = (event: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      $items.forEach(($el) => $el.classList.remove('drop-before', 'is-dragged'));
      this.$list.classList.remove('drop-end');
      this.#busy = false;

      // place once removed from list
      const index = to > from ? to - 1 : to;
      const moved = event.type === 'pointerup' && this.moveShape(shape, index);

      if (!moved && this.#outdated) this.update();
    };

    this.#busy = true;
    $item.classList.add('is-dragged');
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  }
}
