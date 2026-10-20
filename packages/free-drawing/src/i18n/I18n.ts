import { en } from '@/i18n/en';
import type { Language, Translate, CustomTranslations, PluginTexts, PluginTranslations } from '@/@types/i18n';
import { fr } from '@/i18n/fr';
import { es } from '@/i18n/es';
import { de } from '@/i18n/de';

/**
 * Languages of interface, with their name in their language (language choice)
 */
export const languages = {
  /** English, reference language: its texts replace missing ones of other languages */
  en: {
    /** Name of language in itself */
    name: 'English',
    /** Texts of interface */
    translations: en,
  },
  /** French */
  fr: {
    /** Name of language in itself */
    name: 'Français',
    /** Texts of interface */
    translations: fr,
  },
  /** Spanish */
  es: {
    /** Name of language in itself */
    name: 'Español',
    /** Texts of interface */
    translations: es,
  },
  /** German */
  de: {
    /** Name of language in itself */
    name: 'Deutsch',
    /** Texts of interface */
    translations: de,
  },
};

/**
 * Language of a locale (`fr-FR` gives `fr`), English when not supported
 * @param locale Browser language by default
 * @returns Supported language of the locale, else `en`
 */
export function getLanguage(locale: string | undefined = globalThis.navigator?.language): Language {
  const language = locale?.slice(0, 2).toLowerCase();

  return language && language in languages ? (language as Language) : 'en';
}

/**
 * Texts of interface in a language, updated when it changes
 */
export class I18n {
  /** Current language, see `setLanguage` */
  language: Language;
  /** Texts replacing default ones (`translations` option) */
  #custom: CustomTranslations;
  /** Texts of plugins by language (`extend`), after the ones of the library */
  #plugins: PluginTranslations = {};
  /** Functions given to `translate`, run again when language changes */
  #updates: ((t: Translate) => void)[] = [];

  /**
   * Texts in a language, with custom texts of the app
   * @param language Language of texts
   * @param custom Texts replacing default ones, per language
   */
  constructor(language: Language, custom: CustomTranslations = {}) {
    this.language = language;
    this.#custom = custom;
  }

  /**
   * Text of interface in current language, placeholders replaced
   * @param key Key of the text: custom text, else of current language, else English, else the key itself
   * @param params Values of `{name}` placeholders, unknown placeholders kept
   * @returns Translated text
   */
  t: Translate = (key, params = {}) => {
    const text =
      this.#custom[this.language]?.[key] ??
      languages[this.language].translations[key] ??
      this.#plugins[this.language]?.[key] ??
      en[key] ??
      this.#plugins.en?.[key] ??
      key;

    return text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
  };

  /**
   * Texts of a plugin added (its own keys), in every language given, English for missing ones
   * @param translations Texts of the plugin by language
   */
  extend(translations: PluginTranslations) {
    for (const [language, texts] of Object.entries(translations) as [Language, PluginTexts][]) {
      this.#plugins[language] = { ...this.#plugins[language], ...texts };
    }
  }

  /**
   * A key has a text: of the library, of a plugin or of the app
   * @param key Key of a text
   * @returns true when `t` gives a text, not the key itself
   */
  has(key: string): boolean {
    return (
      key in en ||
      Object.values(this.#plugins).some((texts) => key in texts) ||
      Object.values(this.#custom).some((texts) => !!texts && key in (texts as PluginTexts))
    );
  }

  /**
   * Apply texts now and when language changes
   * @param update Sets texts of elements with given translate function
   */
  translate(update: (t: Translate) => void) {
    update(this.t);
    this.#updates.push(update);
  }

  /**
   * Change language: texts given to `translate` are updated
   * @param language New language of texts
   */
  setLanguage(language: Language) {
    this.language = language;
    for (const update of this.#updates) update(this.t);
  }
}
