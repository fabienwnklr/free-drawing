import { Drawer } from '@/Drawer';
import { stringToNode } from '@/utils/functions';
import { BaseWidget } from '../BaseWidget';
import BrushIcon from '@/icons/brush.svg?raw';
import { Line } from 'konva/lib/shapes/Line';
export class BrushWidget extends BaseWidget {
  #lastLine: Line = new Line();
  isPaint: any;
  constructor(protected drawer: Drawer) {
    const $BrushIcon = stringToNode<SVGElement>(BrushIcon);
    super(drawer, 'brush', 'Brush', $BrushIcon);
  }

  protected onActive(): void {
    this.initEvents();
    this.updateCursor();
  }

  protected onDesactive(): void {
    this.removeEvents();
  }

  protected initEvents(): void {
    this.drawer.stage.on('mousedown touchstart', (e) => {
      if (e.target !== this.drawer.stage) {
        return;
      }
      e.evt.preventDefault();

      this.isPaint = true;
      this._draw();
    });

    // and core function - drawing
    this.drawer.stage.on('mousemove touchmove', (e) => {
      // prevent scrolling on touch devices
      e.evt.preventDefault();

      if (!this.isPaint) return;

      const realPos = this.drawer._getRelativePointerPos();
      const newPoints = this.#lastLine?.points().concat([realPos.x, realPos.y]) ?? [0, 0];
      this.#lastLine?.points(newPoints);
    });

    this.drawer.stage.on('mouseup touchend', (e) => {
      this.isPaint = false;

      e.evt.preventDefault();
    });
  }

  protected removeEvents(): void {
    this.drawer.stage.off('mousedown touchstart');
    this.drawer.stage.off('mousemove touchmove');
    this.drawer.stage.off('mouseup touchend');
  }

  private _draw() {
    const realPos = this.drawer._getRelativePointerPos();
    this.#lastLine = new Line({
      stroke: '#df4b26',
      strokeWidth: 5,
      hitStrokeWidth: 20,
      globalCompositeOperation: 'source-over',
      // round cap for smoother lines
      lineCap: 'round',
      lineJoin: 'round',
      // add point twice, so we have some drawings even on a simple click
      points: [realPos.x, realPos.y, realPos.x, realPos.y],
      // draggable: true,
      name: 'line',
    });
    this.drawer.layer.add(this.#lastLine);
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

    ctx.fillStyle = '#df4b26';
    ctx.fill();

    cursorCanvas.toBlob((blob) => {
      if (blob) {
        const cursorURL = URL.createObjectURL(blob);
        this.drawer.$container.style.cursor = `url(${cursorURL}) ${rad / 2} ${rad / 2}, auto`;
      }
    });
  }
}
