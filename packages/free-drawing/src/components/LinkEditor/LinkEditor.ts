import '@/components/LinkEditor/link-editor.scss';
import type { DrawingShape } from '@/@types/drawer';
import type { TranslationKey } from '@/@types/i18n';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { drawerEvents } from '@/constants';
import type { Drawer } from '@/Drawer';
import CloseIcon from '@/icons/close.svg?raw';
import ExternalLinkIcon from '@/icons/external-link.svg?raw';
import LinkIcon from '@/icons/link.svg?raw';
import { createButton, isComposing, placeInView, setLabel } from '@/utils/dom';
import { parseLink } from '@/utils/link';
import { getPlacementArea, getSelectionBox, getSelectionSurroundings, unionRect } from '@/utils/selection';

/** Space between the selection (or its menu) and the editor, between the editor and the view edges (px) */
const gap = 12;

/**
 * Link of the selection, above it: address field (Enter or change applies it, Escape cancels), open and remove
 * buttons. Shown for selected shapes having a link, or to add one (`edit`: link button of the selection panel, context
 * menu, command palette). Hidden while shapes are moved, transformed or edited, and for locked shapes
 */
export class LinkEditor {
  /** Drawer whose selection link is edited */
  drawer: Drawer;
  /** Editor element (group named "Link"), placed above the selection */
  $editor: HTMLDivElement;
  /** Address of the link of selected shapes, applied on change or Enter, Escape cancels */
  $input: HTMLInputElement;
  /** Opens the link of selected shapes, shown when they have one */
  $openBtn: HTMLButtonElement;
  /** Removes the link of selected shapes, shown when they have one */
  $removeBtn: HTMLButtonElement;
  /** Shapes whose link is shown: selection when the field was filled */
  #shapes: DrawingShape[] = [];
  /** Shown for a selection without link: opened by `edit`, until the address is applied or cancelled */
  #editing = false;
  /** Address last applied or refused (Enter then change of the field: handled once) */
  #handled = '';
  /** Element focused before `edit` (link button of the panel, drawer...), focused again once done */
  #opener: HTMLElement | null = null;

  /**
   * Create the editor (hidden) in the floating region, updated with the selection (after the selection menu)
   * @param drawer Drawer whose selection link is edited
   */
  constructor(drawer: Drawer) {
    this.drawer = drawer;
    this.$editor = document.createElement('div');
    this.$editor.classList.add('drawer-link-editor', 'tool');
    this.$editor.setAttribute('role', 'group');

    const $icon = document.createElement('span');

    $icon.classList.add('drawer-link-editor__icon');
    $icon.innerHTML = LinkIcon;

    this.$input = document.createElement('input');
    this.$input.type = 'url';
    this.$input.autocomplete = 'off';
    this.$input.spellcheck = false;
    this.$input.classList.add('drawer-link-editor__input');
    drawer.i18n.translate((t) => {
      this.$editor.setAttribute('aria-label', t('action.link'));
      this.$input.placeholder = t('link.placeholder');
      setLabel(this.$input, t('link.address'));
    });
    this.$input.addEventListener('change', () => this._apply());
    this.$input.addEventListener('keydown', (e) => {
      // typed keys are not drawer shortcuts (tools, delete selection...)
      e.stopPropagation();
      if ((e.key !== 'Enter' && e.key !== 'Escape') || isComposing(e)) return;
      // not a click of the element focused once done (link button of the panel)
      e.preventDefault();
      if (e.key === 'Escape') this._fill();
      if (e.key === 'Escape' || this._apply()) this._done();
    });

    this.$openBtn = this._createButton(ExternalLinkIcon, 'link.open', () =>
      this.drawer.openShapeLink(this.#shapes.find((shape) => this.drawer.getShapeLink(shape)))
    );
    this.$removeBtn = this._createButton(CloseIcon, 'link.remove', () => {
      this.drawer.setShapeLink(null, this.#shapes);
      this._done();
    });
    this.$editor.append($icon, this.$input, this.$openBtn, this.$removeBtn);
    drawer.layout.add('floating', this.$editor);

    // same moments as the selection menu, created before: placed out of it
    drawer.selectionLayer.on('draw.linkeditor', () => this.update());
    drawer.drawLayer.on('dragend.linkeditor', () => this.update());
    drawer.getWidget<SelectWidget>('selection')?.transformer.on('transformend.linkeditor', () => this.update());
    drawer.on(drawerEvents.readOnlyChange, () => this.update());
    drawer.on(drawerEvents.selectionChange, () => {
      // address typed for the previous selection
      if (this.$editor.contains(document.activeElement)) this._apply();
      this.#editing = false;
      this._fill();
      this.update();
    });
    // link changed elsewhere (undo, collaborator...): shown, unless typed
    drawer.on(drawerEvents.change, () => {
      if (document.activeElement !== this.$input) this._fill();
      this.update();
    });
  }

  /**
   * Icon button named by its label
   * @param icon SVG markup of the icon
   * @param label Key of the accessible name and tooltip
   * @param run Called on click
   * @returns Button appended by the constructor
   */
  private _createButton(icon: string, label: TranslationKey, run: () => void) {
    const $btn = createButton('drawer-button');

    $btn.innerHTML = icon;
    this.drawer.i18n.translate((t) => setLabel($btn, t(label)));
    $btn.addEventListener('click', run);

    return $btn;
  }

  /**
   * Link of the shapes shown
   * @returns link of the first of them having one, null without one
   */
  private _getLink(): string | null {
    return this.#shapes.map((shape) => this.drawer.getShapeLink(shape)).find((link) => link) ?? null;
  }

  /**
   * Field filled with the link of selected shapes, open and remove buttons shown for a link
   */
  private _fill() {
    this.#shapes = this.drawer.getSelectedShapes();

    const link = this._getLink();

    this.$input.value = link ?? '';
    this.#handled = this.$input.value;
    this.$openBtn.hidden = !link;
    this.$removeBtn.hidden = !link;
  }

  /**
   * Typed address applied to the shapes shown (empty removes their link), told when invalid
   * @returns false for an invalid address (not applied)
   */
  private _apply(): boolean {
    const value = this.$input.value;

    if (value === this.#handled) return true;
    this.#handled = value;
    if (value.trim() && !parseLink(value)) {
      this.drawer.toast(this.drawer.t('toast.invalidShapeLink'), 'warning');
      return false;
    }
    this.drawer.setShapeLink(value, this.#shapes);
    this._fill();

    return true;
  }

  /**
   * Address applied or cancelled: editor kept only for a link, focus back on the element focused before `edit`
   */
  private _done() {
    const opener = this.#opener;

    this.#editing = false;
    this.#opener = null;
    this.update();
    opener?.focus();
    if (!opener || document.activeElement !== opener) this.drawer.focus();
  }

  /**
   * Editor shown above the selection, its address focused and selected (link button of the selection panel, context
   * menu, command palette)
   */
  edit() {
    const $focused = document.activeElement;

    this.#opener = $focused instanceof HTMLElement && !this.$editor.contains($focused) ? $focused : null;
    this.#editing = true;
    this._fill();
    this.update();
    if (!this.isVisible()) return;
    this.$input.focus();
    this.$input.select();
  }

  /**
   * Show the editor above the selection (else below it, out of the selection menu) for a link or while editing, or
   * hide it (no selection, locked shapes, shapes moved or edited, out of view...)
   */
  update() {
    const locked = !!this.drawer.getWidget<SelectWidget>('selection')?.isLocked();

    if (locked || !this.#shapes.length || !getSelectionBox(this.drawer) || (!this.#editing && !this._getLink())) {
      this.hide();
      return;
    }

    this.$editor.classList.add('show');

    const { offsetWidth: width, offsetHeight: height } = this.$editor;
    const boxes = [getSelectionSurroundings(this.drawer)];
    const menu = this.drawer.selectionMenu;

    // out of the selection menu too (placed before)
    if (menu?.isVisible()) {
      const view = this.drawer.$stageContainer.getBoundingClientRect();
      const rect = menu.$menu.getBoundingClientRect();

      boxes.push({ x: rect.left - view.left, y: rect.top - view.top, width: rect.width, height: rect.height });
    }

    const around = unionRect(boxes);
    const area = getPlacementArea(this.drawer, gap);
    const left = Math.max(area.left, Math.min(around.x + around.width / 2 - width / 2, area.right - width));
    const above = around.y - gap - height;
    const below = around.y + around.height + gap;

    // above, else below, else at top of view (selection bigger than view)
    placeInView(
      this.drawer,
      this.$editor,
      left,
      above >= area.top ? above : below + height <= area.bottom ? below : area.top
    );
  }

  /**
   * Hide the editor, focus back on drawer if it was in it (e.g. selection cleared)
   */
  hide() {
    const hadFocus = this.$editor.contains(document.activeElement);

    this.$editor.classList.remove('show');
    if (hadFocus) this.drawer.focus();
  }

  /**
   * Whether the editor is shown
   * @returns True while the editor is shown
   */
  isVisible() {
    return this.$editor.classList.contains('show');
  }
}
