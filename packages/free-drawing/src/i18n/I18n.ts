import { type TranslationKey, type Translations, en } from '@/i18n/en';
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

/** Code of a language of interface (`en`, `fr`, `es`, `de`) */
export type Language = keyof typeof languages;

/** Values of `{name}` placeholders of a text */
export type TranslationParams = Record<string, string | number>;

/** Function giving the text of a key in current language, placeholders replaced by params (`drawer.t`) */
export type Translate = (key: TranslationKey, params?: TranslationParams) => string;

/** Texts of languages replacing default ones (e.g. `{ fr: { 'menu.open': 'Ouvrir un dessin' } }`) */
export type CustomTranslations = Partial<Record<Language, Partial<Translations>>>;

/**
 * Language of a locale (`fr-FR` gives `fr`), English when not supported
 * @param {string} locale Browser language by default
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
  /** Functions given to `translate`, run again when language changes */
  #updates: ((t: Translate) => void)[] = [];

  /**
   * @param language Language of texts
   * @param custom Texts replacing default ones, per language
   */
  constructor(language: Language, custom: CustomTranslations = {}) {
    this.language = language;
    this.#custom = custom;
  }

  /**
   * Text of interface in current language, placeholders replaced
   */
  t: Translate = (key, params = {}) => {
    const text = this.#custom[this.language]?.[key] ?? languages[this.language].translations[key] ?? en[key] ?? key;

    return text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
  };

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
   */
  setLanguage(language: Language) {
    this.language = language;
    this.#updates.forEach((update) => update(this.t));
  }
}
