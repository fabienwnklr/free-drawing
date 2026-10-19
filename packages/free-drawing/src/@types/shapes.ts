import type { Node } from 'konva/lib/Node';

/**
 * Side of a shape (its middle) an arrow end is fixed to
 */
export type Anchor = 'top' | 'right' | 'bottom' | 'left';

/**
 * Arrow end linked to a shape: at a side, or on its outline aiming at the other end
 */
export type BoundEnd = {
  /** Shape the end is linked to */
  shape: Node;
  /** Side whose middle the end is fixed to, else end on outline */
  anchor?: Anchor;
};
