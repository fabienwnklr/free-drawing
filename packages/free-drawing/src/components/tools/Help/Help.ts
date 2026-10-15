import '@/components/tools/Help/help.scss';
import { Drawer } from '@/Drawer';
import { Modal } from '@/components/Modal/Modal';
import HelpIcon from '@/icons/help.svg?raw';
import ExternalLink from '@/icons/external-link.svg?raw';
import { ShapeWidget } from '@/components/toolbar/widgets/ShapeWidget';
import { createButton, setLabel } from '@/utils/dom';
import type { Translate } from '@/i18n/I18n';

/** Shortcut: action, keys (several: alternatives or second action), text after keys */
type Shortcut = { label: string; keys: string[]; or?: boolean; after?: string };

export class Help extends Modal {
  $button: HTMLButtonElement;
  $helpContainer: HTMLDivElement;
  constructor(drawer: Drawer) {
    super(drawer, { title: drawer.t('help.title') });

    this.$modal.classList.add('drawer-modal-help');

    this.$helpContainer = document.createElement('div');
    this.$helpContainer.classList.add('drawer-help-container', 'tool');
    this.$button = createButton('drawer-button', 'drawer-button-neutral');
    this.$button.innerHTML = HelpIcon;
    this.$button.setAttribute('aria-haspopup', 'dialog');

    this.$helpContainer.append(this.$button);

    this.drawer.$footerContainer.append(this.$helpContainer);

    // after widgets: their titles are translated
    this.drawer.i18n.translate((t) => {
      this.setTitle(t('help.title'));
      setLabel(this.$button, t('help.title'));
      this._render(t);
    });

    this.$button.addEventListener('click', () => {
      this.show();
    });
  }

  /**
   * Links and shortcuts in current language
   */
  private _render(t: Translate) {
    const editor: Shortcut[] = [
      ...(this.drawer.options.commandPalette ? [{ label: t('menu.commands'), keys: ['Ctrl+K'] }] : []),
      { label: t('history.undo'), keys: ['Ctrl+Z'] },
      { label: t('history.redo'), keys: ['Ctrl+Y'] },
      { label: t('menu.clearCanvas'), keys: [`Ctrl+${t('key.delete')}`, 'Ctrl+Backspace'], or: true },
      { label: t('help.selectAll'), keys: ['Ctrl+A'] },
      { label: t('help.deleteSelection'), keys: [t('key.delete')] },
      { label: t('help.duplicate'), keys: ['Ctrl+D'] },
      { label: t('help.group'), keys: ['Ctrl+G', 'Ctrl+Shift+G'] },
      { label: t('help.selectInGroup'), keys: [`Ctrl+${t('key.click')}`] },
      { label: t('help.constrainDrawing'), keys: ['Shift'], after: t('help.whileDrawing') },
      { label: t('help.arrowUnlinked'), keys: ['Ctrl'], after: t('help.whileDrawing') },
      { label: t('help.constrainSelection'), keys: ['Shift'], after: t('help.whileTransforming') },
      { label: t('help.move'), keys: [t('key.arrows')] },
      { label: t('help.forwardBackward'), keys: ['Ctrl+Up', 'Ctrl+Down'] },
      { label: t('help.frontBack'), keys: ['Ctrl+Shift+Up', 'Ctrl+Shift+Down'] },
      { label: t('action.rotateRight'), keys: ['Shift+R'] },
      { label: t('action.rotateLeft'), keys: ['Shift+L'] },
      { label: t('action.flipHorizontal'), keys: ['Shift+H'] },
      { label: t('action.flipVertical'), keys: ['Shift+V'] },
      { label: t('help.lock'), keys: ['Ctrl+Shift+L'] },
      { label: t('help.paste'), keys: ['Ctrl+V'] },
      { label: t('help.open'), keys: ['Ctrl+O'] },
      { label: t('help.save'), keys: ['Ctrl+S'] },
      { label: t('help.export'), keys: ['Ctrl+Shift+E'] },
      { label: t('action.copyPng'), keys: ['Shift+Alt+C'] },
      { label: t('action.copySvg'), keys: ['Shift+Alt+S'] },
    ];
    const view: Shortcut[] = [
      { label: t('menu.zenMode'), keys: ['Alt+Z'] },
      { label: t('help.grid'), keys: ['Alt+G'] },
      { label: t('help.layers'), keys: ['Alt+L'] },
      {
        label: t('help.layersSelect'),
        keys: [
          `Ctrl+${t('key.click')}`,
          `Shift+${t('key.click')}`,
          `Shift+${t('key.arrows')}`,
          `Ctrl+${t('key.space')}`,
        ],
      },
      { label: t('menu.darkMode'), keys: ['Alt+Shift+D'] },
      { label: t('help.snap'), keys: ['Alt+S'] },
      { label: t('help.zoom'), keys: [`Ctrl+${t('key.wheel')}`] },
      { label: t('preferences.title'), keys: ['Ctrl+,'] },
    ];

    this.$modalBody.innerHTML = /*html*/ `
    <div class="drawer-modal-help-links">
      <a class="drawer-link" href="https://free-drawing-docs.fabienwinkler.fr/" target="_blank"></a>
      <a class="drawer-link" href="https://github.com/fabienwnklr/free-drawing/issues/new" target="_blank"></a>
    </div>
    <h3></h3>
    <div class="drawer-modal-help-grid">
      <div class="drawer-modal-help-grid-container">
        <h4></h4>
        <!-- toolbar widgets and their shortcuts (widgets option) -->
        <ul class="drawer-modal-help-shortcut-container" data-help-tools></ul>
      </div>
      <div class="drawer-modal-help-grid-container">
        <h4></h4>
        <ul class="drawer-modal-help-shortcut-container" data-help-editor></ul>
      </div>
      <div class="drawer-modal-help-grid-container">
        <h4></h4>
        <ul class="drawer-modal-help-shortcut-container" data-help-view></ul>
      </div>
    </div>
    `;

    const [$doc, $issue] = this.$modalBody.querySelectorAll('a');
    const [$tools, $editor, $view] = this.$modalBody.querySelectorAll('h4');

    $doc.append(t('help.documentation'));
    $issue.append(t('help.issue'));
    $doc.insertAdjacentHTML('beforeend', ExternalLink);
    $issue.insertAdjacentHTML('beforeend', ExternalLink);
    this.$modalBody.querySelector('h3')!.textContent = t('help.shortcuts');
    $tools.textContent = t('help.tools');
    $editor.textContent = t('help.editor');
    $view.textContent = t('help.view');

    const fill = (selector: string, shortcuts: Shortcut[]) =>
      this.$modalBody
        .querySelector(selector)!
        .append(...shortcuts.map((shortcut) => this._createShortcut(t, shortcut)));

    fill('[data-help-tools]', this._getToolsShortcuts(t));
    fill('[data-help-editor]', editor);
    fill('[data-help-view]', view);
  }

  /**
   * Shortcuts of toolbar widgets (only the available ones, with their title and shortcut options)
   */
  private _getToolsShortcuts(t: Translate) {
    const widgets = Array.from(this.drawer.toolbar.widgets.values());
    const shortcuts: Shortcut[] = widgets
      .filter((widget) => widget.shortcut)
      .map((widget) => ({ label: widget.$button.title, keys: [widget.shortcut!.toUpperCase()] }));

    if (widgets.some((widget) => widget instanceof ShapeWidget)) {
      shortcuts.push({ label: t('help.toolsConstrain'), keys: ['Shift'] });
    }

    return shortcuts;
  }

  /**
   * Item of shortcut list: action then keys
   */
  private _createShortcut(t: Translate, { label, keys, or, after }: Shortcut) {
    const $item = document.createElement('li');
    const $keys = document.createElement('span');

    $item.classList.add('drawer-modal-help-shortcut');
    keys.forEach((key, index) => {
      const $key = document.createElement('kbd');

      $key.classList.add('drawer-modal-help-kdb');
      $key.textContent = key;
      if (index) $keys.append(or ? ` ${t('help.or')} ` : ' ');
      $keys.append($key);
    });
    if (after) $keys.append(` ${after}`);
    $item.append(label, ' ', $keys);

    return $item;
  }
}
