import type { Drawer } from '@/Drawer';
import type { LibraryItem } from '@/@types/file';
import type { TranslationKey } from '@/@types/i18n';
import '@/components/LibraryPanel/library-panel.scss';
import { drawerEvents } from '@/constants';
import AddIcon from '@/icons/add.svg?raw';
import CloseIcon from '@/icons/close.svg?raw';
import LibraryIcon from '@/icons/library.svg?raw';
import OpenIcon from '@/icons/open.svg?raw';
import SaveIcon from '@/icons/save.svg?raw';
import TrashIcon from '@/icons/trash.svg?raw';
import { arrowNavigation, createButton, setLabel, setPressed, uniqueId } from '@/utils/dom';
import { libraryDragType } from '@/utils/library';
import { ariaShortcut, formatShortcut } from '@/utils/shortcut';

/**
 * Panel of the library (`library` option, header button after the layers one, Alt+B): items shown by their preview, a
 * click inserts one in the middle of the view, a drag onto the drawing inserts it there; the selection is added to it,
 * the library is imported from and exported to files
 */
export class LibraryPanel {
  /** Drawer of the library (`drawer.library`) */
  drawer: Drawer;
  /** Container of the header button (hidden in zen mode) */
  $buttonContainer: HTMLDivElement;
  /** Header button showing / hiding the panel (Alt+B) */
  $button: HTMLButtonElement;
  /** Panel element (`region` named by its title): header, items, empty message, hint */
  $panel: HTMLDivElement;
  /** Header button adding the selection to the library, enabled with a selection */
  $addButton: HTMLButtonElement;
  /** Header button importing a library file */
  $importButton: HTMLButtonElement;
  /** Header button exporting the library to a file, enabled with items */
  $exportButton: HTMLButtonElement;
  /** Header button closing the panel, focus back on the panel button */
  $closeButton: HTMLButtonElement;
  /** List of items, oldest first (arrow keys move between them) */
  $list: HTMLUListElement;
  /** Message shown without items */
  $empty: HTMLParagraphElement;
  /** How to insert items */
  $hint: HTMLParagraphElement;

  /**
   * Add the header button and the hidden panel, listen to the library, the selection, read only and language changes,
   * and to items dropped on the drawing
   * @param drawer Drawer of the library
   */
  constructor(drawer: Drawer) {
    this.drawer = drawer;

    this.$buttonContainer = document.createElement('div');
    this.$buttonContainer.classList.add('drawer-library-button-container', 'tool');
    this.$button = createButton('drawer-button', 'drawer-button-neutral');
    this.$button.innerHTML = LibraryIcon;
    this.$button.setAttribute('aria-keyshortcuts', ariaShortcut('Alt+B'));
    this.$button.setAttribute('aria-expanded', 'false');
    setPressed(this.$button, false);
    this.$button.addEventListener('click', () => this.toggle());
    this.$buttonContainer.append(this.$button);
    // after the layers button, else the settings menu
    drawer.layout.add('header', this.$buttonContainer, {
      hideInZen: true,
      after: drawer.layersPanel?.$buttonContainer ?? drawer.setting.$dropdownContainer,
    });

    this.$panel = document.createElement('div');
    this.$panel.id = uniqueId('library');
    this.$panel.classList.add('drawer-library-panel', 'tool');
    this.$panel.setAttribute('role', 'region');
    this.$button.setAttribute('aria-controls', this.$panel.id);

    const $header = document.createElement('div');
    const $title = document.createElement('h2');
    const $actions = document.createElement('div');

    $header.classList.add('drawer-library-header');
    $title.classList.add('drawer-library-title');
    $title.id = uniqueId('library-title');
    this.$panel.setAttribute('aria-labelledby', $title.id);
    this.$addButton = this._createHeaderButton(AddIcon, 'library.add', () => drawer.library.add());
    this.$importButton = this._createHeaderButton(OpenIcon, 'library.import', () => drawer.library.importFile());
    this.$exportButton = this._createHeaderButton(SaveIcon, 'library.export', () => drawer.library.exportFile());
    this.$closeButton = this._createHeaderButton(CloseIcon, 'library.close', () => this._close());
    $actions.classList.add('drawer-library-header-actions');
    $actions.append(this.$addButton, this.$importButton, this.$exportButton, this.$closeButton);
    $header.append($title, $actions);

    this.$list = document.createElement('ul');
    this.$list.classList.add('drawer-library-list');
    this.$list.setAttribute('aria-labelledby', $title.id);
    this.$empty = document.createElement('p');
    this.$empty.classList.add('drawer-library-empty', 'text-muted');
    this.$hint = document.createElement('p');
    this.$hint.classList.add('drawer-library-hint', 'text-muted');
    drawer.i18n.translate((t) => {
      setLabel(this.$button, t('library.title'));
      this.$button.title = `${t('library.title')} (${formatShortcut('Alt+B', t)})`;
      $title.textContent = t('library.title');
      this.$empty.textContent = t('library.empty');
      this.$hint.textContent = t('library.hint');
    });
    this.$panel.append($header, this.$list, this.$empty, this.$hint);
    drawer.layout.add('floating', this.$panel, { hideInZen: true });

    arrowNavigation(
      this.$list,
      () => [...this.$list.querySelectorAll<HTMLElement>('.drawer-library-insert')],
      'horizontal'
    );
    this.$panel.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;

      e.stopPropagation();
      this._close();
    });

    // item dragged from the panel, dropped on the drawing: inserted there
    drawer.$stageContainer.addEventListener('dragover', (e) => {
      if (drawer.readOnly || !e.dataTransfer?.types.includes(libraryDragType)) return;

      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });
    drawer.$stageContainer.addEventListener('drop', (e) => {
      const id = e.dataTransfer?.getData(libraryDragType);

      if (drawer.readOnly || !id) return;

      e.preventDefault();
      drawer.stage.setPointersPositions(e);
      drawer.library.insert(id, drawer._getRelativePointerPos());
    });

    drawer.on(drawerEvents.libraryChange, () => this.update());
    drawer.on(drawerEvents.selectionChange, () => this._updateButtons());
    drawer.on(drawerEvents.readOnlyChange, () => this.update());
    // names of items in the new language
    drawer.on(drawerEvents.languageChange, () => this.update());
    this.update();
  }

  /**
   * Whether the panel is shown
   * @returns True while the panel is shown
   */
  isVisible() {
    return this.$panel.classList.contains('show');
  }

  /**
   * Show or hide the panel (the layers panel, at the same place, is hidden)
   * @param show Toggle by default
   */
  toggle(show: boolean = !this.isVisible()) {
    if (show) this.drawer.layersPanel?.toggle(false);
    this.$panel.classList.toggle('show', show);
    setPressed(this.$button, show);
    this.$button.setAttribute('aria-expanded', String(show));
  }

  /**
   * Items shown again (library, read only or language changed), with the state of the header buttons
   */
  update() {
    const { items } = this.drawer.library;
    // focus kept on the same place of the list
    const focused = [...this.$list.querySelectorAll('button')].indexOf(document.activeElement as HTMLButtonElement);

    this.$list.replaceChildren(...items.map((item) => this._createItem(item)));
    this.$empty.hidden = items.length > 0;
    this.$hint.hidden = !items.length;
    if (focused >= 0) {
      const buttons = this.$list.querySelectorAll('button');

      (buttons[Math.min(focused, buttons.length - 1)] ?? this.$addButton).focus();
    }
    this._updateButtons();
  }

  /**
   * Add button enabled with a selection, export button with items
   */
  private _updateButtons() {
    this.$addButton.disabled = !this.drawer.getSelectedShapes().length;
    this.$exportButton.disabled = !this.drawer.library.items.length;
  }

  /**
   * Hides the panel, focus back on its header button (close button, Escape)
   */
  private _close() {
    this.toggle(false);
    this.$button.focus();
  }

  /**
   * Row of an item: its preview and name inserting it (click, drag onto the drawing; not in read only), a button
   * removing it
   * @param item Item of the library
   * @returns List item
   */
  private _createItem(item: LibraryItem) {
    const { drawer } = this;
    const $item = document.createElement('li');
    const $insert = createButton('drawer-library-insert');
    const $preview = document.createElement('img');
    const $name = document.createElement('span');
    const $remove = createButton('drawer-button', 'drawer-button-neutral', 'drawer-library-remove');

    $item.classList.add('drawer-library-item');
    $preview.classList.add('drawer-library-preview');
    $preview.src = drawer.library.getPreview(item);
    $preview.alt = '';
    $preview.draggable = false;
    $name.classList.add('drawer-library-name');
    $name.textContent = item.name;
    $insert.append($preview, $name);
    setLabel($insert, drawer.t('library.insert', { name: item.name }));
    $insert.title = item.name;
    $insert.disabled = drawer.readOnly;
    $insert.draggable = !drawer.readOnly;
    $insert.addEventListener('click', () => drawer.library.insert(item.id));
    $insert.addEventListener('dragstart', (e) => {
      e.dataTransfer?.setData(libraryDragType, item.id);
      if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
    });
    $remove.innerHTML = TrashIcon;
    setLabel($remove, drawer.t('library.remove', { name: item.name }));
    $remove.title = drawer.t('library.remove', { name: item.name });
    $remove.addEventListener('click', () => drawer.library.remove(item.id));
    $item.append($insert, $remove);

    return $item;
  }

  /**
   * Icon button of the panel header, named by its translated label
   * @param icon SVG markup of the icon
   * @param label Key of the accessible name and tooltip (translated again when language changes)
   * @param action Run on click
   * @returns Header button, to add to the header actions
   */
  private _createHeaderButton(icon: string, label: TranslationKey, action: () => void) {
    const $btn = createButton('drawer-button', 'drawer-button-neutral');

    $btn.innerHTML = icon;
    this.drawer.i18n.translate((t) => {
      setLabel($btn, t(label));
      $btn.title = t(label);
    });
    $btn.addEventListener('click', action);

    return $btn;
  }
}
