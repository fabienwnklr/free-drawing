import { stringToNode } from '@/utils/functions';
import { BaseWidget } from '../BaseWidget';
import LineIcon from '@/icons/line2.svg?raw';
import { Drawer } from '@/Drawer';
import { shapeName } from '@/constants';
import { Line } from 'konva/lib/shapes/Line';
import { SelectWidget } from '../Select/Select';

export class LineWidget extends BaseWidget {
  isPaint: boolean = false;
  #lastLine: Line = new Line();
  constructor(drawer: Drawer) {
    const $LineIcon = stringToNode<SVGElement>(LineIcon);
    super(drawer, 'line', 'Line', $LineIcon, 'l');
  }

  protected onActive(): void {
    this.initEvents();
    this.updateCursor();
    // this.overlay.show();
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

      this._updateLine();
      this.isPaint = false;
      this.drawer.UIPointerEvents('all');

      this.drawer.stage.fire('change');

      const selectWidget = this.drawer.getWidget<SelectWidget>('selection');
      selectWidget?.transformer.nodes([]);

      e.evt.preventDefault();
    });
  }

  private _updateLine() {
    const { x, y } = this.drawer._getRelativePointerPos();
    // Get 4 last points (start position)
    const newPoints = this.#lastLine.points().slice(0, 4);
    newPoints.push(x, y);
    this.#lastLine?.points(newPoints);
  }

  protected removeEvents(): void {
    this.drawer.stage.off('mousedown touchstart');
    this.drawer.stage.off('mousemove touchmove');
    this.drawer.stage.off('mouseup touchend');
  }

  public updateCursor(): void {
    this.drawer.$stageContainer.style.cursor = `url("data:image/svg+xml,<svg height='32' width='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg' style='color: black;'><defs><filter id='shadow' y='-40%' x='-40%' width='180px' height='180%' color-interpolation-filters='sRGB'><feDropShadow dx='1' dy='1' stdDeviation='1.2' flood-opacity='.5'/></filter></defs><g fill='none' transform='rotate(0 16 16)' filter='url(%23shadow)'><path d='m25 16h-6.01v-6h-2.98v6h-6.01v3h6.01v6h2.98v-6h6.01z' fill='white'/><path d='m23.9902 17.0103h-6v-6.01h-.98v6.01h-6v.98h6v6.01h.98v-6.01h6z' fill='%23231f1f'/></g></svg>") 16 16, crosshair`;
  }
}
