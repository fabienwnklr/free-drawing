import type { Container } from 'konva/lib/Container';
import type { IRect } from 'konva/lib/types';
import type { DrawingShape } from '@/@types/drawer';
import { type Frame, getFrameTitle, isFrame } from '@/utils/frame';

/**
 * Items in reading order: rows from top to bottom, left to right in a row. An item starting above the middle of the
 * first item of a row belongs to this row: boxes of a row need not be aligned
 * @param items Items to order
 * @param getBox Box of an item
 * @returns Items in reading order (new array)
 */
export function inReadingOrder<T>(items: T[], getBox: (item: T) => IRect): T[] {
  const boxes = items.map((item) => ({ item, box: getBox(item) })).sort((a, b) => a.box.y - b.box.y);
  const rows: (typeof boxes)[] = [];

  for (const entry of boxes) {
    const row = rows.at(-1);

    if (row && entry.box.y < row[0].box.y + row[0].box.height / 2) row.push(entry);
    else rows.push([entry]);
  }

  return rows.flatMap((row) => row.sort((a, b) => a.box.x - b.box.x).map(({ item }) => item));
}

/**
 * Slides of a drawing: its visible frames, in reading order
 * @param shapes Drawing shapes
 * @param layer Draw layer: coordinates of the boxes of the frames
 * @returns Frames presented one after the other
 */
export function getSlides(shapes: DrawingShape[], layer: Container): Frame[] {
  return inReadingOrder(
    shapes.filter((shape): shape is Frame => isFrame(shape) && shape.isVisible()),
    (frame) => frame.getClientRect({ relativeTo: layer })
  );
}

/**
 * Title of a slide
 * @param frame Frame of the slide
 * @returns Name of the frame, empty without
 */
export function getSlideTitle(frame: Frame): string {
  return getFrameTitle(frame).text().trim();
}
