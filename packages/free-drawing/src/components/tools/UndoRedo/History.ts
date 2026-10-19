import type { Drawer } from '@/Drawer';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { Node } from 'konva/lib/Node';
import type { DrawingShape } from '@/@types/drawer';
import { historyLimit } from '@/constants';
import type { ShapeState } from '@/@types/file';

/**
 * State of a drawing shape or group (history, collaboration, files), without `draggable` which depends on active tool
 * @param shape Drawing shape or group (with its shapes) to serialize
 * @returns Konva object of the shape, `draggable` removed at every level
 */
export function getShapeState(shape: DrawingShape): ShapeState {
  return toState(shape.toObject());
}

/**
 * Konva object of a node and of its children without `draggable` (attrs changed in place)
 * @returns State with the same attrs and class name, children converted too
 */
function toState({ attrs, className, children }: ShapeState): ShapeState {
  delete attrs.draggable;

  return children ? { attrs, className, children: children.map(toState) } : { attrs, className };
}

/**
 * JSON of a drawing shape state
 * @param shape Drawing shape or group to serialize
 * @returns JSON string of `getShapeState`, an item of history states
 */
export function serializeShape(shape: DrawingShape): string {
  return JSON.stringify(getShapeState(shape));
}

/**
 * Undo / redo history of the drawing: states of drawing shapes, at most `historyLimit`
 */
export class History {
  /**
   * Drawing states, JSON of shapes array (string is lighter than objects and compared without serializing again)
   */
  appHistory: string[] = ['[]'];
  /** Index of current state in `appHistory`: states before it are undone, states after it redone */
  appHistoryStep: number = 0;
  /** Drawer whose shapes are saved and restored */
  drawer: Drawer;

  /**
   * Create a history with an empty drawing as only state
   * @param drawer Drawer whose shapes are saved and restored
   */
  constructor(drawer: Drawer) {
    this.drawer = drawer;
  }

  /**
   * Add current drawing as a new state (on each drawer change), skipped when identical to current state
   * @param fromSaved drawing loaded from a save: one state per shape added, so that each one can be undone
   */
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
   * @param state JSON array of drawing shape states, becomes the current state
   */
  private _push(state: string) {
    this.appHistory = this.appHistory.slice(0, this.appHistoryStep + 1);
    this.appHistory.push(state);

    if (this.appHistory.length > historyLimit) {
      this.appHistory = this.appHistory.slice(-historyLimit);
    }

    this.appHistoryStep = this.appHistory.length - 1;
  }

  /**
   * Current drawing is the first state (e.g. loaded from storage): nothing to undo or redo
   */
  reset() {
    this.appHistory = [`[${this.drawer.getDrawingShapes().map(serializeShape).join(',')}]`];
    this.appHistoryStep = 0;
  }

  /**
   * A state is before the current one
   * @returns True when undo can restore a previous state
   */
  canUndo() {
    return !!this.appHistory[this.appHistoryStep - 1];
  }

  /**
   * Restore previous state, nothing when there is none
   */
  undo() {
    if (!this.canUndo()) return;

    this.appHistoryStep -= 1;
    this._restoreState(this.appHistory[this.appHistoryStep]);
  }

  /**
   * A state undone is after the current one
   * @returns True when redo can restore a next state
   */
  canRedo() {
    return !!this.appHistory[this.appHistoryStep + 1];
  }

  /**
   * Restore next state, nothing when there is none
   */
  redo() {
    if (!this.canRedo()) return;

    this.appHistoryStep += 1;
    this._restoreState(this.appHistory[this.appHistoryStep]);
  }

  /**
   * Replace drawing by given state
   * @param state JSON array of drawing shape states (an item of `appHistory`)
   */
  private _restoreState(state: string) {
    this.drawer.getWidget<SelectWidget>('selection')?.clearSelection();
    for (const shape of this.drawer.getDrawingShapes()) shape.destroy();

    (JSON.parse(state) as ShapeState[]).forEach((shape) => {
      this.drawer.addShape(Node.create(shape) as DrawingShape);
    });
  }
}
