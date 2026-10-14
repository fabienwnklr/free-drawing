import '@/components/tools/Zoom/zoom.scss';
import { Drawer } from '@/Drawer';
import MinusIcon from '@/icons/minus.svg?raw';
import PlusIcon from '@/icons/plus.svg?raw';
import ZoomReset from '@/icons/zoom-reset.svg?raw';
import { createButton, setLabel } from '@/utils/dom';

export class Zoom {
  drawer: Drawer;
  $zoomContainer: HTMLDivElement;
  $btnMinus: HTMLButtonElement;
  $btnReset: HTMLButtonElement;
  $btnPlus: HTMLButtonElement;

  constructor(drawer: Drawer) {
    this.drawer = drawer;

    this.$zoomContainer = document.createElement('div');
    this.$zoomContainer.classList.add('drawer-zoom-container', 'tool');
    this.$zoomContainer.setAttribute('role', 'group');
    this.$zoomContainer.setAttribute('aria-label', 'Zoom');

    this.$btnMinus = createButton('drawer-button', 'drawer-button-neutral');
    this.$btnReset = createButton('drawer-button', 'drawer-button-neutral', 'reset-zoom');
    this.$btnPlus = createButton('drawer-button', 'drawer-button-neutral');

    this.$btnMinus.innerHTML = MinusIcon;
    setLabel(this.$btnMinus, 'Zoom out');

    this._updateResetButton();

    this.$btnPlus.innerHTML = PlusIcon;
    setLabel(this.$btnPlus, 'Zoom in');

    this.$zoomContainer.append(...[this.$btnMinus, this.$btnReset, this.$btnPlus]);

    this.drawer.$footerLeftElement.append(this.$zoomContainer);

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

  zoomMinus() {
    this.drawer.setZoomLevel(this.drawer.getZoomLevel() / this.drawer.options.scaling);
  }

  resetZoom() {
    this.drawer.stage.scale({ x: 1, y: 1 });
    this.drawer.stage.position({ x: 0, y: 0 });
    this.update();
  }

  zoomPlus() {
    this.drawer.setZoomLevel(this.drawer.getZoomLevel() * this.drawer.options.scaling);
  }

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
    setLabel(this.$btnReset, `Reset zoom (${percentage})`);
  }

  private _formatPercentage() {
    return Number(this.drawer.getZoomLevel()).toLocaleString(undefined, { style: 'percent', maximumFractionDigits: 0 });
  }
}
