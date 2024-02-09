import type { Drawer } from '@/Drawer';
import './toast.scss';

export class Toast {
  $toastContainer: HTMLDivElement;
  timeout: number = 3000;

  constructor(drawer: Drawer, message: string, type: string = 'neutral', timeout: number = 3000) {
    this.timeout = timeout;
    this.$toastContainer = document.createElement('div');
    this.$toastContainer.classList.add('drawer-toast', type);

    this.$toastContainer.innerHTML = message;

    drawer.$drawerContainer.append(this.$toastContainer);
  }

  show() {
    this.$toastContainer.classList.add('show');

    if (this.timeout) {
      setTimeout(() => {
        this.hide();
      }, this.timeout)
    }
  }

  hide() {
    this.$toastContainer.addEventListener('animationend', () => {
      this.$toastContainer.classList.remove('show', 'hide');
      this.$toastContainer.classList.remove();
    })
    this.$toastContainer.classList.add('hide');
  }

  destroy() {
    this.$toastContainer.remove();
  }
}
