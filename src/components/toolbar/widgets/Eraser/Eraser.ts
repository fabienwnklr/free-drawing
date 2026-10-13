import { Drawer } from '@/Drawer';
import { BaseWidget } from '../BaseWidget';
import EraserIcon from '@/icons/eraser.svg?raw';
import type { Shape, ShapeConfig } from 'konva/lib/Shape';
import { SelectWidget } from '../Select/Select';
import { crosshairCursor } from '@/constants';

export class EraserWidget extends BaseWidget {
  isErasing: boolean = false;
  #toRemoved = new Set<Shape<ShapeConfig>>();

  constructor(drawer: Drawer) {
    super(drawer, 'eraser', 'Eraser', EraserIcon, 'e');
  }

  protected initEvents(): void {
    this.onStage('mousedown touchstart', (e) => {
      if (e.target !== this.drawer.stage) {
        return;
      }
      e.evt.preventDefault();

      this.isErasing = true;
      this.drawer.UIPointerEvents('none');
    });

    // and core function - drawing
    this.onStage('mousemove touchmove', (e) => {
      if (!this.isErasing) {
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
      this.isErasing = false;
      this.drawer.UIPointerEvents('all');

      const selectWidget = this.drawer.getWidget<SelectWidget>('selection');
      selectWidget?.clearSelection();

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

  updateCursor(): void {
    this.drawer.$stageContainer.style.cursor = crosshairCursor;
  }
}
