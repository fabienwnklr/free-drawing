import '@/components/Modal/modal.scss';
import { defaultOptionsModal } from '@/components/Modal/constants';
import { stringToNode } from '@/utils/functions';
import type { Drawer } from '@/Drawer';
import type { ModalOptions } from '@/@types/modal';
import CloseIcon from '@/icons/close.svg?raw';
import { uniqueId } from '@/utils/dom';

const focusableSelector =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export class Modal {
  $modal!: HTMLDivElement;
  $modalHeader!: HTMLDivElement;
  $modalBody!: HTMLDivElement;
  $modalFooter!: HTMLDivElement;
  options: ModalOptions;
  drawer: Drawer;
  $backdrop!: HTMLDivElement;
  /** Element focused before showing modal, focused again on hide */
  #opener: HTMLElement | null = null;

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
   */
  setTitle(title: string) {
    const $title = this.$modalHeader.querySelector('.drawer-modal-title');

    if ($title) $title.textContent = title;
  }

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
   */
  #removedFromPage() {
    if (this.$modal.isConnected) return false;

    this.#removeDocumentListeners();
    return true;
  }

  #removeDocumentListeners() {
    document.removeEventListener('click', this.#onDocumentClick);
    document.removeEventListener('keydown', this.#onDocumentKeydown, true);
  }

  /**
   * Tab and Shift+Tab cycle in modal
   */
  private _trapFocus(event: KeyboardEvent) {
    const $focusables = this._getFocusables();
    const $first = $focusables[0];
    const $last = $focusables[$focusables.length - 1];
    const $active = document.activeElement;

    if (!$first) {
      event.preventDefault();
    } else if (!this.$modal.contains($active) || $active === (event.shiftKey ? $first : $last)) {
      event.preventDefault();
      (event.shiftKey ? $last : $first).focus();
    }
  }

  private _getFocusables() {
    return Array.from(this.$modal.querySelectorAll<HTMLElement>(focusableSelector));
  }

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

      this.drawer.$drawerContainer.append(this.$backdrop);
    } else {
      this.drawer.$drawerContainer.append(this.$modal);
    }
  }

  setHeaderContent(content: string) {
    if (content) {
      this.$modalHeader.innerHTML = content;
    }
  }

  setBodyContent(content: string) {
    this.$modalBody.innerHTML = content;
  }

  appendBodyContent(content: string) {
    this.$modalBody.append(content);
  }

  setFooterContent(content: string) {
    this.$modalFooter.innerHTML = content;
  }

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

  hide() {
    this.#removeDocumentListeners();

    if (this.$backdrop) {
      this.$backdrop.classList.remove('show');
    }
    this.$modal.classList.remove('show');

    // focus back on element which opened modal (not if hidden since, e.g. menu item), else drawer
    const $opener = this.#opener;

    this.#opener = null;
    $opener?.focus();
    if (!$opener || document.activeElement !== $opener) this.drawer.focus();
  }

  isVisible(): boolean {
    return this.$modal.classList.contains('show');
  }

  destroy() {
    this.hide();
    (this.$backdrop ?? this.$modal).remove();
  }
}
