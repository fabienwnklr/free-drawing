import { Drawer } from '@/Drawer';
import { stringToNode } from '@/utils/functions';
import { BaseWidget } from '../BaseWidget';
import SelectIcon from '@/icons/select.svg?raw';
import { Transformer } from 'konva/lib/shapes/Transformer';

export class SelectWidget extends BaseWidget {
  constructor(protected drawer: Drawer) {
    const $SelectIcon = stringToNode<SVGElement>(SelectIcon);
    super(drawer, 'selection', 'Select', $SelectIcon);
  }

  protected onActive(): void {
    const draw = this.drawer.layer.children.filter((e) => {
      if (!(e instanceof Transformer) && !e.hasName('background') && !e.hasName('selection')) {
        return e;
      }
    });

    draw.forEach((d) => d.setDraggable(true));
  }

  protected onDesactive(): void {
    const draw = this.drawer.layer.children.filter((e) => {
      if (!(e instanceof Transformer) && !e.hasName('background') && !e.hasName('selection')) {
        return e;
      }
    });

    draw.forEach((d) => d.setDraggable(false));
    this.drawer.transformer.nodes([]);
  }
}
