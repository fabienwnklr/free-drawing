import type { Drawer } from '@/Drawer';
import { Modal } from '@/components/Modal/Modal';
import { deepMerge } from '@/utils/functions';
import { confirmModalDefaultOpts } from '@/components/Modal/constants';
import type { ConfirmModalOptions } from '@/@types/ui';
import { createButton, uniqueId } from '@/utils/dom';

import '@/components/Modal/modal-confirm.scss';

/**
 * Confirmation dialog (`alertdialog` without header): a message, Cancel (focused first) and Confirm buttons.
 * By default Cancel hides it and Confirm clears the drawing (see {@link confirmModalDefaultOpts}).
 */
export class ConfirmModal extends Modal {
  /** Drawer the dialog belongs to */
  drawer: Drawer;
  /** Message asking confirmation, names the dialog */
  $message: HTMLParagraphElement;
  /** Cancel button, runs {@link ConfirmModal.onCancel} */
  $cancelBtn: HTMLButtonElement;
  /** Confirm button (danger style), runs {@link ConfirmModal.onConfirm} */
  $confirmBtn: HTMLButtonElement;
  /** Action of the Cancel button, from options (default: hides the dialog) */
  onCancel: (modal: ConfirmModal) => void;
  /** Action of the Confirm button, from options (default: clears the drawing and hides the dialog) */
  onConfirm: (modal: ConfirmModal) => void;
  /** Options of the confirmation (message, button labels, actions), merged with default ones */
  _options: ConfirmModalOptions;
  #messageId = uniqueId('confirm-message');

  /**
   * Create the dialog (hidden, without header) with its message and buttons
   * @param drawer Drawer the dialog belongs to
   * @param options Message, button labels and actions, missing ones taken from {@link confirmModalDefaultOpts}
   */
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
   * @param message Text of the message, kept when the language changes
   */
  setMessage(message: string) {
    this._options.message = message;
    this.$message.textContent = message;
  }

  /**
   * Label of the confirm button, naming the action (e.g. "Stop session")
   * @param label Text of the button, kept when the language changes
   */
  setConfirmLabel(label: string) {
    this._options.confirmLabel = label;
    this.$confirmBtn.textContent = label;
  }

  /**
   * Buttons run their action with the dialog (actions read at click: they can be replaced after creation)
   */
  private _initEvents() {
    this.$cancelBtn.addEventListener('click', () => {
      this.onCancel(this);
    });
    this.$confirmBtn.addEventListener('click', () => {
      this.onConfirm(this);
    });
  }
}
