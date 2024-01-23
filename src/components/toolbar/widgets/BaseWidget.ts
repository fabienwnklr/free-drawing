import { AvailableTools } from '@/@types/toolbar';
import { Drawer } from '@/Drawer';

export abstract class BaseWidget {
  protected readonly $container: HTMLElement;
  private $icon: Element | undefined;
  private disabled: boolean = false;
  $button: HTMLElement;
  id: AvailableTools;

  constructor(
    protected drawer: Drawer,
    id: AvailableTools,
    title: string | undefined,
    $icon: Element | undefined
  ) {
    this.id = id;
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
    this.$button.title = title ?? '';
    this.$icon = $icon;

    this._initEvents();
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

  protected abstract onActive(): void;
  protected abstract onDesactive(): void;

  private _initEvents() {
    this.$button.addEventListener('pointerup', () => {
      this.setActive(true);
    });
  }

  setActive(active: boolean) {
    if (active) {
      if (this.drawer.toolbar.activeWidget) {
        this.drawer.toolbar.activeWidget.setActive(false);
      }
      this.drawer.toolbar.setActiveWidget(this);
      this.$button.classList.add('active');
      this.updateCursor();
      this.onActive();
    } else {
      this.onDesactive();
      this.$button.classList.remove('active');
    }
  }

  updateCursor() {
    const rad = 5;
    const cursorCanvas = document.createElement('canvas');
    const ctx = cursorCanvas.getContext('2d') as CanvasRenderingContext2D;
    cursorCanvas.width = cursorCanvas.height = rad;

    ctx.lineCap = 'round';
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, this.drawer.stage.width(), this.drawer.stage.height());

    if (ctx.lineCap === 'round') {
      ctx.arc(rad / 2, rad / 2, (rad / 2) * 0.9, 0, Math.PI * 2, false);
    } else {
      ctx.rect(0, 0, rad, rad);
    }

    if (this.drawer.activeTool === 'brush') {
      ctx.fillStyle = '#df4b26';
      ctx.fill();
    } else if (this.drawer.activeTool === 'eraser') {
      this.drawer.$container.style.cursor = 'crosshair';
      return;
    } else if (this.drawer.activeTool === 'pan') {
      this.drawer.$container.style.cursor = 'grab';
      return;
    } else if (this.drawer.activeTool === 'selection') {
      this.drawer.$container.style.cursor = 'default';
      return;
    } else {
      // Text
      this.drawer.$container.style.cursor = `text`;
      return;
    }

    cursorCanvas.toBlob((blob) => {
      if (blob) {
        const cursorURL = URL.createObjectURL(blob);
        this.drawer.$container.style.cursor = `url(${cursorURL}) ${rad / 2} ${rad / 2}, auto`;
      }
    });
  }
}
