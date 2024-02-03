import type { Drawer } from '@/Drawer';
import { History } from './history';
import UndoIcon from '@/icons/undo.svg?raw';
import RedoIcon from '@/icons/redo.svg?raw';
import './undo-redo.scss';

export class UndoRedo extends History {
  $undoRedoContainer: HTMLDivElement;
  $btnUndo: HTMLDivElement;
  $btnRedo: any;

  constructor(drawer: Drawer) {
    super(drawer);
    this.$undoRedoContainer = document.createElement('div');
    this.$undoRedoContainer.classList.add('drawer-undoredo-container', 'tool');

    this.$btnUndo = document.createElement('div');
    this.$btnUndo.role = 'button';
    this.$btnUndo.classList.add('drawer-button', 'drawer-button-neutral');
    this.$btnUndo.tabIndex = 0;
    this.$btnUndo.innerHTML = UndoIcon;

    this.$btnRedo = document.createElement('div');
    this.$btnRedo.role = 'button';
    this.$btnRedo.classList.add('drawer-button', 'drawer-button-neutral');
    this.$btnRedo.tabIndex = 0;
    this.$btnRedo.innerHTML = RedoIcon;

    this.$undoRedoContainer.append(...[this.$btnUndo, this.$btnRedo]);

    this.drawer.$footerLeftElement.append(this.$undoRedoContainer);

    this._initEvents();
  }

  private _initEvents() {
    this.$btnUndo.addEventListener('click', () => {
      this.undo();
    });

    this.$btnRedo.addEventListener('click', () => {
      this.redo();
    });
  }
}
