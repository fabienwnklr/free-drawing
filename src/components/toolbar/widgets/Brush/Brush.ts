import { Drawer } from '@/Drawer';
import { stringToNode } from '@/utils/functions';
import { BaseWidget } from '../BaseWidget';
import BrushIcon from '@/icons/brush.svg?raw';
import { Line } from 'konva/lib/shapes/Line';
import { SelectWidget } from '../Select/Select';
import { BrushOverlay } from '@/components/tools/Overlay/BrushOverlay/BrushOverlay';
import { getStroke } from 'perfect-freehand';
import { shapeName } from '@/constants';
// import { socketEvents } from '../../../../../server/socket-events.js'
const socketEvents = {
  DRAW: 'DRAW',
  DRAW_BEGIN_PATH: 'DRAW_BEGIN_PATH',
};

export class BrushWidget extends BaseWidget {
  #lastLine: Line = new Line();
  isPaint: boolean = false;
  #allPoints: { x: number; y: number }[] = [];
  overlay: BrushOverlay;

  constructor(protected drawer: Drawer) {
    const $BrushIcon = stringToNode<SVGElement>(BrushIcon);
    super(drawer, 'brush', 'Brush', $BrushIcon, 'b');

    this.overlay = new BrushOverlay(drawer);
    this.drawer.socket.on(socketEvents.DRAW, this._socketDraw.bind(this));
  }

  protected onActive(): void {
    this.initEvents();
    this.updateCursor();
    this.overlay.show();
  }

  protected onDesactive(): void {
    this.removeEvents();
    this.overlay.hide();
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
      this.drawer.socket.emit(socketEvents.DRAW, this.#lastLine);
    });

    this.drawer.stage.on('mouseup touchend', (e) => {
      if (e.evt.button === 2) return;

      this._updateLine(true);
      console.log(this.getSvgPathFromStroke(getStroke(this.#allPoints)))
      this.isPaint = false;
      this.drawer.UIPointerEvents('all');
      this.#allPoints = [];

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

  /**
   * Get the drawing data from the socket and basically
   * draw on our canvas whatever the other person draws
   *
   */
  private _socketDraw(data: string) {
    this.drawer.drawLayer.add(new Line(JSON.parse(data)));
  }

  getSvgPathFromStroke(points: number[][]): string {
    const TO_FIXED_PRECISION = /(\s?[A-Z]?,?-?\d*\.\d{0,2})((\d|e|-)*)/g;
    if (!points.length) {
      return '';
    }

    const max = points.length - 1;

    return points
      .reduce(
        (acc, point, i, arr) => {
          if (i === max) {
            acc.push(point, this.med(point, arr[0]), 'L', arr[0], 'Z');
          } else {
            acc.push(point, this.med(point, arr[i + 1]));
          }
          return acc;
        },
        ['M', points[0], 'Q']
      )
      .join(' ')
      .replace(TO_FIXED_PRECISION, '$1');
  }

  med(A: number[], B: number[]) {
    return [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
  }

  updateCursor() {
    this.drawer.$stageContainer.style.cursor = `url("data:image/svg+xml,<svg height='32' width='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg' style='color: black;'><defs><filter id='shadow' y='-40%' x='-40%' width='180px' height='180%' color-interpolation-filters='sRGB'><feDropShadow dx='1' dy='1' stdDeviation='1.2' flood-opacity='.5'/></filter></defs><g fill='none' transform='rotate(0 16 16)' filter='url(%23shadow)'><path d='m25 16h-6.01v-6h-2.98v6h-6.01v3h6.01v6h2.98v-6h6.01z' fill='white'/><path d='m23.9902 17.0103h-6v-6.01h-.98v6.01h-6v.98h6v6.01h.98v-6.01h6z' fill='%23231f1f'/></g></svg>") 16 16, crosshair`;
  }
}
