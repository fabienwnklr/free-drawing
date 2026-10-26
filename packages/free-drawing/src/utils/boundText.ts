import type { Container } from 'konva/lib/Container';
import type { Node } from 'konva/lib/Node';
import { Shape } from 'konva/lib/Shape';
import { Arrow } from 'konva/lib/shapes/Arrow';
import { Text } from 'konva/lib/shapes/Text';
import type { Vector2d } from 'konva/lib/types';
import { pathShapes, shapeName } from '@/constants';
import { getOutlineDistance } from '@/utils/binding';
import { isNote, notePadding } from '@/utils/note';

/**
 * Texts of shapes: a text with a `containerId` attribute (id of a rectangle, an ellipse, a path shape or an arrow) is
 * placed in its shape (`updateBoundTexts`): centered in it as wide as its inside and turned with it, or centered on the
 * middle of an arrow (label). It is selected, moved, styled and removed with its shape
 */
export const containerShapes = [shapeName.rect, shapeName.ellipse, ...pathShapes, shapeName.arrow];

/** Space between the text of a shape and its outline (drawing units) */
const textPadding = 8;

/** Width of the halo of arrow labels: background color around their letters, the line of the arrow cut there */
const haloWidth = 6;

/**
 * Shape that can hold a text
 * @param node Node of the drawing
 * @returns True for rectangles, ellipses, path shapes and arrows
 */
export const isContainer = (node: Node): node is Shape =>
  node instanceof Shape && containerShapes.some((name) => node.hasName(name));

/**
 * Text of a shape (`containerId` attribute)
 * @param node Node of the drawing
 * @returns True for a text placed in a shape
 */
export const isBoundText = (node: Node): node is Text => node instanceof Text && !!node.getAttr('containerId');

/**
 * Shape holding a text
 * @param text Text of a shape
 * @param layer Draw layer
 * @returns Its shape, null when removed
 */
export function getContainer(text: Node, layer: Container): Shape | null {
  const id = text.getAttr('containerId');
  const node = id ? layer.findOne((n: Node) => n.id() === id) : undefined;

  return node && isContainer(node) ? node : null;
}

/**
 * Text of a shape
 * @param container Rectangle, ellipse, path shape or arrow
 * @param layer Draw layer
 * @returns Its text, null without text
 */
export function getBoundText(container: Node, layer: Container): Text | null {
  const id = container.id();

  return (id && layer.findOne<Text>((n: Node) => n instanceof Text && n.getAttr('containerId') === id)) || null;
}

/**
 * Shapes with the texts they hold and the shapes holding them: selected, moved, styled and removed together
 * @param nodes Shapes (selection...)
 * @param layer Draw layer
 * @returns Shapes and their partners, each one once, in their order
 */
export function withBoundTexts<T extends Node>(nodes: T[], layer: Container): T[] {
  const partners = nodes.map((node) => (isBoundText(node) ? getContainer(node, layer) : getBoundText(node, layer)));

  return [...new Set([...nodes, ...partners.filter((node): node is NonNullable<typeof node> => !!node)])] as T[];
}

/**
 * Point at the middle of the length of a line
 * @param points Points of the line (x and y in turn)
 * @returns Middle point, in coordinates of the line
 */
function middleOf(points: number[]): Vector2d {
  const lengths = [];

  for (let i = 2; i < points.length; i += 2) {
    lengths.push(Math.hypot(points[i] - points[i - 2], points[i + 1] - points[i - 1]));
  }

  let rest = lengths.reduce((sum, length) => sum + length, 0) / 2;

  for (const [i, length] of lengths.entries()) {
    if (rest <= length && length) {
      const t = rest / length;

      return {
        x: points[i * 2] + (points[i * 2 + 2] - points[i * 2]) * t,
        y: points[i * 2 + 1] + (points[i * 2 + 3] - points[i * 2 + 1]) * t,
      };
    }
    rest -= length;
  }
  return { x: points[0] ?? 0, y: points[1] ?? 0 };
}

/**
 * Number rounded to 2 decimals (saved positions)
 * @param n Coordinate or size
 * @returns Rounded number
 */
const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Place a text in its shape: centered in it, as wide as its inside (inner rectangle of ellipses, 70 % of path shapes)
 * and turned with it, never scaled (a resize of the shape changes its width, not its letters); label of an arrow:
 * centered on its middle, as wide as its lines, halo of the background color. Hidden with its shape
 * @param text Text of the shape
 * @param container Its shape
 * @param background Background color of the drawing (halo of arrow labels)
 * @returns True when the text changed
 */
export function placeBoundText(text: Text, container: Shape, background: string): boolean {
  const parent = text.getParent();

  if (!parent) return false;

  const before = JSON.stringify(text.attrs);
  const height = container.height();
  // coordinates of the shape to coordinates of the parent of the text (group, content of a frame...)
  const toParent = parent.getAbsoluteTransform().copy().invert().multiply(container.getAbsoluteTransform());
  const { rotation, scaleX, scaleY } = toParent.decompose();
  const arrow = container instanceof Arrow;
  let center: Vector2d;

  if (arrow) {
    center = toParent.point(middleOf(container.points()));
    // empty label being written: room for a few words
    text.setAttrs({
      width: text.text() ? undefined : text.fontSize() * 6,
      stroke: background,
      strokeWidth: haloWidth,
      fillAfterStrokeEnabled: true,
      lineJoin: 'round',
    });
  } else {
    const inside = container.hasName(shapeName.rect) ? 1 : container.hasName(shapeName.ellipse) ? Math.SQRT1_2 : 0.7;
    const note = isNote(container);
    const padding = note ? notePadding : textPadding;

    // shape drawn to the left: negative size
    text.width(Math.max(1, round(Math.abs(container.getSelfRect().width * scaleX) * inside - 2 * padding)));
    // note taller for its text (never shorter)
    if (note && height >= 0) {
      container.height(Math.max(height, Math.ceil((text.height() + 2 * padding) / Math.abs(scaleY || 1))));
    }

    const box = container.getSelfRect();

    center = toParent.point({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
  }

  const angle = arrow ? 0 : rotation;
  const radians = (angle * Math.PI) / 180;
  // top left corner of the text box, its center on the center of the shape
  const [halfWidth, halfHeight] = [text.width() / 2, text.height() / 2];

  text.setAttrs({
    x: round(center.x - halfWidth * Math.cos(radians) + halfHeight * Math.sin(radians)),
    y: round(center.y - halfWidth * Math.sin(radians) - halfHeight * Math.cos(radians)),
    rotation: round(angle),
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
    visible: container.visible(),
  });

  return JSON.stringify(text.attrs) !== before || container.height() !== height;
}

/**
 * Texts of shapes placed in their shapes (after a move, a resize, a change); a text whose shape was removed is no
 * longer bound to it (a free text)
 * @param layer Draw layer
 * @param background Background color of the drawing (halo of arrow labels)
 * @returns True when a text changed
 */
export function updateBoundTexts(layer: Container, background: string): boolean {
  let changed = false;

  for (const text of layer.find<Text>(isBoundText)) {
    const container = getContainer(text, layer);

    if (container) {
      changed = placeBoundText(text, container, background) || changed;
    } else {
      text.setAttr('containerId', undefined);
      changed = true;
    }
  }
  return changed;
}

/**
 * Shape whose text is edited at a point: smallest rectangle, ellipse or path shape around it (also without
 * background: its empty inside)
 * @param shapes Drawing shapes (shapes of frames too)
 * @param layer Draw layer
 * @param point Point in layer coordinates (double click)
 * @returns Smallest shape around the point, null when none
 */
export function findContainerAt(shapes: Node[], layer: Container, point: Vector2d): Shape | null {
  const area = (node: Node) => {
    const { width, height } = node.getClientRect();

    return width * height;
  };
  const around = shapes.filter(
    (shape): shape is Shape =>
      isContainer(shape) &&
      !(shape instanceof Arrow) &&
      shape.isVisible() &&
      shape.isListening() &&
      getOutlineDistance(shape, layer, point) <= 0
  );

  return around.sort((a, b) => area(a) - area(b))[0] ?? null;
}
