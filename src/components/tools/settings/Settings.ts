import { Dropdown } from '@/components/dropdown/Dropdown';
import './settings.scss';
import { Drawer } from '@/Drawer';
import SettingIcon from '@/icons/setting.svg?raw';
import OpenIcon from '@/icons/open.svg?raw';
import ExportIcon from '@/icons/export.svg?raw';
import TrashIcon from '@/icons/trash.svg?raw';
import GridIcon from '@/icons/grid.svg?raw';
import GithubIcon from '@/icons/github.svg?raw';
import { ConfirmModal } from '@/components/modal/ConfirmModal';

export class Settings extends Dropdown {
  drawer: Drawer;
  $exportButton: HTMLDivElement;
  $openButton: HTMLDivElement;
  $clearCanvasButton: HTMLDivElement;
  $showGridButton: HTMLDivElement;
  $githubButton: HTMLDivElement;
  $clearConfirmModal: ConfirmModal | null = null;

  constructor(drawer: Drawer) {
    super();

    this.drawer = drawer;
    this.$dropdownContainer.classList.add('drawer-dropdown-setting');
    this.$button.innerHTML = SettingIcon;

    this.$openButton = document.createElement('div');
    this.$openButton.classList.add('drawer-button', 'drawer-dropdown-list-item');
    this.$openButton.innerHTML = OpenIcon + 'Open';
    this.$openButton.role = 'button';

    this.$exportButton = document.createElement('div');
    this.$exportButton.classList.add('drawer-button', 'drawer-dropdown-list-item');
    this.$exportButton.innerHTML = ExportIcon + 'Export to...';
    this.$exportButton.role = 'button';

    this.$clearCanvasButton = document.createElement('div');
    this.$clearCanvasButton.classList.add('drawer-button', 'drawer-dropdown-list-item');
    this.$clearCanvasButton.innerHTML = TrashIcon + 'Clear canvas';
    this.$clearCanvasButton.role = 'button';

    this.$showGridButton = document.createElement('div');
    this.$showGridButton.classList.add('drawer-button', 'drawer-dropdown-list-item');
    this.$showGridButton.innerHTML = GridIcon + 'Show grid';
    this.$showGridButton.role = 'button';

    this.$githubButton = document.createElement('div');
    this.$githubButton.classList.add('drawer-button', 'drawer-dropdown-list-item');
    this.$githubButton.innerHTML = GithubIcon + 'Github';
    this.$githubButton.role = 'button';

    this.$dropdownList.append(
      ...[this.$openButton, this.$exportButton, this.$clearCanvasButton, this.$showGridButton, this.$githubButton]
    );
    this.drawer.$drawerContainer.append(this.$dropdownContainer);

    this.initEvents();
  }

  private initEvents() {
    this.$clearCanvasButton.addEventListener('click', () => {
      if (!this.$clearConfirmModal) {
        this.$clearConfirmModal = new ConfirmModal(this.drawer, { message: 'Are you sure to remove all canvas draw ?' });
      }
      this.$clearConfirmModal.show()
    });
    this.$githubButton.addEventListener('click', () => {
      window.open('https://github.com/fabienwnklr/free-drawing', 'blank');
    });
  }
}
