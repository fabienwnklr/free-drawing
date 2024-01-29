export class Dropdown {
  $dropdownContainer: HTMLDivElement;
  $button: HTMLDivElement;
  $menu: HTMLDivElement;

  constructor() {
    this.$button = document.createElement('div');
    this.$button.role = 'button';
    this.$button.classList.add('drawer-button', 'tool');
    this.$menu = document.createElement('div');
    this.$menu.classList.add('drawer-dropdown');

    this.$dropdownContainer = document.createElement('div');
    this.$dropdownContainer.classList.add('drawer-dropdown-container');

    this.$dropdownContainer.append(...[this.$button, this.$menu]);

    this._initEvents();
  }

  setContent(content: string | Node) {
    if (typeof content === 'string') {
      this.$menu.innerHTML = content;
    } else {
      this.$menu.append(content);
    }
  }

  private _initEvents() {
    this.$button.addEventListener('click', () => {
      this.$menu.classList.toggle('show');
    });
  }
}
