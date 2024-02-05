import { Drawer } from '@/Drawer';
import { stringToNode } from '@/utils/functions';
import { BaseWidget } from '../BaseWidget';
import PanIcon from '@/icons/pan.svg?raw';

export class PanWidget extends BaseWidget {
  isGrabbing: boolean = false;
  hasMoved: boolean = false;

  constructor(protected drawer: Drawer) {
    const $PanIcon = stringToNode<SVGElement>(PanIcon);
    super(drawer, 'pan', 'Pan', $PanIcon);
  }

  protected initEvents(): void {
    // this.drawer.stage.off()
    this.drawer.stage.on('mousedown touchstart', () => {
      this.isGrabbing = true;
      this.drawer.UIPointerEvents('none');

      this.drawer.$stageContainer.style.cursor = 'grabbing';
    });

    this.drawer.stage.on('mousemove touchmove', (e) => {
      if (e.target !== this.drawer.stage || !this.isGrabbing) return;
      this.hasMoved = true;

      this.drawer.$stageContainer.style.cursor = 'grabbing';
    });

    this.drawer.stage.on('mouseup touchend', () => {
      if (this.hasMoved) {
        this.drawer.stage.fire('change');
      }
      this.isGrabbing = false;
      this.drawer.UIPointerEvents('all');
      this.hasMoved = false;
      this.drawer.$stageContainer.style.cursor = 'grab';
    });
  }

  protected removeEvents() {
    this.drawer.stage.off('mousedown touchstart');
    this.drawer.stage.off('mousemove touchmove');
    this.drawer.stage.off('mouseup touchend');
  }

  protected onActive(): void {
    this.initEvents();
    this.updateCursor();
    this.drawer.stage.draggable(true);
  }
  protected onDesactive(): void {
    this.removeEvents();
    this.drawer.stage.draggable(false);
  }

  updateCursor() {
    this.drawer.$stageContainer.style.cursor = 'grab';
  }
}
