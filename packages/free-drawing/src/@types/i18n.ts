import type { en } from '@/i18n/en';
import type { languages } from '@/i18n/I18n';

/** Key of a text of interface */
export type TranslationKey = keyof typeof en;

/** All texts of interface in a language */
export type Translations = Record<TranslationKey, string>;

/** Code of a language of interface (`en`, `fr`, `es`, `de`) */
export type Language = keyof typeof languages;

/** Values of `{name}` placeholders of a text */
export type TranslationParams = Record<string, string | number>;

/** Function giving the text of a key in current language, placeholders replaced by params (`drawer.t`) */
export type Translate = (key: TranslationKey, params?: TranslationParams) => string;

/** Texts of languages replacing default ones (e.g. `{ fr: { 'menu.open': 'Ouvrir un dessin' } }`), also of plugins */
export type CustomTranslations = Partial<Record<Language, Partial<Translations> & PluginTexts>>;

/** Texts of a plugin in a language, by key (keys of its own, e.g. `stamps.insert`, `tools.stamp`) */
export type PluginTexts = Record<string, string>;

/** Texts of a plugin by language (`Plugin.addTranslations`), English used for missing ones */
export type PluginTranslations = Partial<Record<Language, PluginTexts>>;
