import '@/components/PreferencesModal/preferences-modal.scss';
import type { Drawer } from '@/Drawer';
import type { GridStyle, Preferences, Theme, WheelAction } from '@/@types/drawer';
import { Modal } from '@/components/Modal/Modal';
import { languages } from '@/i18n/I18n';
import type { Language, TranslationKey } from '@/@types/i18n';
import { drawerEvents, gridStyles, wheelActions } from '@/constants';
import { createButton, createSwitch, isComposing, uniqueId } from '@/utils/dom';
import { formatShortcut } from '@/utils/shortcut';
import type { Choice } from '@/@types/ui';

const themes: Choice<Theme>[] = [
  { value: 'light', label: 'preferences.light' },
  { value: 'dark', label: 'preferences.dark' },
  { value: 'system', label: 'preferences.system' },
];

/**
 * Preferences of user (theme, language, zen mode, grid, snapping, auto save, name in collaboration sessions):
 * applied as soon as a field changes, to see them (name in collaboration sessions: by Save), kept by Save; Cancel,
 * Escape or close give back the preferences shown before. Saved in browser by drawer (and by the app of a logged in
 * user)
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
  /** Style of the grid: squares, dots, lines, isometric */
  $gridStyle: HTMLSelectElement;
  /** Action of the mouse wheel: zoom or move of the view */
  $wheelAction: HTMLSelectElement;
  /** Switch of snapping to shapes, unchecks the grid when checked */
  $snapping: HTMLInputElement;
  /** Switch of auto save (else changes saved from the menu) */
  $autoSave: HTMLInputElement;
  /** Keep tool after drawing, with selection widget only */
  $keepTool: HTMLInputElement | null = null;
  /** Shapes recognized in brush strokes, with brush widget only */
  $shapeRecognition: HTMLInputElement | null = null;
  /** Name in collaboration sessions, with `collaboration` option */
  $name: HTMLInputElement | null = null;
  /** Cancel button: hides the dialog, preferences shown before given back */
  $cancelButton: HTMLButtonElement;
  /** Save button: keeps the preferences of the fields, applies the name and hides the dialog */
  $saveButton: HTMLButtonElement;
  /** Fields changed since shown: not replaced by preferences changed elsewhere */
  #changed = false;
  /** Preferences when the dialog was shown, given back when it is hidden without Save; null while hidden */
  #initial: Preferences | null = null;

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
    this.$gridStyle = document.createElement('select');
    this.$gridStyle.append(...gridStyles.map(({ value }) => new Option('', value)));
    $drawing.append(this._createField('grid.style', this.$gridStyle));
    this.$wheelAction = document.createElement('select');
    this.$wheelAction.append(...wheelActions.map(({ value }) => new Option('', value)));
    $drawing.append(this._createField('preferences.wheel', this.$wheelAction));
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
    if (drawer.getWidget('brush'))
      this.$shapeRecognition = this._createSwitch($drawing, 'preferences.shapeRecognition');

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
        if (e.key === 'Enter' && !isComposing(e)) this.save();
      });
      $collaboration.append(this._createField('collab.name', this.$name));
      this.$modalBody.append($collaboration);
    }
    this.$modalBody.addEventListener('input', () => (this.#changed = true));
    // applied at once to see them (name: by Save); grid and snapping already exclude each other (listeners of the
    // fields, before this one)
    this.$modalBody.addEventListener('change', (e) => {
      this.#changed = true;
      if (e.target !== this.$name) this._apply();
    });

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
      gridStyles.forEach(({ label }, i) => {
        this.$gridStyle.options[i].text = t(label);
      });
      wheelActions.forEach(({ label }, i) => {
        this.$wheelAction.options[i].text = t(label);
      });
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
   * Shows the dialog with fields filled from current preferences (given back unless saved)
   */
  show() {
    this.#changed = false;
    this.#initial = this.drawer.getPreferences();
    this.update();
    super.show();
  }

  /**
   * Preferences of the fields kept, name applied, dialog closed
   */
  save() {
    this._apply();
    if (this.$name) this.drawer.setUserName(this.$name.value);
    // kept
    this.#initial = null;
    this.hide();
  }

  /**
   * Hides the dialog: without Save, the preferences shown before are given back
   */
  hide() {
    const initial = this.#initial;

    this.#initial = null;
    if (initial && this.#changed) this.drawer.setPreferences(initial);
    super.hide();
  }

  /**
   * Preferences of the fields applied (one preferences change)
   */
  private _apply() {
    const theme = this.$themes.find(($radio) => $radio.checked)?.value as Theme | undefined;

    this.drawer.setPreferences({
      ...(theme && { theme }),
      language: this.$language.value as Language | 'auto',
      zen: this.$zen.checked,
      grid: this.$grid.checked,
      gridStyle: this.$gridStyle.value as GridStyle,
      wheelAction: this.$wheelAction.value as WheelAction,
      snapping: this.$snapping.checked,
      autoSave: this.$autoSave.checked,
      ...(this.$keepTool && { keepTool: this.$keepTool.checked }),
      ...(this.$shapeRecognition && { shapeRecognition: this.$shapeRecognition.checked }),
    });
  }

  /**
   * Fields show current preferences
   */
  update() {
    const preferences: Preferences = this.drawer.getPreferences();

    for (const $radio of this.$themes) $radio.checked = $radio.value === preferences.theme;
    this.$language.value = preferences.language;
    this.$zen.checked = preferences.zen;
    this.$grid.checked = preferences.grid;
    this.$gridStyle.value = preferences.gridStyle;
    this.$wheelAction.value = preferences.wheelAction;
    this.$snapping.checked = preferences.snapping;
    this.$autoSave.checked = preferences.autoSave;
    if (this.$keepTool) this.$keepTool.checked = preferences.keepTool;
    if (this.$shapeRecognition) this.$shapeRecognition.checked = preferences.shapeRecognition;
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
   * Switch at the end of its row: label, shortcut doing the same out of the dialog (if any)
   * @param $container Section receiving the row
   * @param label Key of the label text (translated again when language changes), name of the switch
   * @param shortcut Keys doing the same out of the dialog, shown only: not a shortcut of the switch (the dialog applies
   * its fields with Save), not in its name
   * @returns Switch input, unchecked until `update`
   */
  private _createSwitch($container: HTMLElement, label: TranslationKey, shortcut?: string) {
    const $label = document.createElement('label');
    const $text = document.createElement('span');
    const $shortcut = document.createElement('kbd');
    const $switch = createSwitch();

    $label.className = 'drawer-preferences-switch';
    $shortcut.className = 'drawer-preferences-shortcut';
    $shortcut.hidden = !shortcut;
    // hint for the eyes: the name of the switch is its label
    $shortcut.setAttribute('aria-hidden', 'true');
    $label.append($text, $shortcut, $switch);
    $container.append($label);
    this.drawer.i18n.translate((t) => {
      $text.textContent = t(label);
      $shortcut.textContent = formatShortcut(shortcut ?? '', t);
    });

    return $switch;
  }
}
