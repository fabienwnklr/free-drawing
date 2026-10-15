import TriangleIcon from '@/icons/triangle.svg?raw';
import { Drawer } from '@/Drawer';
import { shapeName } from '@/constants';
import { PathShapeWidget } from '@/components/toolbar/widgets/PathShapeWidget';

export class TriangleWidget extends PathShapeWidget {
  protected shapeName = shapeName.triangle;
  protected path = 'M0.5 0L1 1L0 1Z';

  constructor(drawer: Drawer) {
    super(drawer, 'triangle', 'Triangle', TriangleIcon);
  }
}
