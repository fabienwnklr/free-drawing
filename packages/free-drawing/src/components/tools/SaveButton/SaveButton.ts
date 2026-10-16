import '@/components/tools/SaveButton/save-button.scss';
import type { Drawer } from '@/Drawer';
import SaveNowIcon from '@/icons/save-now.svg?raw';
import { createButton, setLabel } from '@/utils/dom';
import { drawerEvents } from '@/constants';

/**
 * Button of header saving the drawing while auto save is off (`saveButton` option): a dot shows changes not saved yet
 */
export class SaveButton {
  /** Drawer saved by the button */
  drawer: Drawer;
  /** Header element of the button, hidden while auto save is on and in zen mode */
  $container: HTMLDivElement;
  /** Button saving the drawing (`saveNow`), its name tells when changes are not saved */
  $button: HTMLButtonElement;

  constructor(drawer: Drawer) {
    this.drawer = drawer;

    this.$container = document.createElement('div');
    this.$container.classList.add('drawer-save-button-container', 'tool');
    this.$button = createButton('drawer-button', 'drawer-button-neutral');
    this.$button.innerHTML = SaveNowIcon;
    this.$button.addEventListener('click', () => this.drawer.saveNow());
    this.$container.append(this.$button);
    this.drawer.layout.add('header', this.$container, { hideInZen: true });

    // auto save turned on or off (preference), changes saved or not, texts
    this.drawer.on(drawerEvents.unsavedChange, () => this.update());
    this.drawer.on(drawerEvents.preferencesChange, () => this.update());
    this.drawer.on(drawerEvents.languageChange, () => this.update());
    this.update();
  }

  /**
   * Shown without auto save, dot and name telling changes not saved yet
   */
  update() {
    const unsaved = this.drawer.hasUnsavedChanges();
    const label = this.drawer.t('menu.save');

    this.$container.hidden = this.drawer.options.autoSave;
    this.$button.classList.toggle('is-unsaved', unsaved);
    setLabel(this.$button, unsaved ? `${label} (${this.drawer.t('menu.unsaved')})` : label);
  }
}
