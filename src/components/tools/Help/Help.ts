import './help.scss';
import { Drawer } from '@/Drawer';
import { Modal } from '@/components/Modal/Modal';
import HelpIcon from '@/icons/help.svg?raw';
import ExternalLink from '@/icons/external-link.svg?raw';

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
        <ul class="drawer-modal-help-shortcut-container">
            <li class="drawer-modal-help-shortcut">
              <div>
                Hand (panning tool)
              </div>
              <div>
                <kbd class="drawer-modal-help-kdb">H</kbd>
              </div>
            </li>
            <li class="drawer-modal-help-shortcut">
            Selection <kbd class="drawer-modal-help-kdb">S</kbd>
            </li>
            <li class="drawer-modal-help-shortcut">
            Brush <kbd class="drawer-modal-help-kdb">B</kbd>
            </li>
            <li class="drawer-modal-help-shortcut">
            Eraser <kbd class="drawer-modal-help-kdb">E</kbd>
            </li>
            <li class="drawer-modal-help-shortcut">
            Text <kbd class="drawer-modal-help-kdb">T</kbd>
            </li>
            <li class="drawer-modal-help-shortcut">
            Line <kbd class="drawer-modal-help-kdb">L</kbd>
            </li>
            <li class="drawer-modal-help-shortcut">
            Rectangle <kbd class="drawer-modal-help-kdb">R</kbd>
            </li>
            <li class="drawer-modal-help-shortcut">
            Ellipse <kbd class="drawer-modal-help-kdb">C</kbd>
            </li>
            <li class="drawer-modal-help-shortcut">
            Arrow <kbd class="drawer-modal-help-kdb">A</kbd>
            </li>
            <li class="drawer-modal-help-shortcut">
            Square, circle, 45° line (while drawing) <kbd class="drawer-modal-help-kdb">Shift</kbd>
            </li>
          </ul>
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
              Move selection
              <span>
                <kbd class="drawer-modal-help-kdb">Arrows</kbd>
              </span>
            </li>
            <li class="drawer-modal-help-shortcut">
              Paste text
              <span>
                <kbd class="drawer-modal-help-kdb">Ctrl+V</kbd>
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

    this.$helpContainer = document.createElement('div');
    this.$helpContainer.classList.add('drawer-help-container', 'tool');
    this.$button = document.createElement('button');
    this.$button.classList.add('drawer-button', 'drawer-button-neutral');
    this.$button.innerHTML = HelpIcon;

    this.$helpContainer.append(this.$button);

    this.drawer.$footerContainer.append(this.$helpContainer);

    this.$button.addEventListener('click', () => {
      this.show();
    });
  }
}
