import { ModalOptions } from "@/@types/modal";

/**
 * @private
 */
export const defaultOptionsModal: ModalOptions = {
    id: Date.now().toString(),
    showHeader: true,
    bodyContent: undefined,
    footerContent: undefined,
    closeOnClickOutside: true,
    backdrop: true,
  };
