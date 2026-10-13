import { Drawer } from '@/Drawer';
import { BaseWidget } from '../BaseWidget';
import PanIcon from '@/icons/pan.svg?raw';
import { grabCursor, grabbingCursor } from '@/constants';

export class PanWidget extends BaseWidget {
  hasMoved: boolean = false;
  protected cursor = grabCursor;

  constructor(drawer: Drawer) {
    super(drawer, 'pan', 'Pan', PanIcon, 'h');
  }

  /**
   * @deprecated use `inAction`
   */
  get isGrabbing() {
    return this.inAction;
  }

  protected initEvents(): void {
    this.onStage('mousedown touchstart', () => {
      this.startAction();
      this.drawer.$stageContainer.style.cursor = grabbingCursor;
    });

    this.onStage('mousemove touchmove', (e) => {
      if (e.target !== this.drawer.stage || !this.inAction) return;
      this.hasMoved = true;

      this.drawer.$stageContainer.style.cursor = grabbingCursor;
    });

    this.onStage('mouseup touchend', () => {
      if (this.hasMoved) {
        this.drawer.stage.fire('change');
      }
      this.endAction();
      this.hasMoved = false;
      this.updateCursor();
    });
  }

  protected onActive(): void {
    this.drawer.stage.draggable(true);
  }

  protected onDesactive(): void {
    this.drawer.stage.draggable(false);
  }
}
