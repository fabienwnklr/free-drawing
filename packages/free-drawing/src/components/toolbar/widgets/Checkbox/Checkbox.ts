import CheckboxIcon from '@/icons/checkbox.svg?raw';
import type { Drawer } from '@/Drawer';
import { shapeName } from '@/constants';
import { PathShapeWidget } from '@/components/toolbar/widgets/PathShapeWidget';

/**
 * Check box tool: rounded square with a check mark in the dragged box (to-do lists)
 */
export class CheckboxWidget extends PathShapeWidget {
  protected shapeName = shapeName.checkbox;
  // rounded square, then the check mark (open, drawn by the stroke; turning as the square: inside the filled square,
  // not a hole)
  protected path =
    'M0.12 0L0.88 0C0.95 0 1 0.05 1 0.12L1 0.88C1 0.95 0.95 1 0.88 1L0.12 1C0.05 1 0 0.95 0 0.88L0 0.12' +
    'C0 0.05 0.05 0 0.12 0ZM0.76 0.3L0.42 0.7L0.25 0.52';

  /**
   * Create the check box tool, without shortcut
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'checkbox', 'Check box', CheckboxIcon);
  }
}
