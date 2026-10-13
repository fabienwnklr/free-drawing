import MicroEvent from '@/utils/MicroEvent';
import { uniqueId } from '@/utils/dom';
import './dropdown.scss';

export class Dropdown extends MicroEvent {
  $dropdownContainer: HTMLDivElement;
  $button: HTMLButtonElement;
  $menu: HTMLDivElement;
  $dropdownList: HTMLUListElement;
  $dropdownItem: HTMLLIElement;

  constructor() {
    super();

    this.$button = document.createElement('button');
    this.$button.classList.add('drawer-button', 'drawer-button-neutral', 'tool', 'drawer-button-dropdown');
    this.$menu = document.createElement('div');
    this.$menu.classList.add('drawer-dropdown');
    this.$menu.id = uniqueId('dropdown');
    // disclosure: button shows / hides menu content
    this.$button.setAttribute('aria-expanded', 'false');
    this.$button.setAttribute('aria-controls', this.$menu.id);

    this.$dropdownContainer = document.createElement('div');
    this.$dropdownContainer.classList.add('drawer-dropdown-container');

    this.$dropdownContainer.append(...[this.$button, this.$menu]);
    this.$dropdownList = document.createElement('ul');
    this.$dropdownList.classList.add('drawer-dropdown-list');
    this.$dropdownItem = document.createElement('li');
    this.$dropdownItem.classList.add('drawer-dropdown-list-item');

    this.setContent(this.$dropdownList);
    this._initEvents();
  }

  setContent(content: string | Node) {
    if (typeof content === 'string') {
      this.$menu.innerHTML = content;
    } else {
      this.$menu.append(content);
    }
  }

  show() {
    this._setShown(true);
  }

  hide() {
    this._setShown(false);

    this.trigger('fd.dropdown.hide');
  }

  isShown() {
    return this.$menu.classList.contains('show');
  }

  private _setShown(shown: boolean) {
    this.$menu.classList.toggle('show', shown);
    this.$button.setAttribute('aria-expanded', String(shown));
  }

  private _initEvents() {
    this.$button.addEventListener('click', () => {
      // no hide event, focus stays on button
      this._setShown(!this.isShown());
    });

    // Escape closes menu, focus goes back to its button
    this.$dropdownContainer.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !this.isShown()) return;

      event.stopPropagation();
      this.hide();
      this.$button.focus();
    });

    document.addEventListener(
      'click',
      (event) => {
        if (event.target) {
          const openBtnClicked = this.$button.contains(event.target as Node);

          if (!openBtnClicked && this.isShown()) {
            this.hide();
          }
        }
      },
      false
    );
  }
}
