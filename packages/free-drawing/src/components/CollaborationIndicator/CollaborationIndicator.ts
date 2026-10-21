import '@/components/CollaborationIndicator/collaboration-indicator.scss';
import type { Drawer } from '@/Drawer';
import UsersIcon from '@/icons/users.svg?raw';
import StopIcon from '@/icons/stop.svg?raw';
import { createButton, setLabel } from '@/utils/dom';
import { ConfirmModal } from '@/components/Modal/ConfirmModal';
import { drawerEvents } from '@/constants';

/**
 * Reminder of a live collaboration session in the header, also in zen mode: live dot and number of people connected
 * (opens the collaboration dialog), and a button stopping the session (owner) or leaving it
 */
export class CollaborationIndicator {
  /** Drawer whose session is shown */
  drawer: Drawer;
  /** Header element, hidden without session */
  $container: HTMLDivElement;
  /** Live dot, "Live" and number of people connected: opens the collaboration dialog */
  $button: HTMLButtonElement;
  /** "Live" text of the button */
  $label: HTMLSpanElement;
  /** Number of people connected, "..." while connecting */
  $count: HTMLSpanElement;
  /** Stops the session (owner) or leaves it, after a confirmation */
  $stopButton: HTMLButtonElement;
  /** Confirmation of a stop (or leave), created on first use: a click by mistake keeps the session */
  confirmModal: ConfirmModal | null = null;

  /**
   * Create the reminder in header, next to the layers button (or the settings menu), updated when the session or the
   * language changes
   * @param drawer Drawer whose session is shown
   */
  constructor(drawer: Drawer) {
    this.drawer = drawer;

    this.$container = document.createElement('div');
    this.$container.classList.add('drawer-collaboration-indicator', 'tool');
    this.$container.setAttribute('role', 'group');

    this.$button = createButton('drawer-button', 'drawer-button-neutral', 'drawer-collaboration-live');
    const $dot = document.createElement('span');

    $dot.classList.add('drawer-live-dot');
    $dot.setAttribute('aria-hidden', 'true');
    this.$label = document.createElement('span');
    const $people = document.createElement('span');

    $people.classList.add('drawer-live-count');
    $people.innerHTML = UsersIcon;
    this.$count = document.createElement('span');
    $people.append(this.$count);
    this.$button.append($dot, this.$label, $people);
    this.$button.addEventListener('click', () => this.drawer.showCollaboration());

    this.$stopButton = createButton('drawer-button', 'drawer-button-neutral', 'drawer-collaboration-stop');
    this.$stopButton.innerHTML = StopIcon;
    this.$stopButton.addEventListener('click', () => this.confirmStop());

    this.$container.append(this.$button, this.$stopButton);
    // not hidden in zen mode: a session shares the drawing with other people
    this.drawer.layout.add('header', this.$container, {
      after: this.drawer.layersPanel?.$buttonContainer ?? this.drawer.setting.$dropdownContainer,
    });

    // session started, joined, users or rights changed, stopped; texts
    this.drawer.on(drawerEvents.collaborationChange, () => this.update());
    this.drawer.on(drawerEvents.languageChange, () => this.update());
    this.update();
  }

  /**
   * Ask to stop the session (owner) or leave it: Cancel is focused, the session goes on unless confirmed
   */
  confirmStop() {
    const { drawer } = this;
    const owner = !!drawer.collaboration?.isOwner;

    this.confirmModal ??= new ConfirmModal(drawer, {
      onConfirm: (modal) => {
        modal.hide();
        drawer.stopCollaboration();
        // the stop button is hidden with the reminder: keyboard focus back on the drawer
        drawer.focus({ preventScroll: true });
      },
    });
    // current language and role
    this.confirmModal.setMessage(drawer.t(owner ? 'confirm.stopCollaboration' : 'confirm.leaveCollaboration'));
    this.confirmModal.setConfirmLabel(drawer.t(owner ? 'collab.stop' : 'collab.leave'));
    this.confirmModal.show();
  }

  /**
   * Shown during a session: number of people connected, button stopping it (owner) or leaving it
   */
  update() {
    const { collaboration } = this.drawer;

    this.$container.hidden = !collaboration;
    if (!collaboration) return;

    const { drawer } = this;
    const count = collaboration.users.length;

    this.$container.setAttribute('aria-label', drawer.t('collab.title'));
    this.$label.textContent = drawer.t('collab.live');
    this.$count.textContent = count ? String(count) : '...';
    setLabel(
      this.$button,
      drawer.t('collab.liveState', {
        state: count ? drawer.t('collab.connected', { count }) : drawer.t('collab.connecting'),
      })
    );
    setLabel(this.$stopButton, drawer.t(collaboration.isOwner ? 'collab.stop' : 'collab.leave'));
  }
}
