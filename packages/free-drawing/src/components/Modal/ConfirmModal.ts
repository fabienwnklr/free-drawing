import type { Drawer } from '@/Drawer';
import { Modal } from '@/components/Modal/Modal';
import { deepMerge } from '@/utils/functions';
import { confirmModalDefaultOpts } from '@/components/Modal/constants';
import type { ConfirmModalOptions } from '@/@types/modal';
import { createButton, uniqueId } from '@/utils/dom';

import '@/components/Modal/modal-confirm.scss';

export class ConfirmModal extends Modal {
  drawer: Drawer;
  $message: HTMLParagraphElement;
  $cancelBtn: HTMLButtonElement;
  $confirmBtn: HTMLButtonElement;
  onCancel: (modal: ConfirmModal) => void;
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
    this.onCancel = this._options.onCancel;
    this.onConfirm = this._options.onConfirm;

    this.$message = document.createElement('p');
    this.$message.className = 'p-2';
    this.$message.id = this.#messageId;
    this.$modalBody.append(this.$message);
    // cancel first: focused on show
    this.$cancelBtn = createButton('drawer-button', 'drawer-button-neutral');
    this.$confirmBtn = createButton('drawer-button', 'drawer-button-danger');
    this.$modalFooter.append(this.$cancelBtn, this.$confirmBtn);
    // texts given in options, else translated ones
    drawer.i18n.translate((t) => {
      this.$message.textContent = this._options.message ?? t('confirm.message');
      this.$cancelBtn.textContent = this._options.cancelLabel ?? t('confirm.cancel');
      this.$confirmBtn.textContent = this._options.confirmLabel ?? t('confirm.confirm');
    });

    this._initEvents();
  }

  /**
   * Message asking confirmation
   */
  setMessage(message: string) {
    this._options.message = message;
    this.$message.textContent = message;
  }

  private _initEvents() {
    this.$cancelBtn.addEventListener('click', () => {
      this.onCancel(this);
    });
    this.$confirmBtn.addEventListener('click', () => {
      this.onConfirm(this);
    });
  }
}
