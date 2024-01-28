import { BaseWidget } from '../BaseWidget';
import { Drawer } from '@/Drawer';
import UndoIcon from '@/icons/close.svg?raw';
import { stringToNode } from '@/utils/functions';

export class UndoWidget extends BaseWidget {
    constructor(drawer: Drawer) {
        const $UndoIcon = stringToNode<SVGElement>(UndoIcon);
        super(drawer, 'undo', 'Undo', $UndoIcon)
    }

    protected onActive(): void {
        throw new Error('Method not implemented.');
    }
    protected onDesactive(): void {
        throw new Error('Method not implemented.');
    }
    protected initEvents(): void {
        throw new Error('Method not implemented.');
    }
    protected removeEvents(): void {
        throw new Error('Method not implemented.');
    }
    protected updateCursor(): void {
        throw new Error('Method not implemented.');
    }
}
