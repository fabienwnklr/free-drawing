import './help.scss';
import { Drawer } from '@/Drawer';
import { Modal } from '@/components/Modal/Modal';
import HelpIcon from '@/icons/help.svg?raw';
import ExternalLink from '@/icons/external-link.svg?raw';
import { ShapeWidget } from '@/components/toolbar/widgets/ShapeWidget';
import { createButton, setLabel } from '@/utils/dom';

export class Help extends Modal {
  $button: HTMLButtonElement;
  $helpContainer: HTMLDivElement;
  constructor(drawer: Drawer) {
    super(drawer, { title: 'Help' });

    const data = /*html*/ `
    <div class="drawer-modal-help-links">
      <a class="drawer-link" href="https://free-drawing-docs.fabienwinkler.fr/" target="_blank">Documentation${ExternalLink}</a>
      <a class="drawer-link" href="https://github.com/fabienwnklr/free-drawing/issues/new" target="_blank">Found issue ? Please inform us !${ExternalLink}</a>
    </div>
    <h3>Keyboard shortcuts</h3>
    <div class="drawer-modal-help-grid">
      <div class="drawer-modal-help-grid-container">
        <h4>Tools</h4>
        <!-- toolbar widgets and their shortcuts (widgets option) -->
        <ul class="drawer-modal-help-shortcut-container" data-help-tools></ul>
        </div>

        <div class="drawer-modal-help-grid-container">
          <h4>Editor</h4>
          <ul class="drawer-modal-help-shortcut-container">
            <li class="drawer-modal-help-shortcut">
              Undo
              <span>
                <kbd class="drawer-modal-help-kdb">Ctrl+Z</kbd>
              </span>
            </li>
            <li class="drawer-modal-help-shortcut">
              Redo
              <span>
                <kbd class="drawer-modal-help-kdb">Ctrl+Y</kbd>
              </span>
            </li>
            <li class="drawer-modal-help-shortcut">
              Clear canvas
              <span>
                <kbd class="drawer-modal-help-kdb">Ctrl+Delete</kbd>
                or
                <kbd class="drawer-modal-help-kdb">Ctrl+Backspace</kbd>
              </span>
            </li>
            <li class="drawer-modal-help-shortcut">
              Select all
              <span>
                <kbd class="drawer-modal-help-kdb">Ctrl+A</kbd>
              </span>
            </li>
            <li class="drawer-modal-help-shortcut">
              Delete selection
              <span>
                <kbd class="drawer-modal-help-kdb">Delete</kbd>
              </span>
            </li>
            <li class="drawer-modal-help-shortcut">
              Duplicate selection
              <span>
                <kbd class="drawer-modal-help-kdb">Ctrl+D</kbd>
              </span>
            </li>
            <li class="drawer-modal-help-shortcut">
              Group / ungroup selection
              <span>
                <kbd class="drawer-modal-help-kdb">Ctrl+G</kbd>
                <kbd class="drawer-modal-help-kdb">Ctrl+Shift+G</kbd>
              </span>
            </li>
            <li class="drawer-modal-help-shortcut">
              Select shape in a group
              <span>
                <kbd class="drawer-modal-help-kdb">Ctrl+Click</kbd>
              </span>
            </li>
            <li class="drawer-modal-help-shortcut">
              Move selection
              <span>
                <kbd class="drawer-modal-help-kdb">Arrows</kbd>
              </span>
            </li>
            <li class="drawer-modal-help-shortcut">
              Bring forward / send backward
              <span>
                <kbd class="drawer-modal-help-kdb">Ctrl+Up</kbd>
                <kbd class="drawer-modal-help-kdb">Ctrl+Down</kbd>
              </span>
            </li>
            <li class="drawer-modal-help-shortcut">
              Bring to front / send to back
              <span>
                <kbd class="drawer-modal-help-kdb">Ctrl+Shift+Up</kbd>
                <kbd class="drawer-modal-help-kdb">Ctrl+Shift+Down</kbd>
              </span>
            </li>
            <li class="drawer-modal-help-shortcut">
              Paste text
              <span>
                <kbd class="drawer-modal-help-kdb">Ctrl+V</kbd>
              </span>
            </li>
            <li class="drawer-modal-help-shortcut">
              Open file
              <span>
                <kbd class="drawer-modal-help-kdb">Ctrl+O</kbd>
              </span>
            </li>
            <li class="drawer-modal-help-shortcut">
              Save as file
              <span>
                <kbd class="drawer-modal-help-kdb">Ctrl+S</kbd>
              </span>
            </li>
            <li class="drawer-modal-help-shortcut">
              Export image
              <span>
                <kbd class="drawer-modal-help-kdb">Ctrl+Shift+E</kbd>
              </span>
            </li>
          </ul>
        </div>

        <div class="drawer-modal-help-grid-container">
          <h4>View</h4>
          <ul class="drawer-modal-help-shortcut-container">
            <li class="drawer-modal-help-shortcut">
              Zen mode
              <span>
                <kbd class="drawer-modal-help-kdb">Alt+Z</kbd>
              </span>
            </li>
            <li class="drawer-modal-help-shortcut">
              Grid
              <span>
                <kbd class="drawer-modal-help-kdb">Alt+G</kbd>
              </span>
            </li>
            <li class="drawer-modal-help-shortcut">
              Layers panel
              <span>
                <kbd class="drawer-modal-help-kdb">Alt+L</kbd>
              </span>
            </li>
            <li class="drawer-modal-help-shortcut">
              Snap to objects
              <span>
                <kbd class="drawer-modal-help-kdb">Alt+S</kbd>
              </span>
            </li>
            <li class="drawer-modal-help-shortcut">
              Zoom
              <span>
                <kbd class="drawer-modal-help-kdb">Ctrl+Wheel</kbd>
              </span>
            </li>
          </ul>
        </div>

      </div>
    `;

    this.$modal.classList.add('drawer-modal-help');
    this.setBodyContent(data);
    this._fillToolsShortcuts();

    this.$helpContainer = document.createElement('div');
    this.$helpContainer.classList.add('drawer-help-container', 'tool');
    this.$button = createButton('drawer-button', 'drawer-button-neutral');
    this.$button.innerHTML = HelpIcon;
    setLabel(this.$button, 'Help');
    this.$button.setAttribute('aria-haspopup', 'dialog');

    this.$helpContainer.append(this.$button);

    this.drawer.$footerContainer.append(this.$helpContainer);

    this.$button.addEventListener('click', () => {
      this.show();
    });
  }

  /**
   * Shortcuts of toolbar widgets (only the available ones, with their title and shortcut options)
   */
  private _fillToolsShortcuts() {
    const $tools = this.$modalBody.querySelector('[data-help-tools]') as HTMLUListElement;
    const addShortcut = (label: string, key: string) => {
      const $item = document.createElement('li');
      const $key = document.createElement('kbd');
      $item.classList.add('drawer-modal-help-shortcut');
      $key.classList.add('drawer-modal-help-kdb');
      $key.textContent = key;
      $item.append(label + ' ', $key);
      $tools.append($item);
    };
    const widgets = Array.from(this.drawer.toolbar.widgets.values());

    widgets.forEach((widget) => {
      if (widget.shortcut) addShortcut(widget.$button.title, widget.shortcut.toUpperCase());
    });

    if (widgets.some((widget) => widget instanceof ShapeWidget)) {
      addShortcut('Square, circle, 45° line (while drawing)', 'Shift');
    }
  }
}
