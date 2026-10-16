import { Drawer } from '@/Drawer';
import { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import PanIcon from '@/icons/pan.svg?raw';
import { grabCursor, grabbingCursor } from '@/constants';

/**
 * Pan tool: drag moves the view (stage draggable while active), grabbing cursor meanwhile
 */
export class PanWidget extends BaseWidget {
  /** View moved since pointer down: a change is fired on pointer up (view saved) */
  hasMoved: boolean = false;
  protected cursor = grabCursor;

  /**
   * Create the pan tool, shortcut H
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'pan', 'Pan', PanIcon, 'h');
  }

  /**
   * View being dragged (pointer action in progress)
   * @deprecated use `inAction`
   */
  get isGrabbing() {
    return this.inAction;
  }

  /**
   * Grabbing cursor while pointer is down, change fired on pointer up when the view moved (view saved)
   */
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

  /**
   * Stage draggable: a drag moves the view
   */
  protected onActive(): void {
    this.drawer.stage.draggable(true);
  }

  /**
   * Stage no longer draggable
   */
  protected onDesactive(): void {
    this.drawer.stage.draggable(false);
  }
}
