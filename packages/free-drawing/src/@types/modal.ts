import type { ConfirmModal } from '@/components/Modal/ConfirmModal';

/**
 * Options of `Modal` dialogs, merged with `defaultOptionsModal`
 */
export interface ModalOptions {
  /** Identifier of the dialog (creation time by default), not used by the dialog itself */
  id?: string;
  /** Title shown in header, names the dialog */
  title?: string;
  /** Header with title and close button (default true), else header removed */
  showHeader?: boolean;
  /** HTML content of body */
  bodyContent?: string;
  /** HTML content of footer (e.g. buttons) */
  footerContent?: string;
  /** Click out of the dialog hides it (default true) */
  closeOnClickOutside?: boolean;
  /** Escape key hides the dialog (default true) */
  closeOnEsc?: boolean;
  /** Dialog shown over a backdrop covering the drawer (default true) */
  backdrop?: boolean;
}

/**
 * Options of `ConfirmModal`: message, button labels and actions of its buttons
 */
export type ConfirmModalOptions = {
  /** Translated texts by default */
  message?: string;
  /** Label of cancel button (focused on show) */
  cancelLabel?: string;
  /** Label of confirm button */
  confirmLabel?: string;
  /** Click on cancel button, hides the dialog by default */
  onCancel: (modal: ConfirmModal) => void;
  /** Click on confirm button, clears the drawing and hides the dialog by default */
  onConfirm: (modal: ConfirmModal) => void;
};
