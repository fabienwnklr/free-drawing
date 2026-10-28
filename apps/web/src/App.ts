import { Drawer, ariaShortcut, type DrawerStorage, type Preferences } from '@fabwcie/free-drawing';
import { ExtraShapesPlugin, HighlighterPlugin } from '@fabwcie/free-drawing-extra-tools';
import { type DrawingSummary, type DrawingsStore, type User, api } from './api';
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
  readonly $saveState: HTMLElement;
  /** Auto save on / off (preference of drawer) */
  readonly $autoSaveButton: HTMLButtonElement;
  /** Saves the drawing while auto save is off */
  readonly $saveButton: HTMLButtonElement;
  readonly $drawingsButton: HTMLButtonElement;
  readonly $accountButton: HTMLButtonElement;
  readonly accountDialog: AccountDialog;
  readonly drawingsDialog: DrawingsDialog;
  readonly profileDialog: ProfileDialog;
  #saveState: SaveState = '';
  /** Session read and drawing chosen: drawing is loaded after it */
  readonly #started: Promise<void>;

  constructor($root: HTMLElement, { server, collaboration }: { server: boolean; collaboration: boolean }) {
    this.server = server;
    $root.classList.add('app');
    $root.innerHTML = /*html*/ `
      <header class="app-bar">
        <span class="app-logo"><img src="${logoUrl}" alt="" width="22" height="22" /><span class="app-logo-text">free-drawing</span></span>
        <input class="app-name" maxlength="100" hidden />
        <span class="app-save-state text-muted" aria-live="polite"></span>
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
    this.$autoSaveButton = $root.querySelector('[data-autosave]')!;
    this.$saveButton = $root.querySelector('[data-save]')!;
    this.$drawingsButton = $root.querySelector('[data-drawings]')!;
    this.$accountButton = $root.querySelector('[data-account]')!;

    this.#started = this._restoreSession();
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
        await this.#started;

        const { content, ...drawing } = await this.store.getDrawing(this.drawing!.id);

        this.drawing = drawing;
        this._remember(drawing);
        this.render();
        return content;
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
          // shown by drawer once, reason explained (drawings of the account too big)
          this._setSaveState('error');
          throw new Error(this.texts.reason(error as Error));
        }
      },
    };
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
    const room = window.location.hash.match(/^#room=([\w-]+)/)?.[1];

    // a room link fills its own drawing (last one kept), the same one each time it is opened
    this.drawing = room ? await this._roomDrawing(room) : await this._lastDrawing();
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
    this.drawer.on('preferences.change', (preferences: Preferences) => {
      if (this.user) api.savePreferences(preferences).catch(() => {});
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
    this.$accountButton.addEventListener('click', () =>
      this.user ? this.profileDialog.show() : this.accountDialog.show()
    );
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
    await api.signOut().catch(() => {});
    await this._leaveAccount();
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
   * Drawing of browser shown again: drawing of account is not kept in browser
   */
  private async _leaveAccount() {
    this._leaveSession();
    this.user = null;
    // not saved meanwhile
    this.drawing = null;
    this.drawer.setUser(null);
    this._setSaveState('');
    this.drawing = await this._lastDrawing();
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
    const saveTexts = { '': '', saving: t('saving'), saved: t('saved'), error: t('notSaved'), unsaved: t('unsaved') };

    document.documentElement.lang = this.drawer.language;
    document.body.classList.toggle('app-dark', this.drawer.isDarkMode());
    this.$name.hidden = !this.drawing;
    this.$name.placeholder = t('untitled');
    this.$name.setAttribute('aria-label', t('drawingName'));
    if (document.activeElement !== this.$name) this.$name.value = this.drawing?.name ?? '';
    this.$saveState.textContent = saveTexts[this.#saveState];
    this.$saveState.classList.toggle('is-error', this.#saveState === 'error');
    this.$autoSaveButton.setAttribute('aria-checked', String(this.drawer.options.autoSave));
    this.$autoSaveButton.querySelector('[data-label]')!.textContent = t('autoSave');
    this.$autoSaveButton.title = t('autoSaveHint');
    this.$saveButton.hidden = this.drawer.options.autoSave;
    this.$saveButton.textContent = t('save');
    this.$drawingsButton.querySelector('[data-label]')!.textContent = t('myDrawings');
    // static site: no accounts
    this.$accountButton.hidden = !this.server;
    this.$accountButton.querySelector('[data-label]')!.textContent = t(this.user ? 'account' : 'signIn');
    this.accountDialog?.render();
    this.profileDialog?.render();
    this.drawingsDialog?.render();
  }
}
