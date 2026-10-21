import '@/components/Modal/modal.scss';
import { defaultOptionsModal } from '@/components/Modal/constants';
import { stringToNode } from '@/utils/functions';
import type { Drawer } from '@/Drawer';
import type { ModalOptions } from '@/@types/ui';
import CloseIcon from '@/icons/close.svg?raw';
import { hasFocusOutside, uniqueId } from '@/utils/dom';

const focusableSelector =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Element reached by Tab: tab index not negative, shown (not in a hidden or inert element, not hidden by styles where
 * the browser tells it)
 * @param $el Focusable element of a dialog
 * @returns True when Tab can stop on it
 */
function isTabStop($el: HTMLElement) {
  if ($el.tabIndex < 0 || $el.closest('[hidden], [inert]')) return false;

  return typeof $el.checkVisibility !== 'function' || $el.checkVisibility({ visibilityProperty: true });
}

/**
 * Name of the group of a radio
 * @param $el Element of a dialog
 * @returns Name of its radio group, empty for other elements
 */
function radioGroup($el: Element | null) {
  return $el instanceof HTMLInputElement && $el.type === 'radio' ? $el.name : '';
}

/**
 * Dialog of the drawer (header with title and close button, body, footer), base of every dialog of the library.
 * Added to the `floating` region of the layout, hidden until {@link Modal.show}: while shown, focus stays in it,
 * Escape and a click outside close it (see options) and keys typed in it do not run drawer shortcuts.
 */
export class Modal {
  /** Dialog element (`role="dialog"`, `aria-modal`), holds header, body and footer */
  $modal!: HTMLDivElement;
  /** Header of the dialog: title and close button, removed when `showHeader` option is false */
  $modalHeader!: HTMLDivElement;
  /** Body of the dialog: content of the dialog */
  $modalBody!: HTMLDivElement;
  /** Footer of the dialog: buttons of the dialog */
  $modalFooter!: HTMLDivElement;
  /** Options of the dialog, merged with default ones */
  options: ModalOptions;
  /** Drawer the dialog belongs to */
  drawer: Drawer;
  /** Backdrop around the dialog (only with `backdrop` option), shown and hidden with it */
  $backdrop!: HTMLDivElement;
  /** Element focused before showing modal, focused again on hide */
  #opener: HTMLElement | null = null;

  /**
   * Create the dialog (hidden) in the `floating` region of the layout
   * @param drawer Drawer the dialog belongs to (layout, texts, focus given back on hide)
   * @param options Options of the dialog, missing ones taken from `defaultOptionsModal`
   */
  constructor(drawer: Drawer, options?: Partial<ModalOptions>) {
    try {
      this.drawer = drawer;
      this.options = { ...defaultOptionsModal, ...options };
      this._init();
      this._setupDefaultEvents();
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Creates the dialog, its header (translated close button) unless `showHeader` is false, body and footer contents
   */
  private _init() {
    this._createModal();
    this.$modal.setAttribute('role', 'dialog');
    this.$modal.setAttribute('aria-modal', 'true');

    if (this.options.showHeader) {
      const titleId = uniqueId('modal-title');

      this.setHeaderContent(
        `<h2 class="drawer-modal-title" id="${titleId}">${
          this.options.title ?? ''
        }</h2><button type="button" class="btn-close" data-modal="close">${CloseIcon}</button>`
      );
      this.$modal.setAttribute('aria-labelledby', titleId);
      this.drawer.i18n.translate((t) => {
        const $close = this.$modalHeader.querySelector<HTMLElement>('[data-modal=close]')!;

        $close.title = t('modal.close');
        $close.setAttribute('aria-label', t('modal.close'));
      });
    } else {
      this.$modalHeader.remove();
    }

    this.setBodyContent(this.options.bodyContent ?? '');
    this.setFooterContent(this.options.footerContent ?? '');
  }

  /**
   * Title in header
   * @param title Text of the title (nothing without header)
   */
  setTitle(title: string) {
    const $title = this.$modalHeader.querySelector('.drawer-modal-title');

    if ($title) $title.textContent = title;
  }

  /**
   * Close button hides the dialog, keys typed in it do not reach the drawer
   */
  private _setupDefaultEvents() {
    const $closeBtn = this.$modalHeader.querySelector('[data-modal=close]');

    if ($closeBtn) {
      $closeBtn.addEventListener('click', () => {
        this.hide();
      });
    }

    // keys typed in modal do not trigger drawer shortcuts
    this.$modal.addEventListener('keydown', (event) => event.stopPropagation());
  }

  // document listeners, added only while modal is visible
  #onDocumentClick = (event: MouseEvent) => {
    if (this.#removedFromPage()) return;
    if (!this.$modal.contains(event.target as Node)) this.hide();
  };

  #onDocumentKeydown = (event: KeyboardEvent) => {
    if (this.#removedFromPage()) return;
    if (event.key === 'Escape' && this.options.closeOnEsc) {
      event.stopPropagation();
      this.hide();
    } else if (event.key === 'Tab') {
      this._trapFocus(event);
    }
  };

  /**
   * Drawer removed from page while modal is shown (e.g. view of app changed): keys and clicks of page not taken anymore
   * @returns True when the dialog left the page (document listeners removed)
   */
  #removedFromPage() {
    if (this.$modal.isConnected) return false;

    this.#removeDocumentListeners();
    return true;
  }

  /**
   * Removes the document listeners of a shown dialog (click outside, Escape and Tab)
   */
  #removeDocumentListeners() {
    document.removeEventListener('click', this.#onDocumentClick);
    document.removeEventListener('keydown', this.#onDocumentKeydown, true);
  }

  /**
   * Tab and Shift+Tab cycle in modal
   * @param event Keydown of Tab on the document, default prevented when focus wraps
   */
  private _trapFocus(event: KeyboardEvent) {
    const $focusables = this._getFocusables();
    const $first = $focusables[0];
    const $last = $focusables[$focusables.length - 1];
    const $edge = event.shiftKey ? $first : $last;
    const $active = document.activeElement;

    if (!$first) {
      event.preventDefault();
    } else if (
      !this.$modal.contains($active) ||
      $active === $edge ||
      // any radio of the group: Tab leaves the group
      (!!radioGroup($active) && radioGroup($active) === radioGroup($edge))
    ) {
      event.preventDefault();
      (event.shiftKey ? $last : $first).focus();
    }
  }

  /**
   * Elements of the dialog reached by Tab, in document order, as the browser does: enabled, shown, tab index not
   * negative, one stop per radio group (its checked radio, else its first one)
   * @returns Buttons, links, fields and elements with a tab index of the dialog
   */
  private _getFocusables() {
    const $stops = Array.from(this.$modal.querySelectorAll<HTMLElement>(focusableSelector)).filter(isTabStop);

    return $stops.filter(($el) => {
      const group = radioGroup($el);

      if (!group) return true;

      const $radios = $stops.filter(($other) => radioGroup($other) === group) as HTMLInputElement[];

      return $el === ($radios.find(($radio) => $radio.checked) ?? $radios[0]);
    });
  }

  /**
   * Creates dialog elements and adds them to the `floating` region of the layout (in a backdrop if enabled)
   */
  private _createModal() {
    this.$modal = stringToNode<HTMLDivElement>(/*html*/ `
    <div class="drawer-modal"></div>`);
    this.$modalHeader = stringToNode<HTMLDivElement>(/*html*/ `
      <div class="drawer-modal-header"></div>`);
    this.$modalBody = stringToNode<HTMLDivElement>(/*html*/ `
      <div class="drawer-modal-body"></div>`);
    this.$modalFooter = stringToNode<HTMLDivElement>(/*html*/ `
      <div class="drawer-modal-footer"></div>`);

    this.$modal.append(...[this.$modalHeader, this.$modalBody, this.$modalFooter]);

    if (this.options.backdrop) {
      this.$backdrop = stringToNode<HTMLDivElement>(/*html*/ `
      <div class="backdrop"></div>
      `);
      this.$backdrop.append(this.$modal);

      this.drawer.layout.add('floating', this.$backdrop);
    } else {
      this.drawer.layout.add('floating', this.$modal);
    }
  }

  /**
   * Replaces the header with an HTML string (an empty string keeps the current header)
   * @param content HTML markup of the header
   */
  setHeaderContent(content: string) {
    if (content) {
      this.$modalHeader.innerHTML = content;
    }
  }

  /**
   * Replaces the body with an HTML string
   * @param content HTML markup of the body, empty to clear it
   */
  setBodyContent(content: string) {
    this.$modalBody.innerHTML = content;
  }

  /**
   * Adds text at the end of the body (as text, not parsed as HTML)
   * @param content Text added after the body content
   */
  appendBodyContent(content: string) {
    this.$modalBody.append(content);
  }

  /**
   * Replaces the footer with an HTML string
   * @param content HTML markup of the footer (buttons), empty to clear it
   */
  setFooterContent(content: string) {
    this.$modalFooter.innerHTML = content;
  }

  /**
   * Shows the dialog and focuses its first focusable element. The element focused before is focused again on hide.
   * While shown, Escape (`closeOnEsc`) and a click outside (`closeOnClickOutside`) hide it, Tab cycles in it.
   */
  show() {
    if (!this.isVisible()) {
      const $active = document.activeElement;
      this.#opener = $active instanceof HTMLElement && $active !== document.body ? $active : null;
    }

    if (this.$backdrop) {
      this.$backdrop.classList.add('show');
    }
    this.$modal.classList.add('show');

    // keyboard focus in modal (first button, link or field)
    this._getFocusables()[0]?.focus();
    // capture: before drawer shortcuts and focused element
    document.addEventListener('keydown', this.#onDocumentKeydown, true);

    // after current event, so the click opening the modal (any button) does not close it
    setTimeout(() => {
      if (!this.isVisible()) return;

      if (this.options.closeOnClickOutside) document.addEventListener('click', this.#onDocumentClick);
    });
  }

  /**
   * Hides the dialog and gives focus back to the element which opened it, else to the drawer, unless an element out
   * of the drawer took it (field of the page or another drawer clicked)
   */
  hide() {
    this.#removeDocumentListeners();

    if (this.$backdrop) {
      this.$backdrop.classList.remove('show');
    }
    this.$modal.classList.remove('show');

    // focus back on element which opened modal (not if hidden since, e.g. menu item), else drawer
    const $opener = this.#opener;

    this.#opener = null;
    if (hasFocusOutside(this.drawer.$drawerContainer)) return;
    $opener?.focus();
    if (!$opener || document.activeElement !== $opener) this.drawer.focus();
  }

  /**
   * Whether the dialog is shown
   * @returns True while the dialog is shown
   */
  isVisible(): boolean {
    return this.$modal.classList.contains('show');
  }

  /**
   * Hides the dialog and removes it from the page
   */
  destroy() {
    this.hide();
    (this.$backdrop ?? this.$modal).remove();
  }
}
