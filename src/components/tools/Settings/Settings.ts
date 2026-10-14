import { Dropdown } from '@/components/Dropdown/Dropdown';
import './settings.scss';
import { Drawer } from '@/Drawer';
import SettingIcon from '@/icons/setting.svg?raw';
import OpenIcon from '@/icons/open.svg?raw';
import ExportIcon from '@/icons/export.svg?raw';
import TrashIcon from '@/icons/trash.svg?raw';
import GridIcon from '@/icons/grid.svg?raw';
import GithubIcon from '@/icons/github.svg?raw';
import ZenIcon from '@/icons/zen.svg?raw';
import StoreIcon from '@/icons/store.svg?raw';
import SaveIcon from '@/icons/save.svg?raw';
import LinkIcon from '@/icons/link.svg?raw';
import { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { ColorLike } from '@/@types/drawer';
import { createButton, setLabel, setPressed, uniqueId } from '@/utils/dom';
import { ColorPicker } from '@/components/ColorPicker/ColorPicker';

export class Settings extends Dropdown {
  drawer: Drawer;
  $exportButton: HTMLButtonElement;
  $openButton: HTMLButtonElement;
  $saveAsButton: HTMLButtonElement;
  $copyLinkButton: HTMLButtonElement;
  $clearCanvasButton: HTMLButtonElement;
  $toggleGridButton: HTMLButtonElement;
  $githubButton: HTMLButtonElement;
  $zenModeButton: HTMLButtonElement;
  $clearStorageButton: HTMLButtonElement;
  $bgColorContainer: HTMLDivElement;
  $bgColorBtnContainer: HTMLDivElement;
  bgColorPicker: ColorPicker;

  constructor(drawer: Drawer) {
    super();

    this.drawer = drawer;
    this.$dropdownContainer.classList.add('drawer-dropdown-setting');
    this.$button.innerHTML = SettingIcon;
    setLabel(this.$button, 'Menu');
    // buttons, separators and colors, not list items
    this.$dropdownList.setAttribute('role', 'none');

    this.$openButton = this._createItem(OpenIcon, 'Open <span class="text-muted" aria-hidden="true">Ctrl+O</span>');
    this.$openButton.setAttribute('aria-keyshortcuts', 'Control+O');
    this.$saveAsButton = this._createItem(SaveIcon, 'Save as... <span class="text-muted" aria-hidden="true">Ctrl+S</span>');
    this.$saveAsButton.setAttribute('aria-keyshortcuts', 'Control+S');
    this.$copyLinkButton = this._createItem(LinkIcon, 'Copy link');
    this.$exportButton = this._createItem(ExportIcon, 'Export to...');

    // asks confirmation
    this.$clearCanvasButton = this._createItem(TrashIcon, 'Clear canvas');
    this.$clearCanvasButton.setAttribute('aria-haspopup', 'dialog');
    this.$clearCanvasButton.setAttribute('aria-keyshortcuts', 'Control+Delete');

    this.$toggleGridButton = this._createItem(GridIcon, 'Show grid');
    this.$toggleGridButton.setAttribute('aria-keyshortcuts', 'Alt+G');
    setPressed(this.$toggleGridButton, false);

    this.$zenModeButton = this._createItem(ZenIcon, 'Zen mode <span class="text-muted" aria-hidden="true">Alt+Z</span>');
    this.$zenModeButton.setAttribute('aria-keyshortcuts', 'Alt+Z');
    setPressed(this.$zenModeButton, false);

    this.$githubButton = this._createItem(GithubIcon, 'Github');
    setLabel(this.$githubButton, 'Github (opens in a new tab)');

    // asks confirmation
    this.$clearStorageButton = this._createItem(StoreIcon, 'Clear stored data');
    this.$clearStorageButton.setAttribute('aria-haspopup', 'dialog');

    this.$bgColorContainer = document.createElement('div');
    this.$bgColorContainer.classList.add('color-picker-container');
    const $bgColorTitle = document.createElement('h6');
    $bgColorTitle.classList.add('title');
    $bgColorTitle.textContent = 'Background color';
    $bgColorTitle.id = uniqueId('bg-color-title');
    this.$bgColorContainer.append($bgColorTitle);
    this.$bgColorContainer.setAttribute('role', 'group');
    this.$bgColorContainer.setAttribute('aria-labelledby', $bgColorTitle.id);

    this.$bgColorBtnContainer = document.createElement('div');
    this.$bgColorBtnContainer.classList.add('color-picker-btn-container');

    const bgColors: { color: ColorLike; label: string }[] = [
      { color: '#fff', label: 'White' },
      { color: '#f8f9fa', label: 'Light gray' },
      { color: '#f5faff', label: 'Light blue' },
      { color: '#fffce8', label: 'Light yellow' },
      { color: '#fdf8f6', label: 'Light beige' },
    ];

    this.bgColorPicker = new ColorPicker(this.$bgColorBtnContainer, {
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

    this.$dropdownList.append(
      ...[
        this.$openButton,
        this.$saveAsButton,
        this.$copyLinkButton,
        // this.$exportButton,
        this.getSeparator(),
        this.$clearCanvasButton,
        this.$toggleGridButton,
        this.$zenModeButton,
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
   * Menu item: icon and label (html)
   */
  private _createItem(icon: string, label: string) {
    const $item = createButton('drawer-button', 'drawer-button-neutral', 'drawer-dropdown-list-item');

    $item.innerHTML = icon + label;

    return $item;
  }

  getSeparator() {
    const $separator = document.createElement('hr');

    return $separator;
  }

  private initEvents() {
    this.$openButton.addEventListener('click', () => this.drawer.open());
    this.$saveAsButton.addEventListener('click', () => this.drawer.saveAs());
    this.$copyLinkButton.addEventListener('click', () => this.drawer.copyLink());

    this.$clearCanvasButton.addEventListener('click', () => {
      this.drawer.clearCanvas();
    });

    this.$toggleGridButton.addEventListener('click', () => {
      this.toggleGrid();
    });

    this.$zenModeButton.addEventListener('click', () => {
      this.toggleZenMode();
    });

    this.$githubButton.addEventListener('click', () => {
      window.open('https://github.com/fabienwnklr/free-drawing', 'blank');
    });

    this.$clearStorageButton.addEventListener('click', () => {
      this.drawer.clearStoredData();
    });

    // focus drawer on hide dropdown (no on toggle by click again on it), unless focus is in a dialog opened from menu
    this.on('fd.dropdown.hide', () => {
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
