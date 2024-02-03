import './zoom.scss';
import { Drawer } from '@/Drawer';
import MinusIcon from '@/icons/minus.svg?raw';
import PlusIcon from '@/icons/plus.svg?raw';
import ZoomReset from '@/icons/zoom-reset.svg?raw';

export class Zoom {
  drawer: Drawer;
  zoomLevel: number;
  $zoomContainer: HTMLDivElement;
  $btnMinus: HTMLDivElement;
  $btnReset: HTMLDivElement;
  $btnPlus: HTMLDivElement;

  constructor(drawer: Drawer) {
    this.drawer = drawer;
    this.zoomLevel = drawer.stage.scaleX();

    this.$zoomContainer = document.createElement('div');
    this.$zoomContainer.classList.add('drawer-zoom-container', 'tool');

    this.$btnMinus = document.createElement('div');
    this.$btnReset = document.createElement('div');
    this.$btnPlus = document.createElement('div');

    this.$btnMinus.role = 'button';
    this.$btnMinus.classList.add('drawer-button', 'drawer-button-neutral');
    this.$btnMinus.tabIndex = 0;
    this.$btnMinus.innerHTML = MinusIcon;

    this.$btnReset.role = 'button';
    this.$btnReset.classList.add('drawer-button', 'drawer-button-neutral', 'reset-zoom');
    this.$btnReset.tabIndex = 0;
    this.$btnReset.title = 'Reset zoom';
    this.$btnReset.innerHTML = ZoomReset + this._formatPercentage();

    this.$btnPlus.role = 'button';
    this.$btnPlus.classList.add('drawer-button', 'drawer-button-neutral');
    this.$btnPlus.tabIndex = 0;
    this.$btnPlus.innerHTML = PlusIcon;

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
    const oldScale = this.drawer.stage.scaleX();

    const center = {
      x: this.drawer.stage.width() / 2,
      y: this.drawer.stage.height() / 2,
    };

    const relatedTo = {
      x: (center.x - this.drawer.stage.x()) / oldScale,
      y: (center.y - this.drawer.stage.y()) / oldScale,
    };

    const newScale = this.zoomLevel / this.drawer.options.scaling;

    this.drawer.stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: center.x - relatedTo.x * newScale,
      y: center.y - relatedTo.y * newScale,
    };
    this.drawer.stage.position({
      x: newPos.x,
      y: newPos.y,
    });
    this.update();
  }

  resetZoom() {
    this.drawer.stage.scale({ x: 1, y: 1 });
    this.drawer.stage.position({ x: 0, y: 0 });

    if (this.drawer.activeTool === 'brush') {
      this.drawer.toolbar.activeWidget.updateCursor();
    }

    this.update();
  }

  zoomPlus() {
    const oldScale = this.drawer.stage.scaleX();

    const center = {
      x: this.drawer.stage.width() / 2,
      y: this.drawer.stage.height() / 2,
    };

    const relatedTo = {
      x: (center.x - this.drawer.stage.x()) / oldScale,
      y: (center.y - this.drawer.stage.y()) / oldScale,
    };

    const newScale = this.zoomLevel * this.drawer.options.scaling;

    this.drawer.stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: center.x - relatedTo.x * newScale,
      y: center.y - relatedTo.y * newScale,
    };
    this.drawer.stage.position({
      x: newPos.x,
      y: newPos.y,
    });
    this.update();
  }

  update() {
    this.zoomLevel = this.drawer.stage.scaleX();
    this.$btnReset.innerHTML = ZoomReset + this._formatPercentage();
  }

  private _formatPercentage() {
    return Number(this.zoomLevel).toLocaleString(undefined, { style: 'percent', maximumFractionDigits: 0 });
  }
}
