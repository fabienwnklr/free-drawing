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
import { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { ColorLike } from '@/@types/drawer';
import { setLabel, setPressed, uniqueId } from '@/utils/dom';

export class Settings extends Dropdown {
  drawer: Drawer;
  $exportButton: HTMLButtonElement;
  $openButton: HTMLButtonElement;
  $clearCanvasButton: HTMLButtonElement;
  $toggleGridButton: HTMLButtonElement;
  $githubButton: HTMLButtonElement;
  $zenModeButton: HTMLButtonElement;
  $clearStorageButton: HTMLButtonElement;
  $bgColorContainer: HTMLDivElement;
  $bgColorBtnContainer: HTMLDivElement;

  constructor(drawer: Drawer) {
    super();

    this.drawer = drawer;
    this.$dropdownContainer.classList.add('drawer-dropdown-setting');
    this.$button.innerHTML = SettingIcon;
    setLabel(this.$button, 'Menu');
    // buttons, separators and colors, not list items
    this.$dropdownList.setAttribute('role', 'none');

    this.$openButton = document.createElement('button');
    this.$openButton.classList.add('drawer-button', 'drawer-button-neutral', 'drawer-dropdown-list-item');
    this.$openButton.innerHTML = OpenIcon + 'Open';

    this.$exportButton = document.createElement('button');
    this.$exportButton.classList.add('drawer-button', 'drawer-button-neutral', 'drawer-dropdown-list-item');
    this.$exportButton.innerHTML = ExportIcon + 'Export to...';

    this.$clearCanvasButton = document.createElement('button');
    this.$clearCanvasButton.classList.add('drawer-button', 'drawer-button-neutral', 'drawer-dropdown-list-item');
    this.$clearCanvasButton.innerHTML = TrashIcon + 'Clear canvas';

    this.$toggleGridButton = document.createElement('button');
    this.$toggleGridButton.classList.add('drawer-button', 'drawer-button-neutral', 'drawer-dropdown-list-item');
    this.$toggleGridButton.innerHTML = GridIcon + 'Show grid';
    this.$toggleGridButton.setAttribute('aria-keyshortcuts', 'Alt+G');
    setPressed(this.$toggleGridButton, false);

    this.$zenModeButton = document.createElement('button');
    this.$zenModeButton.classList.add('drawer-button', 'drawer-button-neutral', 'drawer-dropdown-list-item');
    this.$zenModeButton.innerHTML = ZenIcon + 'Zen mode <span class="text-muted" aria-hidden="true">Alt+Z</span>';
    this.$zenModeButton.setAttribute('aria-keyshortcuts', 'Alt+Z');
    setPressed(this.$zenModeButton, false);

    this.$githubButton = document.createElement('button');
    this.$githubButton.classList.add('drawer-button', 'drawer-button-neutral', 'drawer-dropdown-list-item');
    this.$githubButton.innerHTML = GithubIcon + 'Github';

    this.$clearStorageButton = document.createElement('button');
    this.$clearStorageButton.classList.add('drawer-button', 'drawer-button-neutral', 'drawer-dropdown-list-item');
    this.$clearStorageButton.innerHTML = StoreIcon + 'Clear stored data';

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
    const $bgColorButtons: HTMLButtonElement[] = [];

    const bgColors: { color: ColorLike; label: string }[] = [
      { color: '#fff', label: 'White' },
      { color: '#f8f9fa', label: 'Light gray' },
      { color: '#f5faff', label: 'Light blue' },
      { color: '#fffce8', label: 'Light yellow' },
      { color: '#fdf8f6', label: 'Light beige' },
    ];

    bgColors.forEach(({ color, label }) => {
      const $btn = document.createElement('button');
      $btn.classList.add('color-picker__button');
      setLabel($btn, label);
      setPressed($btn, false);
      $btn.style.backgroundColor = color;
      $btn.dataset.bgColor = color;
      $btn.addEventListener('click', () => {
        // active button updated by drawer
        this.drawer.setBgColor(color);
        this.drawer.focus();
      });
      $bgColorButtons.push($btn);
    });
    this.$bgColorBtnContainer.append(...$bgColorButtons);
    this.$bgColorContainer.append(this.$bgColorBtnContainer);
    this.updateBgColor(this.drawer.background.fill() as ColorLike);

    this.$dropdownList.append(
      ...[
        // this.$openButton,
        // this.$exportButton,
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
    this.drawer.$drawerContainer.append(this.$dropdownContainer);

    this.initEvents();
  }

  /**
   * Set active background color button
   * @param {ColorLike} color
   */
  updateBgColor(color: ColorLike) {
    this.$bgColorBtnContainer
      .querySelectorAll<HTMLElement>('.color-picker__button')
      .forEach(($btn) => setPressed($btn, $btn.dataset.bgColor === color));
  }

  getSeparator() {
    const $separator = document.createElement('hr');

    return $separator;
  }

  private initEvents() {
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

    if (zen) {
      if (this.drawer.zoom) this.drawer.zoom.$zoomContainer.style.display = 'none';
      this.drawer.help.$helpContainer.style.display = 'none';
      this.drawer.undoRedo.$undoRedoContainer.style.display = 'none';
    } else {
      if (this.drawer.zoom) this.drawer.zoom.$zoomContainer.style.display = '';
      this.drawer.help.$helpContainer.style.display = '';
      this.drawer.undoRedo.$undoRedoContainer.style.display = '';
    }
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
