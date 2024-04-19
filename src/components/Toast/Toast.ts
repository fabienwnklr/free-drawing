import type { Drawer } from '@/Drawer';
import './toast.scss';
import MicroEvent from '@/utils/MicroEvent';
import { AvailableTypes } from '@/@types/toast';
import InfoIcon from '@/icons/info.svg?raw';
import WarningIcon from '@/icons/warning.svg?raw';
import ErrorIcon from '@/icons/error.svg?raw';

export class Toast extends MicroEvent {
  $toastContainer: HTMLDivElement;
  timeout: number = 5000;

  constructor(
    drawer: Drawer,
    message: string,
    type: AvailableTypes = 'neutral',
    timeout: number = 5000,
    showIcon = true
  ) {
    super();

    this.timeout = timeout;
    this.$toastContainer = document.createElement('div');
    this.$toastContainer.classList.add('drawer-toast', type);

    // default is neutral, so no icon set
    let icon = '';

    if (type === 'info') {
      icon = InfoIcon;
    } else if (type === 'warning') {
      icon = WarningIcon;
    } else if (type === 'error' || type === 'danger') {
      icon = ErrorIcon;
    }

    this.$toastContainer.innerHTML = icon + message;

    if (!showIcon) {
      this.$toastContainer.innerHTML = message;
    }

    drawer.$drawerContainer.append(this.$toastContainer);
  }

  show() {
    this.$toastContainer.classList.add('show');

    if (this.timeout) {
      setTimeout(() => {
        this.hide();

        this.trigger('fd.toast.hide');
      }, this.timeout);
    }
  }

  hide() {
    this.$toastContainer.addEventListener('animationend', () => {
      this.$toastContainer.classList.remove('show', 'hide');
      this.$toastContainer.classList.remove();
    });
    this.$toastContainer.classList.add('hide');
  }

  destroy() {
    this.$toastContainer.remove();
  }
}
