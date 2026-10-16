import type { AvailableTools } from '@/@types/toolbar';
import type { Drawer } from '@/Drawer';
import type { DrawingShape } from '@/@types/drawer';
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
 * @param start Fixed point (drag start)
 * @param end Point to snap (pointer)
 * @returns End moved on the nearest multiple of 45 degrees around start
 */
export function snapAngle(start: Vector2d, end: Vector2d): Vector2d {
  const step = Math.PI / 4;
  const angle = Math.round(Math.atan2(end.y - start.y, end.x - start.x) / step) * step;
  const length = Math.hypot(end.x - start.x, end.y - start.y);

  return { x: start.x + Math.cos(angle) * length, y: start.y + Math.sin(angle) * length };
}

/**
 * Box from drag start to end (whatever the drag direction)
 * @param start Corner where the drag started
 * @param end Opposite corner (pointer)
 * @param square Same width and height
 * @returns Top left corner and positive size of the box
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
    /** Left of the box */
    x: Math.min(start.x, start.x + width),
    /** Top of the box */
    y: Math.min(start.y, start.y + height),
    /** Width of the box, never negative */
    width: Math.abs(width),
    /** Height of the box, never negative */
    height: Math.abs(height),
  };
}

/**
 * Tool drawing a shape by drag (line, rectangle, ellipse, arrow), shift key constrains the shape
 */
export abstract class ShapeWidget<T extends DrawingShape> extends BaseWidget {
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

  /**
   * Create the widget with the shape overlay shared by shape tools of the drawer
   * @param drawer Drawer of this widget
   * @param id Id of the tool
   * @param title Title of the button without translation of the id
   * @param icon Svg markup of the button icon
   * @param shortcut Default key activating the tool
   */
  constructor(drawer: Drawer, id: AvailableTools, title: string, icon: string, shortcut?: string) {
    super(drawer, id, title, icon, shortcut);

    let overlay = overlays.get(drawer);

    if (!overlay) {
      overlay = new ShapeOverlay(drawer);
      overlays.set(drawer, overlay);
    }

    this.overlay = overlay;
  }

  /**
   * Shape being drawn (pointer action in progress)
   * @deprecated use `inAction`
   */
  get isPaint() {
    return this.inAction;
  }

  /**
   * New shape at drag start
   * @param start Drag start, in drawing coordinates
   * @returns Shape of the tool at start, added to drawing then updated while dragging
   */
  protected abstract createShape(start: Vector2d): T;

  /**
   * Update shape geometry from drag start to end
   * @param shape Shape being drawn, created by `createShape`
   * @param start Drag start, in drawing coordinates
   * @param end Pointer, in drawing coordinates
   * @param constrain Shift key pressed (square, circle, 45 degrees...)
   */
  protected abstract updateShape(shape: T, start: Vector2d, end: Vector2d, constrain: boolean): void;

  /**
   * Style of new shapes, from drawer options
   */
  protected get shapeStyle() {
    const { strokeColor, fillColor, strokeWidth, strokeStyle, opacity } = this.drawer.options;

    return {
      /** Stroke color (`strokeColor` option) */
      stroke: strokeColor,
      /** Background color (`fillColor` option) of shapes having one (`hasFill`), none if transparent */
      fill: this.hasFill ? toFill(fillColor) : undefined,
      /** Stroke width (`strokeWidth` option) */
      strokeWidth,
      /** Dash of `strokeStyle` option for this stroke width, undefined for solid */
      dash: getDash(strokeStyle, strokeWidth),
      /** Round ends of lines, dashes and dots */
      lineCap: 'round' as const,
      /** Opacity (`opacity` option) */
      opacity,
      /** Width of the hit region, 20 at least: easier to select / erase than the stroke only */
      hitStrokeWidth: Math.max(20, strokeWidth),
    };
  }

  /**
   * Drawing ended: shape drawn, or null (removed: simple click)
   * @param shape Shape drawn, in its final geometry and placed in frames, null after a simple click
   */
  protected onDrawEnd?(shape: T | null): void;

  /**
   * Shift pressed or released while drawing: shape updated to the pointer with or without constraint
   * @param constrain Shift pressed
   */
  protected onConstrainChange(constrain: boolean): void {
    if (this.#shape) this.updateShape(this.#shape, this.#start, this.drawer._getRelativePointerPos(), constrain);
  }

  /**
   * Overlay shared by shape tools: background color and edges only for shapes having them
   */
  protected onActive(): void {
    this.overlay.toggleFillBtns(this.hasFill);
    this.overlay.toggleEdgesBtns(this.hasEdges);
  }

  /**
   * Draw by drag: shape created on pointer down, updated on move (shared live), finished on pointer up (removed after
   * a simple click)
   */
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
        this.onDrawEnd?.(null);
        return;
      }

      this.updateShape(shape, this.#start, end, !!e.evt.shiftKey);
      // in frame containing it
      this.drawer.placeInFrames([shape]);
      this.onDrawEnd?.(shape);
      this.clearSelection();
      this.drawer.stage.fire('change');
      this.afterDraw();
    });
  }
}
