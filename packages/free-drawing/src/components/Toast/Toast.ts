import type { Drawer } from '@/Drawer';
import '@/components/Toast/toast.scss';
import MicroEvent from '@/utils/MicroEvent';
import { AvailableTypes } from '@/@types/toast';
import InfoIcon from '@/icons/info.svg?raw';
import WarningIcon from '@/icons/warning.svg?raw';
import ErrorIcon from '@/icons/error.svg?raw';
import { drawerEvents } from '@/constants';

/**
 * Short message shown at the top of the drawer (stacked with other toasts), with an icon of its type.
 * Announced by screen readers (`alert` for problems, else `status`), created for one message by `drawer.toast`.
 */
export class Toast extends MicroEvent {
  /** Element of the toast: icon and message */
  $toastContainer: HTMLDivElement;
  /** Time in ms before hiding the toast once shown (0: stays until hidden) */
  timeout: number = 5000;

  /**
   * Create the toast (hidden until `show`) in the stack of toasts of the drawer, created on first toast
   * @param drawer Drawer showing the toast
   * @param message Text of the toast (not parsed as HTML)
   * @param type Kind of message: gives style, icon and role (`alert` for warning, error, danger)
   * @param timeout Time in ms before hiding the toast once shown (0: stays until hidden)
   * @param showIcon Icon of the type before the message (neutral has none)
   */
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
    // announced by screen readers, immediately for problems
    this.$toastContainer.setAttribute(
      'role',
      type === 'error' || type === 'danger' || type === 'warning' ? 'alert' : 'status'
    );

    // default is neutral, so no icon set
    let icon = '';

    if (type === 'info') {
      icon = InfoIcon;
    } else if (type === 'warning') {
      icon = WarningIcon;
    } else if (type === 'error' || type === 'danger') {
      icon = ErrorIcon;
    }

    // message as text: error messages may come from a server
    this.$toastContainer.innerHTML = showIcon ? icon : '';
    this.$toastContainer.append(message);

    // stacked with other toasts at top of drawer
    let $toasts = drawer.$drawerContainer.querySelector<HTMLDivElement>('.drawer-toasts');

    if (!$toasts) {
      $toasts = document.createElement('div');
      $toasts.classList.add('drawer-toasts');
      drawer.layout.add('floating', $toasts);
    }
    $toasts.append(this.$toastContainer);
  }

  /**
   * Shows the toast, hidden after `timeout` (then `drawer.toast.hide` is triggered)
   */
  show() {
    this.$toastContainer.classList.add('show');

    if (this.timeout) {
      setTimeout(() => {
        this.hide();

        this.trigger(drawerEvents.toastHide);
      }, this.timeout);
    }
  }

  /**
   * Hides the toast with an animation, then removes it from the page
   */
  hide() {
    // removed from page at the end of hide animation, a new toast is created for each message
    this.$toastContainer.addEventListener('animationend', () => this.destroy(), { once: true });
    this.$toastContainer.classList.add('hide');
  }

  /**
   * Removes the toast from the page at once
   */
  destroy() {
    this.$toastContainer.remove();
  }
}
