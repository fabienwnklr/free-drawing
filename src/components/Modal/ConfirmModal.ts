import type { Drawer } from '@/Drawer';
import { Modal } from './Modal';
import { deepMerge } from '@/utils/functions';
import { confirmModalDefaultOpts } from './constants';
import type { ConfirmModalOptions } from '@/@types/modal';
import { uniqueId } from '@/utils/dom';

import './modal-confirm.scss';

export class ConfirmModal extends Modal {
  drawer: Drawer;
  $cancelBtn!: HTMLButtonElement;
  $confirmBtn!: HTMLButtonElement;
  message: string;
  cancelLabel: string;
  onCancel: (modal: ConfirmModal) => void;
  confirmLabel: string;
  onConfirm: (modal: ConfirmModal) => void;
  _options: ConfirmModalOptions;
  #messageId = uniqueId('confirm-message');

  constructor(drawer: Drawer, options: Partial<ConfirmModalOptions> = {}) {
    super(drawer, { showHeader: false });

    this.$modal.classList.add('drawer-modal-confirm');
    // confirmation interrupts user, named by its message
    this.$modal.setAttribute('role', 'alertdialog');
    this.$modal.setAttribute('aria-labelledby', this.#messageId);
    this._options = deepMerge<ConfirmModalOptions>(confirmModalDefaultOpts, options);
    this.drawer = drawer;
    this.message = this._options.message;
    this.cancelLabel = this._options.cancelLabel;
    this.onCancel = this._options.onCancel;
    this.confirmLabel = this._options.confirmLabel;
    this.onConfirm = this._options.onConfirm;

    this.fill();
    this._setupElements();
    this._initEvents();
  }

  fill() {
    this.setBodyContent(`<p class="p-2" id="${this.#messageId}">${this.message}</p>`);
    // cancel first: focused on show
    this.setFooterContent(
      /*html*/ `<button type="button" class="drawer-button drawer-button-neutral">${this.cancelLabel}</button><button type="button" class="drawer-button drawer-button-danger">${this.confirmLabel}</button>`
    );
  }

  private _setupElements() {
    this.$cancelBtn = this.$modalFooter.querySelector(`.drawer-button-neutral`) as HTMLButtonElement;
    this.$confirmBtn = this.$modalFooter.querySelector(`.drawer-button-danger`) as HTMLButtonElement;
  }

  private _initEvents() {
    this.$cancelBtn?.addEventListener('click', () => {
      this.onCancel(this);
    });
    this.$confirmBtn?.addEventListener('click', () => {
      this.onConfirm(this);
    });
  }
}
