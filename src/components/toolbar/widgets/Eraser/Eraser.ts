import { Drawer } from '@/Drawer';
import { BaseWidget } from '../BaseWidget';
import EraserIcon from '@/icons/eraser.svg?raw';
import type { Shape, ShapeConfig } from 'konva/lib/Shape';
import { Text } from 'konva/lib/shapes/Text';
import { crosshairCursor } from '@/constants';

/**
 * Outline color of shapes to erase
 */
const erasingColor = '#e03131';

export class EraserWidget extends BaseWidget {
  /** Shapes erased on pointer up, with their outline shown meanwhile */
  #toRemoved = new Map<Shape<ShapeConfig>, Shape<ShapeConfig>>();
  protected cursor = crosshairCursor;

  constructor(drawer: Drawer) {
    super(drawer, 'eraser', 'Eraser', EraserIcon, 'e');
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
    });

    // and core function - drawing
    this.onStage('mousemove touchmove', (e) => {
      if (!this.inAction) {
        return;
      }
      // prevent scrolling on touch devices
      e.evt.preventDefault();
      const target = this.drawer.stage.getIntersection(this.drawer._getPointerPos());
      const shape = this.drawer.getDrawingShapes().find((s) => s === target);

      if (!shape || this.#toRemoved.has(shape)) return;

      this.#toRemoved.set(shape, this._showOutline(shape));
    });

    this.onStage('mouseup touchend', (e) => {
      this.endAction();
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

    this.onStage('click tap', (e) => {
      if (e.target !== this.drawer.stage && !e.target.hasName('background') && !e.target.hasName('selection')) {
        e.target.destroy();
      }
    });
  }

  /**
   * Shape replaced by its thin outline until pointer up: visible whatever shape color and opacity, shape unchanged
   * @returns outline, in selection layer
   */
  private _showOutline(shape: Shape<ShapeConfig>) {
    const outline = shape.clone({
      name: 'erasing',
      stroke: erasingColor,
      strokeWidth: 1.5,
      // same width whatever zoom
      strokeScaleEnabled: false,
      fillEnabled: false,
      dash: undefined,
      opacity: 1,
      listening: false,
      draggable: false,
    }) as Shape<ShapeConfig>;

    if (outline instanceof Text) {
      // struck out, decoration line is drawn with fill color
      outline.setAttrs({ fill: erasingColor, strokeWidth: 1, textDecoration: 'line-through' });
    }

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
  }
}
