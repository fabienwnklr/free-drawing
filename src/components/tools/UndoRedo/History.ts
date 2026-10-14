import type { Drawer } from '@/Drawer';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { Node } from 'konva/lib/Node';
import type { DrawingShape } from '@/@types/drawer';
import { historyLimit } from '@/constants';

/**
 * Serialized drawing shape (konva `toObject` format), any shape type can be restored, groups with their shapes
 */
export type ShapeState = { attrs: Record<string, unknown>; className: string; children?: ShapeState[] };

/**
 * State of a drawing shape or group (history, collaboration, files), without `draggable` which depends on active tool
 */
export function getShapeState(shape: DrawingShape): ShapeState {
  return toState(shape.toObject());
}

function toState({ attrs, className, children }: ShapeState): ShapeState {
  delete attrs.draggable;

  return children ? { attrs, className, children: children.map(toState) } : { attrs, className };
}

/**
 * JSON of a drawing shape state
 */
export function serializeShape(shape: DrawingShape): string {
  return JSON.stringify(getShapeState(shape));
}

export class History {
  /**
   * Drawing states, JSON of shapes array (string is lighter than objects and compared without serializing again)
   */
  appHistory: string[] = ['[]'];
  appHistoryStep: number = 0;
  drawer: Drawer;

  constructor(drawer: Drawer) {
    this.drawer = drawer;
  }

  saveState(fromSaved = false) {
    const shapes = this.drawer.getDrawingShapes().map(serializeShape);

    if (fromSaved) {
      // add the first, first and second, first, second and third, etc. (only last ones, history is limited)
      for (let i = Math.max(0, shapes.length - historyLimit); i < shapes.length; i++) {
        this._push(`[${shapes.slice(0, i + 1).join(',')}]`);
      }
      return;
    }

    const state = `[${shapes.join(',')}]`;

    // ignore change without drawing modification (pan, grid...), also keeps redo available
    if (state === this.appHistory[this.appHistoryStep]) return;

    this._push(state);
  }

  /**
   * Add state after current one (removes redo states), keeps the last `historyLimit` states
   * @param state
   */
  private _push(state: string) {
    this.appHistory = this.appHistory.slice(0, this.appHistoryStep + 1);
    this.appHistory.push(state);

    if (this.appHistory.length > historyLimit) {
      this.appHistory = this.appHistory.slice(-historyLimit);
    }

    this.appHistoryStep = this.appHistory.length - 1;
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
  private _restoreState(state: string) {
    this.drawer.getWidget<SelectWidget>('selection')?.clearSelection();
    this.drawer.getDrawingShapes().forEach((shape) => shape.destroy());

    (JSON.parse(state) as ShapeState[]).forEach((shape) => {
      this.drawer.addShape(Node.create(shape) as DrawingShape);
    });
  }
}
