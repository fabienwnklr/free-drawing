import type { Container } from 'konva/lib/Container';
import type { Node } from 'konva/lib/Node';
import { Shape } from 'konva/lib/Shape';
import { Arrow } from 'konva/lib/shapes/Arrow';
import { Text } from 'konva/lib/shapes/Text';
import type { Vector2d } from 'konva/lib/types';
import type { Transform } from 'konva/lib/Util';
import type { LayerIndex } from '@/@types/shapes';
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
 * Nodes of a layer by id and texts of shapes by the id of their shape, found in one walk: for an operation looking up
 * many shapes (a search of the layer for each one would take the square of the number of shapes)
 * @param layer Draw layer
 * @returns Index of the layer as it is now
 */
export function indexLayer(layer: Container): LayerIndex {
  const byId = new Map<string, Node>();
  const texts = new Map<string, Text>();

  for (const node of layer.find(() => true)) {
    const id = node.id();

    // first one in the layer, as `findOne`
    if (id && !byId.has(id)) byId.set(id, node);
    if (isBoundText(node) && !texts.has(node.getAttr('containerId'))) texts.set(node.getAttr('containerId'), node);
  }
  return { byId, texts };
}

/**
 * Shape holding a text
 * @param text Text of a shape
 * @param layer Draw layer
 * @param index Index of the layer (`indexLayer`), else the layer is searched
 * @returns Its shape, null when removed
 */
export function getContainer(text: Node, layer: Container, index?: LayerIndex): Shape | null {
  const id = text.getAttr('containerId');
  const node = !id ? undefined : index ? index.byId.get(id) : layer.findOne((n: Node) => n.id() === id);

  return node && isContainer(node) ? node : null;
}

/**
 * Text of a shape
 * @param container Rectangle, ellipse, path shape or arrow
 * @param layer Draw layer
 * @param index Index of the layer (`indexLayer`), else the layer is searched
 * @returns Its text, null without text
 */
export function getBoundText(container: Node, layer: Container, index?: LayerIndex): Text | null {
  const id = container.id();

  if (!id) return null;
  if (index) return index.texts.get(id) ?? null;
  return layer.findOne<Text>((n: Node) => n instanceof Text && n.getAttr('containerId') === id) ?? null;
}

/**
 * Shapes with the texts they hold and the shapes holding them: selected, moved, styled and removed together
 * @param nodes Shapes (selection...)
 * @param layer Draw layer
 * @returns Shapes and their partners, each one once, in their order
 */
export function withBoundTexts<T extends Node>(nodes: T[], layer: Container): T[] {
  const index = indexLayer(layer);
  const partners = nodes.map((node) =>
    isBoundText(node) ? getContainer(node, layer, index) : getBoundText(node, layer, index)
  );

  return [...new Set([...nodes, ...partners.filter((node): node is NonNullable<typeof node> => !!node)])] as T[];
}

/**
 * Shapes arranged by themselves (align, distribute, stack): texts of shapes and labels of arrows given with their
 * shape follow it, they are not counted
 * @param nodes Shapes (selection...)
 * @returns Shapes without the texts whose shape is given too
 */
export function withoutBoundTexts<T extends Node>(nodes: T[]): T[] {
  const ids = new Set(nodes.map((node) => node.id()));

  return nodes.filter((node) => !isBoundText(node) || !ids.has(node.getAttr('containerId')));
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
 * Transform mirroring what it draws (shape or group flipped once)
 * @param transform Transform of a node
 * @returns True when its determinant is negative
 */
const isMirrored = (transform: Transform) => {
  const [a, b, c, d] = transform.getMatrix();

  return a * d - b * c < 0;
};

/**
 * Place a text in its shape: centered in it, as wide as its inside (inner rectangle of ellipses, 70 % of path shapes)
 * and turned with it, never scaled (a resize of the shape changes its width, not its letters), readable in a flipped
 * shape or group; label of an arrow: centered on its middle, as wide as its lines, halo of the background color. Hidden
 * with its shape
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

  // text of a flipped group: mirrored again, readable
  const flip = isMirrored(parent.getAbsoluteTransform()) ? -1 : 1;
  let angle = arrow ? 0 : rotation;

  // flipped shape (also twice: as turned by 180 degrees, unlike a turned one) or group: of the two angles along the
  // shape, the one reading from left to right on screen (a flipped shape is decomposed as turned by 180 degrees)
  const flipped = container.scaleX() < 0 || container.scaleY() < 0 || isMirrored(toParent);

  if (flip < 0 || (!arrow && flipped)) {
    const transform = parent.getAbsoluteTransform();
    const origin = transform.point({ x: 0, y: 0 });
    const end = transform.point({
      x: flip * Math.cos((angle * Math.PI) / 180),
      y: flip * Math.sin((angle * Math.PI) / 180),
    });

    if (Math.abs(Math.atan2(end.y - origin.y, end.x - origin.x)) > Math.PI / 2 + 1e-9) {
      angle += angle > 0 ? -180 : 180;
    }
  }

  const radians = (angle * Math.PI) / 180;
  // top left corner of the text box, its center on the center of the shape
  const [halfWidth, halfHeight] = [(flip * text.width()) / 2, text.height() / 2];

  text.setAttrs({
    x: round(center.x - halfWidth * Math.cos(radians) + halfHeight * Math.sin(radians)),
    y: round(center.y - halfWidth * Math.sin(radians) - halfHeight * Math.cos(radians)),
    // no -0 (a flipped shape turned by -180 degrees)
    rotation: round(angle) || 0,
    scaleX: flip,
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
 * @param moved Ids of the nodes moved (drag, transform: see `getMovedIds` of utils/binding): only their texts and the
 * texts moved, every text by default
 * @returns True when a text changed
 */
export function updateBoundTexts(layer: Container, background: string, moved?: Set<string>): boolean {
  const index = indexLayer(layer);
  let changed = false;

  // every one (also a second text of a shape)
  for (const text of layer.find<Text>(isBoundText)) {
    if (moved && !moved.has(text.id()) && !moved.has(text.getAttr('containerId'))) continue;

    const container = getContainer(text, layer, index);

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
