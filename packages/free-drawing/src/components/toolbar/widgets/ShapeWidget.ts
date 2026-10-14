import type { AvailableTools } from '@/@types/toolbar';
import type { Drawer } from '@/Drawer';
import type { Shape, ShapeConfig } from 'konva/lib/Shape';
import type { Vector2d } from 'konva/lib/types';
import { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import { ShapeOverlay } from '@/components/tools/Overlay/ShapeOverlay/ShapeOverlay';
import { crosshairCursor } from '@/constants';
import { toFill } from '@/utils/color';
import { getDash } from '@/utils/stroke';

// one overlay shared by shape tools of a drawer
const overlays = new WeakMap<Drawer, ShapeOverlay>();

/**
 * Point at the same distance from start as end, in the nearest 45 degrees direction
 * @param {Vector2d} start
 * @param {Vector2d} end
 */
export function snapAngle(start: Vector2d, end: Vector2d): Vector2d {
  const step = Math.PI / 4;
  const angle = Math.round(Math.atan2(end.y - start.y, end.x - start.x) / step) * step;
  const length = Math.hypot(end.x - start.x, end.y - start.y);

  return { x: start.x + Math.cos(angle) * length, y: start.y + Math.sin(angle) * length };
}

/**
 * Box from drag start to end (whatever the drag direction)
 * @param {Vector2d} start
 * @param {Vector2d} end
 * @param {boolean} square Same width and height
 */
export function dragBox(start: Vector2d, end: Vector2d, square: boolean) {
  let width = end.x - start.x;
  let height = end.y - start.y;

  if (square) {
    const size = Math.max(Math.abs(width), Math.abs(height));
    width = width < 0 ? -size : size;
    height = height < 0 ? -size : size;
  }

  return {
    x: Math.min(start.x, start.x + width),
    y: Math.min(start.y, start.y + height),
    width: Math.abs(width),
    height: Math.abs(height),
  };
}

/**
 * Tool drawing a shape by drag (line, rectangle, ellipse, arrow), shift key constrains the shape
 */
export abstract class ShapeWidget<T extends Shape<ShapeConfig>> extends BaseWidget {
  overlay: ShapeOverlay;
  protected cursor = crosshairCursor;
  #shape: T | null = null;
  #start: Vector2d = { x: 0, y: 0 };
  /** Shapes of tool have a background color (rectangle, ellipse) */
  protected hasFill: boolean = false;
  /** Corners sharp or round (`edges` option) */
  protected hasEdges: boolean = false;
  /** Last pointer event of drawing (modifier keys) */
  protected pointerEvent: MouseEvent | TouchEvent | null = null;

  constructor(drawer: Drawer, id: AvailableTools, title: string, icon: string, shortcut: string) {
    super(drawer, id, title, icon, shortcut);

    let overlay = overlays.get(drawer);

    if (!overlay) {
      overlay = new ShapeOverlay(drawer);
      overlays.set(drawer, overlay);
    }

    this.overlay = overlay;
  }

  /**
   * @deprecated use `inAction`
   */
  get isPaint() {
    return this.inAction;
  }

  /**
   * New shape at drag start
   * @param {Vector2d} start
   */
  protected abstract createShape(start: Vector2d): T;

  /**
   * Update shape geometry from drag start to end
   * @param constrain Shift key pressed (square, circle, 45 degrees...)
   */
  protected abstract updateShape(shape: T, start: Vector2d, end: Vector2d, constrain: boolean): void;

  /**
   * Style of new shapes, from drawer options
   */
  protected get shapeStyle() {
    const { strokeColor, fillColor, strokeWidth, strokeStyle, opacity } = this.drawer.options;

    return {
      stroke: strokeColor,
      fill: this.hasFill ? toFill(fillColor) : undefined,
      strokeWidth,
      dash: getDash(strokeStyle, strokeWidth),
      // dashes and dots ends
      lineCap: 'round' as const,
      opacity,
      // easier to select / erase than the stroke only
      hitStrokeWidth: Math.max(20, strokeWidth),
    };
  }

  /**
   * Drawing ended (shape drawn or removed)
   */
  protected onDrawEnd?(): void;

  // Shift pressed or released while drawing
  protected onConstrainChange(constrain: boolean): void {
    if (this.#shape) this.updateShape(this.#shape, this.#start, this.drawer._getRelativePointerPos(), constrain);
  }

  // overlay shared by shape tools: background color only for shapes having one
  protected onActive(): void {
    this.overlay.toggleFillBtns(this.hasFill);
    this.overlay.toggleEdgesBtns(this.hasEdges);
  }

  protected initEvents(): void {
    this.onStage('mousedown touchstart', (e) => {
      if (e.evt.button === 2) return;
      e.evt.preventDefault();

      this.startAction();
      this.pointerEvent = e.evt;
      this.#start = this.drawer._getRelativePointerPos();
      this.#shape = this.drawer.addShape(this.createShape(this.#start));
    });

    this.onStage('mousemove touchmove', (e) => {
      if (!this.inAction || !this.#shape) return;
      // prevent scrolling on touch devices
      e.evt.preventDefault();

      this.pointerEvent = e.evt;
      this.updateShape(this.#shape, this.#start, this.drawer._getRelativePointerPos(), !!e.evt.shiftKey);
      this.shareLive(this.#shape);
    });

    this.onStage('mouseup touchend', (e) => {
      // mouseup without mousedown on stage (e.g. started on overlay) must not alter last shape
      if (e.evt.button === 2 || !this.inAction || !this.#shape) return;
      e.evt.preventDefault();

      const shape = this.#shape;
      const end = this.drawer._getRelativePointerPos();
      this.#shape = null;
      this.pointerEvent = e.evt;
      this.endAction();

      // simple click, nothing drawn
      if (Math.hypot(end.x - this.#start.x, end.y - this.#start.y) < 2) {
        shape.destroy();
        this.onDrawEnd?.();
        return;
      }

      this.updateShape(shape, this.#start, end, !!e.evt.shiftKey);
      this.onDrawEnd?.();
      this.clearSelection();
      this.drawer.stage.fire('change');
    });
  }
}
