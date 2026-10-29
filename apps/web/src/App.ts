import { Drawer, ariaShortcut, type DrawerStorage, type Preferences } from '@fabwcie/free-drawing';
import { ExtraShapesPlugin, HighlighterPlugin } from '@fabwcie/free-drawing-extra-tools';
import { ApiError, type DrawingSummary, type DrawingsStore, type User, api } from './api';
import { local, localDrawings } from './local';
import { Texts } from './texts';
import { AccountDialog } from './AccountDialog';
import { DrawingsDialog } from './DrawingsDialog';
import { ProfileDialog } from './ProfileDialog';
import logoUrl from '../logo.svg';

type SaveState = '' | 'saving' | 'saved' | 'error' | 'unsaved';

/** Icons of buttons of the bar, alone on narrow screens (labels read by screen readers) */
const icons = {
  drawings:
    '<svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 32 32"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M28 11v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6c3 0 3 3 5 3h9.003C27.108 9 28 9.895 28 11Z" /></svg>',
  account:
    '<svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><circle cx="12" cy="8" r="4" /><path d="M5 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" /></svg>',
};

/**
 * App of free-drawing: drawings kept in browser, or with an account when served by the server of free-drawing
 * (drawings and preferences saved on server, collaboration). Static site: drawings of browser only.
 */
export class App {
  readonly drawer: Drawer;
  readonly texts: Texts;
  /** Served by the server of free-drawing: accounts */
  readonly server: boolean;
  /** Logged in user */
  user: User | null = null;
  /** Drawing open: of account on server (logged in user), else of browser */
  drawing: DrawingSummary | null = null;
  readonly $bar: HTMLElement;
  readonly $main: HTMLElement;
  readonly $name: HTMLInputElement;
  /** Save state shown (saving, saved, error, unsaved), not read at each save */
  readonly $saveState: HTMLElement;
  /** Live region of the bar: changes not saved read once (errors of saves are read with the toast of the drawer) */
  readonly $status: HTMLElement;
  /** Auto save on / off (preference of drawer) */
  readonly $autoSaveButton: HTMLButtonElement;
  /** Saves the drawing while auto save is off */
  readonly $saveButton: HTMLButtonElement;
  readonly $drawingsButton: HTMLButtonElement;
  readonly $accountButton: HTMLButtonElement;
  readonly accountDialog: AccountDialog;
  readonly drawingsDialog: DrawingsDialog;
  readonly profileDialog: ProfileDialog;
  /** Session of the account ended elsewhere (signed out, password changed, expired): signed in again to save */
  sessionEnded = false;
  #saveState: SaveState = '';
  /** Session read and drawing chosen (`_start`): drawing is loaded after it; null after a failure, started again */
  #started: Promise<void> | null = null;
  /** Preferences of the account read: changes of preferences saved in the account after them only, never over them */
  #accountPreferences = false;

  constructor($root: HTMLElement, { server, collaboration }: { server: boolean; collaboration: boolean }) {
    this.server = server;
    $root.classList.add('app');
    $root.innerHTML = /*html*/ `
      <header class="app-bar">
        <span class="app-logo"><img src="${logoUrl}" alt="" width="22" height="22" /><span class="app-logo-text">free-drawing</span></span>
        <input class="app-name" maxlength="100" hidden />
        <span class="app-save-state text-muted"></span>
        <span class="app-status" role="status"></span>
        <button type="button" class="app-toggle" role="switch" data-autosave>
          <span class="app-toggle-track" aria-hidden="true"></span><span data-label></span>
        </button>
        <button type="button" class="app-button" data-save hidden></button>
        <span class="app-spacer"></span>
        <button type="button" class="app-button" data-drawings>${icons.drawings}<span data-label></span></button>
        <button type="button" class="app-button" data-account hidden>${icons.account}<span data-label></span></button>
      </header>
      <main class="app-main"></main>
    `;
    this.$bar = $root.querySelector('.app-bar')!;
    this.$main = $root.querySelector('.app-main')!;
    this.$name = $root.querySelector('.app-name')!;
    this.$saveState = $root.querySelector('.app-save-state')!;
    this.$status = $root.querySelector('.app-status')!;
    this.$autoSaveButton = $root.querySelector('[data-autosave]')!;
    this.$saveButton = $root.querySelector('[data-save]')!;
    this.$drawingsButton = $root.querySelector('[data-drawings]')!;
    this.$accountButton = $root.querySelector('[data-account]')!;

    // failure told by the load of the drawing
    this._start().catch(() => {});
    this.drawer = new Drawer(this.$main as HTMLDivElement, {
      width: this.$main.clientWidth,
      height: this.$main.clientHeight,
      collaboration,
      storage: this._createStorage(),
      // save button of app bar instead
      saveButton: false,
      // every tool of the demo: shapes and highlighter of the extra tools, in "More tools"
      plugins: [ExtraShapesPlugin, HighlighterPlugin],
    });
    this.texts = new Texts(this.drawer);
    this.accountDialog = new AccountDialog(this);
    this.drawingsDialog = new DrawingsDialog(this);
    this.profileDialog = new ProfileDialog(this);

    this._initEvents();
    // user and preferences once drawing is loaded (or could not be)
    this.drawer.ready.then(
      () => this._onStart(),
      () => this._onStart()
    );
    this.render();
  }

  /**
   * Drawings of logged in user, else of browser
   */
  get store(): DrawingsStore {
    return this.user ? api : localDrawings;
  }

  /**
   * Drawing open: of account on server (logged in user), else of browser
   */
  private _createStorage(): DrawerStorage {
    return {
      load: async () => {
        try {
          await this._start();

          const { id } = this.drawing!;
          const { content, ...drawing } = await this.store.getDrawing(id);

          // another drawing opened meanwhile (the drawer applies its load only): not set back
          if (this.drawing?.id === id) {
            this.drawing = drawing;
            this._remember(drawing);
            this.render();
          }
          return content;
        } catch (error) {
          // shown by the drawer, reason explained (too many drawings...)
          throw this._explained(error as Error);
        }
      },
      save: async (file) => {
        const { drawing, store } = this;

        // deleted drawing: not saved again
        if (!drawing) return;

        this._setSaveState('saving');
        try {
          const saved = await store.updateDrawing(drawing.id, { content: file });

          if (this.drawing?.id === saved.id) this.drawing = saved;
          this._setSaveState('saved');
        } catch (error) {
          // session of the account ended elsewhere: signed in again from the account button, changes kept unsaved
          if (this.user && error instanceof ApiError && error.status === 401) this.sessionEnded = true;
          this._setSaveState('error');
          // shown by drawer once
          throw this._explained(error as Error);
        }
      },
    };
  }

  /**
   * Error of a load or a save of the drawing given to the drawer: known errors of the server explained (drawings of the
   * account too big, session ended...), others as they are, so the drawer translates the ones of the browser by their
   * name (storage full)
   * @param error Error of the store
   * @returns The error, or an error with the reason explained
   */
  private _explained(error: Error): Error {
    const reason = this.texts.reason(error);

    return reason === error.message ? error : new Error(reason);
  }

  /**
   * Session read and drawing chosen (`_restoreSession`), once: started again by the next load after a failure (network,
   * drawing of a room not created, storage full)
   * @returns Resolved once the drawing to open is known
   */
  private _start(): Promise<void> {
    this.#started ??= this._restoreSession().catch((error: unknown) => {
      this.#started = null;
      throw error;
    });
    return this.#started;
  }

  /**
   * User of the session (none when not logged in, server unavailable or static site) and the drawing to open
   */
  private async _restoreSession() {
    if (this.server) {
      try {
        this.user = await api.me();
      } catch {
        // drawings of browser
      }
    }
    const { hash } = window.location;
    const room = hash.match(/^#room=([\w-]+)/)?.[1];

    // drawing opened meanwhile (start failed before): kept; a room link fills its own drawing (last one kept), the same
    // one each time it is opened; a drawing link (`#drawing=`, `#drawer-<n>=` of previous versions) a new one: not
    // saved over the last drawing
    this.drawing ??= room
      ? await this._roomDrawing(room)
      : /^#(drawing|drawer-\d+)=/.test(hash)
      ? await this.store.createDrawing({})
      : await this._lastDrawing();
  }

  /**
   * Drawing of a collaboration room: the one of a previous visit (or of the session started in it), else a new one
   */
  private async _roomDrawing(room: string) {
    const { store } = this;
    const id = local.roomDrawingId(room, !!this.user);
    const drawing =
      (id && (await store.listDrawings()).find((summary) => summary.id === id)) || (await store.createDrawing({}));

    local.setRoomDrawingId(room, drawing.id, !!this.user);
    return drawing;
  }

  /**
   * Drawing of account or browser open on last visit, else last updated one, else a new one (first drawing of browser:
   * the one drawn before drawings of browser, or in the demo)
   */
  private async _lastDrawing() {
    const { store } = this;
    const lastId = this.user ? local.lastDrawingId() : local.lastLocalDrawingId();
    const content = !this.user && local.isFirstVisit() ? local.previousDrawing() : undefined;
    const drawings = await store.listDrawings();

    return drawings.find(({ id }) => id === lastId) ?? drawings[0] ?? (await store.createDrawing({ content }));
  }

  /**
   * Drawing opened again on next visit
   */
  private _remember({ id }: DrawingSummary) {
    if (this.user) local.setLastDrawingId(id);
    else local.setLastLocalDrawingId(id);
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
    this.#accountPreferences = false;
    try {
      const preferences = await api.getPreferences();

      if (Object.keys(preferences).length) this.drawer.setPreferences(preferences);
      else await api.savePreferences(this.drawer.getPreferences());
      this.#accountPreferences = true;
    } catch {
      // current preferences kept, not saved in the account (they would replace its own)
    }
  }

  private _initEvents() {
    // also saved in browser by drawer; in the account once its own preferences are read
    this.drawer.on('preferences.change', (preferences: Preferences) => {
      if (this.user && this.#accountPreferences && !this.sessionEnded) api.savePreferences(preferences).catch(() => {});
      this.render();
    });
    // pending changes saved when turned on
    this.$autoSaveButton.addEventListener('click', () => {
      this.drawer.setAutoSave(!this.drawer.options.autoSave);
      this.render();
    });
    this.$saveButton.addEventListener('click', () => this.drawer.saveNow());
    this.$saveButton.setAttribute('aria-keyshortcuts', ariaShortcut('Ctrl+S'));
    // Ctrl / Cmd + S out of the drawer (app bar, dialogs) saves the drawing, not the page (Shift: file downloaded);
    // in the drawer, its shortcut already handled it
    document.addEventListener('keydown', (e) => {
      if (e.defaultPrevented || !(e.ctrlKey || e.metaKey) || e.altKey || e.key.toLowerCase() !== 's') return;
      e.preventDefault();
      if (e.shiftKey) this.drawer.saveAs();
      else this.drawer.saveNow();
    });
    // without auto save: changes not saved yet
    this.drawer.on('unsaved.change', (unsaved: boolean) => {
      if (unsaved && !this.drawer.options.autoSave) this._setSaveState('unsaved');
      else if (!unsaved && this.#saveState === 'unsaved') this._setSaveState('');
    });
    this.drawer.on('language.change', () => this.render());
    this.drawer.on('theme.change', () => this.render());
    // session started in this drawing: opened again by the room link (page reloaded)
    this.drawer.on('collaboration.change', () => {
      const room = this.drawer.collaboration?.room;

      if (room && this.drawing) local.setRoomDrawingId(room, this.drawing.id, !!this.user);
    });
    window.addEventListener('resize', () => this.drawer.setSize(this.$main.clientWidth, this.$main.clientHeight));

    this.$name.addEventListener('change', () => this.rename(this.$name.value));
    // Enter validates name, Escape restores it (not when they end a composition: Chinese, Japanese, Korean...; Safari
    // ends it with a key of code 229)
    this.$name.addEventListener('keydown', (e) => {
      if (e.isComposing || e.keyCode === 229) return;
      if (e.key === 'Enter') this.$name.blur();
      if (e.key === 'Escape') {
        this.$name.value = this.drawing?.name ?? '';
        this.$name.blur();
      }
    });
    this.$drawingsButton.addEventListener('click', () => this.drawingsDialog.show());
    // session ended elsewhere: signed in again (email of the account given)
    this.$accountButton.addEventListener('click', () => {
      if (!this.user) this.accountDialog.show();
      else if (this.sessionEnded) this.accountDialog.show('signIn', this.user.email);
      else this.profileDialog.show();
    });
  }

  /**
   * Logged in from account dialog: drawing of account opened (the one drawn before for a new account), its preferences
   */
  async login(user: User) {
    const ended = this.sessionEnded;

    // same account signed in again after its session ended: its drawing kept, its changes saved now
    if (ended && user.id === this.user?.id) {
      this.sessionEnded = false;
      this.setUser(user);
      await this.drawer.save();
      return;
    }
    // drawing of browser kept there; changes of an account whose session ended: in a drawing of the browser
    if (ended) await this._keepUnsaved();
    else await this.drawer.save();

    // drawing of the account known before the drawings of the account are used: saves meanwhile still go to the browser
    // (a failure keeps the drawings of the browser)
    const drawings = await api.listDrawings();
    // a new account gets the drawing of the browser, not the one of another account
    const drawing = drawings[0] ?? (await api.createDrawing(ended ? {} : { content: this.drawer.getDrawingFile() }));

    this.sessionEnded = false;
    this.user = user;
    this.#accountPreferences = false;
    this.drawer.setUser({ id: user.id, name: user.name });
    await this._open(drawing);
    // once loaded: grid and snapping preferences fire changes, saved in this drawing
    await this._loadPreferences();
    this.render();
  }

  /**
   * Live collaboration left before another drawing is loaded: else the loaded drawing would replace the drawing of the
   * session for its other users (they keep it, the session goes on without this user)
   */
  private _leaveSession() {
    if (!this.drawer.collaboration) return;

    this.drawer.stopCollaboration();
    this.drawer.toast(this.texts.t('sessionLeft'), 'info');
  }

  /**
   * Drawing of user loaded at once: the one shown before is not saved in it (error shown by drawer)
   */
  private async _open(drawing: DrawingSummary) {
    this._leaveSession();
    this.drawing = drawing;

    const loaded = this.drawer.loadFromStorage();

    this._remember(drawing);
    this._setSaveState('');
    await loaded.catch(() => {});
  }

  /**
   * Name or email of logged in user changed: shown, name of collaboration sessions
   */
  setUser(user: User) {
    this.user = user;
    this.drawer.setUser({ id: user.id, name: user.name });
    this.render();
  }

  async logout() {
    await this.drawer.save();

    // not saved (session ended elsewhere, server unavailable): kept in a drawing of this browser, opened next
    const kept = await this._keepUnsaved();

    await api.signOut().catch(() => {});
    await this._leaveAccount(kept);
  }

  /**
   * Changes of the drawing of the account not saved (its session ended, server unavailable): kept in a new drawing of
   * this browser, told in a toast
   * @returns Drawing of the browser keeping them, null without changes not saved (or when it can't be kept)
   */
  private async _keepUnsaved(): Promise<DrawingSummary | null> {
    if (!this.user || !this.drawer.hasUnsavedChanges()) return null;
    try {
      const drawing = await localDrawings.createDrawing({
        name: this.drawing?.name,
        content: this.drawer.getDrawingFile(),
      });

      this.drawer.toast(this.texts.t('keptInBrowser'), 'warning');
      return drawing;
    } catch {
      return null;
    }
  }

  /**
   * Account deleted with its drawings and preferences (wrong password: error, still logged in)
   */
  async deleteAccount(password: string) {
    // pending save ended before (not done once drawing is deleted)
    await this.drawer.save();
    await api.deleteUser(password);
    await this._leaveAccount();
  }

  /**
   * Drawing of browser shown again: drawing of account is not kept in browser (unless its changes could not be saved)
   * @param drawing Drawing of the browser to open, the last one by default
   */
  private async _leaveAccount(drawing: DrawingSummary | null = null) {
    this._leaveSession();
    this.user = null;
    this.sessionEnded = false;
    this.#accountPreferences = false;
    // not saved meanwhile
    this.drawing = null;
    this.drawer.setUser(null);
    this._setSaveState('');
    this.drawing = drawing ?? (await this._lastDrawing());
    await this.drawer.loadFromStorage();
    this.render();
  }

  /**
   * Open a drawing of account or browser, changes of current one saved before
   */
  async openDrawing(drawing: DrawingSummary) {
    await this.drawer.save();
    await this._open(drawing);
    this.render();
  }

  async newDrawing() {
    await this.openDrawing(await this.store.createDrawing({}));
  }

  async rename(name: string) {
    const { drawing } = this;

    if (!drawing || name.trim() === drawing.name) return;
    try {
      const renamed = await this.store.updateDrawing(drawing.id, { name });

      if (this.drawing?.id === renamed.id) this.drawing = renamed;
    } catch (error) {
      this.drawer.toast(this.texts.error(error as Error), 'error');
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
    const saveTexts = { '': '', saving: t('saving'), saved: t('saved'), error: t('notSaved'), unsaved: t('unsaved') };

    document.documentElement.lang = this.drawer.language;
    document.body.classList.toggle('app-dark', this.drawer.isDarkMode());
    this.$name.hidden = !this.drawing;
    this.$name.placeholder = t('untitled');
    this.$name.setAttribute('aria-label', t('drawingName'));
    if (document.activeElement !== this.$name) this.$name.value = this.drawing?.name ?? '';
    this.$saveState.textContent = saveTexts[this.#saveState];
    this.$saveState.classList.toggle('is-error', this.#saveState === 'error');
    // same text not written again (read again by screen readers at each render)
    const status = this.#saveState === 'unsaved' ? t('unsaved') : '';

    if (this.$status.textContent !== status) this.$status.textContent = status;
    this.$autoSaveButton.setAttribute('aria-checked', String(this.drawer.options.autoSave));
    this.$autoSaveButton.querySelector('[data-label]')!.textContent = t('autoSave');
    this.$autoSaveButton.title = t('autoSaveHint');
    this.$saveButton.hidden = this.drawer.options.autoSave;
    this.$saveButton.textContent = t('save');
    this.$drawingsButton.querySelector('[data-label]')!.textContent = t('myDrawings');
    // static site: no accounts
    this.$accountButton.hidden = !this.server;
    this.$accountButton.querySelector('[data-label]')!.textContent = t(
      this.user && !this.sessionEnded ? 'account' : 'signIn'
    );
    this.accountDialog?.render();
    this.profileDialog?.render();
    this.drawingsDialog?.render();
  }
}
