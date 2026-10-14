import './collaboration-modal.scss';
import type { Drawer } from '@/Drawer';
import { Modal } from '@/components/Modal/Modal';
import { createButton, uniqueId } from '@/utils/dom';

/**
 * Live collaboration dialog: name, start or stop session, room link with copy button and QR code, connected users
 */
export class CollaborationModal extends Modal {
  $name: HTMLInputElement;
  $session: HTMLDivElement;
  $link: HTMLInputElement;
  $qrCode: HTMLDivElement;
  $users: HTMLParagraphElement;
  $startButton: HTMLButtonElement;
  $stopButton: HTMLButtonElement;

  constructor(drawer: Drawer) {
    super(drawer, { title: 'Live collaboration' });
    this.$modal.classList.add('drawer-modal-collaboration');

    const $intro = document.createElement('p');

    $intro.textContent = 'Draw with other people in real time: everyone with the link joins this drawing.';

    this.$name = this._createField('Your name', 'text');
    this.$name.maxLength = 40;
    this.$name.placeholder = 'Anonymous';
    this.$name.value = drawer.getUserName();
    // name shown to other users
    this.$name.addEventListener('change', () => this.drawer.setUserName(this.$name.value));

    this.$session = document.createElement('div');
    this.$session.classList.add('drawer-collaboration-session');

    this.$link = this._createField('Link', 'text');
    this.$link.readOnly = true;
    this.$link.addEventListener('focus', () => this.$link.select());

    const $copy = createButton('drawer-button', 'drawer-button-neutral');

    $copy.textContent = 'Copy';
    $copy.addEventListener('click', () => this.copyLink());
    this.$link.after($copy);

    this.$qrCode = document.createElement('div');
    this.$qrCode.classList.add('drawer-collaboration-qrcode');
    this.$qrCode.setAttribute('role', 'img');
    this.$qrCode.setAttribute('aria-label', 'QR code of the link, to scan with a phone');

    this.$users = document.createElement('p');
    this.$users.classList.add('drawer-collaboration-users');
    // updated when users join or leave
    this.$users.setAttribute('aria-live', 'polite');

    this.$session.append(this.$link.closest('.drawer-collaboration-field')!, this.$qrCode, this.$users);
    this.$modalBody.prepend($intro, this.$name.closest('.drawer-collaboration-field')!, this.$session);

    this.$startButton = createButton('drawer-button', 'drawer-button-primary');
    this.$startButton.textContent = 'Start session';
    this.$startButton.addEventListener('click', () => this.start());
    this.$stopButton = createButton('drawer-button', 'drawer-button-danger');
    this.$stopButton.textContent = 'Stop session';
    this.$stopButton.addEventListener('click', () => this.drawer.stopCollaboration());
    this.$modalFooter.append(this.$startButton, this.$stopButton);

    this.drawer.on('fd.collaboration.change', () => this.update());
  }

  /**
   * Labelled input, in a field container
   */
  private _createField(text: string, type: string) {
    const $field = document.createElement('div');
    const $label = document.createElement('label');
    const $input = document.createElement('input');

    $field.classList.add('drawer-collaboration-field');
    $input.id = uniqueId('collaboration-field');
    $input.type = type;
    $label.htmlFor = $input.id;
    $label.textContent = text;
    $field.append($label, $input);

    return $input;
  }

  show() {
    this.$name.value = this.drawer.getUserName();
    this.update();
    super.show();
  }

  async start() {
    try {
      await this.drawer.startCollaboration(undefined, this.$name.value);
    } catch (error) {
      this.drawer.toast(`Collaboration unavailable: ${(error as Error).message}`, 'error');
    }
  }

  async copyLink() {
    try {
      // secure context (https) only
      if (!navigator.clipboard) throw new Error('clipboard unavailable');

      await navigator.clipboard.writeText(this.$link.value);
      this.drawer.toast('Link copied', 'info');
    } catch (error) {
      this.drawer.toast(`Link can't be copied: ${(error as Error).message}`, 'warning');
    }
  }

  /**
   * Show session (link, QR code, users) or start button
   */
  async update() {
    const { collaboration } = this.drawer;

    this.$session.hidden = !collaboration;
    this.$startButton.hidden = !!collaboration;
    this.$stopButton.hidden = !collaboration;

    if (!collaboration) return;

    const link = this.drawer.getCollaborationLink();
    const { users } = collaboration;

    this.$users.textContent = users.length ? `Connected (${users.length}): ${users.join(', ')}` : 'Connecting...';

    if (this.$link.value === link) return;

    this.$link.value = link;
    // loaded only when needed, as socket.io client
    const { renderSVG } = await import('uqr');

    this.$qrCode.innerHTML = renderSVG(link, { ecc: 'M', border: 2 });
  }
}
