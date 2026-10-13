import { BaseWidget } from '../BaseWidget';
import SquareIcon from '@/icons/square.svg?raw';
import { Drawer } from '@/Drawer';

export class SquareWidget extends BaseWidget {
  constructor(drawer: Drawer) {
    super(drawer, 'square', 'Square', SquareIcon, 'r');
  }
}
