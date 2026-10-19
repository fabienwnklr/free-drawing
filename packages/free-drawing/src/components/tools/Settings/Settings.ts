import { Dropdown } from '@/components/Dropdown/Dropdown';
import '@/components/tools/Settings/settings.scss';
import type { Drawer } from '@/Drawer';
import SettingIcon from '@/icons/setting.svg?raw';
import OpenIcon from '@/icons/open.svg?raw';
import ExportIcon from '@/icons/export.svg?raw';
import TrashIcon from '@/icons/trash.svg?raw';
import GridIcon from '@/icons/grid.svg?raw';
import GithubIcon from '@/icons/github.svg?raw';
import ZenIcon from '@/icons/zen.svg?raw';
import MoonIcon from '@/icons/moon.svg?raw';
import StoreIcon from '@/icons/store.svg?raw';
import SaveIcon from '@/icons/save.svg?raw';
import SaveNowIcon from '@/icons/save-now.svg?raw';
import LinkIcon from '@/icons/link.svg?raw';
import UsersIcon from '@/icons/users.svg?raw';
import LanguageIcon from '@/icons/language.svg?raw';
import CommandIcon from '@/icons/command.svg?raw';
import SlidersIcon from '@/icons/sliders.svg?raw';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { ColorLike } from '@/@types/drawer';
import { createButton, disableElement, enableElement, setLabel, setPressed, uniqueId } from '@/utils/dom';
import { ColorPicker } from '@/components/ColorPicker/ColorPicker';
import { drawerEvents } from '@/constants';
import { type Language, languages } from '@/i18n/I18n';
import type { TranslationKey } from '@/i18n/en';

/**
 * Settings menu of header (dropdown): file actions, collaboration, view toggles, language, preferences and
 * background color. Also toggles grid, snapping and zen mode for shortcuts, context menu and command palette
 */
export class Settings extends Dropdown {
  /** Drawer the menu acts on */
  drawer: Drawer;
  /** Item opening export dialog (Ctrl+Shift+E) */
  $exportButton: HTMLButtonElement;
  /** Item opening command palette (Ctrl+K), only with `commandPalette` option */
  $commandsButton: HTMLButtonElement;
  /** Item opening preferences dialog (Ctrl+,) */
  $preferencesButton: HTMLButtonElement;
  /** Item opening a `.freedrawing` file (Ctrl+O), disabled in read only */
  $openButton: HTMLButtonElement;
  /** Item saving drawing in a `.freedrawing` file (Ctrl+S) */
  $saveAsButton: HTMLButtonElement;
  /** Save now, shown without auto save */
  $saveButton: HTMLButtonElement;
  /** Item copying a link holding the drawing */
  $copyLinkButton: HTMLButtonElement;
  /** Item opening collaboration dialog, with session state, only with `collaboration` option */
  $collaborationButton: HTMLButtonElement;
  /** Item clearing drawing after confirmation, disabled in read only */
  $clearCanvasButton: HTMLButtonElement;
  /** Toggle item of grid (Alt+G) */
  $toggleGridButton: HTMLButtonElement;
  /** Item opening repository of the library in a new tab */
  $githubButton: HTMLButtonElement;
  /** Toggle item of zen mode (Alt+Z) */
  $zenModeButton: HTMLButtonElement;
  /** Toggle item of dark mode (Alt+Shift+D), follows `drawer.theme.change` */
  $darkModeButton: HTMLButtonElement;
  /** Language choice: auto (browser language) or a language, follows `drawer.language.change` */
  $languageSelect: HTMLSelectElement;
  /** Item removing drawing saved in localStorage, after confirmation */
  $clearStorageButton: HTMLButtonElement;
  /** Background color section (group named by its title) */
  $bgColorContainer: HTMLDivElement;
  /** Element of background color buttons */
  $bgColorBtnContainer: HTMLDivElement;
  /** Background color choice calling `drawer.setBgColor`, transparent included */
  bgColorPicker: ColorPicker;

  /**
   * Create the menu items (commands, collaboration and save now only when available) and the button in header
   * @param drawer Drawer the menu acts on, whose options give the items shown
   */
  constructor(drawer: Drawer) {
    super();

    this.drawer = drawer;
    this.$dropdownContainer.classList.add('drawer-dropdown-setting');
    this.$button.innerHTML = SettingIcon;
    // buttons, separators and colors, not list items
    this.$dropdownList.setAttribute('role', 'none');

    this.$commandsButton = this._createItem(CommandIcon, 'menu.commands', 'Ctrl+K');
    this.$commandsButton.setAttribute('aria-haspopup', 'dialog');
    this.$commandsButton.setAttribute('aria-keyshortcuts', 'Control+K');
    this.$openButton = this._createItem(OpenIcon, 'menu.open', 'Ctrl+O');
    this.$openButton.setAttribute('aria-keyshortcuts', 'Control+O');
    this.$saveButton = this._createItem(SaveNowIcon, 'menu.save');
    // changes not saved yet
    const $saveState = document.createElement('span');

    $saveState.className = 'text-muted';
    this.$saveButton.append($saveState);
    this.$saveAsButton = this._createItem(SaveIcon, 'menu.saveAs', 'Ctrl+S');
    this.$saveAsButton.setAttribute('aria-keyshortcuts', 'Control+S');
    this.$copyLinkButton = this._createItem(LinkIcon, 'menu.copyLink');
    this.$collaborationButton = this._createItem(UsersIcon, 'menu.collaboration');
    // session state
    const $collaborationState = document.createElement('span');

    $collaborationState.className = 'text-muted';
    this.$collaborationButton.append($collaborationState);
    this.$collaborationButton.setAttribute('aria-haspopup', 'dialog');
    this.$exportButton = this._createItem(ExportIcon, 'menu.export', 'Ctrl+Shift+E');
    this.$exportButton.setAttribute('aria-haspopup', 'dialog');
    this.$exportButton.setAttribute('aria-keyshortcuts', 'Control+Shift+E');

    // asks confirmation
    this.$clearCanvasButton = this._createItem(TrashIcon, 'menu.clearCanvas');
    this.$clearCanvasButton.setAttribute('aria-haspopup', 'dialog');
    this.$clearCanvasButton.setAttribute('aria-keyshortcuts', 'Control+Delete');

    this.$toggleGridButton = this._createItem(GridIcon, 'menu.showGrid');
    this.$toggleGridButton.setAttribute('aria-keyshortcuts', 'Alt+G');
    setPressed(this.$toggleGridButton, false);

    this.$zenModeButton = this._createItem(ZenIcon, 'menu.zenMode', 'Alt+Z');
    this.$zenModeButton.setAttribute('aria-keyshortcuts', 'Alt+Z');
    setPressed(this.$zenModeButton, false);

    this.$darkModeButton = this._createItem(MoonIcon, 'menu.darkMode', 'Alt+Shift+D');
    this.$darkModeButton.setAttribute('aria-keyshortcuts', 'Alt+Shift+D');
    setPressed(this.$darkModeButton, false);

    const $language = this._createLanguageItem();

    this.$languageSelect = $language.querySelector('select')!;

    this.$preferencesButton = this._createItem(SlidersIcon, 'menu.preferences', 'Ctrl+,');
    this.$preferencesButton.setAttribute('aria-haspopup', 'dialog');
    this.$preferencesButton.setAttribute('aria-keyshortcuts', 'Control+,');

    this.$githubButton = this._createItem(GithubIcon, 'menu.github');

    // asks confirmation
    this.$clearStorageButton = this._createItem(StoreIcon, 'menu.clearStorage');
    this.$clearStorageButton.setAttribute('aria-haspopup', 'dialog');

    this.$bgColorContainer = document.createElement('div');
    this.$bgColorContainer.classList.add('color-picker-container');
    const $bgColorTitle = document.createElement('h6');
    $bgColorTitle.classList.add('title');
    $bgColorTitle.id = uniqueId('bg-color-title');
    this.$bgColorContainer.append($bgColorTitle);
    this.$bgColorContainer.setAttribute('role', 'group');
    this.$bgColorContainer.setAttribute('aria-labelledby', $bgColorTitle.id);

    this.$bgColorBtnContainer = document.createElement('div');
    this.$bgColorBtnContainer.classList.add('color-picker-btn-container');

    const bgColors: { color: ColorLike; label: TranslationKey }[] = [
      { color: '#fff', label: 'color.white' },
      { color: '#f8f9fa', label: 'color.lightGray' },
      { color: '#f5faff', label: 'color.lightBlue' },
      { color: '#fffce8', label: 'color.lightYellow' },
      { color: '#fdf8f6', label: 'color.lightBeige' },
    ];

    this.bgColorPicker = new ColorPicker(this.$bgColorBtnContainer, {
      i18n: this.drawer.i18n,
      colors: bgColors,
      attr: 'data-bg-color',
      buttonClass: 'color-picker__button',
      transparent: true,
      onChange: (color) => {
        // active button updated by drawer
        this.drawer.setBgColor(color);
        this.drawer.focus();
      },
    });
    this.$bgColorContainer.append(this.$bgColorBtnContainer);
    this.updateBgColor(this.drawer.background.fill() as ColorLike);

    this.drawer.i18n.translate((t) => {
      setLabel(this.$button, t('menu.label'));
      setLabel(this.$githubButton, t('menu.githubLabel'));
      $bgColorTitle.textContent = t('menu.background');
      this._updateCollaborationState();
    });
    const updateSave = () => {
      this.$saveButton.hidden = this.drawer.options.autoSave;
      $saveState.textContent = this.drawer.hasUnsavedChanges() ? this.drawer.t('menu.unsaved') : '';
    };

    updateSave();
    this.drawer.on(drawerEvents.unsavedChange, updateSave);
    this.drawer.on(drawerEvents.preferencesChange, updateSave);
    this.drawer.on(drawerEvents.languageChange, updateSave);

    this.$dropdownList.append(
      ...[
        ...(this.drawer.options.commandPalette ? [this.$commandsButton] : []),
        this.$openButton,
        this.$saveButton,
        this.$saveAsButton,
        this.$copyLinkButton,
        this.$exportButton,
        // server given by collaboration option
        ...(this.drawer.options.collaboration ? [this.$collaborationButton] : []),
        this.getSeparator(),
        this.$clearCanvasButton,
        this.$toggleGridButton,
        this.$zenModeButton,
        this.$darkModeButton,
        $language,
        this.$preferencesButton,
        this.$githubButton,
        this.getSeparator(),
        this.$clearStorageButton,
        this.getSeparator(),
        this.$bgColorContainer,
      ]
    );
    this.drawer.layout.add('header', this.$dropdownContainer);

    this.initEvents();
  }

  /**
   * Set active background color button
   * @param color Background color of the drawing (custom color when not in palette)
   */
  updateBgColor(color: ColorLike) {
    this.bgColorPicker.setColor(color);
  }

  /**
   * Menu item: icon, translated label and shortcut
   * @param icon Svg icon shown first
   * @param label Key of the item text, translated again on language change
   * @param shortcut Keys shown after the text (hidden from screen readers), none when missing
   * @returns Item button, not appended yet
   */
  private _createItem(icon: string, label: TranslationKey, shortcut?: string) {
    const $item = createButton('drawer-button', 'drawer-button-neutral', 'drawer-dropdown-list-item');
    const $label = document.createElement('span');

    $item.innerHTML = icon;
    $item.append($label);
    this.drawer.i18n.translate((t) => ($label.textContent = t(label)));
    if (shortcut) {
      const $shortcut = document.createElement('span');

      $shortcut.className = 'text-muted';
      $shortcut.setAttribute('aria-hidden', 'true');
      $shortcut.textContent = shortcut;
      $item.append($shortcut);
    }

    return $item;
  }

  /**
   * Language choice: browser one or a language
   * @returns Item holding the label and the language select (set to current choice)
   */
  private _createLanguageItem() {
    const $item = document.createElement('div');
    const $label = document.createElement('label');
    const $select = document.createElement('select');
    const $auto = new Option('', 'auto');

    $item.className = 'drawer-dropdown-list-item drawer-language';
    $item.innerHTML = LanguageIcon;
    $select.id = uniqueId('language');
    $label.htmlFor = $select.id;
    $select.append(
      $auto,
      // names in their language
      ...Object.entries(languages).map(([language, { name }]) => new Option(name, language))
    );
    $select.value = this.drawer.languageChoice;
    $item.append($label, $select);
    this.drawer.i18n.translate((t) => {
      $label.textContent = t('menu.language');
      $auto.text = t('language.auto');
    });

    $select.addEventListener('change', () => this.drawer.setLanguage($select.value as Language | 'auto'));
    // menu stays open while choosing
    $select.addEventListener('click', (e) => e.stopPropagation());
    // arrows choose a language, not move selection (Escape closes menu)
    $select.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') e.stopPropagation();
    });

    return $item;
  }

  /**
   * Session state shown in collaboration item
   */
  private _updateCollaborationState() {
    const collaboration = this.drawer.collaboration;
    const users = collaboration?.users.length;

    this.$collaborationButton.querySelector('.text-muted')!.textContent = collaboration
      ? this.drawer.t(users ? 'menu.collaborationUsers' : 'menu.collaborationOn', { count: users ?? 0 })
      : '';
  }

  /**
   * Separator between groups of menu items
   * @returns New `hr` element
   */
  getSeparator() {
    const $separator = document.createElement('hr');

    return $separator;
  }

  /**
   * Actions of menu items, and items following drawer state (read only, session, language, theme)
   */
  private initEvents() {
    this.$commandsButton.addEventListener('click', () => this.drawer.showCommandPalette());
    this.$preferencesButton.addEventListener('click', () => this.drawer.showPreferences());
    this.$openButton.addEventListener('click', () => this.drawer.open());
    this.$saveAsButton.addEventListener('click', () => this.drawer.saveAs());
    this.$saveButton.addEventListener('click', () => this.drawer.saveNow());
    this.$copyLinkButton.addEventListener('click', () => this.drawer.copyLink());
    this.$exportButton.addEventListener('click', () => this.drawer.showExport());
    this.$collaborationButton.addEventListener('click', () => this.drawer.showCollaboration());
    // read only: no item modifying drawing
    this.drawer.on(drawerEvents.readOnlyChange, (readOnly: boolean) => {
      for (const $item of [this.$openButton, this.$clearCanvasButton]) {
        if (readOnly) disableElement($item);
        else enableElement($item);
      }
    });
    // session state shown in menu
    this.drawer.on(drawerEvents.collaborationChange, () => this._updateCollaborationState());
    // language set by api
    this.drawer.on(drawerEvents.languageChange, () => (this.$languageSelect.value = this.drawer.languageChoice));

    this.$clearCanvasButton.addEventListener('click', () => {
      this.drawer.clearCanvas();
    });

    this.$toggleGridButton.addEventListener('click', () => {
      this.toggleGrid();
    });

    this.$zenModeButton.addEventListener('click', () => {
      this.toggleZenMode();
    });

    this.$darkModeButton.addEventListener('click', () => this.drawer.toggleDarkMode());
    this.drawer.on(drawerEvents.themeChange, (dark: boolean) => setPressed(this.$darkModeButton, dark));

    this.$githubButton.addEventListener('click', () => {
      window.open('https://github.com/fabienwnklr/free-drawing', 'blank');
    });

    this.$clearStorageButton.addEventListener('click', () => {
      this.drawer.clearStoredData();
    });

    // focus drawer on hide dropdown (no on toggle by click again on it), unless focus is in a dialog opened from menu
    this.on(drawerEvents.dropdownHide, () => {
      if (!document.activeElement?.closest('[aria-modal="true"]')) this.drawer.focus();
    });
  }

  /**
   * Interface hidden except toolbar and menu
   */
  get zenMode() {
    return this.drawer.layout.zen;
  }

  /**
   * Switch zen mode (menu item, Alt+Z, preferences), saved in preferences
   */
  toggleZenMode() {
    const zen = !this.zenMode;

    setPressed(this.$zenModeButton, zen);
    // interface added with hideInZen
    this.drawer.layout.setZen(zen);
    this.drawer._preferencesChanged();
  }

  /**
   * Switch snapping of selection widget (Alt+S, context menu, command palette), nothing without it
   */
  toggleSnapping() {
    const selectWidget = this.drawer.getWidget<SelectWidget>('selection');
    const active = !selectWidget?.snapping;

    selectWidget?.toggleSnapping(active);
    this.drawer.focus();
  }

  /**
   * Show grid (object snapping turned off) or hide it: menu item, Alt+G, context menu, command palette
   */
  toggleGrid() {
    if (this.drawer.grid) {
      this.drawer.hideGrid();
    } else {
      this.drawer.showGrid();
    }
    this.drawer.focus();
    this.drawer.stage.fire('change');
  }
}
