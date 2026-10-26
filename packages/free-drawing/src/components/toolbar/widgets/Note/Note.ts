import type { Drawer } from '@/Drawer';
import type { Node } from 'konva/lib/Node';
import { Rect } from 'konva/lib/shapes/Rect';
import type { Vector2d } from 'konva/lib/types';
import NoteIcon from '@/icons/note.svg?raw';
import type { ColorLike } from '@/@types/drawer';
import { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import { NoteOverlay } from '@/components/tools/Overlay/NoteOverlay/NoteOverlay';
import { getContainer, isBoundText } from '@/utils/boundText';
import { isNote, noteAttrs, noteColors } from '@/utils/note';

/**
 * Note tool: a click adds a sticky note there (a square of a light color, its own, yellow by default) and writes in
 * it at once; a click on a note writes in it. Validated, the selection tool comes back with the note selected (unless
 * the tool is kept)
 */
export class NoteWidget extends BaseWidget {
  overlay: NoteOverlay;
  /** Color of new notes, see `noteColors` */
  color: ColorLike = noteColors[0].value;
  /** Current press ended the edit of a text: its click adds no note */
  #skipClick = false;
  protected cursor = 'crosshair';

  /**
   * Create the note tool, shortcut N, with its overlay of colors
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'note', 'Note', NoteIcon, 'n');

    this.overlay = new NoteOverlay(drawer, this.color, (color) => {
      this.color = color;
    });
  }

  /**
   * Click on a note writes in it, elsewhere adds a note and writes in it (not right or middle button, nor the click
   * whose press validated a text)
   */
  protected initEvents(): void {
    this.onStage('mousedown touchstart', (e) => {
      const textWidget = this._textWidget();

      // no mouse events of the browser after a tap: their click would add another note
      if (e.type === 'touchstart') e.evt.preventDefault();
      this.#skipClick = !!textWidget?.pressEndedEdit;
      if (textWidget) textWidget.pressEndedEdit = false;
    });
    this.onStage('click tap', (e) => {
      if (e.evt.button > 0 || this.#skipClick) return;

      const note = this._noteAt(e.target) ?? this.addNote(this.drawer._getRelativePointerPos());

      // locked note
      if (!note.isListening()) return;
      this.overlay.hide();
      this._write(note);
    });
  }

  /**
   * Tool activated: no press ended an edit with it yet
   */
  protected onActive(): void {
    const textWidget = this._textWidget();

    if (textWidget) textWidget.pressEndedEdit = false;
  }

  /**
   * Tool changed: no click to skip
   */
  protected onDesactive(): void {
    this.#skipClick = false;
  }

  /**
   * New note centered on a point of the drawing, in the frame containing it
   * @param center Center of the note, in drawing coordinates (pointer by default)
   * @returns The added note (a rectangle named `rect` and `note`)
   */
  addNote(center: Vector2d = this.drawer._getRelativePointerPos()): Rect {
    const note = this.drawer.addShape(new Rect(noteAttrs(center, this.color, this.drawer.options.opacity)));

    this.drawer.placeInFrames([note]);
    this.drawer.stage.fire('change');

    return note;
  }

  /**
   * Text tool, which edits texts of shapes
   * @returns Text widget, undefined when the toolbar has none
   */
  private _textWidget() {
    return this.drawer.getWidget<TextWidget>('text');
  }

  /**
   * Note clicked: the note or its text
   * @param target Node under the pointer
   * @returns Note, null when the click is elsewhere
   */
  private _noteAt(target: Node): Rect | null {
    const node = isBoundText(target) ? getContainer(target, this.drawer.drawLayer) : target;

    return node && isNote(node) ? node : null;
  }

  /**
   * Write in a note; once validated: tool kept (`keepTool`) with its options panel, else selection tool back with the
   * note selected
   * @param note Note to write in
   */
  private _write(note: Rect) {
    const done = () => {
      this.afterDraw();
      if (this.drawer.activeWidget === this) {
        this.showToolOverlay();
        return;
      }
      this.drawer.getWidget<SelectWidget>('selection')?.select([note]);
    };
    const textWidget = this._textWidget();

    if (textWidget) textWidget.editTextOf(note, done);
    else done();
  }
}
