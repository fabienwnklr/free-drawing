import FrameIcon from '@/icons/frame.svg?raw';
import type { Drawer } from '@/Drawer';
import type { Vector2d } from 'konva/lib/types';
import { ShapeWidget, dragBox } from '@/components/toolbar/widgets/ShapeWidget';
import { type Frame, createFrame, isFrame, setFrameSize } from '@/utils/frame';

/**
 * Frame: area with a title (name of frame, "Frame 1"...), its shapes are moved with it and cut at its edges.
 * Shapes entirely in a new frame are put in it, shapes drawn or moved later in it too (see `Drawer.placeInFrames`).
 */
export class FrameWidget extends ShapeWidget<Frame> {
  // no style
  protected showOverlayOnActive = false;

  /**
   * Create the frame tool, shortcut F
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'frame', 'Frame', FrameIcon, 'f');
  }

  /**
   * Frame of size 0 at drag start, titled with the next frame number
   * @param start Drag start, in drawing coordinates
   * @returns Frame named "Frame n" in the language of the drawer
   */
  protected createShape(start: Vector2d) {
    return createFrame({
      ...start,
      width: 0,
      height: 0,
      label: this.drawer.t('shapes.frameName', { number: String(this._nextNumber()) }),
    });
  }

  /**
   * Number of the next frame, after the number of frames and the numbers of their names ("Frame 3" in the language of
   * the drawer): a deleted frame does not give its number to two frames
   * @returns Number of the frame drawn
   */
  private _nextNumber() {
    const frames = this.drawer.getDrawingShapes().filter(isFrame);
    // text around the number of a name
    const [before, after = ''] = this.drawer.t('shapes.frameName', { number: '\n' }).split('\n');
    const numbers = frames.map((frame) => {
      const label = this.drawer.getShapeLabel(frame);
      const named = label.startsWith(before) && label.endsWith(after);
      const number = named ? label.slice(before.length, label.length - after.length) : '';

      return /^\d+$/.test(number) ? Number(number) : 0;
    });

    return Math.max(frames.length, ...numbers) + 1;
  }

  /**
   * Frame of the dragged box
   * @param frame Frame being drawn
   * @param start Drag start, in drawing coordinates
   * @param end Pointer, in drawing coordinates
   * @param constrain Shift pressed: square frame
   */
  protected updateShape(frame: Frame, start: Vector2d, end: Vector2d, constrain: boolean) {
    const { x, y, width, height } = dragBox(start, end, constrain);

    frame.position({ x, y });
    setFrameSize(frame, width, height);
  }

  /**
   * Frame drawn: moved under other shapes, takes the shapes entirely in it
   * @param frame Frame drawn, null after a simple click
   */
  protected onDrawEnd(frame: Frame | null) {
    if (!frame) return;

    // under shapes, takes those in it
    frame.moveToBottom();
    this.drawer.fitFrame(frame);
  }
}
