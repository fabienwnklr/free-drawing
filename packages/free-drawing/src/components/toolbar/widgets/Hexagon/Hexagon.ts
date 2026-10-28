import HexagonIcon from '@/icons/hexagon.svg?raw';
import type { Drawer } from '@/Drawer';
import { pathShapeData, shapeName } from '@/constants';
import { PathShapeWidget } from '@/components/toolbar/widgets/PathShapeWidget';

/**
 * Hexagon tool: hexagon in the dragged box, points on its left and right sides
 */
export class HexagonWidget extends PathShapeWidget {
  protected shapeName = shapeName.hexagon;
  protected path = pathShapeData[shapeName.hexagon];

  /**
   * Create the hexagon tool, without shortcut
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'hexagon', 'Hexagon', HexagonIcon);
  }
}
