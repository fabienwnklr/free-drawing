import FrameIcon from '@/icons/frame.svg?raw';
import { Drawer } from '@/Drawer';
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

  constructor(drawer: Drawer) {
    super(drawer, 'frame', 'Frame', FrameIcon, 'f');
  }

  protected createShape(start: Vector2d) {
    const number = this.drawer.getDrawingShapes().filter(isFrame).length + 1;

    return createFrame({
      ...start,
      width: 0,
      height: 0,
      label: this.drawer.t('shapes.frameName', { number: String(number) }),
    });
  }

  protected updateShape(frame: Frame, start: Vector2d, end: Vector2d, constrain: boolean) {
    const { x, y, width, height } = dragBox(start, end, constrain);

    frame.position({ x, y });
    setFrameSize(frame, width, height);
  }

  protected onDrawEnd(frame: Frame | null) {
    if (!frame) return;

    // under shapes, takes those in it
    frame.moveToBottom();
    this.drawer.fitFrame(frame);
  }
}
