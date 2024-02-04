import { Drawer } from '@/Drawer';
import { stringToNode } from '@/utils/functions';
import { BaseWidget } from '../BaseWidget';
import EraserIcon from '@/icons/eraser.svg?raw';
import { Line } from 'konva/lib/shapes/Line';
import { Node, NodeConfig } from 'konva/lib/Node';
import { SelectWidget } from '../Select/Select';

export class EraserWidget extends BaseWidget {
  isErasing: boolean = false;
  #toRemoved: Node<NodeConfig>[] = [];

  constructor(protected drawer: Drawer) {
    const $EraserIcon = stringToNode<SVGElement>(EraserIcon);
    super(drawer, 'eraser', 'Eraser', $EraserIcon);
  }

  protected initEvents(): void {
    this.drawer.stage.on('mousedown touchstart', (e) => {
      if (e.target !== this.drawer.stage) {
        return;
      }
      e.evt.preventDefault();

      this.isErasing = true;
      this.drawer.UIPointerEvents('none');
    });

    // and core function - drawing
    this.drawer.stage.on('mousemove touchmove', (e) => {
      if (!this.isErasing) {
        return;
      }
      // prevent scrolling on touch devices
      e.evt.preventDefault();
      const shapes = this.drawer.stage.find<Line>('.line');
      const pos = this.drawer._getPointerPos();
      const selected = shapes.filter((s) => s == this.drawer.stage.getIntersection(pos));

      selected.forEach((s) => {
        if (s.opacity() === 0.5) {
          return;
        }
        this.#toRemoved.push(s);
        s.opacity(0.5);
      });
    });

    this.drawer.stage.on('mouseup touchend', (e) => {
      this.isErasing = false;
      this.drawer.UIPointerEvents('all');

      const selectWidget = this.drawer.toolbar.widgets.get('selection') as SelectWidget;
      if (selectWidget) {
        selectWidget.transformer.nodes([]);
      }

      e.evt.preventDefault();

      if (this.#toRemoved.length) {
        this.#toRemoved.forEach((t) => t.destroy());
        this.#toRemoved = [];
        this.drawer.stage.fire('change');
      }
    });

    this.drawer.stage.on('click tap', (e) => {
      if (e.target !== this.drawer.stage && !e.target.hasName('background') && !e.target.hasName('selection')) {
        e.target.destroy();
      }
    });
  }

  protected removeEvents(): void {
    this.drawer.stage.off('mousedown touchstart');
    this.drawer.stage.off('mousemove touchmove');
    this.drawer.stage.off('mouseup touchend');
    this.drawer.stage.off('click tap');
  }

  updateCursor(): void {
    this.drawer.$stageContainer.style.cursor = `url("data:image/svg+xml,<svg height='32' width='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg' style='color: black;'><defs><filter id='shadow' y='-40%' x='-40%' width='180px' height='180%' color-interpolation-filters='sRGB'><feDropShadow dx='1' dy='1' stdDeviation='1.2' flood-opacity='.5'/></filter></defs><g fill='none' transform='rotate(0 16 16)' filter='url(%23shadow)'><path d='m25 16h-6.01v-6h-2.98v6h-6.01v3h6.01v6h2.98v-6h6.01z' fill='white'/><path d='m23.9902 17.0103h-6v-6.01h-.98v6.01h-6v.98h6v6.01h.98v-6.01h6z' fill='%23231f1f'/></g></svg>") 16 16, crosshair`;
  }

  protected onActive(): void {
    this.initEvents();
    this.updateCursor();
  }

  protected onDesactive(): void {
    this.removeEvents();
  }
}
