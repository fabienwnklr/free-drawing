import DiamondIcon from '@/icons/diamond.svg?raw';
import { Drawer } from '@/Drawer';
import { shapeName } from '@/constants';
import { PathShapeWidget } from '@/components/toolbar/widgets/PathShapeWidget';

export class DiamondWidget extends PathShapeWidget {
  protected shapeName = shapeName.diamond;
  protected path = 'M0.5 0L1 0.5L0.5 1L0 0.5Z';

  constructor(drawer: Drawer) {
    super(drawer, 'diamond', 'Diamond', DiamondIcon, 'd');
  }
}
