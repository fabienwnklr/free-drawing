import { _registerNode } from 'konva/lib/Global';
import { Group } from 'konva/lib/Group';
import type { Container } from 'konva/lib/Container';
import type { Layer } from 'konva/lib/Layer';
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
/** Font size of frame title */
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
   * @param config konva options: `relativeTo` (absolute by default), `skipTransform` (own coordinates)
   * @returns box of the frame, rect of everything drawn for konva drawing
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
 * @param node any node, or nothing
 * @returns true for a frame
 */
export function isFrame(node: Node | null | undefined): node is Frame {
  return node instanceof Frame;
}

/**
 * New frame of given box and name
 * @returns frame with its box, title and empty content, not added to a layer
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
 * @param frame frame created by `createFrame` (or loaded)
 * @returns content group of the frame
 */
export function getFrameContent(frame: Frame): Group {
  return frame.findOne<Group>(`.${frameParts.content}`)!;
}

/**
 * Title text of a frame, above its box
 * @param frame frame created by `createFrame` (or loaded)
 * @returns title text node of the frame
 */
export function getFrameTitle(frame: Frame): Text {
  return frame.findOne<Text>(`.${frameParts.title}`)!;
}

/**
 * Shapes of a frame
 * @param frame frame whose shapes are read
 * @returns drawing shapes of its content, bottom first
 */
export function getFrameShapes(frame: Frame): DrawingShape[] {
  return getFrameContent(frame).getChildren() as DrawingShape[];
}

/**
 * Size of frame: its box, cut of its shapes, title above it
 * @param frame frame to resize
 * @param width new width, in frame coordinates
 * @param height new height, in frame coordinates
 */
export function setFrameSize(frame: Frame, width: number, height: number) {
  frame.size({ width, height });
  frame.findOne(`.${frameParts.box}`)!.size({ width, height });
  getFrameContent(frame).clip({ x: 0, y: 0, width, height });
  getFrameTitle(frame).y(-titleSize - 6);
}

/**
 * Name of frame: its title
 * @param frame frame to rename
 * @param label new name, set as `label` attribute and title text
 */
export function setFrameLabel(frame: Frame, label: string) {
  frame.setAttr('label', label);
  getFrameTitle(frame).text(label);
}

/**
 * Frame of a title, if it is one
 * @param node any node (hit node, double clicked node...)
 * @returns frame whose title is the node, null for other nodes
 */
export function getFrameOfTitle(node: Node): Frame | null {
  const parent = node.getParent();

  return node.hasName(frameParts.title) && isFrame(parent) ? parent : null;
}

/**
 * Container of drawing shapes: draw layer, or content of a frame
 * @param node node to check (parent of a shape), or nothing
 * @param layer draw layer
 * @returns true for the draw layer or the content group of a frame
 */
export function isShapesContainer(node: Node | null, layer: Container): boolean {
  return node === layer || !!node?.hasName(frameParts.content);
}

/**
 * Frame holding a shape
 * @param shape drawing shape
 * @returns frame whose content holds the shape, null for a shape of the drawing
 */
export function getShapeFrame(shape: DrawingShape): Frame | null {
  const content = shape.getParent();
  const frame = content?.hasName(frameParts.content) ? content.getParent() : null;

  return isFrame(frame) ? frame : null;
}

/**
 * Position, rotation, scale and skew of a frame in the drawing, to place nodes like it (highlights)
 * @param frame frame of the draw layer
 * @returns transform attributes of the frame
 */
export function frameTransform(frame: Frame) {
  return {
    x: frame.x(),
    y: frame.y(),
    rotation: frame.rotation(),
    scaleX: frame.scaleX(),
    scaleY: frame.scaleY(),
    skewX: frame.skewX(),
    skewY: frame.skewY(),
    offsetX: frame.offsetX(),
    offsetY: frame.offsetY(),
  };
}

/**
 * Shapes of frames being moved drawn above the drawing, not cut at the edges of their frame: skipped by their frame,
 * drawn by the draw layer after the drawing. Only drawn elsewhere: they stay in their frame (drawing saved, sent to
 * collaborators, kept in history while moved), placed when dropped (`placeInFrames`)
 * @param shapes shapes being moved (others ignored: of the drawing, frames, shapes of groups)
 * @param layer draw layer
 * @returns function drawing them in their frame again
 */
export function drawAbove(shapes: DrawingShape[], layer: Layer): () => void {
  // bottom first: same stacking order above the drawing
  const moved = shapes
    .map((shape) => ({ shape, frame: getShapeFrame(shape) }))
    .filter((item): item is { shape: DrawingShape; frame: Frame } => !!item.frame)
    .sort((a, b) => a.frame.zIndex() - b.frame.zIndex() || a.shape.zIndex() - b.shape.zIndex())
    .map(({ shape }) => shape);

  if (!moved.length) return () => {};

  const draws = moved.map((shape) => {
    const node: Node = shape;
    // drawing of its class, out of the cut of its frame (absolute transform and opacity)
    const draw = node.drawScene;

    // nothing drawn by its frame (own property, not an attribute: not saved)
    Object.assign(node, { drawScene: () => node });

    return () => {
      // removed meanwhile (change of a collaborator, undo...)
      if (node.getLayer() === layer) draw.call(node);
    };
  });

  layer.on('draw.moved', () => {
    for (const draw of draws) draw();
  });
  layer.batchDraw();

  return () => {
    layer.off('draw.moved');
    for (const shape of moved) Reflect.deleteProperty(shape, 'drawScene');
    layer.batchDraw();
  };
}

/**
 * Drawing shape of a node of draw layer: the node itself, or its top group, in draw layer or in a frame
 * (a part of a frame gives the frame)
 * @param node node of the draw layer (hit shape, shape of a group...)
 * @param layer draw layer
 * @returns drawing shape containing the node, the node itself when it is one
 */
export function getDrawingShape(node: Node, layer: Container): DrawingShape {
  let shape = node;

  while (shape.getParent() && !isShapesContainer(shape.getParent(), layer)) shape = shape.getParent()!;

  return shape as DrawingShape;
}

/**
 * Drawing shapes and shapes of frames, from bottom to top (shapes of a frame after it)
 * @param shapes Drawing shapes (of draw layer)
 * @returns the shapes, each frame followed by its shapes
 */
export function withFrameShapes(shapes: DrawingShape[]): DrawingShape[] {
  return shapes.flatMap((shape) => (isFrame(shape) ? [shape, ...getFrameShapes(shape)] : [shape]));
}

/**
 * Frame whose box contains the center of a shape (top one), null if none
 * @param shape shape to place (drawn, dragged, transformed...)
 * @param frames frames of the drawing, bottom first (hidden ones ignored)
 * @returns topmost visible frame containing the shape center (absolute coordinates), null if none
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
 * @param shape drawing shape to move
 * @param container new parent: draw layer or content group of a frame (nothing done when already its parent)
 */
export function moveShapeTo(shape: DrawingShape, container: Container) {
  if (shape.getParent() === container) return;

  const position = shape.absolutePosition();

  shape.moveTo(container);
  shape.absolutePosition(position);
}
