import type { AvailableTools, WidgetOptions } from '@/@types/toolbar';
import { Drawer } from '@/Drawer';
import { stringToNode } from '@/utils/functions';
import { getWidgetOptions } from '@/utils/widgets';
import type { KonvaEventListener } from 'konva/lib/Node';
import type { Stage } from 'konva/lib/Stage';
import type { BaseOverlay } from '@/components/tools/Overlay/BaseOverlay';
import { disableElement, enableElement } from '@/utils/dom';

export abstract class BaseWidget {
  protected readonly $container: HTMLElement;
  private $icon: SVGElement;
  private disabled: boolean = false;
  $button: HTMLButtonElement;
  id: AvailableTools;
  shortcut: string | undefined;
  /** Options of the tool (color, width...), shown by the widget while active */
  declare overlay?: BaseOverlay;
  /** Widget options given with drawer `widgets` option */
  readonly options: WidgetOptions;

  constructor(
    protected drawer: Drawer,
    id: AvailableTools,
    title: string,
    $icon: SVGElement | string,
    shortcut?: string
  ) {
    this.id = id;
    this.options = getWidgetOptions(drawer.options.widgets, id);
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
    this.$button.title = this.options.title ?? title ?? id;
    this.$icon = typeof $icon === 'string' ? stringToNode<SVGElement>($icon) : $icon;
    // compared to lower case key (caps lock), false disables shortcut
    this.shortcut = this.options.shortcut === false ? undefined : (this.options.shortcut ?? shortcut)?.toLowerCase();

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

  /**
   * Disable / enable widget, a disabled widget can not be activated
   */
  toggleDisable() {
    this.disabled = !this.disabled;

    if (this.disabled) {
      disableElement(this.$button);
    } else {
      enableElement(this.$button);
    }
  }

  /**
   * Listen stage events while widget is active.
   * Events are namespaced with widget id, so they are removed on deactivation without removing other listeners.
   * @param events Space separated event names
   * @param handler
   */
  protected onStage(events: string, handler: KonvaEventListener<Stage, any>) {
    const namespaced = events
      .split(' ')
      .map((event) => `${event}.${this.id}`)
      .join(' ');

    this.drawer.stage.on(namespaced, handler);
  }

  /**
   * Add widget events (with `onStage`), called on activation
   */
  protected initEvents(): void {}

  /**
   * Remove widget events, called on deactivation
   */
  protected removeEvents(): void {
    this.drawer.stage.off(`.${this.id}`);
  }

  /**
   * Called on activation, after events and cursor setup
   */
  protected onActive(): void {}

  /**
   * Called on deactivation, after events removal
   */
  protected onDesactive(): void {}

  public updateCursor(): void {
    this.drawer.$stageContainer.style.cursor = 'default';
  }

  /**
   * Get the drawing data from the socket and basically
   * draw on our canvas whatever the other person draws
   *
   */
  public _socketDraw?(data: string): void;

  private _initEvents() {
    this.$button.addEventListener('click', () => {
      this.setActive(true);
    });
  }

  setActive(active: boolean) {
    if (active) {
      if (this.disabled) return;

      if (this.drawer.activeWidget) {
        this.drawer.activeWidget.setActive(false);
      }
      this.drawer.toolbar.setActiveWidget(this);
      this.$button.classList.add('active');
      this.initEvents();
      this.updateCursor();
      this.onActive();
      this.drawer.focus();
    } else {
      this.removeEvents();
      this.onDesactive();
      this.$button.classList.remove('active');
    }
  }
}
