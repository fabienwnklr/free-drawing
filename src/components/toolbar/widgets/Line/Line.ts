import { stringToNode } from '@/utils/functions';
import { BaseWidget } from '../BaseWidget';
import LineIcon from '@/icons/line.svg?raw';
import { Drawer } from '@/Drawer';
import { shapeName } from '@/constants';
import { Line } from 'konva/lib/shapes/Line';
import getStroke from 'perfect-freehand';
import { SelectWidget } from '../Select/Select';

export class LineWidget extends BaseWidget {
  isPaint: boolean = false;
  #lastLine: Line = new Line();
  #allPoints: {x: number, y: number}[] = [];
  #firstPoint: number[] = [];
  constructor(drawer: Drawer) {
    const $LineIcon = stringToNode<SVGElement>(LineIcon);
    super(drawer, 'pan', 'Pan', $LineIcon, 'h');
  }

  protected onActive(): void {
    this.initEvents();
  }
  protected onDesactive(): void {
    this.removeEvents();
  }
  protected initEvents(): void {
    this.drawer.stage.on('mousedown touchstart', (e) => {
      if (e.evt.button === 2) return;
      e.evt.preventDefault();

      this.isPaint = true;
      this.drawer.UIPointerEvents('none');

      const realPos = this.drawer._getRelativePointerPos();
      this.#lastLine = new Line({
        stroke: this.drawer.options.strokeColor,
        fill: this.drawer.options.strokeColor,
        opacity: this.drawer.options.opacity,
        tension: 0.3,
        strokeWidth: this.drawer.options.strokeWidth,
        hitStrokeWidth: 20,
        globalCompositeOperation: 'source-over',
        shadowForStrokeEnabled: false,
        // round cap for smoother lines
        lineCap: 'round',
        lineJoin: 'round',
        // add point twice, so we have some drawings even on a simple click
        points: [realPos.x, realPos.y, realPos.x, realPos.y],
        name: shapeName.line,
      });

      this.#lastLine.on('dragend', () => {
        this.drawer.stage.fire('change');
      });
      this.#firstPoint = [realPos.x, realPos.y, realPos.x, realPos.y]
      this.drawer.drawLayer.add(this.#lastLine);
    });

    // and core function - drawing
    this.drawer.stage.on('mousemove touchmove', (e) => {
      // prevent scrolling on touch devices
      e.evt.preventDefault();

      if (!this.isPaint) return;

      this._updateLine();
    });

    this.drawer.stage.on('mouseup touchend', (e) => {
      if (e.evt.button === 2) return;

      this._updateLine(true);
      this.isPaint = false;
      this.drawer.UIPointerEvents('all');

      this.drawer.stage.fire('change');

      const selectWidget = this.drawer.getWidget<SelectWidget>('selection');
      selectWidget?.transformer.nodes([]);

      e.evt.preventDefault();
    });
  }

  private _updateLine(last?: boolean) {
    const realPos = this.drawer._getRelativePointerPos();
    this.#allPoints.push(realPos);
    const points = getStroke(this.#allPoints, {
      size: this.drawer.options.strokeWidth,
      smoothing: 1,
      thinning: 0.6,
      easing: (t) => Math.sin((t * Math.PI) / 2),
      last,
    });

    if (!this.#lastLine.closed()) this.#lastLine.closed(true);
    const newPoints = points.flat();
    this.#lastLine?.points(newPoints);
  }
  protected removeEvents(): void {
    this.drawer.stage.off('mousedown touchstart');
    this.drawer.stage.off('mousemove touchmove');
    this.drawer.stage.off('mouseup touchend');
  }
  public updateCursor(): void {
    throw new Error('Method not implemented.');
  }
}
