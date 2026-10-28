import '@/components/tools/Help/help.scss';
import type { Drawer } from '@/Drawer';
import { Modal } from '@/components/Modal/Modal';
import HelpIcon from '@/icons/help.svg?raw';
import ExternalLink from '@/icons/external-link.svg?raw';
import { ShapeWidget } from '@/components/toolbar/widgets/ShapeWidget';
import { createButton, setLabel } from '@/utils/dom';
import { formatShortcut } from '@/utils/shortcut';
import type { Translate, TranslationKey } from '@/@types/i18n';
import type { Shortcut } from '@/@types/ui';

/**
 * Help dialog, opened by its footer button: links to documentation and issues, shortcuts of tools, editor and view
 * in current language (tools from toolbar widgets and their shortcut options)
 */
export class Help extends Modal {
  /** Footer button opening the dialog */
  $button: HTMLButtonElement;
  /** Footer element of the button, hidden in zen mode */
  $helpContainer: HTMLDivElement;
  /**
   * Create the dialog and its footer button, content rendered again on each language change
   * @param drawer Drawer whose toolbar widgets and options give the shortcuts shown
   */
  constructor(drawer: Drawer) {
    super(drawer, { title: drawer.t('help.title') });

    this.$modal.classList.add('drawer-modal-help');

    this.$helpContainer = document.createElement('div');
    this.$helpContainer.classList.add('drawer-help-container', 'tool');
    this.$button = createButton('drawer-button', 'drawer-button-neutral');
    this.$button.innerHTML = HelpIcon;
    this.$button.setAttribute('aria-haspopup', 'dialog');

    this.$helpContainer.append(this.$button);

    this.drawer.layout.add('footer', this.$helpContainer, { hideInZen: true });

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
   * Shortcuts shown again, e.g. with the commands of plugins once they are initialized
   */
  refresh() {
    this._render(this.drawer.i18n.t);
  }

  /**
   * Links and shortcuts in current language
   * @param t Translation function of the current language
   */
  private _render(t: Translate) {
    const editor: Shortcut[] = [
      ...(this.drawer.options.commandPalette ? [{ label: t('menu.commands'), keys: ['Ctrl+K'] }] : []),
      { label: t('history.undo'), keys: ['Ctrl+Z'] },
      { label: t('history.redo'), keys: ['Ctrl+Y', 'Ctrl+Shift+Z'], or: true },
      { label: t('menu.clearCanvas'), keys: ['Ctrl+Delete', 'Ctrl+Backspace'], or: true },
      { label: t('help.selectAll'), keys: ['Ctrl+A'] },
      { label: t('navigation.nextPrevious'), keys: ['Tab', 'Shift+Tab'], after: t('navigation.onDrawing') },
      { label: t('navigation.enter'), keys: ['Enter'], after: t('navigation.onDrawing') },
      { label: t('navigation.parent'), keys: ['Shift+Enter'], after: t('navigation.onDrawing') },
      { label: t('navigation.leave'), keys: ['Escape'], after: t('navigation.onDrawing') },
      { label: t('search.label'), keys: ['Ctrl+F'] },
      { label: t('help.deleteSelection'), keys: ['Delete'] },
      { label: t('help.duplicate'), keys: ['Ctrl+D'] },
      { label: t('action.copyStyle'), keys: ['Ctrl+Alt+C'] },
      { label: t('action.pasteStyle'), keys: ['Ctrl+Alt+V'] },
      { label: t('help.group'), keys: ['Ctrl+G', 'Ctrl+Shift+G'] },
      { label: t('help.selectInGroup'), keys: ['Ctrl+Click'] },
      { label: t('help.constrainDrawing'), keys: ['Shift'], after: t('help.whileDrawing') },
      { label: t('help.arrowUnlinked'), keys: ['Ctrl'], after: t('help.whileDrawing') },
      { label: t('help.constrainSelection'), keys: ['Shift'], after: t('help.whileTransforming') },
      { label: t('help.move'), keys: ['Arrows'] },
      { label: t('help.forwardBackward'), keys: ['Ctrl+Up', 'Ctrl+Down'] },
      { label: t('help.frontBack'), keys: ['Ctrl+Shift+Up', 'Ctrl+Shift+Down'] },
      { label: t('action.rotateRight'), keys: ['Shift+R'] },
      { label: t('action.rotateLeft'), keys: ['Shift+L'] },
      { label: t('action.flipHorizontal'), keys: ['Shift+H'] },
      { label: t('action.flipVertical'), keys: ['Shift+V'] },
      { label: t('action.fitTextWidth'), keys: ['Shift+W'] },
      { label: t('help.lock'), keys: ['Ctrl+Shift+L'] },
      { label: t('help.paste'), keys: ['Ctrl+V'] },
      { label: t('help.open'), keys: ['Ctrl+O'] },
      { label: t('menu.save'), keys: ['Ctrl+S'] },
      { label: t('help.save'), keys: ['Ctrl+Shift+S'] },
      { label: t('help.export'), keys: ['Ctrl+Shift+E'] },
      { label: t('action.copyPng'), keys: ['Shift+Alt+C'] },
      { label: t('action.copySvg'), keys: ['Shift+Alt+S'] },
    ];
    const view: Shortcut[] = [
      { label: t('menu.zenMode'), keys: ['Alt+Z'] },
      { label: t('help.grid'), keys: ['Alt+G'] },
      // panels of the drawer (`layersPanel`, `library` options)
      ...(this.drawer.layersPanel
        ? [
            { label: t('help.layers'), keys: ['Alt+L'] },
            { label: t('help.layersSelect'), keys: ['Ctrl+Click', 'Shift+Click', 'Shift+Arrows', 'Ctrl+Space'] },
          ]
        : []),
      ...(this.drawer.libraryPanel ? [{ label: t('library.title'), keys: ['Alt+B'] }] : []),
      { label: t('menu.darkMode'), keys: ['Alt+Shift+D'] },
      { label: t('help.snap'), keys: ['Alt+S'] },
      // mouse wheel zooming or moving the view (preference)
      ...(this.drawer.options.wheelAction === 'zoom'
        ? [
            { label: t('help.zoom'), keys: ['Wheel'] },
            { label: t('wheel.pan'), keys: ['Ctrl+Wheel', 'Shift+Wheel'] },
          ]
        : [
            { label: t('help.zoom'), keys: ['Ctrl+Wheel'] },
            { label: t('wheel.pan'), keys: ['Wheel', 'Shift+Wheel'] },
          ]),
      { label: t('wheel.pan'), keys: ['Space'], after: t('help.spaceDrag') },
      ...(this.drawer.options.zoom
        ? [
            { label: t('zoom.fit'), keys: ['Shift+1'] },
            { label: t('zoom.selection'), keys: ['Shift+2'] },
            { label: t('zoom.to100'), keys: ['Shift+0'] },
          ]
        : []),
      { label: t('preferences.title'), keys: ['Ctrl+,'] },
      ...(this.drawer.options.slideshow
        ? [
            { label: t('slideshow.start'), keys: ['Alt+Shift+P'] },
            { label: t('slideshow.nextPrevious'), keys: ['Arrows', 'Space'], after: t('slideshow.whilePresenting') },
            { label: t('slideshow.firstLast'), keys: ['Home', 'End'], after: t('slideshow.whilePresenting') },
            { label: t('slideshow.stop'), keys: ['Escape'], after: t('slideshow.whilePresenting') },
          ]
        : []),
      { label: t('replay.start'), keys: ['Alt+Shift+R'] },
      { label: t('replay.playPause'), keys: ['Space'], after: t('replay.whileReplaying') },
      { label: t('replay.step'), keys: ['Left', 'Right'], after: t('replay.whileReplaying') },
      { label: t('replay.firstLast'), keys: ['Home', 'End'], after: t('replay.whileReplaying') },
      { label: t('replay.stop'), keys: ['Escape'], after: t('replay.whileReplaying') },
    ];

    // commands of plugins
    for (const { command } of this.drawer.plugins.commands) {
      if (command.shortcut) editor.push({ label: t(command.label as TranslationKey), keys: [command.shortcut] });
    }

    this.$modalBody.innerHTML = /*html*/ `
    <div class="drawer-modal-help-links">
      <a class="drawer-link" href="https://free-drawing-docs.netlify.app/" target="_blank" rel="noopener"></a>
      <a class="drawer-link" href="https://github.com/fabienwnklr/free-drawing/issues/new" target="_blank" rel="noopener"></a>
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
   * @param t Translation function of the current language
   * @returns Widgets with a shortcut, then keep tool (Q) and Shift constrain when these are available
   */
  private _getToolsShortcuts(t: Translate) {
    const widgets = Array.from(this.drawer.toolbar.widgets.values());
    const shortcuts: Shortcut[] = widgets
      .filter((widget) => widget.shortcut)
      .map((widget) => ({ label: widget.$button.title, keys: [widget.shortcut!.toUpperCase()] }));

    if (this.drawer.toolbar.$keepToolButton) shortcuts.push({ label: t('toolbar.keepTool'), keys: ['Q'] });

    if (widgets.some((widget) => widget instanceof ShapeWidget)) {
      shortcuts.push({ label: t('help.toolsConstrain'), keys: ['Shift'] });
    }

    return shortcuts;
  }

  /**
   * Item of shortcut list: action then keys (symbols of Apple keyboards on its devices, alternatives shown once)
   * @param t Translation function of the current language (names of keys, text between alternative keys)
   * @returns List item: label, keys in `kbd` elements, then text after them
   */
  private _createShortcut(t: Translate, { label, keys, or, after }: Shortcut) {
    const $item = document.createElement('li');
    const $keys = document.createElement('span');

    $item.classList.add('drawer-modal-help-shortcut');
    // Ctrl + Delete or Ctrl + Backspace: one key of macOS
    [...new Set(keys.map((key) => formatShortcut(key, t)))].forEach((key, index) => {
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
