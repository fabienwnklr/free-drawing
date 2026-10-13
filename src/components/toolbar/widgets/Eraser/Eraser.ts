import { Drawer } from '@/Drawer';
import { BaseWidget } from '../BaseWidget';
import EraserIcon from '@/icons/eraser.svg?raw';
import type { Shape, ShapeConfig } from 'konva/lib/Shape';
import { crosshairCursor } from '@/constants';

export class EraserWidget extends BaseWidget {
  #toRemoved = new Set<Shape<ShapeConfig>>();
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

      this.#toRemoved.add(shape);
      // visual feedback until mouseup
      shape.opacity(0.5);
    });

    this.onStage('mouseup touchend', (e) => {
      this.endAction();
      this.clearSelection();

      e.evt.preventDefault();

      if (this.#toRemoved.size) {
        this.#toRemoved.forEach((t) => t.destroy());
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
}
