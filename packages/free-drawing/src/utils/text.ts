import { Text } from 'konva/lib/shapes/Text';
import type { DrawingShape } from '@/@types/drawer';
import { getShapes } from '@/utils/hit';
import { getFrameOfTitle, isFrame } from '@/utils/frame';

/**
 * Texts of shapes and of their groups (not shapes of frames, nor titles of frames)
 */
export function getTexts(shapes: DrawingShape[]): Text[] {
  return shapes
    .flatMap((shape) => (isFrame(shape) ? [] : getShapes(shape)))
    .filter((shape): shape is Text => shape instanceof Text && !getFrameOfTitle(shape));
}

/**
 * Width of a text box fitting its content: longest line as konva measures it, and padding
 */
export function getContentWidth(text: Text): number {
  const attrs = { ...text.getAttrs() };

  // measured by a text of the same style with automatic width
  delete attrs.width;

  return Math.max(1, Math.ceil(new Text(attrs).width()));
}

/**
 * Fit width of a text to its content (lines no longer wrapped), its lines stay in place whatever their alignment
 * @returns {boolean} true if width changed
 */
export function fitTextWidth(text: Text): boolean {
  const width = getContentWidth(text);

  if (width === text.width()) return false;

  const align = text.align();
  // centered or right aligned lines move with box size
  const shift = (text.width() - width) * (align === 'center' ? 0.5 : align === 'right' ? 1 : 0);
  // along its own x axis (rotation, scale, flip)
  const transform = text.getTransform();
  const origin = transform.point({ x: 0, y: 0 });
  const moved = transform.point({ x: shift, y: 0 });

  text.setAttrs({ width, x: text.x() + moved.x - origin.x, y: text.y() + moved.y - origin.y });

  return true;
}
