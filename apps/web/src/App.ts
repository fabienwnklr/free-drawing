import { Drawer, type DrawerStorage, type Preferences } from '@fabwcie/free-drawing';
import { type DrawingSummary, type User, api } from './api';
import { local } from './local';
import { Texts } from './texts';
import { AccountDialog } from './AccountDialog';
import { DrawingsDialog } from './DrawingsDialog';

type SaveState = '' | 'saving' | 'saved' | 'error';

/**
 * App served by the server of free-drawing: account, drawings saved on server, preferences of account.
 * Anonymous users draw in their browser.
 */
export class App {
  readonly drawer: Drawer;
  readonly texts: Texts;
  /** Logged in user */
  user: User | null = null;
  /** Drawing open (logged in user), saved on server */
  drawing: DrawingSummary | null = null;
  readonly $bar: HTMLElement;
  readonly $main: HTMLElement;
  readonly $name: HTMLInputElement;
  readonly $saveState: HTMLElement;
  readonly $drawingsButton: HTMLButtonElement;
  readonly $user: HTMLElement;
  readonly $accountButton: HTMLButtonElement;
  readonly accountDialog: AccountDialog;
  readonly drawingsDialog: DrawingsDialog;
  #saveState: SaveState = '';
  /** Session read and drawing chosen: drawing is loaded after it */
  readonly #started: Promise<void>;

  constructor($root: HTMLElement, collaboration: boolean) {
    $root.classList.add('app');
    $root.innerHTML = /*html*/ `
      <header class="app-bar">
        <span class="app-logo">free-drawing</span>
        <input class="app-name" maxlength="100" hidden />
        <span class="app-save-state text-muted" aria-live="polite"></span>
        <span class="app-spacer"></span>
        <button type="button" class="app-button" data-drawings hidden></button>
        <span class="app-user text-muted"></span>
        <button type="button" class="app-button" data-account></button>
      </header>
      <main class="app-main"></main>
    `;
    this.$bar = $root.querySelector('.app-bar')!;
    this.$main = $root.querySelector('.app-main')!;
    this.$name = $root.querySelector('.app-name')!;
    this.$saveState = $root.querySelector('.app-save-state')!;
    this.$drawingsButton = $root.querySelector('[data-drawings]')!;
    this.$user = $root.querySelector('.app-user')!;
    this.$accountButton = $root.querySelector('[data-account]')!;

    this.#started = this._restoreSession();
    this.drawer = new Drawer(this.$main as HTMLDivElement, {
      width: this.$main.clientWidth,
      height: this.$main.clientHeight,
      collaboration,
      storage: this._createStorage(),
    });
    this.texts = new Texts(this.drawer);
    this.accountDialog = new AccountDialog(this);
    this.drawingsDialog = new DrawingsDialog(this);

    this._initEvents();
    // user and preferences once drawing is loaded (or could not be)
    this.drawer.ready.then(
      () => this._onStart(),
      () => this._onStart()
    );
    this.render();
  }

  /**
   * Drawings of logged in user saved on server, else in browser
   */
  private _createStorage(): DrawerStorage {
    return {
      load: async () => {
        await this.#started;
        if (!this.drawing) return local.loadDrawing();

        const { content, ...drawing } = await api.getDrawing(this.drawing.id);

        this.drawing = drawing;
        local.setLastDrawingId(drawing.id);
        this.render();
        return content;
      },
      save: async (file) => {
        const { drawing } = this;

        // drawing of an account never kept in browser (e.g. deleted one)
        if (!drawing) return this.user ? undefined : local.saveDrawing(file);

        this._setSaveState('saving');
        try {
          const saved = await api.updateDrawing(drawing.id, { content: file });

          if (this.drawing?.id === saved.id) this.drawing = saved;
          this._setSaveState('saved');
        } catch (error) {
          // shown by drawer once
          this._setSaveState('error');
          throw error;
        }
      },
    };
  }

  /**
   * User of the session (none when not logged in or server unavailable) and their drawing to open
   */
  private async _restoreSession() {
    try {
      this.user = await api.me();
    } catch {
      return;
    }
    // a room link fills a new drawing: last one kept
    this.drawing = window.location.hash.startsWith('#room=') ? await api.createDrawing({}) : await this._lastDrawing();
  }

  /**
   * Drawing open on last visit, else last updated one, else a new one
   */
  private async _lastDrawing() {
    const drawings = await api.listDrawings();

    return drawings.find(({ id }) => id === local.lastDrawingId()) ?? drawings[0] ?? (await api.createDrawing({}));
  }

  /**
   * Logged in user: their preferences (anonymous user: preferences saved in browser by drawer)
   */
  private async _onStart() {
    if (this.user) {
      this.drawer.setUser({ id: this.user.id, name: this.user.name });
      await this._loadPreferences();
    }
    this.render();
  }

  /**
   * Preferences of account, the current ones on first login
   */
  private async _loadPreferences() {
    try {
      const preferences = await api.getPreferences();

      if (Object.keys(preferences).length) this.drawer.setPreferences(preferences);
      else await api.savePreferences(this.drawer.getPreferences());
    } catch {
      // current preferences kept
    }
  }

  private _initEvents() {
    // also saved in browser by drawer
    this.drawer.on('drawer.preferences.change', (preferences: Preferences) => {
      if (this.user) api.savePreferences(preferences).catch(() => {});
    });
    this.drawer.on('drawer.language.change', () => this.render());
    this.drawer.on('drawer.theme.change', () => this.render());
    window.addEventListener('resize', () => this.drawer.setSize(this.$main.clientWidth, this.$main.clientHeight));

    this.$name.addEventListener('change', () => this.rename(this.$name.value));
    // Enter validates name, Escape restores it
    this.$name.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.$name.blur();
      if (e.key === 'Escape') {
        this.$name.value = this.drawing?.name ?? '';
        this.$name.blur();
      }
    });
    this.$drawingsButton.addEventListener('click', () => this.drawingsDialog.show());
    this.$accountButton.addEventListener('click', () => (this.user ? this.logout() : this.accountDialog.show()));
  }

  /**
   * Logged in from account dialog: drawing of account opened (the one drawn before for a new account), its preferences
   */
  async login(user: User) {
    // drawing of browser kept there
    await this.drawer.save();
    this.user = user;

    const drawings = await api.listDrawings();
    const drawing = drawings[0] ?? (await api.createDrawing({ content: this.drawer.getDrawingFile() }));

    this.drawer.setUser({ id: user.id, name: user.name });
    await this._open(drawing);
    // once loaded: grid and snapping preferences fire changes, saved in this drawing
    await this._loadPreferences();
    this.render();
  }

  /**
   * Drawing of user loaded at once: the one shown before is not saved in it (error shown by drawer)
   */
  private async _open(drawing: DrawingSummary) {
    this.drawing = drawing;

    const loaded = this.drawer.loadFromStorage();

    local.setLastDrawingId(drawing.id);
    this._setSaveState('');
    await loaded.catch(() => {});
  }

  /**
   * Drawing of browser shown again: drawing of account is not kept in browser
   */
  async logout() {
    await this.drawer.save();
    await api.signOut().catch(() => {});
    this.user = null;
    this.drawing = null;
    this.drawer.setUser(null);
    this._setSaveState('');
    await this.drawer.loadFromStorage();
    this.render();
  }

  /**
   * Open a drawing of user, changes of current one saved before
   */
  async openDrawing(drawing: DrawingSummary) {
    await this.drawer.save();
    await this._open(drawing);
    this.render();
  }

  async newDrawing() {
    await this.openDrawing(await api.createDrawing({}));
  }

  async rename(name: string) {
    const { drawing } = this;

    if (!drawing || name.trim() === drawing.name) return;
    try {
      const renamed = await api.updateDrawing(drawing.id, { name });

      if (this.drawing?.id === renamed.id) this.drawing = renamed;
    } catch (error) {
      this.drawer.toast(this.texts.t('error', { error: (error as Error).message }), 'error');
    }
    this.render();
  }

  private _setSaveState(state: SaveState) {
    this.#saveState = state;
    this.render();
  }

  /**
   * Texts and state of bar: language and theme of the drawer
   */
  render() {
    const { t } = this.texts;
    const saveTexts = { '': '', saving: t('saving'), saved: t('saved'), error: t('notSaved') };

    document.documentElement.lang = this.drawer.language;
    document.body.classList.toggle('app-dark', this.drawer.isDarkMode());
    this.$name.hidden = !this.drawing;
    this.$name.placeholder = t('untitled');
    this.$name.setAttribute('aria-label', t('drawingName'));
    if (document.activeElement !== this.$name) this.$name.value = this.drawing?.name ?? '';
    this.$saveState.textContent = saveTexts[this.#saveState];
    this.$saveState.classList.toggle('is-error', this.#saveState === 'error');
    this.$drawingsButton.hidden = !this.user;
    this.$drawingsButton.textContent = t('myDrawings');
    this.$user.textContent = this.user?.name ?? '';
    this.$accountButton.textContent = t(this.user ? 'signOut' : 'signIn');
    this.accountDialog?.render();
    this.drawingsDialog?.render();
  }
}
