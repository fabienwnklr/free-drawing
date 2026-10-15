import { Drawer } from '@/Drawer';
import { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import EraserIcon from '@/icons/eraser.svg?raw';
import type { Node } from 'konva/lib/Node';
import { Text } from 'konva/lib/shapes/Text';
import { crosshairCursor } from '@/constants';
import { getShapes } from '@/utils/hit';
import { getDrawingShape } from '@/utils/frame';
import type { DrawingShape } from '@/@types/drawer';
import { Trail } from '@/components/toolbar/widgets/Eraser/Trail';

/**
 * Outline color of shapes to erase
 */
const erasingColor = '#e03131';

export class EraserWidget extends BaseWidget {
  /** Shapes erased on pointer up, with their outline shown meanwhile */
  #toRemoved = new Map<DrawingShape, DrawingShape>();
  protected cursor = crosshairCursor;
  /** Trail behind pointer while erasing */
  #trail: Trail;

  constructor(drawer: Drawer) {
    super(drawer, 'eraser', 'Eraser', EraserIcon, 'e');

    this.#trail = new Trail(drawer.selectionLayer);
  }

  /**
   * @deprecated use `inAction`
   */
  get isErasing() {
    return this.inAction;
  }

  protected initEvents(): void {
    this.onStage('mousedown touchstart', (e) => {
      if (e.target !== this.drawer.stage) {
        return;
      }
      e.evt.preventDefault();

      this.startAction();
      this.#trail.start();
      this._addTrailPoint();
    });

    // and core function - drawing
    this.onStage('mousemove touchmove', (e) => {
      if (!this.inAction) {
        return;
      }
      // prevent scrolling on touch devices
      e.evt.preventDefault();
      this._addTrailPoint();
      const shape = this._getDrawingShape(this.drawer.stage.getIntersection(this.drawer._getPointerPos()));

      if (!shape || this.#toRemoved.has(shape)) return;

      this.#toRemoved.set(shape, this._showOutline(shape));
    });

    this.onStage('mouseup touchend', (e) => {
      this.endAction();
      this.#trail.stop();
      this.clearSelection();

      e.evt.preventDefault();

      if (this.#toRemoved.size) {
        this.#toRemoved.forEach((outline, shape) => {
          outline.destroy();
          shape.destroy();
        });
        this.#toRemoved.clear();
        this.drawer.stage.fire('change');
      }
    });

    // click on a shape (not an erasing move)
    this.onStage('click tap', (e) => {
      const shape = this._getDrawingShape(e.target);

      if (!shape) return;

      shape.destroy();
      this.drawer.stage.fire('change');
    });
  }

  /**
   * Drawing shape of a node (shape of a group: whole group is erased, shape of a frame: alone)
   */
  private _getDrawingShape(node: Node | null): DrawingShape | undefined {
    return node && node.getLayer() === this.drawer.drawLayer ? getDrawingShape(node, this.drawer.drawLayer) : undefined;
  }

  private _addTrailPoint() {
    const { x, y } = this.drawer._getRelativePointerPos();

    this.#trail.add(x, y);
  }

  /**
   * Shape replaced by its thin outline until pointer up: visible whatever shape color and opacity, shape unchanged
   * @returns outline, in selection layer
   */
  private _showOutline(shape: DrawingShape) {
    const outline = shape.clone({ name: 'erasing', opacity: 1, listening: false, draggable: false }) as DrawingShape;

    // shapes of groups too
    getShapes(outline).forEach((s) => {
      s.setAttrs({
        stroke: erasingColor,
        strokeWidth: 1.5,
        // same width whatever zoom
        strokeScaleEnabled: false,
        fillEnabled: false,
        dash: undefined,
        opacity: 1,
      });

      if (s instanceof Text) {
        // struck out, decoration line is drawn with fill color
        s.setAttrs({ fill: erasingColor, strokeWidth: 1, textDecoration: 'line-through' });
      }
    });

    this.drawer.selectionLayer.add(outline);
    shape.hide();

    return outline;
  }

  // erasing stopped before pointer up (tool changed): shapes kept as they were
  protected onDesactive(): void {
    this.#toRemoved.forEach((outline, shape) => {
      outline.destroy();
      shape.show();
    });
    this.#toRemoved.clear();
    this.#trail.destroy();
  }
}
