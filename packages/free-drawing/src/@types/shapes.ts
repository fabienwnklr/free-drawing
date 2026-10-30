import type { Node } from 'konva/lib/Node';
import type { Text } from 'konva/lib/shapes/Text';
import type { IRect, Vector2d } from 'konva/lib/types';
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
 * Nodes of a layer found in one walk (see `indexLayer` of utils/boundText): lookups of an operation on many shapes,
 * instead of a search of the layer for each one
 */
export type LayerIndex = {
  /** Nodes by id (the first one in the layer, as `findOne`) */
  byId: Map<string, Node>;
  /** Texts of shapes by the id of their shape (`containerId`) */
  texts: Map<string, Text>;
};

/** Boxes of the shapes linked to the start and the end of an arrow (undefined: free end) */
export type EndBoxes = [IRect | undefined, IRect | undefined];

/**
 * Ends of an arrow from its links (see `getBoundEnds` of utils/binding), in layer coordinates
 */
export type BoundEnds = {
  /** Start of arrow */
  start: Vector2d;
  /** End of arrow */
  end: Vector2d;
  /** Sides of shapes the start and the end are fixed to */
  anchors: [Anchor | undefined, Anchor | undefined];
  /** Boxes of the linked shapes (stroke included), only for elbow arrows: they go around them */
  boxes: EndBoxes;
};

/**
 * Ends of an arrow and boxes of its linked shapes in coordinates of the arrow, to route it (see `routeArrow` of
 * utils/arrow)
 */
export type ArrowEnds = {
  /** Start of arrow */
  start: Vector2d;
  /** End of arrow */
  end: Vector2d;
  /** Boxes of the linked shapes (bounding boxes in coordinates of the arrow), only for elbow arrows */
  boxes: EndBoxes;
};

/** Line of the grid of elbow arrows (see utils/elbow): coordinate and cost of a turn onto it */
export type GridLine = {
  /** Coordinate of the line: x of a vertical line, y of a horizontal one */
  value: number;
  /** Cost added by a turn onto it: lines in the middle preferred, others only when needed */
  cost: number;
};

/** Line chosen for the middle segment of an elbow arrow (its `elbowMid` attribute) */
export type ElbowLine = {
  /** `x` for a vertical segment (moved along x), `y` for a horizontal one */
  axis: 'x' | 'y';
  /** Coordinate of the segment on this axis */
  value: number;
};

/** Middle segment of an elbow arrow (between two turns, not at its ends): moved by the handle of the arrow */
export type ElbowSegment = {
  /** Index of its first point in the points of the arrow */
  index: number;
  /** Vertical segment (moved along x), else horizontal */
  vertical: boolean;
};

/** Drag of the handle of a selected arrow (see `ArrowHandle` of utils/arrowHandle) */
export type ArrowHandleDrag = {
  /** Middle segment of an elbow arrow vertical (moved along x), else horizontal; unused for curves */
  vertical: boolean;
  /** Coordinate of the middle segment of the elbow arrow without `elbowMid` (the handle snaps to it), null without */
  initial: number | null;
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

/** Shape recognized in a freehand stroke (see `recognizeShape` of utils/recognition) */
export type RecognizedKind = 'rect' | 'ellipse' | 'triangle' | 'diamond' | 'line' | 'arrow';

/**
 * Shape recognized in a freehand stroke: drawn by the tool of its kind from `start` to `end`, as by a drag
 */
export type RecognizedShape = {
  /** Kind of shape */
  kind: RecognizedKind;
  /** Top left corner of its box (closed shapes), start of a line, tail of an arrow */
  start: Vector2d;
  /** Bottom right corner of its box (closed shapes), end of a line, tip of an arrow */
  end: Vector2d;
};
