import './help.scss';
import { Drawer } from '@/Drawer';
import { Modal } from '@/components/modal/Modal';
import HelpIcon from '@/icons/help.svg?raw';

export class Help extends Modal {
  $button: HTMLDivElement;
  $helpContainer: HTMLDivElement;
  constructor(drawer: Drawer) {
    super(drawer, { title: 'Help' });

    this.setBodyContent('Helping me!!!!');

    this.$helpContainer = document.createElement('div');
    this.$helpContainer.classList.add('drawer-help-container', 'tool');
    this.$button = document.createElement('div');
    this.$button.classList.add('button');
    this.$button.innerHTML = HelpIcon;

    this.$helpContainer.append(this.$button);

    this.drawer.$drawerContainer.append(this.$helpContainer);

    this.$button.addEventListener('click', () => {
      this.show();
    });
  }
}
