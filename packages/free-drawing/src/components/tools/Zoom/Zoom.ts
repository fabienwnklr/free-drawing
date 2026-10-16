import '@/components/tools/Zoom/zoom.scss';
import { Drawer } from '@/Drawer';
import MinusIcon from '@/icons/minus.svg?raw';
import PlusIcon from '@/icons/plus.svg?raw';
import ZoomReset from '@/icons/zoom-reset.svg?raw';
import { createButton, setLabel } from '@/utils/dom';

/**
 * Zoom buttons of footer (`zoomWidget` option, hidden in zen mode): zoom out, zoom level resetting to 100%, zoom in
 */
export class Zoom {
  /** Drawer whose stage is zoomed */
  drawer: Drawer;
  /** Footer group of zoom buttons */
  $zoomContainer: HTMLDivElement;
  /** Zoom out button */
  $btnMinus: HTMLButtonElement;
  /** Button showing zoom level, resets zoom and view position */
  $btnReset: HTMLButtonElement;
  /** Zoom in button */
  $btnPlus: HTMLButtonElement;

  constructor(drawer: Drawer) {
    this.drawer = drawer;

    this.$zoomContainer = document.createElement('div');
    this.$zoomContainer.classList.add('drawer-zoom-container', 'tool');
    this.$zoomContainer.setAttribute('role', 'group');

    this.$btnMinus = createButton('drawer-button', 'drawer-button-neutral');
    this.$btnReset = createButton('drawer-button', 'drawer-button-neutral', 'reset-zoom');
    this.$btnPlus = createButton('drawer-button', 'drawer-button-neutral');

    this.$btnMinus.innerHTML = MinusIcon;
    this.$btnPlus.innerHTML = PlusIcon;
    this.drawer.i18n.translate((t) => {
      this.$zoomContainer.setAttribute('aria-label', t('zoom.label'));
      setLabel(this.$btnMinus, t('zoom.out'));
      setLabel(this.$btnPlus, t('zoom.in'));
      this._updateResetButton();
    });

    this.$zoomContainer.append(...[this.$btnMinus, this.$btnReset, this.$btnPlus]);

    this.drawer.layout.add('footerStart', this.$zoomContainer, { hideInZen: true });

    this.$btnMinus.addEventListener('click', () => {
      this.zoomMinus();
    });
    this.$btnReset.addEventListener('click', () => {
      this.resetZoom();
    });
    this.$btnPlus.addEventListener('click', () => {
      this.zoomPlus();
    });
  }

  /**
   * Zoom out by `scaling` option factor
   */
  zoomMinus() {
    this.drawer.setZoomLevel(this.drawer.getZoomLevel() / this.drawer.options.scaling);
  }

  /**
   * Back to 100% and to initial view position
   */
  resetZoom() {
    this.drawer.stage.scale({ x: 1, y: 1 });
    this.drawer.stage.position({ x: 0, y: 0 });
    this.update();
  }

  /**
   * Zoom in by `scaling` option factor
   */
  zoomPlus() {
    this.drawer.setZoomLevel(this.drawer.getZoomLevel() * this.drawer.options.scaling);
  }

  /**
   * Show zoom level and update view (background, position), called after each zoom
   */
  update() {
    this._updateResetButton();
    this.drawer._update();
  }

  /**
   * Reset button shows zoom level
   */
  private _updateResetButton() {
    const percentage = this._formatPercentage();

    this.$btnReset.innerHTML = ZoomReset + percentage;
    setLabel(this.$btnReset, this.drawer.t('zoom.reset', { percentage }));
  }

  /**
   * Zoom level as a whole percentage in drawer language (e.g. 110%)
   */
  private _formatPercentage() {
    return Number(this.drawer.getZoomLevel()).toLocaleString(this.drawer.language, {
      style: 'percent',
      maximumFractionDigits: 0,
    });
  }
}
