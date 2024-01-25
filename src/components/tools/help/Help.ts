import './help.scss';
import { Drawer } from '@/Drawer';
import { Modal } from '@/components/modal/Modal';
import HelpIcon from '@/icons/help.svg?raw';

export class Help extends Modal {
  $button: HTMLDivElement;
  $helpContainer: HTMLDivElement;
  constructor(drawer: Drawer) {
    super(drawer, { title: 'Help' });

    const data = /*html*/`
      <div>
        <ul>
          <li>
          Hand (panning tool) <kbd>H</kbd>
          </li>
          <li>
          Hand (panning tool) <kbd>H</kbd>
          </li>
          <li>
          Hand (panning tool) <kbd>H</kbd>
          </li>
          <li>
          Hand (panning tool) <kbd>H</kbd>
          </li>
          <li>
          Hand (panning tool) <kbd>H</kbd>
          </li>
        </ul>
        <ul>
        <li>
        Hand (panning tool) <kbd>H</kbd>
        </li>
        <li>
        Hand (panning tool) <kbd>H</kbd>
        </li>
        <li>
        Hand (panning tool) <kbd>H</kbd>
        </li>
        <li>
        Hand (panning tool) <kbd>H</kbd>
        </li>
        <li>
        Hand (panning tool) <kbd>H</kbd>
        </li>
      </ul>
      </div>
    `

    this.setBodyContent(data);

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
