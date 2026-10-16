import type { ModalOptions } from '@/@types/modal';
import type { ConfirmModal } from '@/components/Modal/ConfirmModal';

/**
 * Default options of dialogs: header shown, closed by Escape and click outside, with a backdrop
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

/**
 * Default actions of confirmation dialog (texts: translated ones)
 */
export const confirmModalDefaultOpts = {
  /**
   * Hides the dialog
   * @param modal Confirmation dialog whose Cancel button was clicked
   */
  onCancel: (modal: ConfirmModal) => {
    modal.hide();
  },
  /**
   * Clears the drawing without asking again, then hides the dialog
   * @param modal Confirmation dialog whose Confirm button was clicked (its drawer is cleared)
   */
  onConfirm: (modal: ConfirmModal) => {
    modal.drawer.clearCanvas(true);
    modal.hide();
  },
};
