import '@/components/PreferencesModal/preferences-modal.scss';
import type { Drawer } from '@/Drawer';
import type { Preferences, Theme } from '@/@types/drawer';
import { Modal } from '@/components/Modal/Modal';
import { type Language, languages } from '@/i18n/I18n';
import type { TranslationKey } from '@/i18n/en';
import { drawerEvents } from '@/constants';
import { createButton, createSwitch, uniqueId } from '@/utils/dom';

const themes: { value: Theme; label: TranslationKey }[] = [
  { value: 'light', label: 'preferences.light' },
  { value: 'dark', label: 'preferences.dark' },
  { value: 'system', label: 'preferences.system' },
];

/**
 * Preferences of user (theme, language, zen mode, grid, snapping, auto save, name in collaboration sessions):
 * applied together with Save (Cancel, Escape or close keep current ones), saved in browser by drawer
 * (and by the app of a logged in user)
 */
export class PreferencesModal extends Modal {
  /** Radio buttons of the theme: light, dark, system */
  $themes: HTMLInputElement[];
  /** Language select: automatic (browser language), then available languages */
  $language: HTMLSelectElement;
  /** Switch of zen mode (most of the interface hidden) */
  $zen: HTMLInputElement;
  /** Switch of the grid, unchecks snapping when checked */
  $grid: HTMLInputElement;
  /** Switch of snapping to shapes, unchecks the grid when checked */
  $snapping: HTMLInputElement;
  /** Switch of auto save (else changes saved from the menu) */
  $autoSave: HTMLInputElement;
  /** Keep tool after drawing, with selection widget only */
  $keepTool: HTMLInputElement | null = null;
  /** Name in collaboration sessions, with `collaboration` option */
  $name: HTMLInputElement | null = null;
  /** Cancel button: hides the dialog, fields not applied */
  $cancelButton: HTMLButtonElement;
  /** Save button: applies fields and hides the dialog */
  $saveButton: HTMLButtonElement;
  /** Fields changed since shown: not replaced by preferences changed elsewhere */
  #changed = false;

  /**
   * Build the dialog: sections of fields (name with `collaboration` option), Cancel and Save buttons
   * @param drawer Drawer whose preferences are shown and applied
   */
  constructor(drawer: Drawer) {
    super(drawer, { title: drawer.t('preferences.title') });
    this.$modal.classList.add('drawer-modal-preferences');

    // appearance: theme, language, zen mode
    const $appearance = this._createSection('preferences.appearance');
    const $themes = document.createElement('fieldset');
    const $themesLegend = document.createElement('legend');
    const themesName = uniqueId('theme');

    $themes.className = 'drawer-preferences-themes';
    $themes.append($themesLegend);
    this.$themes = themes.map(({ value, label }) => {
      const $radio = this._createRadio($themes, label);

      $radio.name = themesName;
      $radio.value = value;
      return $radio;
    });

    this.$language = document.createElement('select');
    this.$language.append(
      new Option('', 'auto'),
      ...Object.entries(languages).map(([language, { name }]) => new Option(name, language))
    );
    $appearance.append($themes, this._createField('menu.language', this.$language));
    this.$zen = this._createSwitch($appearance, 'menu.zenMode', 'Alt+Z');

    // drawing: grid, snapping (exclude each other)
    const $drawing = this._createSection('preferences.drawing');

    this.$grid = this._createSwitch($drawing, 'menu.showGrid', 'Alt+G');
    this.$snapping = this._createSwitch($drawing, 'context.snap', 'Alt+S');
    this.$grid.addEventListener('change', () => {
      if (this.$grid.checked) this.$snapping.checked = false;
    });
    this.$snapping.addEventListener('change', () => {
      if (this.$snapping.checked) this.$grid.checked = false;
    });
    // else saved from menu
    this.$autoSave = this._createSwitch($drawing, 'preferences.autoSave');
    if (drawer.toolbar.$keepToolButton) this.$keepTool = this._createSwitch($drawing, 'toolbar.keepTool', 'Q');

    this.$modalBody.append($appearance, $drawing);

    if (drawer.options.collaboration) {
      const $collaboration = this._createSection('collab.title');

      this.$name = document.createElement('input');
      this.$name.type = 'text';
      this.$name.maxLength = 40;
      // valid token, unknown to dom types
      this.$name.setAttribute('autocomplete', 'nickname');
      // Enter saves, as a form
      this.$name.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.save();
      });
      $collaboration.append(this._createField('collab.name', this.$name));
      this.$modalBody.append($collaboration);
    }
    this.$modalBody.addEventListener('input', () => (this.#changed = true));
    this.$modalBody.addEventListener('change', () => (this.#changed = true));

    // cancel first, save on the right
    this.$cancelButton = createButton('drawer-button', 'drawer-button-neutral');
    this.$saveButton = createButton('drawer-button', 'drawer-button-primary');
    this.$cancelButton.addEventListener('click', () => this.hide());
    this.$saveButton.addEventListener('click', () => this.save());
    this.$modalFooter.append(this.$cancelButton, this.$saveButton);

    drawer.i18n.translate((t) => {
      this.setTitle(t('preferences.title'));
      $themesLegend.textContent = t('preferences.theme');
      this.$language.options[0].text = t('language.auto');
      if (this.$name) this.$name.placeholder = t('collab.anonymous');
      this.$cancelButton.textContent = t('confirm.cancel');
      this.$saveButton.textContent = t('preferences.save');
    });
    // changed elsewhere (app...) while shown, fields not changed yet
    drawer.on(drawerEvents.preferencesChange, () => {
      if (!this.#changed) this.update();
    });
  }

  /**
   * Shows the dialog with fields filled from current preferences
   */
  show() {
    this.#changed = false;
    this.update();
    super.show();
  }

  /**
   * Fields applied together (one preferences change), dialog closed
   */
  save() {
    const theme = this.$themes.find(($radio) => $radio.checked)?.value as Theme | undefined;

    this.drawer.setPreferences({
      ...(theme && { theme }),
      language: this.$language.value as Language | 'auto',
      zen: this.$zen.checked,
      grid: this.$grid.checked,
      snapping: this.$snapping.checked,
      autoSave: this.$autoSave.checked,
      ...(this.$keepTool && { keepTool: this.$keepTool.checked }),
    });
    if (this.$name) this.drawer.setUserName(this.$name.value);
    this.hide();
  }

  /**
   * Fields show current preferences
   */
  update() {
    const preferences: Preferences = this.drawer.getPreferences();

    this.$themes.forEach(($radio) => ($radio.checked = $radio.value === preferences.theme));
    this.$language.value = preferences.language;
    this.$zen.checked = preferences.zen;
    this.$grid.checked = preferences.grid;
    this.$snapping.checked = preferences.snapping;
    this.$autoSave.checked = preferences.autoSave;
    if (this.$keepTool) this.$keepTool.checked = preferences.keepTool;
    if (this.$name) this.$name.value = this.drawer.getUserName();
  }

  /**
   * Group of fields with its title
   * @param title Key of the title (translated again when language changes), names the section
   * @returns Section holding its title, fields are added after it
   */
  private _createSection(title: TranslationKey) {
    const $section = document.createElement('section');
    const $title = document.createElement('h3');

    $title.id = uniqueId('preferences-section');
    $section.setAttribute('aria-labelledby', $title.id);
    $section.append($title);
    this.drawer.i18n.translate((t) => ($title.textContent = t(title)));

    return $section;
  }

  /**
   * Field with its label (select, text input)
   * @param label Key of the label text (translated again when language changes)
   * @param $field Select or text input, put in the label
   * @returns Label holding text and field, to add to a section
   */
  private _createField(label: TranslationKey, $field: HTMLInputElement | HTMLSelectElement) {
    const $label = document.createElement('label');
    const $text = document.createElement('span');

    $label.className = 'drawer-preferences-field';
    $label.append($text, $field);
    this.drawer.i18n.translate((t) => ($text.textContent = t(label)));

    return $label;
  }

  /**
   * Radio with its label
   * @param $container Fieldset receiving the labelled radio
   * @param label Key of the label text (translated again when language changes)
   * @returns Radio input, its name and value are set by the caller
   */
  private _createRadio($container: HTMLElement, label: TranslationKey) {
    const $label = document.createElement('label');
    const $radio = document.createElement('input');
    const $text = document.createElement('span');

    $radio.type = 'radio';
    $label.append($radio, $text);
    $container.append($label);
    this.drawer.i18n.translate((t) => ($text.textContent = t(label)));

    return $radio;
  }

  /**
   * Switch at the end of its row: label, shortcut doing the same (if any)
   * @param $container Section receiving the row
   * @param label Key of the label text (translated again when language changes)
   * @param shortcut Keys doing the same out of the dialog, shown and set as `aria-keyshortcuts`
   * @returns Switch input, unchecked until `update`
   */
  private _createSwitch($container: HTMLElement, label: TranslationKey, shortcut?: string) {
    const $label = document.createElement('label');
    const $text = document.createElement('span');
    const $shortcut = document.createElement('kbd');
    const $switch = createSwitch();

    $label.className = 'drawer-preferences-switch';
    $shortcut.className = 'drawer-preferences-shortcut';
    $shortcut.textContent = shortcut ?? '';
    $shortcut.hidden = !shortcut;
    if (shortcut) $switch.setAttribute('aria-keyshortcuts', shortcut);
    $label.append($text, $shortcut, $switch);
    $container.append($label);
    this.drawer.i18n.translate((t) => ($text.textContent = t(label)));

    return $switch;
  }
}
