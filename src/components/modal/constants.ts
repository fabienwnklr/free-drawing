import type { ModalOptions } from '@/@types/modal';
import type { ConfirmModal } from './ConfirmModal';

/**
 * @private
 */
export const defaultOptionsModal: ModalOptions = {
  id: Date.now().toString(),
  showHeader: true,
  bodyContent: undefined,
  footerContent: undefined,
  closeOnClickOutside: true,
  closeOnEsc: true,
  backdrop: true,
};

export const confirmModalDefaultOpts = {
  message: 'Would you confirm action ?',
  cancelLabel: 'Cancel',
  confirmLabel: 'Confirm',
  onCancel: (modal: ConfirmModal) => {
    modal.hide();
  },
  onConfirm: (modal: ConfirmModal) => {
    modal.drawer.layer.find('Line').forEach((l) => l.destroy());
    modal.drawer.stage.fire('change');
    modal.hide();
  },
};
