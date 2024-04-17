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

    this.$openButton = document.createElement('button');
    this.$openButton.classList.add('drawer-button', 'drawer-button-neutral', 'drawer-dropdown-list-item');
    this.$openButton.innerHTML = OpenIcon + 'Open';
    this.$openButton.role = 'button';

    this.$exportButton = document.createElement('button');
    this.$exportButton.classList.add('drawer-button', 'drawer-button-neutral', 'drawer-dropdown-list-item');
    this.$exportButton.innerHTML = ExportIcon + 'Export to...';
    this.$exportButton.role = 'button';

    this.$clearCanvasButton = document.createElement('button');
    this.$clearCanvasButton.classList.add('drawer-button', 'drawer-button-neutral', 'drawer-dropdown-list-item');
    this.$clearCanvasButton.innerHTML = TrashIcon + 'Clear canvas';
    this.$clearCanvasButton.role = 'button';

    this.$toggleGridButton = document.createElement('button');
    this.$toggleGridButton.classList.add('drawer-button', 'drawer-button-neutral', 'drawer-dropdown-list-item');
    this.$toggleGridButton.innerHTML = GridIcon + 'Show grid';
    this.$toggleGridButton.role = 'button';

    this.$zenModeButton = document.createElement('button');
    this.$zenModeButton.classList.add('drawer-button', 'drawer-button-neutral', 'drawer-dropdown-list-item');
    this.$zenModeButton.innerHTML = ZenIcon + 'Zen mode <span class="text-muted">Altr+Z</span>';
    this.$zenModeButton.role = 'button';

    this.$githubButton = document.createElement('button');
    this.$githubButton.classList.add('drawer-button', 'drawer-button-neutral', 'drawer-dropdown-list-item');
    this.$githubButton.innerHTML = GithubIcon + 'Github';
    this.$githubButton.role = 'button';

    this.$clearStorageButton = document.createElement('button');
    this.$clearStorageButton.classList.add('drawer-button', 'drawer-button-neutral', 'drawer-dropdown-list-item');
    this.$clearStorageButton.innerHTML = StoreIcon + 'Clear stored data';
    this.$clearStorageButton.role = 'button';

    this.$bgColorContainer = document.createElement('div');
    this.$bgColorContainer.classList.add('color-picker-container');
    const $bgColorTitle = document.createElement('h6');
    $bgColorTitle.classList.add('title');
    $bgColorTitle.innerText = 'Background color';
    this.$bgColorContainer.append($bgColorTitle);

    this.$bgColorBtnContainer = document.createElement('div');
    this.$bgColorBtnContainer.classList.add('color-picker-btn-container');
    const $strokeColorButtons: HTMLButtonElement[] = [];

    const strokeColors = ['#fff', '#f8f9fa', '#f5faff', '#fffce8', '#fdf8f6'] as ColorLike[];

    strokeColors.forEach((color) => {
      const $btn = document.createElement('button');
      $btn.classList.add('color-picker__button');
      $btn.style.backgroundColor = color;
      $btn.addEventListener('click', () => {
        this.$bgColorBtnContainer.querySelector('.color-picker__button.active')?.classList.remove('active');
        $btn.classList.add('active');
        this.drawer.setBgColor(color);
        this.drawer.focus();
      });

      if (this.drawer.options.strokeColor === color) {
        $btn.classList.add('active');
      }
      $strokeColorButtons.push($btn);
    });
    this.$bgColorBtnContainer.append(...$strokeColorButtons);
    this.$bgColorContainer.append(this.$bgColorBtnContainer);

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

    // focus drawer on hide dropdown (no on toggle by click again on it)
    this.on('fd.dropdown.hide', () => {
      this.drawer.focus();
    });
  }

  toggleZenMode() {
    this.$zenModeButton.classList.toggle('active');

    if (this.$zenModeButton.classList.contains('active')) {
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
