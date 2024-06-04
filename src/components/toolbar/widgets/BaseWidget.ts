import type { AvailableTools } from '@/@types/toolbar';
import { Drawer } from '@/Drawer';
import { stringToNode } from '@/utils/functions';

export abstract class BaseWidget {
  protected readonly $container: HTMLElement;
  private $icon: SVGElement;
  private disabled: boolean = false;
  $button: HTMLButtonElement;
  id: AvailableTools;
  shortcut: string | undefined;

  constructor(
    protected drawer: Drawer,
    id: AvailableTools,
    title: string,
    $icon: SVGElement | string,
    shortcut?: string
  ) {
    this.id = id;
    this.$container = document.createElement('div');
    this.$container.classList.add(
      `drawer-tool-container`,
      `drawer-tool-button-container`,
      `drawer-internal-widgetId--${id.replace(/\W/g, '-')}`
    );
    this.$button = document.createElement('button');
    this.$button.classList.add(`drawer-button`);
    this.$button.setAttribute('role', 'button');
    this.$button.tabIndex = 0;
    this.$button.title = title ?? id;
    this.$icon = typeof $icon === 'string' ? stringToNode<SVGElement>($icon) : $icon;
    this.shortcut = shortcut;

    this._initEvents();
  }

  /**
   * Adds this to `parent`.
   * Returns the element that was just added to `parent`.
   * @internal
   */
  addTo(parent: HTMLElement) {
    this.$container.appendChild(this.$button);

    this.$button.append(this.$icon);
    if (this.shortcut) {
      const $shortcut = document.createElement('div');
      $shortcut.classList.add('tool-key-shortcut');
      $shortcut.innerText = this.shortcut;
      this.$button.append($shortcut);
    }
    parent.appendChild(this.$container);
  }

  toggleDisable() {
    this.disabled = !this.disabled;
    this.$button.classList.add('disabled');
  }

  protected abstract onActive(): void;
  protected abstract onDesactive(): void;
  protected abstract initEvents(): void;
  protected abstract removeEvents(): void;
  public abstract _socketDraw?(data: string): void;
  public abstract updateCursor(): void;

  private _initEvents() {
    this.$button.addEventListener('click', () => {
      this.setActive(true);
    });
  }

  setActive(active: boolean) {
    if (active) {
      if (this.drawer.activeWidget) {
        this.drawer.activeWidget.setActive(false);
      }
      this.drawer.toolbar.setActiveWidget(this);
      this.$button.classList.add('active');
      this.onActive();
      this.drawer.focus();
    } else {
      this.onDesactive();
      this.$button.classList.remove('active');
    }
  }
}
