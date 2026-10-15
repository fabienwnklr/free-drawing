import '@/components/PreferencesModal/preferences-modal.scss';
import type { Drawer } from '@/Drawer';
import type { Preferences, Theme } from '@/@types/drawer';
import { Modal } from '@/components/Modal/Modal';
import { type Language, languages } from '@/i18n/I18n';
import type { TranslationKey } from '@/i18n/en';
import { drawerEvents } from '@/constants';
import { createSwitch, uniqueId } from '@/utils/dom';

const themes: { value: Theme; label: TranslationKey }[] = [
  { value: 'light', label: 'preferences.light' },
  { value: 'dark', label: 'preferences.dark' },
  { value: 'system', label: 'preferences.system' },
];

/**
 * Preferences of user (theme, language, zen mode, grid, snapping, name in collaboration sessions):
 * applied at once, saved in browser by drawer (and by the app of a logged in user)
 */
export class PreferencesModal extends Modal {
  $themes: HTMLInputElement[];
  $language: HTMLSelectElement;
  $zen: HTMLInputElement;
  $grid: HTMLInputElement;
  $snapping: HTMLInputElement;
  $autoSave: HTMLInputElement;
  /** Name in collaboration sessions, with `collaboration` option */
  $name: HTMLInputElement | null = null;

  constructor(drawer: Drawer) {
    super(drawer, { title: drawer.t('preferences.title') });
    this.$modal.classList.add('drawer-modal-preferences');
    this.$modalFooter.remove();

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
      $radio.addEventListener('change', () => drawer.setTheme(value));
      return $radio;
    });

    this.$language = document.createElement('select');
    this.$language.append(
      new Option('', 'auto'),
      ...Object.entries(languages).map(([language, { name }]) => new Option(name, language))
    );
    this.$language.addEventListener('change', () => drawer.setLanguage(this.$language.value as Language | 'auto'));
    $appearance.append($themes, this._createField('menu.language', this.$language));
    this.$zen = this._createSwitch($appearance, 'menu.zenMode', 'Alt+Z');
    this.$zen.addEventListener('change', () => drawer.setPreferences({ zen: this.$zen.checked }));

    // drawing: grid, snapping (exclude each other)
    const $drawing = this._createSection('preferences.drawing');

    this.$grid = this._createSwitch($drawing, 'menu.showGrid', 'Alt+G');
    this.$grid.addEventListener('change', () => drawer.setPreferences({ grid: this.$grid.checked }));
    this.$snapping = this._createSwitch($drawing, 'context.snap', 'Alt+S');
    this.$snapping.addEventListener('change', () => drawer.setPreferences({ snapping: this.$snapping.checked }));
    // else saved from menu
    this.$autoSave = this._createSwitch($drawing, 'preferences.autoSave');
    this.$autoSave.addEventListener('change', () => drawer.setPreferences({ autoSave: this.$autoSave.checked }));

    this.$modalBody.append($appearance, $drawing);

    if (drawer.options.collaboration) {
      const $collaboration = this._createSection('collab.title');

      this.$name = document.createElement('input');
      this.$name.type = 'text';
      this.$name.maxLength = 40;
      // valid token, unknown to dom types
      this.$name.setAttribute('autocomplete', 'nickname');
      this.$name.addEventListener('change', () => drawer.setUserName(this.$name!.value));
      $collaboration.append(this._createField('collab.name', this.$name));
      this.$modalBody.append($collaboration);
    }

    drawer.i18n.translate((t) => {
      this.setTitle(t('preferences.title'));
      $themesLegend.textContent = t('preferences.theme');
      this.$language.options[0].text = t('language.auto');
      if (this.$name) this.$name.placeholder = t('collab.anonymous');
    });
    // changed elsewhere (menu, shortcuts, app) while shown
    drawer.on(drawerEvents.preferencesChange, () => this.update());
  }

  show() {
    this.update();
    super.show();
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
    if (this.$name && document.activeElement !== this.$name) this.$name.value = this.drawer.getUserName();
  }

  /**
   * Group of fields with its title
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
