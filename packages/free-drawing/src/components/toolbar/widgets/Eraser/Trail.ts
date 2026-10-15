import type { Layer } from 'konva/lib/Layer';
import { Line } from 'konva/lib/shapes/Line';
import { getStroke } from 'perfect-freehand';

export type TrailOptions = {
  /** Fill color */
  color: string;
  /** Width at pointer, in screen pixels (same whatever zoom) */
  size: number;
  /** Life time of a point, in ms */
  duration: number;
  /** Color of a glow around trail (laser), none by default */
  glow?: string;
};

const defaultTrailOptions: TrailOptions = {
  color: 'rgba(0, 0, 0, 0.15)',
  size: 8,
  duration: 200,
};

/**
 * Trail following pointer: thinner towards its tail, points disappear after `duration`
 */
export class Trail {
  readonly options: TrailOptions;
  #line: Line | null = null;
  #points: { x: number; y: number; time: number }[] = [];
  #following = false;
  #frame = 0;

  constructor(
    private readonly layer: Layer,
    options: Partial<TrailOptions> = {}
  ) {
    this.options = { ...defaultTrailOptions, ...options };
  }

  /**
   * Start following pointer, call `add` with its positions
   */
  start() {
    this.#following = true;

    if (!this.#line) {
      // not listening: not found by hit detection
      this.#line = new Line({
        name: 'trail',
        fill: this.options.color,
        closed: true,
        listening: false,
        ...(this.options.glow && { shadowColor: this.options.glow, shadowBlur: 8, shadowOpacity: 0.8 }),
      });
      this.layer.add(this.#line);
    }
    if (!this.#frame) this.#frame = requestAnimationFrame(this.#update);
  }

  /**
   * Add pointer position (layer coordinates)
   */
  add(x: number, y: number) {
    if (this.#following) this.#points.push({ x, y, time: performance.now() });
  }

  /**
   * Stop following pointer, trail fades out then is removed
   */
  stop() {
    this.#following = false;
  }

  /**
   * Remove trail now
   */
  destroy() {
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    this.#following = false;
    this.#points = [];
    this.#line?.destroy();
    this.#line = null;
  }

  #update = () => {
    const now = performance.now();
    this.#points = this.#points.filter((point) => now - point.time < this.options.duration);

    if (!this.#points.length && !this.#following) {
      this.destroy();
      return;
    }

    const outline = getStroke(this.#points, {
      size: this.options.size / this.layer.getAbsoluteScale().x,
      thinning: 0,
      streamline: 0.3,
      // tail tapered along the whole trail
      start: { taper: true },
    });

    // no redraw while pointer does not move
    if (outline.length || this.#line?.points().length) this.#line?.points(outline.flat());
    this.#frame = requestAnimationFrame(this.#update);
  };
}
