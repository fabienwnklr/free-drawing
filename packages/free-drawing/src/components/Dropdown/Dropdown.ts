import type { DropdownEventMap } from '@/@types/ui';
import MicroEvent from '@/utils/MicroEvent';
import { createButton, fitHeight, uniqueId } from '@/utils/dom';
import '@/components/Dropdown/dropdown.scss';
import { drawerEvents } from '@/constants';

/**
 * Disclosure menu: a button showing / hiding a menu below it, base of the settings menu.
 * Escape and a click out of the button hide the menu (`dropdown.hide` event).
 */
export class Dropdown extends MicroEvent<DropdownEventMap> {
  /** Element holding the button and the menu, to add to the page */
  $dropdownContainer: HTMLDivElement;
  /** Button showing / hiding the menu (`aria-expanded`) */
  $button: HTMLButtonElement;
  /** Menu shown below the button, holds the content */
  $menu: HTMLDivElement;
  /** List of the menu, its default content */
  $dropdownList: HTMLUListElement;
  /** List item element with the item class, created for subclasses (not added to the list) */
  $dropdownItem: HTMLLIElement;

  /** Removes the listeners of the page (document, window) when aborted (`drawer.signal`) */
  readonly #signal?: AbortSignal;

  /**
   * Create the button and the hidden menu holding an empty list, listen to clicks and Escape
   * @param signal Aborted when the listeners of the page are removed (`signal` of the drawer)
   */
  constructor(signal?: AbortSignal) {
    super();
    this.#signal = signal;

    this.$button = createButton('drawer-button', 'drawer-button-neutral', 'tool', 'drawer-button-dropdown');
    this.$menu = document.createElement('div');
    this.$menu.classList.add('drawer-dropdown');
    this.$menu.id = uniqueId('dropdown');
    // disclosure: button shows / hides menu content
    this.$button.setAttribute('aria-expanded', 'false');
    this.$button.setAttribute('aria-controls', this.$menu.id);

    this.$dropdownContainer = document.createElement('div');
    this.$dropdownContainer.classList.add('drawer-dropdown-container');

    this.$dropdownContainer.append(...[this.$button, this.$menu]);
    this.$dropdownList = document.createElement('ul');
    this.$dropdownList.classList.add('drawer-dropdown-list');
    this.$dropdownItem = document.createElement('li');
    this.$dropdownItem.classList.add('drawer-dropdown-list-item');

    this.setContent(this.$dropdownList);
    this._initEvents();
  }

  /**
   * Sets the content of the menu: an HTML string replaces it, a node is added at its end
   * @param content HTML markup replacing the content, or node added after it
   */
  setContent(content: string | Node) {
    if (typeof content === 'string') {
      this.$menu.innerHTML = content;
    } else {
      this.$menu.append(content);
    }
  }

  /**
   * Shows the menu
   */
  show() {
    this._setShown(true);
  }

  /**
   * Hides the menu and triggers `dropdown.hide`
   */
  hide() {
    this._setShown(false);

    this.trigger(drawerEvents.dropdownHide);
  }

  /**
   * Whether the menu is shown
   * @returns True while the menu is shown
   */
  isShown() {
    return this.$menu.classList.contains('show');
  }

  /**
   * Shows or hides the menu and updates `aria-expanded` of the button, without event
   * @param shown True to show the menu, false to hide it
   */
  private _setShown(shown: boolean) {
    this.$menu.classList.toggle('show', shown);
    this.$button.setAttribute('aria-expanded', String(shown));
    // kept in the drawer and the window (small screens)
    if (shown) fitHeight(this.$menu);
  }

  /**
   * Button toggles the menu, Escape hides it (focus back on button), a click out of the button hides it
   */
  private _initEvents() {
    this.$button.addEventListener('click', () => {
      // no hide event, focus stays on button
      this._setShown(!this.isShown());
    });

    // Escape closes menu, focus goes back to its button
    this.$dropdownContainer.addEventListener('keydown', (event) => {
      // keys of the menu run no shortcut of the drawer (Delete, letters of tools...)
      if (this.$menu.contains(event.target as Node)) event.stopPropagation();
      if (event.key !== 'Escape' || !this.isShown()) return;

      event.stopPropagation();
      this.hide();
      this.$button.focus();
    });

    document.addEventListener(
      'click',
      (event) => {
        if (event.target) {
          const openBtnClicked = this.$button.contains(event.target as Node);

          if (!openBtnClicked && this.isShown()) {
            this.hide();
          }
        }
      },
      { signal: this.#signal }
    );
    // a press out of it: a tap or a stroke on the canvas gives no click (tools prevent the default of touch start)
    document.addEventListener(
      'pointerdown',
      (event) => {
        if (this.isShown() && !this.$dropdownContainer.contains(event.target as Node)) this.hide();
      },
      { capture: true, signal: this.#signal }
    );
    // drawer or window resized while shown
    window.addEventListener(
      'resize',
      () => {
        if (this.isShown()) fitHeight(this.$menu);
      },
      { signal: this.#signal }
    );
  }
}
