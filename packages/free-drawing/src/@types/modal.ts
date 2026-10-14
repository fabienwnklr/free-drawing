import type { ConfirmModal } from '@/components/Modal/ConfirmModal';

export interface ModalOptions {
  id?: string;
  title?: string;
  showHeader?: boolean;
  bodyContent?: string;
  footerContent?: string;
  closeOnClickOutside?: boolean;
  closeOnEsc?: boolean;
  backdrop?: boolean;
}

export type ConfirmModalOptions = {
  /** Translated texts by default */
  message?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel: (modal: ConfirmModal) => void;
  onConfirm: (modal: ConfirmModal) => void;
};
