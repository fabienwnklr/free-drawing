import type { Node } from 'konva/lib/Node';
import type { IRect } from 'konva/lib/types';
import { Util } from 'konva/lib/Util';
import type { ShapeOrder } from '@/@types/drawer';

/**
 * Move shapes in stacking order of their layer, relative order of moved shapes is kept.
 * `forward` / `backward`: above / below the next shape they overlap (moving past other shapes changes nothing),
 * `front` / `back`: above / below all shapes
 * @param shapes top nodes to move (selection), children of the same parent; shapes without parent ignored
 * @param order where to move them
 * @returns true if a shape moved
 */
export function reorderShapes(shapes: Node[], order: ShapeOrder): boolean {
  const moved = new Set(shapes.filter((shape) => shape.getParent()));
  const sorted = [...moved].sort((a, b) => a.index - b.index);
  // places of moved shapes
  const places = () =>
    [...moved]
      .map((shape) => shape.index)
      .sort((a, b) => a - b)
      .join();
  const before = places();
  const rects = new Map<Node, IRect>();
  const rect = (node: Node) => rects.get(node) ?? rects.set(node, node.getClientRect()).get(node)!;
  // next visible shape overlapping given one: above it (step 1) or below it (step -1)
  const nextOverlapping = (shape: Node, step: 1 | -1) => {
    const siblings = shape.getParent()!.children;

    for (let i = shape.index + step; i >= 0 && i < siblings.length; i += step) {
      if (siblings[i].visible() && Util.haveIntersection(rect(shape), rect(siblings[i]))) return siblings[i];
    }
  };

  if (order === 'front') {
    sorted.forEach((shape) => shape.moveToTop());
  } else if (order === 'back') {
    sorted.reverse().forEach((shape) => shape.moveToBottom());
  } else {
    const step = order === 'forward' ? 1 : -1;

    // highest first when moving forward (lowest first backward): a moved shape is not passed by the next ones
    (step === 1 ? sorted.reverse() : sorted).forEach((shape) => {
      const other = nextOverlapping(shape, step);

      // an overlapping moved shape stays above (below): order of moved shapes is kept
      if (other && !moved.has(other)) shape.zIndex(other.index);
    });
  }

  return places() !== before;
}

/**
 * Put shapes of given ids in this stacking order (order of another client), other shapes keep their place
 * @param nodes Shapes of a layer
 * @param ids Ids of shapes, from bottom to top
 */
export function applyOrder(nodes: Node[], ids: string[]) {
  const byId = new Map(nodes.map((node) => [node.id(), node]));
  const listed = [...new Set(ids)].map((id) => byId.get(id)).filter((node): node is Node => !!node?.getParent());

  if (!listed.length) return;

  // places of listed shapes, filled in given order
  const target = [...listed[0].getParent()!.children];
  const places = listed.map((node) => node.index).sort((a, b) => a - b);

  places.forEach((place, i) => (target[place] = listed[i]));
  target.forEach((node, index) => {
    if (node.index !== index) node.zIndex(index);
  });
}
