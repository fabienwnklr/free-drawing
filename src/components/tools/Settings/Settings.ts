import { Dropdown } from '@/components/Dropdown/Dropdown';
import '@/components/tools/Settings/settings.scss';
import { Drawer } from '@/Drawer';
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
import LinkIcon from '@/icons/link.svg?raw';
import UsersIcon from '@/icons/users.svg?raw';
import LanguageIcon from '@/icons/language.svg?raw';
import { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { ColorLike } from '@/@types/drawer';
import { createButton, disableElement, enableElement, setLabel, setPressed, uniqueId } from '@/utils/dom';
import { ColorPicker } from '@/components/ColorPicker/ColorPicker';
import { drawerEvents } from '@/constants';
import { type Language, languages } from '@/i18n/I18n';
import type { TranslationKey } from '@/i18n/en';

export class Settings extends Dropdown {
  drawer: Drawer;
  $exportButton: HTMLButtonElement;
  $openButton: HTMLButtonElement;
  $saveAsButton: HTMLButtonElement;
  $copyLinkButton: HTMLButtonElement;
  $collaborationButton: HTMLButtonElement;
  $clearCanvasButton: HTMLButtonElement;
  $toggleGridButton: HTMLButtonElement;
  $githubButton: HTMLButtonElement;
  $zenModeButton: HTMLButtonElement;
  $darkModeButton: HTMLButtonElement;
  $languageSelect: HTMLSelectElement;
  $clearStorageButton: HTMLButtonElement;
  $bgColorContainer: HTMLDivElement;
  $bgColorBtnContainer: HTMLDivElement;
  bgColorPicker: ColorPicker;

  constructor(drawer: Drawer) {
    super();

    this.drawer = drawer;
    this.$dropdownContainer.classList.add('drawer-dropdown-setting');
    this.$button.innerHTML = SettingIcon;
    // buttons, separators and colors, not list items
    this.$dropdownList.setAttribute('role', 'none');

    this.$openButton = this._createItem(OpenIcon, 'menu.open', 'Ctrl+O');
    this.$openButton.setAttribute('aria-keyshortcuts', 'Control+O');
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

    this.$dropdownList.append(
      ...[
        this.$openButton,
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
        this.$githubButton,
        this.getSeparator(),
        this.$clearStorageButton,
        this.getSeparator(),
        this.$bgColorContainer
      ]
    );
    this.drawer.$headerContainer.append(this.$dropdownContainer);

    this.initEvents();
  }

  /**
   * Set active background color button
   * @param {ColorLike} color
   */
  updateBgColor(color: ColorLike) {
    this.bgColorPicker.setColor(color);
  }

  /**
   * Menu item: icon, translated label and shortcut
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

  getSeparator() {
    const $separator = document.createElement('hr');

    return $separator;
  }

  private initEvents() {
    this.$openButton.addEventListener('click', () => this.drawer.open());
    this.$saveAsButton.addEventListener('click', () => this.drawer.saveAs());
    this.$copyLinkButton.addEventListener('click', () => this.drawer.copyLink());
    this.$exportButton.addEventListener('click', () => this.drawer.showExport());
    this.$collaborationButton.addEventListener('click', () => this.drawer.showCollaboration());
    // read only: no item modifying drawing
    this.drawer.on(drawerEvents.readOnlyChange, (readOnly: boolean) =>
      [this.$openButton, this.$clearCanvasButton].forEach(($item) =>
        readOnly ? disableElement($item) : enableElement($item)
      )
    );
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

  toggleZenMode() {
    const zen = !this.$zenModeButton.classList.contains('active');

    setPressed(this.$zenModeButton, zen);

    const $containers = [
      this.drawer.zoom?.$zoomContainer,
      this.drawer.position?.$positionContainer,
      this.drawer.help.$helpContainer,
      this.drawer.undoRedo.$undoRedoContainer,
      this.drawer.layersPanel?.$buttonContainer,
      this.drawer.layersPanel?.$panel,
    ];

    $containers.forEach(($container) => {
      if ($container) $container.style.display = zen ? 'none' : '';
    });
  }

  toggleSnapping() {
    const selectWidget = this.drawer.getWidget<SelectWidget>('selection');
    const active = !selectWidget?.snapping;

    selectWidget?.toggleSnapping(active);
    this.drawer.focus();
  }

  toggleGrid() {
    if (this.drawer.grid) {
      this.drawer.hideGrid();
    } else {
      this.drawer.showGrid();
    }
    this.drawer.focus()
    this.drawer.stage.fire('change');
  }
}
