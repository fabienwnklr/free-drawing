import { Drawer } from '../../../Drawer';

export abstract class BaseWidget {
  protected readonly $container: HTMLElement;
  private $icon: Element | null;
  private disabled: boolean = false;
//   #hasDropdown: boolean;
  $button: HTMLElement;

  constructor(
    protected drawer: Drawer,
    protected id: string,
    title: string | null,
    $icon: Element | null
  ) {
    this.$container = document.createElement('div');
    this.$container.classList.add(
      `drawer-tool-container`,
      `drawer-tool-button-container`,
      `drawer-internal-widgetId--${id.replace(/\W/g, '-')}`
    );
    this.$button = document.createElement('div');
    this.$button.classList.add(`button`);
    this.$button.setAttribute('role', 'button');
    this.$button.tabIndex = 0;
    this.$button.title = title ?? "";
    this.$icon = $icon;
  }

  /**
   * Adds this to `parent`.
   * Returns the element that was just added to `parent`.
   * @internal
   */
  addTo(parent: HTMLElement) {
    this.$container.appendChild(this.$button);

    if (this.$icon) {
      this.$button.append(this.$icon);
    }
    parent.appendChild(this.$container);
  }

  toggleDisable() {
    this.disabled = !this.disabled;
    this.$button.classList.add('disabled');
  }
}
