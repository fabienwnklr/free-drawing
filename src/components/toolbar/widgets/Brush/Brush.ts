import { Drawer } from '@/Drawer';
import { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import BrushIcon from '@/icons/brush.svg?raw';
import { Line } from 'konva/lib/shapes/Line';
import { BrushOverlay } from '@/components/tools/Overlay/BrushOverlay/BrushOverlay';
import { getStroke } from 'perfect-freehand';
import { crosshairCursor, shapeName } from '@/constants';
import type { BrushWidgetOptions } from '@/@types/toolbar';
import type { Vector2d } from 'konva/lib/types';

/**
 * Freehand stroke settings used when not given in brush widget options
 */
const freehandDefaults = { thinning: 0.6, smoothing: 1, streamline: 0.5 };

/**
 * Points of a straight stroke, regularly spaced (same width all along)
 */
function straightPoints(from: Vector2d, to: Vector2d): Vector2d[] {
  const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 4));

  return Array.from({ length: steps + 1 }, (_, i) => ({
    x: from.x + ((to.x - from.x) * i) / steps,
    y: from.y + ((to.y - from.y) * i) / steps,
  }));
}

export class BrushWidget extends BaseWidget {
  #lastLine: Line = new Line();
  #allPoints: { x: number; y: number }[] = [];
  #start: Vector2d = { x: 0, y: 0 };
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
      this.#start = realPos;
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

      this._updateLine(false, !!e.evt.shiftKey);
      this.shareLive(this.#lastLine);
    });

    this.onStage('mouseup touchend', (e) => {
      // mouseup without mousedown on stage (e.g. started on overlay) must not alter last line
      if (e.evt.button === 2 || !this.inAction) return;

      this._updateLine(true, !!e.evt.shiftKey);
      this.endAction();
      this.#allPoints = [];

      this.drawer.stage.fire('change');

      this.clearSelection();
      e.evt.preventDefault();
    });
  }

  // Shift pressed or released while drawing
  protected onConstrainChange(constrain: boolean): void {
    this._updateLine(false, constrain);
  }

  /**
   * Stroke to pointer position, straight from its start with Shift
   */
  private _updateLine(last?: boolean, straight = false) {
    const realPos = this.drawer._getRelativePointerPos();

    if (straight) this.#allPoints = straightPoints(this.#start, realPos);
    else this.#allPoints.push(realPos);
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
}
