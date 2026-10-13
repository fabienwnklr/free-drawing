import { Drawer } from '@/Drawer';
import { BaseWidget } from '../BaseWidget';
import BrushIcon from '@/icons/brush.svg?raw';
import { Line } from 'konva/lib/shapes/Line';
import { Node } from 'konva/lib/Node';
import { BrushOverlay } from '@/components/tools/Overlay/BrushOverlay/BrushOverlay';
import { getStroke } from 'perfect-freehand';
import { crosshairCursor, shapeName, socketEvents } from '@/constants';
import type { BrushWidgetOptions } from '@/@types/toolbar';

/**
 * Freehand stroke settings used when not given in brush widget options
 */
const freehandDefaults = { thinning: 0.6, smoothing: 1, streamline: 0.5 };

export class BrushWidget extends BaseWidget {
  #lastLine: Line = new Line();
  #allPoints: { x: number; y: number }[] = [];
  overlay: BrushOverlay;
  declare readonly options: BrushWidgetOptions;
  protected cursor = crosshairCursor;

  constructor(drawer: Drawer) {
    super(drawer, 'brush', 'Brush', BrushIcon, 'b');

    this.overlay = new BrushOverlay(drawer);
  }

  /**
   * @deprecated use `inAction`
   */
  get isPaint() {
    return this.inAction;
  }

  protected initEvents(): void {
    this.onStage('mousedown touchstart', (e) => {
      if (e.evt.button === 2) return;
      e.evt.preventDefault();

      this.startAction();

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

      this.drawer.addShape(this.#lastLine);
    });

    // and core function - drawing
    this.onStage('mousemove touchmove', (e) => {
      // prevent scrolling on touch devices
      e.evt.preventDefault();

      if (!this.inAction) return;

      this._updateLine();
      // this.drawer.socket.emit(socketEvents.DRAW, this.#lastLine);
    });

    this.onStage('mouseup touchend', (e) => {
      // mouseup without mousedown on stage (e.g. started on overlay) must not alter last line
      if (e.evt.button === 2 || !this.inAction) return;

      this._updateLine(true);
      this.endAction();
      this.#allPoints = [];

      this.drawer.stage.fire('change');

      this.clearSelection();
      e.evt.preventDefault();
      // serialized line (konva JSON), only with collaboration enabled
      this.drawer.socket?.emit(socketEvents.DRAW, this.#lastLine.toJSON());
    });
  }

  private _updateLine(last?: boolean) {
    const realPos = this.drawer._getRelativePointerPos();
    this.#allPoints.push(realPos);
    const { thinning, smoothing, streamline } = { ...freehandDefaults, ...this.options };
    const points = getStroke(this.#allPoints, {
      size: this.drawer.options.strokeWidth,
      thinning,
      smoothing,
      streamline,
      easing: (t) => Math.sin((t * Math.PI) / 2),
      last,
    });

    if (!this.#lastLine.closed()) this.#lastLine.closed(true);
    // 2 decimals are enough to draw, and saved data / history are about 3 times lighter
    const newPoints = points.flat().map((n) => Math.round(n * 100) / 100);
    this.#lastLine?.points(newPoints);
  }

  /**
   * Get the drawing data from the socket and basically
   * draw on our canvas whatever the other person draws
   *
   */
  _socketDraw(data: string) {
    // konva JSON of the line, server does not send it back to its author
    this.drawer.addShape(Node.create(data) as Line);
  }
}
