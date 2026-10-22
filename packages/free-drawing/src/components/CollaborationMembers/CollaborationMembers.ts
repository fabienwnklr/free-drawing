import '@/components/CollaborationMembers/collaboration-members.scss';
import type { Drawer } from '@/Drawer';
import type { CollaborationMember } from '@/@types/collaboration';
import { createSwitch } from '@/utils/dom';

/**
 * Users of a live collaboration session with their rights: switch of the right to draw for the owner, role for other
 * users. Rows of users not changed are kept (focus stays on the switch just toggled, the live region reads only users
 * joining or changed). Shown by the collaboration dialog and the panel of the session.
 */
export class CollaborationMembers {
  /** List of the users (live region) */
  readonly $list: HTMLUListElement;
  /** Drawer whose session is shown */
  private readonly drawer: Drawer;

  /**
   * Create the empty list, filled by `update`
   * @param drawer Drawer whose session is shown
   */
  constructor(drawer: Drawer) {
    this.drawer = drawer;
    this.$list = document.createElement('ul');
    this.$list.classList.add('drawer-collaboration-members');
    // updated when users join, leave or get rights
    this.$list.setAttribute('aria-live', 'polite');
  }

  /**
   * Row of a user of the session: name, who invited them, switch of the right to draw for the owner, else role
   * @param member User of the session
   * @returns List item of the user (`data-member`: id of the user)
   */
  private _createMember(member: CollaborationMember) {
    const { isOwner, userId } = this.drawer.collaboration!;
    const t = this.drawer.t.bind(this.drawer);
    const $member = document.createElement('li');
    const $name = document.createElement('span');

    $member.dataset.member = member.id;
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
      $canEdit.addEventListener('change', () => this.drawer.collaboration?.setRight(member.id, $canEdit.checked));
      $label.append($canEdit, t('collab.canDraw'));
      $member.append($label);
    } else {
      const $role = document.createElement('span');

      $role.classList.add('text-muted');
      $role.textContent = t(member.owner ? 'collab.owner' : member.canEdit ? 'collab.canDraw' : 'collab.viewOnly');
      $member.append($role);
    }

    return $member;
  }

  /**
   * Rows of the users of the session: rows of users not changed kept, others replaced, added or removed
   */
  update() {
    const { members } = this.drawer.collaboration!;
    const $previous = Array.from(this.$list.children) as HTMLLIElement[];
    const $focused = $previous.find(($row) => $row.contains(document.activeElement));

    const $rows = members.map((member) => {
      const $row = this._createMember(member);
      const $current = $previous.find(($el) => $el.dataset.member === member.id);

      if (!$current?.isEqualNode($row)) return $row;

      // right given by the server (the switch may have been toggled since)
      const $canEdit = $current.querySelector('input');

      if ($canEdit) $canEdit.checked = member.canEdit;
      return $current;
    });

    for (const $row of $previous) if (!$rows.includes($row)) $row.remove();
    // rows put in order, a row in place is not moved (moving it would take the focus)
    for (const [index, $row] of $rows.entries()) {
      const $place = this.$list.children[index] ?? null;

      if ($place !== $row) this.$list.insertBefore($row, $place);
    }

    // row of the focused switch changed (name, language...): focus on its new switch
    if ($focused && !$focused.isConnected) {
      const $row = $rows.find(($el) => $el.dataset.member === $focused.dataset.member);

      $row?.querySelector('input')?.focus();
    }
  }
}
