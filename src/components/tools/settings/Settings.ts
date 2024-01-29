import { Dropdown } from '@/components/dropdown/Dropdown';
import './settings.scss';
import { Drawer } from '@/Drawer';
import SettingIcon from '@/icons/setting.svg?raw';

export class Settings extends Dropdown {
  drawer: Drawer;

  constructor(drawer: Drawer) {
    super();

    this.drawer = drawer;
    this.$dropdownContainer.classList.add('drawer-dropdown-setting');
    this.$button.innerHTML = SettingIcon;
    this.setContent(`<ul><li>dededede</li></ul>`)
    this.drawer.$drawerContainer.append(this.$dropdownContainer);
  }
}
