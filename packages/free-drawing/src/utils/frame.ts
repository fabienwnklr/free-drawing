import { _registerNode } from 'konva/lib/Global';
import { Group } from 'konva/lib/Group';
import type { Container } from 'konva/lib/Container';
import type { GetClientRectConfig, Node } from 'konva/lib/Node';
import { Rect } from 'konva/lib/shapes/Rect';
import { Text } from 'konva/lib/shapes/Text';
import type { IRect } from 'konva/lib/types';
import type { DrawingShape } from '@/@types/drawer';
import { shapeName } from '@/constants';

/** Parts of a frame (not drawing shapes) */
export const frameParts = {
  /** Name of the border rectangle (hit on border only) */
  box: 'drawer-frame-box',
  /** Name of the title text, above the box */
  title: 'drawer-frame-title',
  /** Name of the group of shapes of the frame, cut at the box edges */
  content: 'drawer-frame-content',
};

/** Color of frame border and title */
const frameColor = '#868e96';
const titleSize = 14;

/**
 * Frame: area with a title above it, its shapes are moved with it and cut at its edges.
 * Group of its box, its title and a group of its shapes (cut), its box is its client rect (transformer, selection,
 * snapping, export): title and shapes out of it are not counted.
 */
export class Frame extends Group {
  /** Not a group of shapes (types) */
  readonly frame = true;

  /**
   * Box of the frame, title and shapes out of it not counted (transformer, selection, snapping, export),
   * drawn rect for konva drawing (cache)
   */
  getClientRect(config: GetClientRectConfig = {}): IRect {
    // as drawn (cache...)
    if (config._forDrawing) return super.getClientRect(config);

    const rect = { x: 0, y: 0, width: this.width(), height: this.height() };

    return config.skipTransform ? rect : this._transformedRect(rect, config.relativeTo);
  }
}

Frame.prototype.className = 'Frame';
// created again from its JSON (history, files, collaboration)
_registerNode(Frame);

/**
 * Node is a frame: to exclude frames from checks of groups of shapes (`instanceof Group`)
 */
export function isFrame(node: Node | null | undefined): node is Frame {
  return node instanceof Frame;
}

/**
 * New frame of given box and name
 */
export function createFrame({ x, y, width, height, label }: IRect & { label: string }): Frame {
  const frame = new Frame({ name: shapeName.frame, x, y, width, height, label });

  frame.add(
    new Rect({
      name: frameParts.box,
      stroke: frameColor,
      strokeWidth: 1,
      // same width whatever zoom
      strokeScaleEnabled: false,
      // hit on border only: inside empty (konva fills hit regions)
      fillEnabled: false,
      hitStrokeWidth: 10,
    }),
    new Text({ name: frameParts.title, text: label, fontFamily: 'Ubuntu', fontSize: titleSize, fill: frameColor }),
    new Group({ name: frameParts.content })
  );
  setFrameSize(frame, width, height);

  return frame;
}

/**
 * Group of the shapes of a frame (cut at its box)
 */
export function getFrameContent(frame: Frame): Group {
  return frame.findOne<Group>(`.${frameParts.content}`)!;
}

/**
 * Title text of a frame, above its box
 */
export function getFrameTitle(frame: Frame): Text {
  return frame.findOne<Text>(`.${frameParts.title}`)!;
}

/**
 * Shapes of a frame
 */
export function getFrameShapes(frame: Frame): DrawingShape[] {
  return getFrameContent(frame).getChildren() as DrawingShape[];
}

/**
 * Size of frame: its box, cut of its shapes, title above it
 */
export function setFrameSize(frame: Frame, width: number, height: number) {
  frame.size({ width, height });
  frame.findOne(`.${frameParts.box}`)!.size({ width, height });
  getFrameContent(frame).clip({ x: 0, y: 0, width, height });
  getFrameTitle(frame).y(-titleSize - 6);
}

/**
 * Name of frame: its title
 */
export function setFrameLabel(frame: Frame, label: string) {
  frame.setAttr('label', label);
  getFrameTitle(frame).text(label);
}

/**
 * Frame of a title, if it is one
 */
export function getFrameOfTitle(node: Node): Frame | null {
  const parent = node.getParent();

  return node.hasName(frameParts.title) && isFrame(parent) ? parent : null;
}

/**
 * Container of drawing shapes: draw layer, or content of a frame
 */
export function isShapesContainer(node: Node | null, layer: Container): boolean {
  return node === layer || !!node?.hasName(frameParts.content);
}

/**
 * Drawing shape of a node of draw layer: the node itself, or its top group, in draw layer or in a frame
 * (a part of a frame gives the frame)
 */
export function getDrawingShape(node: Node, layer: Container): DrawingShape {
  let shape = node;

  while (shape.getParent() && !isShapesContainer(shape.getParent(), layer)) shape = shape.getParent()!;

  return shape as DrawingShape;
}

/**
 * Drawing shapes and shapes of frames, from bottom to top (shapes of a frame after it)
 * @param {DrawingShape[]} shapes Drawing shapes (of draw layer)
 */
export function withFrameShapes(shapes: DrawingShape[]): DrawingShape[] {
  return shapes.flatMap((shape) => (isFrame(shape) ? [shape, ...getFrameShapes(shape)] : [shape]));
}

/**
 * Frame whose box contains the center of a shape (top one), null if none
 */
export function findFrameAt(shape: DrawingShape, frames: Frame[]): Frame | null {
  const box = shape.getClientRect();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  return (
    [...frames].reverse().find((frame) => {
      const rect = frame.getClientRect();

      return frame.isVisible() && x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
    }) ?? null
  );
}

/**
 * Move a shape to another container (draw layer or content of a frame), at the same place on screen
 */
export function moveShapeTo(shape: DrawingShape, container: Container) {
  if (shape.getParent() === container) return;

  const position = shape.absolutePosition();

  shape.moveTo(container);
  shape.absolutePosition(position);
}
