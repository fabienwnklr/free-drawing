import type { Node } from 'konva/lib/Node';
import type { Container } from 'konva/lib/Container';
import type { IRect } from 'konva/lib/types';
import type { Direction, ShapeAlignment } from '@/@types/drawer';

/** Space between shapes stacked by `stackShapes` (drawing units) */
export const stackGap = 16;

/**
 * Box of a node in its layer: rotated shapes by their bounding box, as seen
 * @param node shape, group or frame
 * @param layer draw layer
 * @returns box in layer coordinates
 */
const boxOf = (node: Node, layer: Container): IRect => node.getClientRect({ relativeTo: layer });

/**
 * Move a node by a distance in layer coordinates, whatever its parent (group, content of a frame)
 * @param node shape, group or frame
 * @param layer draw layer
 * @param dx horizontal distance, layer units
 * @param dy vertical distance, layer units
 */
function moveBy(node: Node, layer: Container, dx: number, dy: number) {
  if (!dx && !dy) return;

  const position = node.getAbsolutePosition(layer);

  node.absolutePosition(layer.getAbsoluteTransform().point({ x: position.x + dx, y: position.y + dy }));
}

/**
 * Start (left or top) and size (width or height) of a box along an axis
 * @param box box in layer coordinates
 * @param direction horizontal: x and width, vertical: y and height
 * @returns start and size along the axis
 */
const along = (box: IRect, direction: Direction) =>
  direction === 'horizontal' ? { start: box.x, size: box.width } : { start: box.y, size: box.height };

/**
 * Align nodes on a side or the center of their whole box: left sides on the leftmost one, centers on the center of
 * the box...
 * @param nodes shapes to align (2 at least, else nothing done)
 * @param layer draw layer
 * @param alignment side or center of the whole box
 */
export function alignShapes(nodes: Node[], layer: Container, alignment: ShapeAlignment) {
  if (nodes.length < 2) return;

  const boxes = nodes.map((node) => boxOf(node, layer));
  const left = Math.min(...boxes.map((box) => box.x));
  const right = Math.max(...boxes.map((box) => box.x + box.width));
  const top = Math.min(...boxes.map((box) => box.y));
  const bottom = Math.max(...boxes.map((box) => box.y + box.height));

  for (const [i, node] of nodes.entries()) {
    const { x, y, width, height } = boxes[i];
    // move to the side or center, on the axis of the alignment
    const dx: Partial<Record<ShapeAlignment, number>> = {
      left: left - x,
      center: (left + right - width) / 2 - x,
      right: right - width - x,
    };
    const dy: Partial<Record<ShapeAlignment, number>> = {
      top: top - y,
      middle: (top + bottom - height) / 2 - y,
      bottom: bottom - height - y,
    };

    moveBy(node, layer, dx[alignment] ?? 0, dy[alignment] ?? 0);
  }
}

/**
 * Same space between nodes along an axis: the first and last ones (by their center) stay, the others are placed
 * between them in the order of their centers
 * @param nodes shapes to distribute (3 at least, else nothing done)
 * @param layer draw layer
 * @param direction horizontal: spaces between left and right sides, vertical: between top and bottom
 */
export function distributeShapes(nodes: Node[], layer: Container, direction: Direction) {
  if (nodes.length < 3) return;

  const items = nodes
    .map((node) => ({ node, ...along(boxOf(node, layer), direction) }))
    .sort((a, b) => a.start + a.size / 2 - (b.start + b.size / 2));
  const first = items[0];
  const last = items[items.length - 1];
  // free length between the shapes, shared out (negative when they overlap)
  const free = last.start + last.size - first.start - items.reduce((sum, item) => sum + item.size, 0);
  const gap = free / (items.length - 1);
  let position = first.start;

  for (const { node, start, size } of items) {
    const delta = position - start;

    moveBy(node, layer, direction === 'horizontal' ? delta : 0, direction === 'vertical' ? delta : 0);
    position += size + gap;
  }
}

/**
 * Nodes one after the other along an axis, `gap` between them: the first one (left or top) stays, the others follow
 * it in the order of their starts, their place on the other axis is kept
 * @param nodes shapes to stack (2 at least, else nothing done)
 * @param layer draw layer
 * @param direction horizontal: a row from left to right, vertical: a column from top to bottom
 * @param gap space between two shapes (drawing units)
 */
export function stackShapes(nodes: Node[], layer: Container, direction: Direction, gap: number = stackGap) {
  if (nodes.length < 2) return;

  const items = nodes
    .map((node) => ({ node, ...along(boxOf(node, layer), direction) }))
    .sort((a, b) => a.start - b.start);
  let position = items[0].start;

  for (const { node, start, size } of items) {
    const delta = position - start;

    moveBy(node, layer, direction === 'horizontal' ? delta : 0, direction === 'vertical' ? delta : 0);
    position += size + gap;
  }
}
