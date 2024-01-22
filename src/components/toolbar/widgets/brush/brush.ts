import { Drawer } from '../../../../Drawer';
import { stringToNode } from '../../../../utils/functions';
import { BaseWidget } from '../BaseWidget';
import BrushIcon from './brush.svg?raw';
export class BrushWidget extends BaseWidget {
  constructor(protected drawer: Drawer) {
    const $BrushIcon = stringToNode<SVGElement>(BrushIcon);
    super(drawer, 'brush', 'Brush', $BrushIcon);
  }
}
