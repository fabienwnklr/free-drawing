import { Drawer } from '../../../../Drawer';
import { stringToNode } from '../../../../utils/functions';
import { BaseWidget } from '../BaseWidget';
import EraserIcon from './eraser.svg?raw';

export class EraserWidget extends BaseWidget {
  constructor(protected drawer: Drawer) {
    const $EraserIcon = stringToNode<SVGElement>(EraserIcon);
    super(drawer, 'eraser', 'Eraser', $EraserIcon, 'eraser');
  }
}
