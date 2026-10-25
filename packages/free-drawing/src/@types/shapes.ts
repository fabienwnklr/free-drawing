import type { Node } from 'konva/lib/Node';
import type { Vector2d } from 'konva/lib/types';
import type { Frame } from '@/utils/frame';

/**
 * Side of a shape (its middle) an arrow end is fixed to
 */
export type Anchor = 'top' | 'right' | 'bottom' | 'left';

/** Point of the outline of a shape on the way from its center to a point (see `getOutlinePoint` of utils/binding) */
export type OutlineCrossing = {
  /** Outline point, in layer coordinates */
  point: Vector2d;
  /** Center of the shape, in layer coordinates */
  center: Vector2d;
  /** Stroke width of rectangles, ellipses and path shapes (0 for shapes checked by their box) */
  stroke: number;
};

/** Outline of a path shape in its own coordinates, for the data it was sampled from (see `getPathRings` of utils/binding) */
export type PathOutline = {
  /** Path data sampled */
  data: string;
  /** One ring of points per subpath, curves sampled, in coordinates of the shape */
  rings: Vector2d[][];
};

/**
 * Arrow end linked to a shape: at a side, or on its outline aiming at the other end
 */
export type BoundEnd = {
  /** Shape the end is linked to */
  shape: Node;
  /** Side whose middle the end is fixed to, else end on outline */
  anchor?: Anchor;
};

/**
 * Frames entered and left by shapes moved in or out of them
 */
export type FrameChanges = {
  /** Frames receiving shapes */
  entered: Frame[];
  /** Frames losing shapes */
  left: Frame[];
};
