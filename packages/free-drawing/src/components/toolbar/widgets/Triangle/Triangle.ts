import TriangleIcon from '@/icons/triangle.svg?raw';
import type { Drawer } from '@/Drawer';
import { pathShapeData, shapeName } from '@/constants';
import { PathShapeWidget } from '@/components/toolbar/widgets/PathShapeWidget';

/**
 * Triangle tool: triangle pointing up in the dragged box
 */
export class TriangleWidget extends PathShapeWidget {
  protected shapeName = shapeName.triangle;
  protected path = pathShapeData[shapeName.triangle];

  /**
   * Create the triangle tool, without shortcut
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'triangle', 'Triangle', TriangleIcon);
  }
}
