import type { Drawer } from '@/Drawer';
import { History } from '@/components/tools/UndoRedo/History';
import UndoIcon from '@/icons/undo.svg?raw';
import RedoIcon from '@/icons/redo.svg?raw';
import '@/components/tools/UndoRedo/undo-redo.scss';
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

    this.$btnUndo = createButton('drawer-button', 'drawer-button-neutral');
    this.$btnUndo.innerHTML = UndoIcon;
    this.$btnUndo.setAttribute('aria-keyshortcuts', 'Control+Z');

    this.$btnRedo = createButton('drawer-button', 'drawer-button-neutral');
    this.$btnRedo.innerHTML = RedoIcon;
    this.$btnRedo.setAttribute('aria-keyshortcuts', 'Control+Y');
    drawer.i18n.translate((t) => {
      this.$undoRedoContainer.setAttribute('aria-label', t('history.label'));
      setLabel(this.$btnUndo, t('history.undo'));
      setLabel(this.$btnRedo, t('history.redo'));
    });

    this.$undoRedoContainer.append(...[this.$btnUndo, this.$btnRedo]);

    this.drawer.layout.add('footerStart', this.$undoRedoContainer, { hideInZen: true });

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
    if (!this.canUndo() || this.drawer.readOnly) {
      disableElement(this.$btnUndo);
    } else {
      enableElement(this.$btnUndo);
    }
  }

  manageRedoBtn() {
    if (!this.canRedo() || this.drawer.readOnly) {
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
