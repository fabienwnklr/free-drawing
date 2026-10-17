import type { Drawer } from '@/Drawer';
import { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import EraserIcon from '@/icons/eraser.svg?raw';
import type { Node } from 'konva/lib/Node';
import type { Vector2d } from 'konva/lib/types';
import { crosshairCursor } from '@/constants';
import { getDrawingShape } from '@/utils/frame';
import type { DrawingShape } from '@/@types/drawer';
import { Trail } from '@/components/toolbar/widgets/Eraser/Trail';

/**
 * Opacity of shapes to erase until pointer up, factor of their own opacity
 */
const erasingOpacity = 0.2;

/**
 * Distance between points of the pointer path looked for shapes (screen pixels), so thin shapes crossed quickly are found
 */
const hitStep = 4;

/**
 * Eraser: shapes crossed by pointer while pressed (also the pressed one: a click erases it) are faded, then erased on
 * pointer up, with a trail behind pointer. Shapes of groups erase their whole group, locked shapes are kept.
 */
export class EraserWidget extends BaseWidget {
  /** Shapes erased on pointer up, faded meanwhile, with their own opacity */
  #toErase = new Map<DrawingShape, number>();
  /** Last pointer position looked for shapes (stage coordinates), null out of an erasing */
  #last: Vector2d | null = null;
  protected cursor = crosshairCursor;
  /** Trail behind pointer while erasing */
  #trail: Trail;

  /**
   * Create the eraser tool, shortcut E, with its trail in the selection layer
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'eraser', 'Eraser', EraserIcon, 'e');

    this.#trail = new Trail(drawer.selectionLayer);
  }

  /**
   * Erasing in progress (pointer action)
   * @deprecated use `inAction`
   */
  get isErasing() {
    return this.inAction;
  }

  /**
   * Erase by click or drag: shapes crossed faded, erased on pointer up, trail behind pointer
   */
  protected initEvents(): void {
    this.onStage('mousedown touchstart', (e) => {
      // right or middle button: no erasing (context menu)
      if (e.evt.button > 0) return;
      e.evt.preventDefault();

      this.startAction();
      this.#trail.start();
      this._addTrailPoint();
      this._findAlong(this.drawer._getPointerPos());
    });

    this.onStage('mousemove touchmove', (e) => {
      if (!this.inAction) return;
      // prevent scrolling on touch devices
      e.evt.preventDefault();
      this._addTrailPoint();
      this._findAlong(this.drawer._getPointerPos());
    });

    this.onStage('mouseup touchend', (e) => {
      if (!this.inAction) return;
      e.evt.preventDefault();
      this.endAction();
      this.#trail.stop();
      this.#last = null;
      this.clearSelection();

      if (!this.#toErase.size) return;

      for (const shape of this.#toErase.keys()) shape.destroy();
      this.#toErase.clear();
      this.drawer.stage.fire('change');
    });
  }

  /**
   * Fade the shapes under the pointer path since last position, erased on pointer up
   * @param pos Pointer position (stage coordinates)
   */
  private _findAlong(pos: Vector2d) {
    const from = this.#last ?? pos;
    const steps = Math.max(1, Math.ceil(Math.hypot(pos.x - from.x, pos.y - from.y) / hitStep));

    for (let i = 1; i <= steps; i++) {
      const point = { x: from.x + ((pos.x - from.x) * i) / steps, y: from.y + ((pos.y - from.y) * i) / steps };
      // shapes of drawing only (not cursors of other users above them)
      const shape = this._getDrawingShape(this.drawer.drawLayer.getIntersection(point));

      if (shape && !this.#toErase.has(shape)) {
        this.#toErase.set(shape, shape.opacity());
        shape.opacity(shape.opacity() * erasingOpacity);
      }
    }
    this.#last = pos;
  }

  /**
   * Drawing shape of a node (shape of a group: whole group is erased, shape of a frame: alone)
   * @param node Konva node under pointer, null when none
   * @returns Drawing shape holding the node, undefined when the node is not in the drawing layer
   */
  private _getDrawingShape(node: Node | null): DrawingShape | undefined {
    return node && node.getLayer() === this.drawer.drawLayer ? getDrawingShape(node, this.drawer.drawLayer) : undefined;
  }

  /**
   * Add pointer position (drawing coordinates) to the trail
   */
  private _addTrailPoint() {
    const { x, y } = this.drawer._getRelativePointerPos();

    this.#trail.add(x, y);
  }

  /**
   * Erasing stopped before pointer up (tool changed): shapes kept with their opacity, trail removed
   */
  protected onDesactive(): void {
    for (const [shape, opacity] of this.#toErase) shape.opacity(opacity);
    this.#toErase.clear();
    this.#last = null;
    this.#trail.destroy();
  }
}
