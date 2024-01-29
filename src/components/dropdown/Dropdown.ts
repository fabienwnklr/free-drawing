import './dropdown.scss';

export class Dropdown {
  $dropdownContainer: HTMLDivElement;
  $button: HTMLDivElement;
  $menu: HTMLDivElement;
  $dropdownList: HTMLUListElement;
  $dropdownItem: HTMLLIElement;

  constructor() {
    this.$button = document.createElement('div');
    this.$button.role = 'button';
    this.$button.classList.add('drawer-button', 'tool', 'drawer-button-dropdown');
    this.$menu = document.createElement('div');
    this.$menu.classList.add('drawer-dropdown');

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

  fillList(items: { content: string }[]) {
    const liArr: Node[] = [];
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this;
    for (const item of items) {
      const li = _this.$dropdownItem.cloneNode(true);
      if (item.content) {
        li.textContent = item.content;
      }
      liArr.push(li);
    }

    this.$dropdownList.append(...liArr);
  }

  setContent(content: string | Node) {
    if (typeof content === 'string') {
      this.$menu.innerHTML = content;
    } else {
      this.$menu.append(content);
    }
  }

  show() {
    this.$menu.classList.add('show');
  }

  hide() {
    this.$menu.classList.remove('show');
  }

  private _initEvents() {
    this.$button.addEventListener('click', () => {
      this.$menu.classList.toggle('show');
    });

    document.addEventListener(
      'click',
      (event) => {
        if (event.target) {
          const outsideClick =
            !this.$button.contains(event.target as Node) && !this.$dropdownContainer.contains(event.target as Node);

          if (outsideClick) {
            this.hide();
          }
        }
      },
      false
    );
  }
}
