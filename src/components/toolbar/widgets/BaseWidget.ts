import { AvailableTools } from '../../../@types/toolbar';
import { Drawer } from '../../../Drawer';

export abstract class BaseWidget {
  protected readonly $container: HTMLElement;
  private $icon: Element | null;
  private disabled: boolean = false;
  //   #hasDropdown: boolean;
  $button: HTMLElement;
  toolName: AvailableTools;

  constructor(
    protected drawer: Drawer,
    protected id: string,
    title: string | null,
    $icon: Element | null,
    toolName: AvailableTools
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
    this.$button.title = title ?? '';
    this.$icon = $icon;
    this.toolName = toolName;

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
    } else {
      this.$button.classList.remove('active');
    }
  }

  updateCursor() {
    const lineWidth = this.drawer.context.lineWidth;
    const rad = this.drawer.activeTool === 'brush' ? lineWidth : 30;
    const cursorCanvas = document.createElement('canvas');
    const ctx = cursorCanvas.getContext('2d') as CanvasRenderingContext2D;
    cursorCanvas.width = cursorCanvas.height = rad;

    ctx.lineCap = this.drawer.context.lineCap;
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, this.drawer.$canvas.width, this.drawer.$canvas.height);

    if (ctx.lineCap === 'round') {
      ctx.arc(rad / 2, rad / 2, (rad / 2) * 0.9, 0, Math.PI * 2, false);
    } else {
      ctx.rect(0, 0, rad, rad);
    }

    if (this.drawer.activeTool === 'brush') {
      ctx.fillStyle = this.drawer.context.strokeStyle;
      ctx.fill();
    } else if (this.drawer.activeTool === 'eraser') {
      ctx.strokeStyle = this.drawer.context.strokeStyle;
      ctx.stroke();
    } else if (this.drawer.activeTool === 'selection') {
      this.drawer.stage.container().style.cursor = 'default';
      return;
    } else {
      // Text
      this.drawer.stage.container().style.cursor = `text`;
      return;
    }

    cursorCanvas.toBlob((blob) => {
      if (blob) {
        URL.revokeObjectURL(this.drawer.$canvas.style.cursor);
        const cursorURL = URL.createObjectURL(blob);
        this.drawer.stage.container().style.cursor = `url(${cursorURL}) ${rad / 2} ${rad / 2}, auto`;
      }
    });
  }
}
