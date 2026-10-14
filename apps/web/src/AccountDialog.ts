import { ApiError, api } from './api';
import type { App } from './App';

let lastId = 0;

/**
 * Sign in or create an account (email and password)
 */
export class AccountDialog {
  readonly $dialog: HTMLDialogElement;
  readonly $form: HTMLFormElement;
  readonly $name: HTMLInputElement;
  readonly $email: HTMLInputElement;
  readonly $password: HTMLInputElement;
  readonly $error: HTMLElement;
  readonly $submit: HTMLButtonElement;
  readonly $switch: HTMLButtonElement;
  mode: 'signIn' | 'signUp' = 'signIn';

  constructor(private readonly app: App) {
    const id = `account-${++lastId}`;

    this.$dialog = document.createElement('dialog');
    this.$dialog.className = 'app-dialog';
    this.$dialog.setAttribute('aria-labelledby', `${id}-title`);
    this.$dialog.innerHTML = /*html*/ `
      <form class="app-form">
        <header class="app-dialog-header">
          <h2 id="${id}-title"></h2>
          <button type="button" class="app-icon-button" data-close>
            <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>
        <p class="text-muted" data-intro></p>
        <label data-name-field><span></span><input name="name" autocomplete="name" maxlength="40" /></label>
        <label><span></span><input name="email" type="email" autocomplete="email" required /></label>
        <label>
          <span></span>
          <input name="password" type="password" autocomplete="current-password" required minlength="8" />
          <small class="text-muted" data-hint></small>
        </label>
        <p class="app-error" role="alert"></p>
        <button type="submit" class="app-button app-button-primary"></button>
        <button type="button" class="app-link" data-switch></button>
      </form>
    `;
    this.$form = this.$dialog.querySelector('form')!;
    this.$name = this.$form.elements.namedItem('name') as HTMLInputElement;
    this.$email = this.$form.elements.namedItem('email') as HTMLInputElement;
    this.$password = this.$form.elements.namedItem('password') as HTMLInputElement;
    this.$error = this.$dialog.querySelector('.app-error')!;
    this.$submit = this.$dialog.querySelector('[type=submit]')!;
    this.$switch = this.$dialog.querySelector('[data-switch]')!;
    document.body.append(this.$dialog);

    this.$form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submit();
    });
    this.$switch.addEventListener('click', () => this.setMode(this.mode === 'signIn' ? 'signUp' : 'signIn'));
    this.$dialog.querySelector('[data-close]')!.addEventListener('click', () => this.$dialog.close());
  }

  show(mode: 'signIn' | 'signUp' = 'signIn') {
    this.$form.reset();
    this.setMode(mode);
    this.$dialog.showModal();
    (mode === 'signUp' ? this.$name : this.$email).focus();
  }

  setMode(mode: 'signIn' | 'signUp') {
    this.mode = mode;
    this.$error.textContent = '';
    this.$name.required = mode === 'signUp';
    // password managers: new password when creating account
    this.$password.autocomplete = mode === 'signUp' ? 'new-password' : 'current-password';
    this.render();
  }

  render() {
    const { t } = this.app.texts;
    const signUp = this.mode === 'signUp';
    const [$nameLabel, $emailLabel, $passwordLabel] = this.$form.querySelectorAll('label > span');

    this.$dialog.querySelector('h2')!.textContent = t(signUp ? 'signUp' : 'signIn');
    this.$dialog.querySelector('[data-intro]')!.textContent = t('accountIntro');
    this.$dialog.querySelector('[data-close]')!.setAttribute('aria-label', t('close'));
    (this.$form.querySelector('[data-name-field]') as HTMLElement).hidden = !signUp;
    $nameLabel.textContent = t('name');
    $emailLabel.textContent = t('email');
    $passwordLabel.textContent = t('password');
    this.$dialog.querySelector('[data-hint]')!.textContent = signUp ? t('passwordHint') : '';
    this.$submit.textContent = t(signUp ? 'signUp' : 'signIn');
    this.$switch.textContent = t(signUp ? 'toSignIn' : 'toSignUp');
  }

  async submit() {
    const { t } = this.app.texts;

    this.$submit.disabled = true;
    this.$error.textContent = '';
    try {
      if (this.mode === 'signUp') await api.signUp(this.$name.value.trim(), this.$email.value, this.$password.value);
      else await api.signIn(this.$email.value, this.$password.value);

      const user = await api.me();

      this.$dialog.close();
      await this.app.login(user);
    } catch (error) {
      this.$error.textContent = this._errorText(error as Error);
      if (!this.$dialog.open) this.app.drawer.toast(t('error', { error: (error as Error).message }), 'error');
    } finally {
      this.$submit.disabled = false;
    }
  }

  /**
   * Known errors of Better Auth in language of the app
   */
  private _errorText(error: Error) {
    const { t } = this.app.texts;
    const code = error instanceof ApiError ? error.code ?? '' : '';

    if (code.includes('INVALID_EMAIL_OR_PASSWORD')) return t('errorCredentials');
    if (code.includes('USER_ALREADY_EXISTS')) return t('errorEmailTaken');
    if (code.includes('PASSWORD_TOO_SHORT')) return t('errorPassword');
    if (code.includes('INVALID_EMAIL')) return t('errorEmail');
    return t('error', { error: error.message });
  }
}
