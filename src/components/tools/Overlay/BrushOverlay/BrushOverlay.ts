import type { Drawer } from '@/Drawer';
import { BaseOverlay } from '../BaseOverlay';
import './brush-overlay.scss';


export class BrushOverlay extends BaseOverlay {

  constructor(drawer: Drawer) {
    super(drawer);
  }
}
