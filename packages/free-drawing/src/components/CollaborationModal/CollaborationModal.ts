import '@/components/CollaborationModal/collaboration-modal.scss';
import type { Drawer } from '@/Drawer';
import { Modal } from '@/components/Modal/Modal';
import { createButton, createSwitch, uniqueId } from '@/utils/dom';
import { drawerEvents } from '@/constants';
import type { TranslationKey } from '@/@types/i18n';

/**
 * Live collaboration dialog: start a session, join one from a link (name required), session link with copy button
 * and QR code, users of the session with rights given by the owner, stop session
 */
export class CollaborationModal extends Modal {
  /** Introduction, depends on state: no session, invited by a link, joined session of another user */
  $intro: HTMLParagraphElement;
  /** Name shown to other users (saved on change), required to join; Enter starts or joins */
  $name: HTMLInputElement;
  /** Session part, shown to the owner only: link, users with their rights, QR code */
  $session: HTMLDivElement;
  /** Read only link of the session (selected on focus), followed by its copy button */
  $link: HTMLInputElement;
  /** QR code of the session link (svg rendered by `uqr`, loaded when needed) */
  $qrCode: HTMLDivElement;
  /** Number of connected users, title of the list of users */
  $users: HTMLParagraphElement;
  /** Switch of the owner: users coming for the first time can draw, else they view only */
  $newUsersCanEdit: HTMLInputElement;
  /** Users of the session (live region): name, who invited them, right to draw (switch for the owner) */
  $members: HTMLUListElement;
  /** Starts a session, shown without session nor link to join */
  $startButton: HTMLButtonElement;
  /** Joins the room of the link, shown with a link, enabled once a name is given */
  $joinButton: HTMLButtonElement;
  /** Cancels joining the room of the link, shown with a link */
  $cancelButton: HTMLButtonElement;
  /** Stops the session, shown to the owner */
  $stopButton: HTMLButtonElement;
  /** Room of a link, joined once user gives a name */
  joinRoom: string | null = null;
  /** Id of user who shared the link */
  invitedBy?: string;

  /**
   * Build the dialog: name field, session part (link, users, QR code) and buttons, updated on collaboration changes
   * @param drawer Drawer whose collaboration sessions are started, joined and shown
   */
  constructor(drawer: Drawer) {
    super(drawer, { title: drawer.t('collab.title') });
    this.$modal.classList.add('drawer-modal-collaboration');

    this.$intro = document.createElement('p');

    this.$name = this._createField('collab.name', 'text');
    this.$name.maxLength = 40;
    // name shown to other users
    this.$name.addEventListener('change', () => this.drawer.setUserName(this.$name.value));
    // name required to join
    this.$name.addEventListener('input', () => (this.$joinButton.disabled = !this.$name.value.trim()));
    // Enter starts or joins
    this.$name.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      if (this.joinRoom) this.$joinButton.click();
      else if (!this.drawer.collaboration) this.$startButton.click();
    });

    this.$session = document.createElement('div');
    this.$session.classList.add('drawer-collaboration-session');

    this.$link = this._createField('collab.link', 'text');
    this.$link.readOnly = true;
    this.$link.addEventListener('focus', () => this.$link.select());

    const $copy = createButton('drawer-button', 'drawer-button-neutral');

    $copy.addEventListener('click', () => this.copyLink());
    this.$link.after($copy);

    this.$qrCode = document.createElement('div');
    this.$qrCode.classList.add('drawer-collaboration-qrcode');
    this.$qrCode.setAttribute('role', 'img');

    this.$users = document.createElement('p');
    this.$users.classList.add('drawer-collaboration-users');
    this.$users.id = uniqueId('collaboration-users');
    this.$members = document.createElement('ul');
    this.$members.classList.add('drawer-collaboration-members');
    this.$members.setAttribute('aria-labelledby', this.$users.id);
    // updated when users join, leave or get rights
    this.$members.setAttribute('aria-live', 'polite');

    // owner: right to draw of users coming for the first time (new ids of viewers too)
    const $newUsers = document.createElement('label');
    const $newUsersText = document.createElement('span');

    this.$newUsersCanEdit = createSwitch(true);
    this.$newUsersCanEdit.addEventListener(
      'change',
      () => this.drawer.collaboration?.setNewUsersCanEdit(this.$newUsersCanEdit.checked)
    );
    $newUsers.classList.add('drawer-collaboration-new-users');
    $newUsers.append(this.$newUsersCanEdit, $newUsersText);
    this.drawer.i18n.translate((t) => ($newUsersText.textContent = t('collab.newUsersCanDraw')));

    // users and rights before QR code (visible without scrolling)
    this.$session.append(
      this.$link.closest('.drawer-collaboration-field')!,
      $newUsers,
      this.$users,
      this.$members,
      this.$qrCode
    );
    this.$modalBody.prepend(this.$intro, this.$name.closest('.drawer-collaboration-field')!, this.$session);

    this.$startButton = createButton('drawer-button', 'drawer-button-primary');
    this.$startButton.addEventListener('click', () => this.start());
    this.$cancelButton = createButton('drawer-button', 'drawer-button-neutral');
    this.$cancelButton.addEventListener('click', () => this.cancelJoin());
    this.$joinButton = createButton('drawer-button', 'drawer-button-primary');
    this.$joinButton.addEventListener('click', () => this.join());
    this.$stopButton = createButton('drawer-button', 'drawer-button-danger');
    this.$stopButton.addEventListener('click', () => this.drawer.stopCollaboration());
    this.$modalFooter.append(this.$cancelButton, this.$startButton, this.$joinButton, this.$stopButton);

    drawer.i18n.translate((t) => {
      this.setTitle(t('collab.title'));
      this.$name.placeholder = t('collab.anonymous');
      $copy.textContent = t('collab.copy');
      this.$qrCode.setAttribute('aria-label', t('collab.qrCode'));
      this.$startButton.textContent = t('collab.start');
      this.$cancelButton.textContent = t('confirm.cancel');
      this.$joinButton.textContent = t('collab.join');
      this.$stopButton.textContent = t('collab.stop');
    });

    this.drawer.on(drawerEvents.collaborationChange, () => this.update());
    // intro and users in new language
    this.drawer.on(drawerEvents.languageChange, () => this.update());
  }

  /**
   * Labelled input, in a field container
   * @param text Key of the label text (translated again when language changes)
   * @param type Type of the input
   * @returns Input, in its field container (`.drawer-collaboration-field`) to add to the dialog
   */
  private _createField(text: TranslationKey, type: string) {
    const $field = document.createElement('div');
    const $label = document.createElement('label');
    const $input = document.createElement('input');

    $field.classList.add('drawer-collaboration-field');
    $input.id = uniqueId('collaboration-field');
    $input.type = type;
    $label.htmlFor = $input.id;
    this.drawer.i18n.translate((t) => ($label.textContent = t(text)));
    $field.append($label, $input);

    return $input;
  }

  /**
   * Show dialog
   * @param joinRoom Room of a link: user gives a name before joining it
   * @param invitedBy Id of user who shared the link
   */
  show(joinRoom: string | null = null, invitedBy?: string) {
    this.joinRoom = joinRoom;
    this.invitedBy = invitedBy;
    this.$name.value = this.drawer.getUserName();
    this.update();
    super.show();
  }

  /**
   * Starts a session in a new room with the given name, error shown in a toast (server unavailable...)
   */
  async start() {
    try {
      await this.drawer.startCollaboration(undefined, this.$name.value);
    } catch (error) {
      this.drawer.toast(this.drawer.t('toast.collaborationUnavailable', { error: (error as Error).message }), 'error');
    }
  }

  /**
   * Joins the room of the link with the given name (nothing without name), error shown in a toast
   */
  async join() {
    const room = this.joinRoom;

    if (!room || !this.$name.value.trim()) return;

    this.joinRoom = null;
    try {
      await this.drawer.startCollaboration(room, this.$name.value, this.invitedBy);
    } catch (error) {
      this.drawer.toast(this.drawer.t('toast.collaborationUnavailable', { error: (error as Error).message }), 'error');
    }
  }

  /**
   * Room of link not joined, removed from page url
   */
  cancelJoin() {
    this.joinRoom = null;
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    this.hide();
  }

  /**
   * Copies the session link to clipboard (secure context only), result shown in a toast
   */
  async copyLink() {
    try {
      // secure context (https) only
      if (!navigator.clipboard) throw new Error('clipboard unavailable');

      await navigator.clipboard.writeText(this.$link.value);
      this.drawer.toast(this.drawer.t('toast.linkCopied'), 'info');
    } catch (error) {
      this.drawer.toast(this.drawer.t('toast.linkNotCopied', { error: (error as Error).message }), 'warning');
    }
  }

  /**
   * Users of session, with rights: owner gives or removes the right to draw
   */
  private _updateMembers() {
    const collaboration = this.drawer.collaboration!;
    const { members, isOwner, userId } = collaboration;
    const t = this.drawer.t.bind(this.drawer);

    this.$newUsersCanEdit.checked = collaboration.newUsersCanEdit;

    this.$users.textContent = members.length
      ? t('collab.connected', { count: members.length })
      : t('collab.connecting');
    this.$members.replaceChildren(
      ...members.map((member) => {
        const $member = document.createElement('li');
        const $name = document.createElement('span');

        $name.textContent = member.id === userId ? t('collab.you', { name: member.name }) : member.name;
        $member.append($name);

        // who shared the link (also page url of a user)
        if (member.invitedBy) {
          const $invitedBy = document.createElement('small');

          $invitedBy.classList.add('text-muted');
          $invitedBy.textContent = t('collab.invitedBy', { name: member.invitedBy });
          $name.append(document.createElement('br'), $invitedBy);
        }

        if (isOwner && !member.owner) {
          const $label = document.createElement('label');
          const $canEdit = createSwitch(member.canEdit);

          $canEdit.setAttribute('aria-label', t('collab.canDrawLabel', { name: member.name }));
          $canEdit.addEventListener('change', () => collaboration.setRight(member.id, $canEdit.checked));
          $label.append($canEdit, t('collab.canDraw'));
          $member.append($label);
        } else {
          const $role = document.createElement('span');

          $role.classList.add('text-muted');
          $role.textContent = t(member.owner ? 'collab.owner' : member.canEdit ? 'collab.canDraw' : 'collab.viewOnly');
          $member.append($role);
        }

        return $member;
      })
    );
  }

  /**
   * Owner: session (link, QR code, users and rights, stop), other users: their name only,
   * else join form or start button
   */
  async update() {
    const { collaboration } = this.drawer;
    const joining = !collaboration && !!this.joinRoom;
    const owner = !!collaboration?.isOwner;
    const ownerName = collaboration?.members.find((member) => member.owner)?.name;

    if (joining) {
      this.$intro.textContent = this.drawer.t('collab.introInvited');
    } else if (collaboration && !owner) {
      this.$intro.textContent = ownerName
        ? this.drawer.t('collab.introJoinedOf', { name: ownerName })
        : this.drawer.t('collab.introJoined');
    } else {
      this.$intro.textContent = this.drawer.t('collab.intro');
    }
    this.$name.required = joining;
    this.$joinButton.disabled = !this.$name.value.trim();
    this.$session.hidden = !owner;
    this.$startButton.hidden = !!collaboration || joining;
    this.$joinButton.hidden = !joining;
    this.$cancelButton.hidden = !joining;
    this.$stopButton.hidden = !owner;

    if (!owner) return;

    this._updateMembers();

    const link = this.drawer.getCollaborationLink();

    if (this.$link.value === link) return;

    this.$link.value = link;
    // loaded only when needed, as socket.io client
    const { renderSVG } = await import('uqr');

    this.$qrCode.innerHTML = renderSVG(link, { ecc: 'M', border: 2 });
  }
}
