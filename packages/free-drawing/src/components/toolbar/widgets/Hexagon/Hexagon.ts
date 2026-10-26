import HexagonIcon from '@/icons/hexagon.svg?raw';
import type { Drawer } from '@/Drawer';
import { shapeName } from '@/constants';
import { PathShapeWidget } from '@/components/toolbar/widgets/PathShapeWidget';

/**
 * Hexagon tool: hexagon in the dragged box, points on its left and right sides
 */
export class HexagonWidget extends PathShapeWidget {
  protected shapeName = shapeName.hexagon;
  // flat top and bottom
  protected path = 'M0.25 0L0.75 0L1 0.5L0.75 1L0.25 1L0 0.5Z';

  /**
   * Create the hexagon tool, without shortcut
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'hexagon', 'Hexagon', HexagonIcon);
  }
}
