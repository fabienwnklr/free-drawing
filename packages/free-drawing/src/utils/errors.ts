import type { Translate, TranslationKey } from '@/@types/i18n';

/**
 * Error of the library: its text shown to users comes from `key` in the language of the drawer (see `getErrorText`),
 * its message in English is for developers (console)
 */
export class DrawerError extends Error {
  /** Key of the text of the error in the language of the drawer */
  readonly key: TranslationKey;

  /**
   * Create an error of the library
   * @param key Key of its text shown to users
   * @param message Message in English, for developers
   * @param options Cause of the error (error of the browser or of a server)
   */
  constructor(key: TranslationKey, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'DrawerError';
    this.key = key;
  }
}

/** Texts of errors of the browser, by name (`DOMException`: storage full, permission of the clipboard) */
const browserErrors: Record<string, TranslationKey> = {
  QuotaExceededError: 'error.storageFull',
  NotAllowedError: 'error.notAllowed',
  SecurityError: 'error.notAllowed',
};

/**
 * Text of an error shown after the text of a toast, in the language of the drawer: errors of the library and known
 * errors of the browser translated, else the message of the error (server, app: already in the language of the user)
 * @param error Error caught
 * @param t Translation function of the drawer
 * @returns Text of the error
 */
export function getErrorText(error: unknown, t: Translate): string {
  if (error instanceof DrawerError) return t(error.key);

  // DOMException is not an Error everywhere
  const { name = '', message } = (error ?? {}) as Partial<Error>;

  return browserErrors[name] ? t(browserErrors[name]) : message ?? String(error);
}
