import { ApiError, api } from './api';
import type { App } from './App';

let lastId = 0;

/**
 * Account of logged in user: name and email, password, sign out, account deleted (with its drawings)
 */
export class ProfileDialog {
  readonly $dialog: HTMLDialogElement;
  readonly $profile: HTMLFormElement;
  readonly $password: HTMLFormElement;
  readonly $delete: HTMLFormElement;
  readonly $signOut: HTMLButtonElement;

  constructor(private readonly app: App) {
    const id = `profile-${++lastId}`;
    const close = /*html*/ `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>`;
    // password managers: account of password fields
    const username = /*html*/ `<input name="username" type="email" autocomplete="username" hidden />`;

    this.$dialog = document.createElement('dialog');
    this.$dialog.className = 'app-dialog app-profile';
    this.$dialog.setAttribute('aria-labelledby', `${id}-title`);
    this.$dialog.innerHTML = /*html*/ `
      <header class="app-dialog-header">
        <h2 id="${id}-title"></h2>
        <button type="button" class="app-icon-button" data-close>${close}</button>
      </header>
      <form class="app-form" data-profile aria-labelledby="${id}-profile">
        <h3 id="${id}-profile"></h3>
        <label><span></span><input name="name" autocomplete="name" maxlength="40" required /></label>
        <label><span></span><input name="email" type="email" autocomplete="email" required /></label>
        <p class="app-error" role="alert"></p>
        <p class="app-success" role="status"></p>
        <button type="submit" class="app-button app-button-primary"></button>
      </form>
      <form class="app-form" data-password aria-labelledby="${id}-password">
        <h3 id="${id}-password"></h3>
        ${username}
        <label>
          <span></span><input name="current" type="password" autocomplete="current-password" required />
        </label>
        <label>
          <span></span><input name="next" type="password" autocomplete="new-password" required minlength="8" />
          <small class="text-muted" data-hint></small>
        </label>
        <p class="app-error" role="alert"></p>
        <p class="app-success" role="status"></p>
        <button type="submit" class="app-button"></button>
      </form>
      <div class="app-profile-section">
        <button type="button" class="app-button" data-sign-out></button>
      </div>
      <form class="app-form" data-delete aria-labelledby="${id}-delete">
        <h3 id="${id}-delete"></h3>
        <p class="text-muted" data-warning></p>
        ${username}
        <label><span></span><input name="password" type="password" autocomplete="current-password" required /></label>
        <p class="app-error" role="alert"></p>
        <button type="submit" class="app-button app-button-danger"></button>
      </form>
    `;
    this.$profile = this.$dialog.querySelector('[data-profile]')!;
    this.$password = this.$dialog.querySelector('[data-password]')!;
    this.$delete = this.$dialog.querySelector('[data-delete]')!;
    this.$signOut = this.$dialog.querySelector('[data-sign-out]')!;
    document.body.append(this.$dialog);

    this._onSubmit(this.$profile, () => this._saveProfile());
    this._onSubmit(this.$password, () => this._changePassword());
    this._onSubmit(this.$delete, () => this._deleteAccount());
    this.$signOut.addEventListener('click', () => {
      this.$dialog.close();
      this.app.logout();
    });
    this.$dialog.querySelector('[data-close]')!.addEventListener('click', () => this.$dialog.close());
  }

  show() {
    const { user } = this.app;

    if (!user) return;

    [this.$profile, this.$password, this.$delete].forEach(($form) => {
      $form.reset();
      this._setMessage($form, '');
    });
    this._field(this.$profile, 'name').value = user.name;
    this._field(this.$profile, 'email').value = user.email;
    this.render();
    this.$dialog.showModal();
    this._field(this.$profile, 'name').focus();
  }

  render() {
    const { t } = this.app.texts;
    const text = (selector: string, value: string) => (this.$dialog.querySelector(selector)!.textContent = value);
    const labels = (form: HTMLFormElement, values: string[]) =>
      form.querySelectorAll('label > span').forEach(($label, i) => {
        $label.textContent = values[i];
      });

    text('h2', t('account'));
    this.$dialog.querySelector('[data-close]')!.setAttribute('aria-label', t('close'));
    text('[data-profile] h3', t('profile'));
    labels(this.$profile, [t('name'), t('email')]);
    text('[data-profile] [type=submit]', t('save'));
    text('[data-password] h3', t('changePassword'));
    labels(this.$password, [t('currentPassword'), t('newPassword')]);
    text('[data-hint]', t('passwordHint'));
    text('[data-password] [type=submit]', t('changePassword'));
    this.$signOut.textContent = t('signOut');
    text('[data-delete] h3', t('deleteAccount'));
    text('[data-warning]', t('deleteAccountWarning'));
    labels(this.$delete, [t('password')]);
    text('[data-delete] [type=submit]', t('deleteMyAccount'));
    for (const $input of this.$dialog.querySelectorAll<HTMLInputElement>('[name=username]')) {
      $input.value = this.app.user?.email ?? '';
    }
  }

  private _field(form: HTMLFormElement, name: string) {
    return form.elements.namedItem(name) as HTMLInputElement;
  }

  /**
   * Submit of a form: button disabled meanwhile, error shown in form
   */
  private _onSubmit(form: HTMLFormElement, action: () => Promise<string | void>) {
    const $submit = form.querySelector<HTMLButtonElement>('[type=submit]')!;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      $submit.disabled = true;
      this._setMessage(form, '');
      try {
        this._setMessage(form, (await action()) ?? '');
      } catch (error) {
        this._setMessage(form, this.app.texts.error(error as Error), true);
      } finally {
        $submit.disabled = false;
      }
    });
  }

  private _setMessage(form: HTMLFormElement, message: string, error = false) {
    const $success = form.querySelector('.app-success');

    form.querySelector('.app-error')!.textContent = error ? message : '';
    if ($success) $success.textContent = error ? '' : message;
  }

  /**
   * Name and email changed, user of app updated
   */
  private async _saveProfile() {
    const { t } = this.app.texts;
    const user = this.app.user!;
    const name = this._field(this.$profile, 'name').value.trim();
    const email = this._field(this.$profile, 'email').value.trim().toLowerCase();

    if (name !== user.name) await api.updateUser(name);
    if (email !== user.email) await api.changeEmail(email);

    const updated = await api.me();

    this.app.setUser(updated);
    // email of another account: not changed, not told by server
    if (updated.email !== email) throw new ApiError(t('errorEmailTaken'), 400, 'USER_ALREADY_EXISTS');
    return t('profileSaved');
  }

  /**
   * Password changed, other sessions signed out
   */
  private async _changePassword() {
    await api.changePassword(this._field(this.$password, 'current').value, this._field(this.$password, 'next').value);
    this.$password.reset();
    this.render();
    return this.app.texts.t('passwordChanged');
  }

  /**
   * Account deleted (confirmed, with its password): drawing of browser shown
   */
  private async _deleteAccount() {
    const { t } = this.app.texts;

    if (!window.confirm(t('deleteAccountConfirm'))) return;

    await this.app.deleteAccount(this._field(this.$delete, 'password').value);
    this.$dialog.close();
    this.app.drawer.toast(t('accountDeleted'), 'info');
  }
}
