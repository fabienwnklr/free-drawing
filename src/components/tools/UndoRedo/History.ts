import type { Drawer } from '@/Drawer';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { Node } from 'konva/lib/Node';
import type { Shape, ShapeConfig } from 'konva/lib/Shape';

/**
 * Serialized drawing shape (konva `toObject` format), any shape type can be restored
 */
type ShapeState = { attrs: Record<string, unknown>; className: string };

export class History {
  appHistory: ShapeState[][] = [[]];
  appHistoryStep: number = 0;
  drawer: Drawer;

  constructor(drawer: Drawer) {
    this.drawer = drawer;
  }

  saveState(fromSaved = false) {
    const state = this.drawer.getDrawingShapes().map((shape): ShapeState => {
      const { attrs, className } = shape.toObject();
      // depends on active tool, not on drawing
      delete attrs.draggable;
      return { attrs, className };
    });

    // ignore change without drawing modification (pan, grid...), also keeps redo available
    if (!fromSaved && JSON.stringify(state) === JSON.stringify(this.appHistory[this.appHistoryStep])) {
      return;
    }

    this.appHistory = this.appHistory.slice(0, this.appHistoryStep + 1);
    if (fromSaved) {
      // loop on state for add to history the first, first and second, first, second and third, etc.
      for (let i = 0; i < state.length; i++) {
        this.appHistory = this.appHistory.concat([state.slice(0, i + 1)]);
      }
      this.appHistoryStep = this.appHistory.length - 1;
    } else {
      this.appHistory = this.appHistory.concat([state]);
      this.appHistoryStep = this.appHistory.length - 1;
    }
  }

  canUndo() {
    return !!this.appHistory[this.appHistoryStep - 1];
  }

  undo() {
    if (!this.canUndo()) return;

    this.appHistoryStep -= 1;
    this._restoreState(this.appHistory[this.appHistoryStep]);
  }

  canRedo() {
    return !!this.appHistory[this.appHistoryStep + 1];
  }

  redo() {
    if (!this.canRedo()) return;

    this.appHistoryStep += 1;
    this._restoreState(this.appHistory[this.appHistoryStep]);
  }

  /**
   * Replace drawing by given state
   * @param state
   */
  private _restoreState(state: ShapeState[]) {
    this.drawer.getWidget<SelectWidget>('selection')?.transformer.nodes([]);
    this.drawer.getDrawingShapes().forEach((shape) => shape.destroy());

    state.forEach((shape) => {
      // from JSON, so restored shape does not share attributes (points...) with history
      this.drawer.addShape(Node.create(JSON.stringify(shape)) as Shape<ShapeConfig>);
    });
  }
}
