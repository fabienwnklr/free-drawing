import type { Drawer } from '@/Drawer';
import { History } from './History';
import UndoIcon from '@/icons/undo.svg?raw';
import RedoIcon from '@/icons/redo.svg?raw';
import './undo-redo.scss';
import { createButton, disableElement, enableElement, setLabel } from '@/utils/dom';

export class UndoRedo extends History {
  $undoRedoContainer: HTMLDivElement;
  $btnUndo: HTMLButtonElement;
  $btnRedo: HTMLButtonElement;

  constructor(drawer: Drawer) {
    super(drawer);
    this.$undoRedoContainer = document.createElement('div');
    this.$undoRedoContainer.classList.add('drawer-undoredo-container', 'tool');
    this.$undoRedoContainer.setAttribute('role', 'group');
    this.$undoRedoContainer.setAttribute('aria-label', 'History');

    this.$btnUndo = createButton('drawer-button', 'drawer-button-neutral');
    this.$btnUndo.innerHTML = UndoIcon;
    setLabel(this.$btnUndo, 'Undo');
    this.$btnUndo.setAttribute('aria-keyshortcuts', 'Control+Z');

    this.$btnRedo = createButton('drawer-button', 'drawer-button-neutral');
    this.$btnRedo.innerHTML = RedoIcon;
    setLabel(this.$btnRedo, 'Redo');
    this.$btnRedo.setAttribute('aria-keyshortcuts', 'Control+Y');

    this.$undoRedoContainer.append(...[this.$btnUndo, this.$btnRedo]);

    this.drawer.$footerLeftElement.append(this.$undoRedoContainer);

    this._initEvents();
  }

  private _initEvents() {
    this.$btnUndo.addEventListener('click', () => this.undo());
    this.$btnRedo.addEventListener('click', () => this.redo());
  }

  // change: saved, drawer change event, sent to collaborators, buttons updated (history state already there)
  undo() {
    super.undo();
    this.drawer.stage.fire('change');
  }

  redo() {
    super.redo();
    this.drawer.stage.fire('change');
  }

  manageUndoBtn() {
    if (!this.canUndo()) {
      disableElement(this.$btnUndo);
    } else {
      enableElement(this.$btnUndo);
    }
  }

  manageRedoBtn() {
    if (!this.canRedo()) {
      disableElement(this.$btnRedo);
    } else {
      enableElement(this.$btnRedo);
    }
  }

  manageButtons() {
    this.manageUndoBtn()
    this.manageRedoBtn()
  }
}
