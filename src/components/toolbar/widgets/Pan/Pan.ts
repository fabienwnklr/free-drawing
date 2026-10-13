import { Drawer } from '@/Drawer';
import { BaseWidget } from '../BaseWidget';
import PanIcon from '@/icons/pan.svg?raw';

export class PanWidget extends BaseWidget {
  isGrabbing: boolean = false;
  hasMoved: boolean = false;

  constructor(drawer: Drawer) {
    super(drawer, 'pan', 'Pan', PanIcon, 'h');
  }

  protected initEvents(): void {
    this.onStage('mousedown touchstart', () => {
      this.isGrabbing = true;
      this.drawer.UIPointerEvents('none');

      this.drawer.$stageContainer.style.cursor = 'grabbing';
    });

    this.onStage('mousemove touchmove', (e) => {
      if (e.target !== this.drawer.stage || !this.isGrabbing) return;
      this.hasMoved = true;

      this.drawer.$stageContainer.style.cursor = 'grabbing';
    });

    this.onStage('mouseup touchend', () => {
      if (this.hasMoved) {
        this.drawer.stage.fire('change');
      }
      this.isGrabbing = false;
      this.drawer.UIPointerEvents('all');
      this.hasMoved = false;
      this.drawer.$stageContainer.style.cursor = 'grab';
    });
  }

  protected onActive(): void {
    this.drawer.stage.draggable(true);
  }

  protected onDesactive(): void {
    this.drawer.stage.draggable(false);
  }

  updateCursor() {
    this.drawer.$stageContainer.style.cursor = 'grab';
  }
}
