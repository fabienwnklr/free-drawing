import type { LineConfig } from 'konva/lib/shapes/Line';
import { Line } from 'konva/lib/shapes/Line';
import type { Vector2d } from 'konva/lib/types';
import { getStroke } from 'perfect-freehand';
import { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import { crosshairCursor } from '@/constants';

/**
 * Settings of perfect-freehand: effect of speed on width, softness of edges, stabilization
 */
export type FreehandSettings = {
  /** Effect of drawing speed on stroke width, from -1 to 1 (0 for constant width) */
  thinning: number;
  /** Softness of stroke edges, from 0 to 1 */
  smoothing: number;
  /** How much stroke is stabilized (follows pointer less closely), from 0 to 1 */
  streamline: number;
};

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

/**
 * Tool drawing freehand strokes (brush, highlighter): outline of pointer path filled (perfect-freehand), straight
 * from its start with Shift
 */
export abstract class FreehandWidget extends BaseWidget {
  #lastLine: Line = new Line();
  #allPoints: { x: number; y: number }[] = [];
  #start: Vector2d = { x: 0, y: 0 };
  protected cursor = crosshairCursor;

  /**
   * Style of new strokes (color, opacity, name...)
   */
  protected abstract lineStyle(): LineConfig;

  /**
   * Width of strokes
   */
  protected abstract strokeSize(): number;

  /**
   * Settings of perfect-freehand
   */
  protected abstract freehandSettings(): FreehandSettings;

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
        tension: 0.3,
        hitStrokeWidth: 20,
        shadowForStrokeEnabled: false,
        // round cap for smoother lines
        lineCap: 'round',
        lineJoin: 'round',
        ...this.lineStyle(),
        // add point twice, so we have some drawings even on a simple click
        points: [realPos.x, realPos.y, realPos.x, realPos.y],
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
      // in frame containing it
      this.drawer.placeInFrames([this.#lastLine]);

      this.drawer.stage.fire('change');

      this.clearSelection();
      this.afterDraw([this.#lastLine]);
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
    const points = getStroke(this.#allPoints, {
      size: this.strokeSize(),
      ...this.freehandSettings(),
      easing: (t) => Math.sin((t * Math.PI) / 2),
      last,
    });

    if (!this.#lastLine.closed()) this.#lastLine.closed(true);
    // 2 decimals are enough to draw, and saved data / history are about 3 times lighter
    const newPoints = points.flat().map((n) => Math.round(n * 100) / 100);
    this.#lastLine?.points(newPoints);
  }
}
