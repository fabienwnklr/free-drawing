import CloudIcon from '@/icons/cloud.svg?raw';
import type { Drawer } from '@/Drawer';
import { pathShapeData, shapeName } from '@/constants';
import { PathShapeWidget } from '@/components/toolbar/widgets/PathShapeWidget';

/**
 * Cloud tool: cloud with a flat bottom in the dragged box
 */
export class CloudWidget extends PathShapeWidget {
  protected shapeName = shapeName.cloud;
  protected path = pathShapeData[shapeName.cloud];

  /**
   * Create the cloud tool, without shortcut
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'cloud', 'Cloud', CloudIcon);
  }
}
