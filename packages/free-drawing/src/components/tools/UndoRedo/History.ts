import type { Drawer } from '@/Drawer';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { Node } from 'konva/lib/Node';
import type { ColorLike, DrawingShape } from '@/@types/drawer';
import { historyLimit } from '@/constants';
import type { HistoryChange, HistoryEntry, ShapeState } from '@/@types/file';
import { applyOrder } from '@/utils/order';
import { updateBindings } from '@/utils/binding';
import { updateBoundTexts } from '@/utils/boundText';

/**
 * State of a drawing shape or group (history, collaboration, files), without `draggable` which depends on active tool
 * @param shape Drawing shape or group (with its shapes) to serialize
 * @returns Konva object of the shape, `draggable` removed at every level
 */
export function getShapeState(shape: DrawingShape): ShapeState {
  return toState(shape.toObject());
}

/**
 * State of a drawing shape at its place in the drawing: a shape of a group or of a frame selected alone takes the
 * transform of its parents (drawing files of a selection, library items)
 * @param shape Drawing shape or group
 * @returns State of `getShapeState`, with its position, rotation and scale in the drawing
 */
export function getStateInDrawing(shape: DrawingShape): ShapeState {
  const state = getShapeState(shape);
  const layer = shape.getLayer();

  if (layer && shape.getParent() !== layer) {
    const transform = layer.getAbsoluteTransform().copy().invert().multiply(shape.getAbsoluteTransform());

    // offsets in the transform already
    state.attrs = { ...state.attrs, ...transform.decompose(), offsetX: 0, offsetY: 0 };
  }
  return state;
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
 * @returns JSON string of `getShapeState`, states of history entries
 */
export function serializeShape(shape: DrawingShape): string {
  return JSON.stringify(getShapeState(shape));
}

/**
 * State of a shape, group or frame where a change of this user is undone or redone over the changes of other users made
 * since (collaboration, another tab): its nodes take their state of `target` where the change set them, nodes added in
 * it by others are kept, nodes removed from it by others not put back, attributes changed by others kept where the
 * change did not set them
 * @param target State to restore: before the change to undo it, after it to redo it
 * @param base State on the other side of the change
 * @param current State now
 * @returns State to create
 */
function mergeState(target: ShapeState, base: ShapeState, current: ShapeState): ShapeState {
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  const idOf = (state: ShapeState) => state.attrs.id as string | undefined;
  const attrs = same(base.attrs, target.attrs) ? current.attrs : target.attrs;

  if (current.className !== target.className) return target;
  if (!target.children || !base.children || !current.children) return { ...target, attrs };
  // nodes without id (saves of previous versions): not matched
  if ([target, base, current].some(({ children }) => children!.some((child) => !idOf(child)))) return target;

  const targets = new Map(target.children.map((child) => [idOf(child)!, child]));
  const bases = new Map(base.children.map((child) => [idOf(child)!, child]));
  const children: ShapeState[] = [];

  for (const child of current.children) {
    const id = idOf(child)!;
    const before = bases.get(id);
    const after = targets.get(id);

    // added by the change: removed; changed by it: merged; added by others: kept
    if (before && !after) continue;
    children.push(before && after ? mergeState(after, before, child) : child);
  }

  const ids = () => children.map(idOf);

  // removed by the change: put back above the nearest node below them in the target
  for (const [index, child] of target.children.entries()) {
    const id = idOf(child)!;

    if (bases.has(id) || ids().includes(id)) continue;

    const placed = new Set(ids());
    const below = target.children
      .slice(0, index)
      .map(idOf)
      .reverse()
      .find((other) => placed.has(other));

    children.splice(below === undefined ? 0 : ids().indexOf(below) + 1, 0, child);
  }

  // stacking order set by the change: its nodes in this order, at the places they take
  const common = (states: ShapeState[]) => states.map(idOf).filter((id) => targets.has(id!) && bases.has(id!));

  if (common(target.children).join() !== common(base.children).join()) {
    const order = common(target.children).filter((id) => ids().includes(id));
    const slots = children.flatMap((child, index) => (order.includes(idOf(child)) ? [index] : []));
    const moved = order.map((id) => children.find((child) => idOf(child) === id)!);

    for (const [index, slot] of slots.entries()) children[slot] = moved[index];
  }

  return { attrs, className: target.className, children };
}

/**
 * Undo / redo history of the changes of this user: shapes added, changed or removed by each change, and background
 * color, at most `historyLimit` states. Changes of other users (collaboration) are not recorded, undo and redo keep them
 */
export class History {
  /** Changes of the drawing made by this user, oldest first */
  entries: HistoryEntry[] = [];
  /** Number of entries done: entries before it are undone by undo, entries from it redone by redo */
  step: number = 0;
  /** Drawer whose shapes are saved and restored */
  drawer: Drawer;
  /** Drawing as last recorded (JSON of each shape by id, bottom first): next change of this user compared with it */
  #known = new Map<string, string>();
  /** Background color as last recorded */
  #knownBackground: ColorLike;

  /**
   * Create a history without change, the drawing being empty
   * @param drawer Drawer whose shapes are saved and restored
   */
  constructor(drawer: Drawer) {
    this.drawer = drawer;
    this.#knownBackground = this._readBackground();
  }

  /**
   * States of previous versions: first item stands for the state before the oldest change, each other one is the JSON
   * of a change (`HistoryEntry`)
   * @deprecated changes are in `entries`
   * @returns Items of states, as many as states kept
   */
  get appHistory(): string[] {
    return ['[]', ...this.entries.map((entry) => JSON.stringify(entry))];
  }

  /**
   * Index of current state in `appHistory` of previous versions
   * @deprecated use `step`
   * @returns Number of entries done
   */
  get appHistoryStep(): number {
    return this.step;
  }

  /**
   * Record the change of the drawing made since last record (on each drawer change), nothing when the drawing did not
   * change
   * @param fromSaved drawing loaded from a save: one change per shape added, so that each one can be undone
   */
  saveState(fromSaved = false) {
    const current = this._read();

    if (fromSaved) {
      const ids = [...current.keys()];

      // only last ones, history is limited
      for (let i = Math.max(0, ids.length + 1 - historyLimit); i < ids.length; i++) {
        this._push({
          changes: [{ id: ids[i], before: null, after: current.get(ids[i])! }],
          after: ids.slice(0, i + 1),
        });
      }
      this.#known = current;
      this.#knownBackground = this._readBackground();
      return;
    }

    const background = this._readBackground();
    let entry = this._diff(this.#known, current);

    // background changed (alone or with shapes, e.g. file opened)
    if (background !== this.#knownBackground) {
      entry ??= { changes: [] };
      entry.background = { before: this.#knownBackground, after: background };
    }
    this.#known = current;
    this.#knownBackground = background;
    // change without drawing modification (pan, grid...): also keeps redo available
    if (entry) this._push(entry);
  }

  /**
   * Shapes changed by other users (collaboration): their state becomes the known one, so the next change of this user
   * records only its own modifications, and undo does not revert changes of others
   * @param ids Ids of shapes added, changed or removed by another user
   */
  ignoreChanges(ids: Iterable<string>) {
    const changed = new Set(ids);
    const known = this.#known;
    const shapes = new Map(this.drawer.getDrawingShapes().map((shape) => [shape.id(), shape]));
    // in current order, shapes added here not recorded yet left out (recorded with their change)
    const order = [...shapes.keys()].filter((id) => changed.has(id) || known.has(id));
    const listed = new Set(order);
    let below: string | undefined;

    // shapes removed here not recorded yet (erased before the change fired): known at their place
    for (const id of known.keys()) {
      if (!listed.has(id) && !changed.has(id)) {
        order.splice(below === undefined ? 0 : order.indexOf(below) + 1, 0, id);
        listed.add(id);
      }
      if (listed.has(id)) below = id;
    }

    this.#known = new Map(
      order.map((id) => {
        const shape = shapes.get(id);

        return [id, changed.has(id) && shape ? serializeShape(shape) : known.get(id)!];
      })
    );
  }

  /**
   * Background color changed by another user (collaboration): known as it is now, undo does not revert it
   */
  ignoreBackground() {
    this.#knownBackground = this._readBackground();
  }

  /**
   * Background color of the drawing
   * @returns Fill of the background rectangle
   */
  private _readBackground() {
    return this.drawer.background.fill() as ColorLike;
  }

  /**
   * JSON of each drawing shape
   * @returns JSON by id, bottom first
   */
  private _read() {
    // found once per change (also read by collaboration)
    return this.drawer._shapeStates();
  }

  /**
   * Change between two states of the drawing
   * @param known Drawing as last recorded
   * @param current Drawing now
   * @returns Shapes added, changed and removed, with their places when needed; null without difference
   */
  private _diff(known: Map<string, string>, current: Map<string, string>): HistoryEntry | null {
    const changes: HistoryChange[] = [];

    for (const [id, after] of current) {
      const before = known.get(id) ?? null;

      if (before !== after) changes.push({ id, before, after });
    }
    for (const [id, before] of known) {
      if (!current.has(id)) changes.push({ id, before, after: null });
    }

    const before = [...known.keys()];
    const after = [...current.keys()];
    const reordered = before.filter((id) => current.has(id)).join() !== after.filter((id) => known.has(id)).join();

    if (!changes.length && !reordered) return null;

    const removed = changes.some((change) => change.after === null);
    const added = changes.some((change) => change.before === null);

    // places of shapes put back: removed ones by undo, added ones by redo
    return {
      changes,
      ...((removed || reordered) && { before }),
      ...((added || reordered) && { after }),
      ...(reordered && { reordered }),
    };
  }

  /**
   * Add an entry after the entries done (removes the ones undone), keeps the last ones
   * @param entry Change of this user, done
   */
  private _push(entry: HistoryEntry) {
    this.entries = this.entries.slice(0, this.step);
    this.entries.push(entry);
    // with the current state: `historyLimit` states
    if (this.entries.length >= historyLimit) {
      this.entries = this.entries.slice(1 - historyLimit);
    }
    this.step = this.entries.length;
  }

  /**
   * Image files of the shapes of the history (put back by undo or redo): kept by the drawer
   * @returns Ids of the files of the images in the entries
   */
  fileIds(): Set<string> {
    const ids = new Set<string>();

    for (const { changes } of this.entries) {
      for (const { before, after } of changes) {
        for (const state of [before, after]) {
          for (const [, id] of state?.matchAll(/"fileId":"([\w-]+)"/g) ?? []) ids.add(id);
        }
      }
    }
    return ids;
  }

  /**
   * Current drawing is the first state (e.g. loaded from storage): nothing to undo or redo
   */
  reset() {
    this.entries = [];
    this.step = 0;
    this.#known = this._read();
    this.#knownBackground = this._readBackground();
  }

  /**
   * A change of this user can be undone
   * @returns True when undo can restore a previous state
   */
  canUndo() {
    return this.step > 0;
  }

  /**
   * Undo the last change of this user, nothing when there is none. A change of shapes removed since by other users
   * has nothing left to undo: it is dropped, and the one before is undone
   */
  undo() {
    while (this.canUndo()) {
      this.step -= 1;
      if (this._apply(this.entries[this.step], 'before')) return;
      this.entries.splice(this.step, 1);
    }
  }

  /**
   * A change undone can be done again
   * @returns True when redo can restore a next state
   */
  canRedo() {
    return this.step < this.entries.length;
  }

  /**
   * Do again the last change undone, nothing when there is none (changes without effect dropped, as by `undo`)
   */
  redo() {
    while (this.canRedo()) {
      if (this._apply(this.entries[this.step], 'after')) {
        this.step += 1;
        return;
      }
      this.entries.splice(this.step, 1);
    }
  }

  /**
   * Put the shapes of a change in their state before it (undo) or after it (redo), other shapes kept as they are
   * (changes of other users). A shape changed by it and removed since by another user is not put back
   * @param entry Change of this user
   * @param side State to restore: 'before' to undo, 'after' to redo
   * @returns True when the drawing changed
   */
  private _apply(entry: HistoryEntry, side: 'before' | 'after') {
    const other = side === 'before' ? 'after' : 'before';
    const shapes = new Map(this.drawer.getDrawingShapes().map((shape) => [shape.id(), shape]));
    const order = entry[side];
    const restored = new Set<string>();
    let applied = !!entry.reordered;

    this.drawer.getWidget<SelectWidget>('selection')?.clearSelection();
    // background of the change
    if (entry.background && entry.background[side] !== this._readBackground()) {
      this.drawer._setBackground(entry.background[side]);
      applied = true;
    }
    for (const change of entry.changes) {
      const state = change[side];
      const shape = shapes.get(change.id);

      if (state === null) {
        // added by the change
        if (shape) {
          shape.destroy();
          applied = true;
        }
        continue;
      }
      // removed by another user since
      if (!shape && change[other] !== null) continue;

      // replaced at its place, or put back
      const index = shape?.zIndex();
      const now = shape && serializeShape(shape);
      // changed by others since (shapes added in a group or frame, removed from it...): their changes kept
      const restoredState =
        now && change[other] !== null && now !== change[other]
          ? mergeState(JSON.parse(state), JSON.parse(change[other]), JSON.parse(now))
          : JSON.parse(state);

      shape?.destroy();
      const node = this.drawer._addShape(Node.create(restoredState) as DrawingShape);

      if (index === undefined) restored.add(change.id);
      else node.zIndex(index);
      applied = true;
    }

    if (order && entry.reordered) {
      // shapes reordered by the change, other ones at their place
      const kept = new Set(entry[other]);

      applyOrder(
        this.drawer.getDrawingShapes(),
        order.filter((id) => kept.has(id))
      );
    }
    if (order && restored.size) this._place(restored, order);
    if (!applied) return false;

    // arrows of other users linked to these shapes follow them, texts stay in their shapes, as part of this change (the
    // change handler would find them changed: redo lost)
    updateBindings(this.drawer.drawLayer);
    updateBoundTexts(this.drawer.drawLayer, this._readBackground() as string);
    this.#known = this._read();
    this.#knownBackground = this._readBackground();
    return true;
  }

  /**
   * Put shapes back at their place: above the nearest shape below them in given order which is in the drawing
   * @param ids Ids of shapes to place (added on top)
   * @param order Ids of drawing shapes, bottom first (`before` of an entry undone, `after` of an entry redone)
   */
  private _place(ids: Set<string>, order: string[]) {
    const shapes = new Map(this.drawer.getDrawingShapes().map((shape) => [shape.id(), shape]));
    const waiting = new Set(ids);

    for (const [index, id] of order.entries()) {
      const shape = shapes.get(id);

      if (!shape || !waiting.has(id)) continue;
      waiting.delete(id);

      let below: DrawingShape | undefined;

      for (let i = index - 1; i >= 0 && !below; i--) {
        if (!waiting.has(order[i])) below = shapes.get(order[i]);
      }
      // zIndex removes the shape first: index of a shape above it goes down by one
      shape.zIndex(below ? below.zIndex() + (below.zIndex() < shape.zIndex() ? 1 : 0) : 0);
    }
  }
}
