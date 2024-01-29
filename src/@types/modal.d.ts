export interface ModalOptions {
  id?: string;
  title?: string;
  showHeader?: boolean;
  bodyContent?: string;
  footerContent?: string;
  closeOnClickOutside?: boolean;
  backdrop?: boolean;
}

export type ConfirmModalOptions = {
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: (modal: ConfirmModal) => void;
  onConfirm: (modal: ConfirmModal) => void;
};
