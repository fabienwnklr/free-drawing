import { type TranslationKey, type Translations, en } from '@/i18n/en';
import { fr } from '@/i18n/fr';
import { es } from '@/i18n/es';
import { de } from '@/i18n/de';

/**
 * Languages of interface, with their name in their language (language choice)
 */
export const languages = {
  en: { name: 'English', translations: en },
  fr: { name: 'Français', translations: fr },
  es: { name: 'Español', translations: es },
  de: { name: 'Deutsch', translations: de },
};

export type Language = keyof typeof languages;

/** Values of `{name}` placeholders of a text */
export type TranslationParams = Record<string, string | number>;

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
  language: Language;
  #custom: CustomTranslations;
  #updates: ((t: Translate) => void)[] = [];

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
