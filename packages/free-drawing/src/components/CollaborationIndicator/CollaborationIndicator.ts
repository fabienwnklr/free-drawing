import '@/components/CollaborationIndicator/collaboration-indicator.scss';
import type { Drawer } from '@/Drawer';
import UsersIcon from '@/icons/users.svg?raw';
import StopIcon from '@/icons/stop.svg?raw';
import EyeIcon from '@/icons/eye.svg?raw';
import { createButton, setLabel } from '@/utils/dom';
import { ConfirmModal } from '@/components/Modal/ConfirmModal';
import { CollaborationPanel } from '@/components/CollaborationPanel/CollaborationPanel';
import { drawerEvents } from '@/constants';

/**
 * Reminder of a live collaboration session in the header, also in zen mode: live dot (presentation of this owner),
 * number of people connected and requests to draw waiting, opening the panel of the session; button following the
 * presentation of the owner again, button stopping the session (owner) or leaving it
 */
export class CollaborationIndicator {
  /** Drawer whose session is shown */
  drawer: Drawer;
  /** Header element, hidden without session: buttons and panel of the session */
  $container: HTMLDivElement;
  /** Buttons of the reminder */
  $group: HTMLDivElement;
  /** Live dot, "Live" (or "Presenting"), number of people connected, requests: opens the panel of the session */
  $button: HTMLButtonElement;
  /** "Live" text of the button, "Presenting" while this owner presents its view */
  $label: HTMLSpanElement;
  /** Number of people connected, "..." while connecting */
  $count: HTMLSpanElement;
  /** Number of requests to draw waiting for an answer of the owner, hidden without request */
  $requests: HTMLSpanElement;
  /** Follows the presentation of the owner again, shown once this user moved their view */
  $followButton: HTMLButtonElement;
  /** Text of the follow button */
  $followText: HTMLSpanElement;
  /** Stops the session (owner) or leaves it, after a confirmation */
  $stopButton: HTMLButtonElement;
  /** Panel of the session: rights, presentation, requests, users, link and settings */
  panel: CollaborationPanel;
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
    this.$container.classList.add('drawer-collaboration-indicator');
    this.$group = document.createElement('div');
    this.$group.classList.add('drawer-collaboration-buttons', 'tool');
    this.$group.setAttribute('role', 'group');

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
    this.$requests = document.createElement('span');
    this.$requests.classList.add('drawer-live-requests');
    this.$requests.setAttribute('aria-hidden', 'true');
    this.$button.append($dot, this.$label, $people, this.$requests);
    this.panel = new CollaborationPanel(drawer, this.$button);
    // opened with the keyboard (no pointer position): focus in the panel
    this.$button.addEventListener('click', (e) => this.panel.toggle(e.detail === 0));

    this.$followButton = createButton('drawer-button', 'drawer-button-primary', 'drawer-collaboration-follow');
    this.$followButton.innerHTML = EyeIcon;
    this.$followText = document.createElement('span');
    this.$followButton.append(this.$followText);
    this.$followButton.addEventListener('click', () => this.drawer.collaboration?.follow());

    this.$stopButton = createButton('drawer-button', 'drawer-button-neutral', 'drawer-collaboration-stop');
    this.$stopButton.innerHTML = StopIcon;
    this.$stopButton.addEventListener('click', () => this.confirmStop());

    this.$group.append(this.$button, this.$followButton, this.$stopButton);
    this.$container.append(this.$group, this.panel.$panel);
    // not hidden in zen mode: a session shares the drawing with other people
    this.drawer.layout.add('header', this.$container, {
      after: this.drawer.layersPanel?.$buttonContainer ?? this.drawer.setting.$dropdownContainer,
    });

    // session started, joined, users, rights, presentation or requests changed, stopped; texts
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

    this.panel.hide();
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
   * Shown during a session: number of people connected and requests to answer, presentation, button stopping it (owner)
   * or leaving it
   */
  update() {
    const { collaboration } = this.drawer;

    this.$container.hidden = !collaboration;
    if (!collaboration) return;

    const { drawer } = this;
    const count = collaboration.users.length;
    const requests = collaboration.isOwner ? collaboration.requests.length : 0;
    const presenter = collaboration.members.find((member) => member.owner)?.name || drawer.t('collab.anonymous');
    const state = count ? drawer.t('collab.connected', { count }) : drawer.t('collab.connecting');

    this.$group.setAttribute('aria-label', drawer.t('collab.title'));
    this.$container.classList.toggle('is-presenting', collaboration.presenting);
    this.$label.textContent = drawer.t(collaboration.presenting ? 'collab.presenting' : 'collab.live');
    this.$count.textContent = count ? String(count) : '...';
    this.$requests.hidden = !requests;
    this.$requests.textContent = String(requests);
    setLabel(
      this.$button,
      [
        drawer.t('collab.liveState', { state }),
        collaboration.presenting && drawer.t('collab.presenting'),
        requests && drawer.t('collab.requestsCount', { count: requests }),
      ]
        .filter(Boolean)
        .join(', ')
    );
    // presentation no longer followed (view moved): one click to follow it again
    this.$followButton.hidden = !collaboration.presentedView || collaboration.following;
    this.$followText.textContent = drawer.t('collab.follow');
    this.$followButton.title = drawer.t('collab.followPresentation', { name: presenter });
    setLabel(this.$stopButton, drawer.t(collaboration.isOwner ? 'collab.stop' : 'collab.leave'));
  }
}
