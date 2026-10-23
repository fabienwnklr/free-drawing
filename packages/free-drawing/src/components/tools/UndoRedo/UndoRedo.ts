import type { Drawer } from '@/Drawer';
import { History } from '@/components/tools/UndoRedo/History';
import UndoIcon from '@/icons/undo.svg?raw';
import RedoIcon from '@/icons/redo.svg?raw';
import '@/components/tools/UndoRedo/undo-redo.scss';
import { createButton, disableElement, enableElement, setLabel } from '@/utils/dom';
import { ariaShortcut, formatShortcut } from '@/utils/shortcut';

/**
 * History with its undo and redo buttons (footer, hidden in zen mode), restored states fire drawer change
 */
export class UndoRedo extends History {
  /** Footer group of undo and redo buttons */
  $undoRedoContainer: HTMLDivElement;
  /** Undo button (Ctrl+Z), disabled without previous state or in read only */
  $btnUndo: HTMLButtonElement;
  /** Redo button (Ctrl+Y), disabled without next state or in read only */
  $btnRedo: HTMLButtonElement;

  /**
   * Create the history and its undo and redo buttons in footer
   * @param drawer Drawer whose shapes are saved and restored
   */
  constructor(drawer: Drawer) {
    super(drawer);
    this.$undoRedoContainer = document.createElement('div');
    this.$undoRedoContainer.classList.add('drawer-undoredo-container', 'tool');
    this.$undoRedoContainer.setAttribute('role', 'group');

    this.$btnUndo = createButton('drawer-button', 'drawer-button-neutral');
    this.$btnUndo.innerHTML = UndoIcon;
    this.$btnUndo.setAttribute('aria-keyshortcuts', ariaShortcut('Ctrl+Z'));

    this.$btnRedo = createButton('drawer-button', 'drawer-button-neutral');
    this.$btnRedo.innerHTML = RedoIcon;
    this.$btnRedo.setAttribute('aria-keyshortcuts', ariaShortcut('Ctrl+Y', 'Ctrl+Shift+Z'));
    drawer.i18n.translate((t) => {
      this.$undoRedoContainer.setAttribute('aria-label', t('history.label'));
      setLabel(this.$btnUndo, t('history.undo'));
      setLabel(this.$btnRedo, t('history.redo'));
      // shortcuts in tooltips
      this.$btnUndo.title = `${t('history.undo')} (${formatShortcut('Ctrl+Z', t)})`;
      this.$btnRedo.title = `${t('history.redo')} (${formatShortcut('Ctrl+Y', t)})`;
    });

    this.$undoRedoContainer.append(...[this.$btnUndo, this.$btnRedo]);

    this.drawer.layout.add('footerStart', this.$undoRedoContainer, { hideInZen: true });

    this._initEvents();
  }

  /**
   * Buttons undo and redo
   */
  private _initEvents() {
    this.$btnUndo.addEventListener('click', () => this.undo());
    this.$btnRedo.addEventListener('click', () => this.redo());
  }

  /**
   * Restore previous state, then fire change: saved, drawer change event, sent to collaborators, buttons updated
   * (history state already there)
   */
  undo() {
    super.undo();
    this.drawer.stage.fire('change');
  }

  /**
   * Restore next state, then fire change (as `undo`)
   */
  redo() {
    super.redo();
    this.drawer.stage.fire('change');
  }

  /**
   * Enable undo button only with a previous state, out of read only
   */
  manageUndoBtn() {
    if (!this.canUndo() || this.drawer.readOnly) {
      disableElement(this.$btnUndo);
    } else {
      enableElement(this.$btnUndo);
    }
  }

  /**
   * Enable redo button only with a next state, out of read only
   */
  manageRedoBtn() {
    if (!this.canRedo() || this.drawer.readOnly) {
      disableElement(this.$btnRedo);
    } else {
      enableElement(this.$btnRedo);
    }
  }

  /**
   * Update both buttons: drawer created or changed, history reset, read only changed
   */
  manageButtons() {
    this.manageUndoBtn();
    this.manageRedoBtn();
  }
}
