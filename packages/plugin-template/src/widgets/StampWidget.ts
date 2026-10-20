import type { Group } from 'konva/lib/Group';
import type { Vector2d } from 'konva/lib/types';
import { BaseWidget, type Drawer } from '@fabwcie/free-drawing';
import { stampIcon } from '../icons';
// type only: the plugin imports this tool (no import loop at run time)
import type { StampsPlugin } from '../StampsPlugin';

/**
 * Tool of a plugin, based on `BaseWidget` (button, shortcut, activation): a press adds a stamp under the pointer, the
 * stamp follows the pointer until it is released (shown live to the other users of a collaboration session), Shift
 * keeps it on the horizontal or vertical of the press. Shows the parts of a tool:
 * - constructor: id, title, icon and shortcut;
 * - `cursor`, `initEvents` with `onStage` (events of the stage while the tool is active);
 * - pointer action (`startAction`, `endAction`), `shareLive`, `afterDraw`;
 * - `onActive`, `onDesactive`, `onConstrainChange`.
 */
export class StampWidget extends BaseWidget {
  /** Cursor of the stage while the tool is active */
  protected cursor = 'copy';
  /** Stamp following the pointer while it is pressed */
  #stamp: Group | null = null;
  /** Place of the press, in drawing coordinates */
  #start: Vector2d = { x: 0, y: 0 };
  /** Shift pressed: stamp kept on the horizontal or vertical of the press */
  #constrain = false;

  /**
   * Stamp tool: id `stamp` (title from the `tools.stamp` text, key of `drawer.getWidget('stamp')`), shortcut P
   * @param drawer drawer of the tool
   */
  constructor(drawer: Drawer) {
    // id, title without translation, svg icon, shortcut (the `widgets` drawer option can change title and shortcut)
    super(drawer, 'stamp', 'Stamp', stampIcon, 'p');
  }

  /**
   * Plugin of the tool, by its name (see the type import above)
   * @returns the stamps plugin
   */
  private get plugin() {
    return this.drawer.plugins.get<StampsPlugin>('Stamps')!;
  }

  /**
   * Events of the stage while the tool is active: `onStage` names them with the id of the tool, they are removed when
   * another tool is chosen (never call `stage.on` directly)
   */
  protected initEvents() {
    this.onStage('mousedown touchstart', (e) => {
      // main button only (right button: context menu)
      if (e.evt.button) return;

      this.#start = this.drawer.getPointerPosition();
      this.#constrain = !!e.evt.shiftKey;
      // not saved yet: moved until the pointer is released
      this.#stamp = this.plugin.stamp(this.#start, false);
      // pointer action: shortcuts disabled, interface ignores the pointer (`drawer._duringAction()`)
      if (this.#stamp) this.startAction();
    });
    this.onStage('mousemove touchmove', (e) => {
      if (!this.inAction) return;
      // no scrolling of the page on touch screens
      e.evt.preventDefault();
      this.#constrain = !!e.evt.shiftKey;
      this._move();
    });
    this.onStage('mouseup touchend', () => {
      if (this.inAction) this._finish();
    });
  }

  /**
   * Tool chosen (button, shortcut): selection of the previous tool cleared
   */
  protected onActive() {
    this.clearSelection();
  }

  /**
   * Another tool chosen during a press (its shortcut): stamp kept where it is
   */
  protected onDesactive() {
    if (this.#stamp) this._finish();
  }

  /**
   * Shift pressed or released during the press, pointer not moved: stamp placed again
   * @param constrain Shift pressed
   */
  protected onConstrainChange(constrain: boolean) {
    this.#constrain = constrain;
    this._move();
  }

  /**
   * Stamp under the pointer (on the horizontal or vertical of the press with Shift), shown live to collaborators
   */
  private _move() {
    if (!this.#stamp) return;

    const pointer = this.drawer.getPointerPosition();
    const horizontal = Math.abs(pointer.x - this.#start.x) >= Math.abs(pointer.y - this.#start.y);

    this.#stamp.position(
      this.#constrain ? (horizontal ? { x: pointer.x, y: this.#start.y } : { x: this.#start.x, y: pointer.y }) : pointer
    );
    // other users of a collaboration session see it move (its final state is sent on change)
    this.shareLive(this.#stamp);
  }

  /**
   * Press ended: stamp saved, selection tool back unless the user keeps the tool (pin of the toolbar)
   */
  private _finish() {
    const stamp = this.#stamp!;

    this.#stamp = null;
    // `setActive(false)` ends the action itself when the tool is changed during it
    if (this.inAction) this.endAction();
    this.plugin.save([stamp]);
    this.afterDraw();
  }
}
