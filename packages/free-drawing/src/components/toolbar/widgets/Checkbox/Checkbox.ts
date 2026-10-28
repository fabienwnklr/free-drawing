import CheckboxIcon from '@/icons/checkbox.svg?raw';
import type { Drawer } from '@/Drawer';
import { pathShapeData, shapeName } from '@/constants';
import { PathShapeWidget } from '@/components/toolbar/widgets/PathShapeWidget';

/**
 * Check box tool: rounded square with a check mark in the dragged box (to-do lists)
 */
export class CheckboxWidget extends PathShapeWidget {
  protected shapeName = shapeName.checkbox;
  protected path = pathShapeData[shapeName.checkbox];

  /**
   * Create the check box tool, without shortcut
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'checkbox', 'Check box', CheckboxIcon);
  }
}
