import type { DrawingSummary } from './api';
import type { App } from './App';

let lastId = 0;

const trashIcon = /*html*/ `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
  <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
</svg>`;

/**
 * Drawings of logged in user, else of browser: open one, create one, delete one
 */
export class DrawingsDialog {
  readonly $dialog: HTMLDialogElement;
  readonly $list: HTMLUListElement;
  readonly $empty: HTMLElement;
  /** Drawings of browser (not logged in) */
  readonly $local: HTMLElement;
  readonly $new: HTMLButtonElement;
  drawings: DrawingSummary[] = [];

  constructor(private readonly app: App) {
    const id = `drawings-${++lastId}`;

    this.$dialog = document.createElement('dialog');
    this.$dialog.className = 'app-dialog app-drawings';
    this.$dialog.setAttribute('aria-labelledby', `${id}-title`);
    this.$dialog.innerHTML = /*html*/ `
      <header class="app-dialog-header">
        <h2 id="${id}-title"></h2>
        <button type="button" class="app-icon-button" data-close>
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </header>
      <p class="text-muted" data-local hidden></p>
      <button type="button" class="app-button app-button-primary" data-new></button>
      <ul class="app-drawings-list" aria-labelledby="${id}-title"></ul>
      <p class="text-muted" data-empty hidden></p>
    `;
    this.$list = this.$dialog.querySelector('ul')!;
    this.$empty = this.$dialog.querySelector('[data-empty]')!;
    this.$local = this.$dialog.querySelector('[data-local]')!;
    this.$new = this.$dialog.querySelector('[data-new]')!;
    document.body.append(this.$dialog);

    this.$new.addEventListener('click', async () => {
      this.$dialog.close();
      try {
        await this.app.newDrawing();
      } catch (error) {
        // too many drawings...
        this.app.drawer.toast(this.app.texts.error(error as Error), 'error');
      }
    });
    this.$dialog.querySelector('[data-close]')!.addEventListener('click', () => this.$dialog.close());
  }

  async show() {
    try {
      this.drawings = await this.app.store.listDrawings();
    } catch (error) {
      this.app.drawer.toast(this.app.texts.t('error', { error: (error as Error).message }), 'error');
      return;
    }
    this.render();
    this.$dialog.showModal();
    // current drawing, else new drawing button
    (this.$list.querySelector<HTMLElement>('[aria-current] .app-drawing-open') ?? this.$new).focus();
  }

  render() {
    const { t, date } = this.app.texts;
    const currentId = this.app.drawing?.id;

    this.$dialog.querySelector('h2')!.textContent = t('myDrawings');
    this.$dialog.querySelector('[data-close]')!.setAttribute('aria-label', t('close'));
    this.$new.textContent = t('newDrawing');
    this.$empty.textContent = t('empty');
    this.$local.textContent = t('localDrawings');
    this.$local.hidden = !!this.app.user;
    this.$empty.hidden = this.drawings.length > 0;
    this.$list.replaceChildren(
      ...this.drawings.map((drawing) => {
        const name = drawing.name || t('untitled');
        const $item = document.createElement('li');
        const $open = document.createElement('button');
        const $name = document.createElement('span');
        const $date = document.createElement('small');
        const $delete = document.createElement('button');

        if (drawing.id === currentId) $item.setAttribute('aria-current', 'true');
        $open.type = 'button';
        $open.className = 'app-drawing-open';
        $name.textContent = name;
        $date.className = 'text-muted';
        $date.textContent = t('updated', { date: date(drawing.updatedAt) });
        $open.append($name, $date);
        $open.addEventListener('click', async () => {
          this.$dialog.close();
          if (drawing.id !== this.app.drawing?.id) await this.app.openDrawing(drawing);
        });
        $delete.type = 'button';
        $delete.className = 'app-icon-button';
        $delete.innerHTML = trashIcon;
        $delete.setAttribute('aria-label', t('delete', { name }));
        $delete.title = t('delete', { name });
        $delete.addEventListener('click', () => this.remove(drawing, name));
        $item.append($open, $delete);

        return $item;
      })
    );
  }

  /**
   * Delete a drawing (confirmed), another one opened if it was open
   */
  async remove(drawing: DrawingSummary, name: string) {
    const { t } = this.app.texts;

    if (!window.confirm(t('deleteConfirm', { name }))) return;
    try {
      await this.app.store.deleteDrawing(drawing.id);
      this.drawings = this.drawings.filter(({ id }) => id !== drawing.id);
      if (this.app.drawing?.id === drawing.id) {
        // not saved again in deleted drawing
        this.app.drawing = null;
        if (this.drawings[0]) await this.app.openDrawing(this.drawings[0]);
        else await this.app.newDrawing();
        this.drawings = await this.app.store.listDrawings();
      }
    } catch (error) {
      this.app.drawer.toast(t('error', { error: (error as Error).message }), 'error');
    }
    this.render();
    this.$new.focus();
  }
}
