import CloudIcon from '@/icons/cloud.svg?raw';
import { Drawer } from '@/Drawer';
import { shapeName } from '@/constants';
import { PathShapeWidget } from '@/components/toolbar/widgets/PathShapeWidget';

export class CloudWidget extends PathShapeWidget {
  protected shapeName = shapeName.cloud;
  // flat bottom, bumps on left, top and right
  protected path =
    'M0.22 1C0.08 1 0 0.88 0 0.74C0 0.6 0.1 0.5 0.22 0.49C0.21 0.24 0.36 0 0.55 0C0.7 0 0.8 0.12 0.83 0.27' +
    'C0.93 0.3 1 0.42 1 0.6C1 0.82 0.9 1 0.76 1Z';

  constructor(drawer: Drawer) {
    super(drawer, 'cloud', 'Cloud', CloudIcon);
  }
}
