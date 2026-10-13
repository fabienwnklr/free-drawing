import { BaseWidget } from '../BaseWidget';
import ArrowIcon from '@/icons/arrow.svg?raw';
import { Drawer } from '@/Drawer';

export class ArrowWidget extends BaseWidget {
  constructor(drawer: Drawer) {
    super(drawer, 'arrow', 'Arrow', ArrowIcon, 'a');
  }
}
