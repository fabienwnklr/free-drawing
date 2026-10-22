import '@/components/CollaborationPanel/collaboration-panel.scss';
import type { Drawer } from '@/Drawer';
import { CollaborationMembers } from '@/components/CollaborationMembers/CollaborationMembers';
import { createButton, createSwitch, fitHeight, setLabel, uniqueId } from '@/utils/dom';
import { drawerEvents } from '@/constants';

/** Space kept between the panel and the right of the drawer (px) */
const sideMargin = 12;

/**
 * Panel of a live collaboration session, opened by the reminder of the header: right of this user (viewers ask the
 * owner to draw), presentation of the owner (present its view, follow it again), requests to answer and rights of the
 * users for the owner, link and settings in the collaboration dialog. Escape or a click elsewhere closes it.
 */
export class CollaborationPanel {
  /** Panel, below the button opening it (hidden until `show`) */
  readonly $panel: HTMLDivElement;
  /** Right of this user: draws or views only (not shown to the owner) */
  readonly $status: HTMLParagraphElement;
  /** Viewer asks the owner for the right to draw, once until it answers */
  readonly $requestButton: HTMLButtonElement;
  /** Presentation followed: whose view */
  readonly $following: HTMLParagraphElement;
  /** Presentation no longer followed (view moved): follows it again */
  readonly $followButton: HTMLButtonElement;
  /** Owner: switch presenting its view */
  readonly $present: HTMLInputElement;
  /** Owner: requests to draw waiting for an answer, hidden without request */
  readonly $requests: HTMLDivElement;
  /** Rows of the requests: name, accept and refuse buttons */
  readonly $requestList: HTMLUListElement;
  /** Users of the session with their rights (switches for the owner) */
  readonly members: CollaborationMembers;
  /** Opens the collaboration dialog: link, QR code, right of new users, stop */
  readonly $settingsButton: HTMLButtonElement;
  /** Drawer whose session is shown */
  private readonly drawer: Drawer;
  /** Button opening the panel: expanded state, focused again when Escape closes it */
  private readonly $opener: HTMLButtonElement;
  /** Label of the switch presenting the view */
  private readonly $presentLabel: HTMLLabelElement;
  /** Text of the switch presenting the view */
  private readonly $presentText: HTMLSpanElement;
  /** Title of the requests */
  private readonly $requestsTitle: HTMLParagraphElement;
  /** Title of the users */
  private readonly $usersTitle: HTMLParagraphElement;

  /**
   * Create the hidden panel, put after the element given by the reminder (not in its group of buttons)
   * @param drawer Drawer whose session is shown
   * @param $opener Button opening the panel
   */
  constructor(drawer: Drawer, $opener: HTMLButtonElement) {
    this.drawer = drawer;
    this.$opener = $opener;

    this.$panel = document.createElement('div');
    this.$panel.classList.add('drawer-collaboration-panel');
    this.$panel.id = uniqueId('collaboration-panel');
    this.$panel.setAttribute('role', 'dialog');
    this.$panel.tabIndex = -1;
    this.$panel.hidden = true;
    $opener.setAttribute('aria-haspopup', 'dialog');
    $opener.setAttribute('aria-controls', this.$panel.id);
    $opener.setAttribute('aria-expanded', 'false');

    this.$status = document.createElement('p');
    this.$status.classList.add('drawer-collaboration-status');
    this.$requestButton = createButton('drawer-button', 'drawer-button-primary');
    this.$requestButton.addEventListener('click', () => this.drawer.collaboration?.requestEdit());

    this.$following = document.createElement('p');
    this.$following.classList.add('drawer-collaboration-status');
    this.$followButton = createButton('drawer-button', 'drawer-button-primary');
    this.$followButton.addEventListener('click', () => this.drawer.collaboration?.follow());

    this.$presentLabel = document.createElement('label');
    this.$presentLabel.classList.add('drawer-collaboration-switch');
    this.$present = createSwitch();
    this.$present.addEventListener('change', () => this.drawer.collaboration?.present(this.$present.checked));
    this.$presentText = document.createElement('span');
    this.$presentLabel.append(this.$present, this.$presentText);

    this.$requests = document.createElement('div');
    this.$requestsTitle = document.createElement('p');
    this.$requestsTitle.classList.add('drawer-collaboration-title');
    this.$requestsTitle.id = uniqueId('collaboration-requests');
    this.$requestList = document.createElement('ul');
    this.$requestList.classList.add('drawer-collaboration-members', 'drawer-collaboration-requests');
    this.$requestList.setAttribute('aria-labelledby', this.$requestsTitle.id);
    this.$requests.append(this.$requestsTitle, this.$requestList);

    this.$usersTitle = document.createElement('p');
    this.$usersTitle.classList.add('drawer-collaboration-title');
    this.$usersTitle.id = uniqueId('collaboration-users');
    this.members = new CollaborationMembers(drawer);
    this.members.$list.setAttribute('aria-labelledby', this.$usersTitle.id);

    this.$settingsButton = createButton('drawer-button', 'drawer-button-neutral');
    this.$settingsButton.addEventListener('click', () => {
      this.hide();
      this.drawer.showCollaboration();
    });

    this.$panel.append(
      this.$status,
      this.$requestButton,
      this.$following,
      this.$followButton,
      this.$presentLabel,
      this.$requests,
      this.$usersTitle,
      this.members.$list,
      this.$settingsButton
    );

    // Escape closes it (focus back on its button), keys typed in it do not run drawer shortcuts
    this.$panel.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key !== 'Escape') return;
      e.preventDefault();
      this.hide();
      this.$opener.focus();
    });
    // a click out of the panel and of its button closes it (path of the click: its button may be removed, e.g. request
    // answered)
    document.addEventListener('click', (e) => {
      const path = e.composedPath();

      if (this.isShown() && !path.includes(this.$panel) && !path.includes(this.$opener)) this.hide();
    });
    window.addEventListener('resize', () => {
      if (this.isShown()) this._place();
    });

    this.drawer.on(drawerEvents.collaborationChange, () => this.update());
    this.drawer.on(drawerEvents.languageChange, () => this.update());
  }

  /**
   * Whether the panel is shown
   * @returns True while the panel is shown
   */
  isShown() {
    return !this.$panel.hidden;
  }

  /**
   * Show or hide the panel
   * @param focus Focus its first element when shown (opened with the keyboard)
   */
  toggle(focus = false) {
    if (this.isShown()) this.hide();
    else this.show(focus);
  }

  /**
   * Show the panel below its button, kept in the drawer
   * @param focus Focus its first element (opened with the keyboard)
   */
  show(focus = false) {
    if (!this.drawer.collaboration) return;

    this.$panel.hidden = false;
    this.$opener.setAttribute('aria-expanded', 'true');
    this.update();
    if (focus) this._getFocusables()[0]?.focus();
  }

  /**
   * Hide the panel
   */
  hide() {
    this.$panel.hidden = true;
    this.$opener.setAttribute('aria-expanded', 'false');
  }

  /**
   * Elements of the panel reached by Tab
   * @returns Shown and enabled buttons and switches of the panel
   */
  private _getFocusables() {
    return Array.from(this.$panel.querySelectorAll<HTMLElement>('button, input')).filter(
      ($el) => !$el.closest('[hidden]') && !($el as HTMLButtonElement).disabled
    );
  }

  /**
   * Panel kept in the drawer and the window: height limited to the space below it, moved left when it would go out
   * on the right (phone)
   */
  private _place() {
    this.$panel.style.left = '';
    fitHeight(this.$panel);

    const box = this.$panel.getBoundingClientRect();
    const right = Math.min(this.drawer.$drawerContainer.getBoundingClientRect().right, window.innerWidth);
    const overflow = box.right - right + sideMargin;

    // no layout (tests): not moved
    if (box.width && overflow > 0) this.$panel.style.left = `${-overflow}px`;
  }

  /**
   * Rows of the requests to draw (owner): rows of requests still waiting kept, answered ones removed
   */
  private _updateRequests() {
    const { requests } = this.drawer.collaboration!;
    const t = this.drawer.t.bind(this.drawer);
    const $rows = Array.from(this.$requestList.children) as HTMLLIElement[];

    for (const $row of $rows) {
      if (!requests.some((request) => request.userId === $row.dataset.member)) $row.remove();
    }
    for (const { userId, name } of requests) {
      if ($rows.some(($row) => $row.dataset.member === userId && $row.isConnected)) continue;

      const $row = document.createElement('li');
      const $name = document.createElement('span');
      const $actions = document.createElement('span');
      const answer = (accepted: boolean) => {
        // focus on the next request, else on the panel (row removed)
        const $next = ($row.nextElementSibling ?? $row.previousElementSibling)?.querySelector('button');

        this.drawer.collaboration?.answerRequest(userId, accepted);
        ($next ?? this.$panel).focus();
      };
      const $accept = createButton('drawer-button', 'drawer-button-primary');
      const $refuse = createButton('drawer-button', 'drawer-button-neutral');

      $row.dataset.member = userId;
      $name.textContent = name;
      $accept.textContent = t('collab.accept');
      setLabel($accept, t('collab.acceptLabel', { name }));
      $accept.addEventListener('click', () => answer(true));
      $refuse.textContent = t('collab.refuse');
      setLabel($refuse, t('collab.refuseLabel', { name }));
      $refuse.addEventListener('click', () => answer(false));
      $actions.classList.add('drawer-collaboration-actions');
      $actions.append($accept, $refuse);
      $row.append($name, $actions);
      this.$requestList.append($row);
    }
  }

  /**
   * Content following the session (rights, presentation, requests, users) and the language, closed without session
   */
  update() {
    const { collaboration } = this.drawer;

    if (!collaboration) {
      this.hide();
      return;
    }
    if (!this.isShown()) return;

    const t = this.drawer.t.bind(this.drawer);
    const owner = collaboration.isOwner;
    const presenter = collaboration.members.find((member) => member.owner)?.name || t('collab.anonymous');
    const presented = !!collaboration.presentedView;

    this.$panel.setAttribute('aria-label', t('collab.title'));
    // right of this user (the owner has every right)
    this.$status.hidden = owner;
    this.$status.textContent = t(collaboration.canEdit ? 'collab.youCanDraw' : 'collab.youViewOnly');
    this.$requestButton.hidden = owner || collaboration.canEdit;
    // still focusable once sent
    this.$requestButton.setAttribute('aria-disabled', String(collaboration.requested));
    this.$requestButton.textContent = t(collaboration.requested ? 'collab.requestSent' : 'collab.requestEdit');
    // presentation of the owner
    this.$following.hidden = !presented || !collaboration.following;
    this.$following.textContent = t('collab.following', { name: presenter });
    this.$followButton.hidden = !presented || collaboration.following;
    this.$followButton.textContent = t('collab.followPresentation', { name: presenter });
    this.$presentLabel.hidden = !owner;
    this.$present.checked = collaboration.presenting;
    this.$presentText.textContent = t('collab.present');
    // requests to answer (owner)
    this.$requests.hidden = !owner || !collaboration.requests.length;
    this.$requestsTitle.textContent = t('collab.requests');
    if (owner) this._updateRequests();
    this.$usersTitle.textContent = t('collab.users');
    this.members.update();
    this.$settingsButton.textContent = t('collab.settings');
    this._place();
  }
}
