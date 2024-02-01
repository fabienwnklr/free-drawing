import './modal.scss';
import { defaultOptionsModal } from './constants';
import { stringToNode } from '@/utils/functions';
import type { Drawer } from '@/Drawer';
import type { ModalOptions } from '@/@types/modal';
import CloseIcon from '@/icons/close.svg?raw';

export class Modal {
  $modal!: HTMLDivElement;
  $modalHeader!: HTMLDivElement;
  $modalBody!: HTMLDivElement;
  $modalFooter!: HTMLDivElement;
  options: ModalOptions;
  drawer: Drawer;
  $backdrop!: HTMLDivElement;

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

    if (this.options.showHeader) {
      this.setHeaderContent(
        `<h2 class="drawer-modal-title">${
          this.options.title ?? 'Modal'
        }</h2><button title="Close" class="btn-close" data-modal="close">${CloseIcon}</button>`
      );
    } else {
      this.$modalHeader.remove();
    }

    this.setBodyContent(this.options.bodyContent ?? '');
    this.setFooterContent(this.options.footerContent ?? '');
  }

  private _setupDefaultEvents() {
    const $closeBtn = this.$modalHeader.querySelector('[data-modal=close]');

    if ($closeBtn) {
      $closeBtn.addEventListener('click', () => {
        this.hide();
      });
    }

    // Close modal when clickin outside
    if (this.options.closeOnClickOutside) {
      document.addEventListener(
        'click',
        (event) => {
          if (event.target) {
            const outsideClick =
              !this.drawer.setting.$clearCanvasButton.contains(event.target as Node) &&
              !this.drawer.help.$button.contains(event.target as Node) &&
              !this.$modal.contains(event.target as Node);

            if (outsideClick) {
              this.hide();
            }
          }
        },
        false
      );
    }

    if (this.options.closeOnEsc) {
      document.addEventListener('keydown', (e) => {
        if (e.key === "Escape" && this.isVisible()) {
          this.hide();
        }
      })
    }
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
    if (this.$backdrop) {
      this.$backdrop.classList.add('show');
    }
    this.$modal.classList.add('show');
  }

  hide() {
    if (this.$backdrop) {
      this.$backdrop.classList.remove('show');
    }
    this.$modal.classList.remove('show');
  }

  isVisible(): boolean {
    return this.$modal.classList.contains('show');
  }

  destroy() {
    this.hide();
    this.$modal.remove();
  }
}
