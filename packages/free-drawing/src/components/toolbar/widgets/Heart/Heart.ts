import HeartIcon from '@/icons/heart.svg?raw';
import { Drawer } from '@/Drawer';
import { shapeName } from '@/constants';
import { PathShapeWidget } from '@/components/toolbar/widgets/PathShapeWidget';

export class HeartWidget extends PathShapeWidget {
  protected shapeName = shapeName.heart;
  // from bottom tip: left lobe, dip, right lobe
  protected path =
    'M0.5 1C0.18 0.78 0 0.56 0 0.3C0 0.11 0.14 0 0.29 0C0.4 0 0.47 0.06 0.5 0.16C0.53 0.06 0.6 0 0.71 0' +
    'C0.86 0 1 0.11 1 0.3C1 0.56 0.82 0.78 0.5 1Z';

  constructor(drawer: Drawer) {
    super(drawer, 'heart', 'Heart', HeartIcon);
  }
}
