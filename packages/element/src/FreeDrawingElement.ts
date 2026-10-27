import type { Drawer, DrawerOptions, DrawerUser, Language, Theme } from '@fabwcie/free-drawing';
import { applySettings, mountDrawer, withSettings } from './mountDrawer.js';

declare global {
  interface HTMLElementTagNameMap {
    'free-drawing': FreeDrawingElement;
  }
  interface HTMLElementEventMap {
    /** Drawer of a `<free-drawing>` element ready: plugins initialized, drawing of the `storage` option loaded */
    drawerready: CustomEvent<Drawer>;
    /** Drawing of a `<free-drawing>` element changed: shapes, background... */
    drawerchange: CustomEvent<Drawer>;
  }
}

/** Events of `<free-drawing>`, whose `detail` is the drawer (they do not bubble) */
export type FreeDrawingElementEventMap = Pick<HTMLElementEventMap, 'drawerready' | 'drawerchange'>;

/** HTMLElement in a browser, an empty class on a server (module imported by server rendering: nothing is defined) */
const Base = (typeof HTMLElement === 'undefined' ? class {} : HTMLElement) as typeof HTMLElement;

/** Properties a framework may set before the element is defined: set again through their setters */
const properties = ['options', 'readOnly', 'theme', 'language', 'user'] as const;

/** Names of the elements whose style was added to the page */
const styledNames = new Set<string>();

/**
 * Style of an element added to the page once: a block whose drawer does not give its size to it (contain) nor to its
 * grid or flex box (overflow). Without specificity (`:where`): any style of the app wins
 * @param name Name of the element
 */
function addStyle(name: string) {
  if (styledNames.has(name)) return;

  const css = `:where(${name}:not([hidden])) { display: block; overflow: hidden; contain: inline-size; }`;

  styledNames.add(name);
  // constructed style sheet: allowed by a content security policy without inline styles
  if (
    'adoptedStyleSheets' in document &&
    typeof CSSStyleSheet === 'function' &&
    'replaceSync' in CSSStyleSheet.prototype
  ) {
    const sheet = new CSSStyleSheet();

    sheet.replaceSync(css);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  } else {
    const style = document.createElement('style');

    style.textContent = css;
    document.head.prepend(style);
  }
}

/**
 * `<free-drawing>`: drawing board of free-drawing as a custom element, for any page or framework (Angular, Svelte...).
 * The drawer is created once the element is in the page (library loaded then, never on a server) and destroyed once
 * the element leaves it (not when it is moved). Without `width` and `height` options, it takes the size of the element
 * and follows it. Attributes `read-only`, `theme` and `language` (or their properties) and the `user` property are
 * followed, `options` (property, or JSON attribute) are read when the drawer is created.
 */
export class FreeDrawingElement extends Base {
  /** Attributes followed */
  static readonly observedAttributes = ['read-only', 'theme', 'language'];
  /** Options of the drawer (`options` property) */
  #options?: Partial<DrawerOptions>;
  /** Drawing can't be modified by the user, undefined to leave it to the drawer */
  #readOnly?: boolean;
  /** Theme, undefined to leave it to the drawer */
  #theme?: Theme;
  /** Language of the interface, undefined to leave it to the drawer */
  #language?: Language | 'auto';
  /** User of the app, undefined to leave it to the drawer */
  #user?: DrawerUser | null;
  /** User given to the drawer (JSON): an equal user is not given again */
  #userKey?: string;
  /** Drawer, null until it is created */
  #drawer: Drawer | null = null;
  /** Destroys the drawer or cancels its creation, undefined while the element is out of the page */
  #unmount?: () => void;

  /**
   * Drawer of the element, null until it is created (the library is loaded first) and once the element left the page
   */
  get drawer(): Drawer | null {
    return this.#drawer;
  }

  /**
   * Options of the drawer, read when it is created: create another element for other options. Without them, the
   * `options` attribute (JSON) is read
   */
  get options(): Partial<DrawerOptions> | undefined {
    return this.#options;
  }

  set options(options: Partial<DrawerOptions> | undefined) {
    this.#options = options;
  }

  /**
   * Drawing can't be modified by the user (`drawer.setReadOnly`), as the `read-only` attribute: undefined leaves it to
   * the drawer (`readOnly` option)
   */
  get readOnly(): boolean | undefined {
    return this.#readOnly;
  }

  set readOnly(readOnly: boolean | undefined) {
    this.#readOnly = readOnly;
    this._applySettings();
  }

  /**
   * Theme: 'light', 'dark' or 'system' (`drawer.setTheme`), as the `theme` attribute: wins over the theme saved in the
   * browser, undefined leaves it to the drawer
   */
  get theme(): Theme | undefined {
    return this.#theme;
  }

  set theme(theme: Theme | undefined) {
    this.#theme = theme;
    this._applySettings();
  }

  /**
   * Language of the interface, 'auto' for the one of the browser (`drawer.setLanguage`), as the `language` attribute:
   * wins over the saved one, undefined leaves it to the drawer
   */
  get language(): Language | 'auto' | undefined {
    return this.#language;
  }

  set language(language: Language | 'auto' | undefined) {
    this.#language = language;
    this._applySettings();
  }

  /**
   * User of the app: id and name in collaboration sessions (`drawer.setUser`), null for an anonymous user, undefined
   * to leave it to the drawer
   */
  get user(): DrawerUser | null | undefined {
    return this.#user;
  }

  set user(user: DrawerUser | null | undefined) {
    this.#user = user;
    this._applyUser();
  }

  /**
   * Element in the page: drawer created (once the library is loaded), unless it was only moved
   */
  connectedCallback() {
    for (const property of properties) this._upgrade(property);
    addStyle(this.localName);
    if (this.#unmount) return;

    this.#unmount = mountDrawer(
      this,
      () =>
        withSettings(this.#options ?? this._readOptions(), {
          readOnly: this.#readOnly,
          theme: this.#theme,
          language: this.#language,
          user: this.#user,
        }),
      {
        created: (drawer) => {
          this.#drawer = drawer;
          this.#userKey = this.#user === undefined ? undefined : JSON.stringify(this.#user);
        },
        ready: (drawer) => this.dispatchEvent(new CustomEvent('drawerready', { detail: drawer })),
        change: (drawer) => this.dispatchEvent(new CustomEvent('drawerchange', { detail: drawer })),
      }
    );
  }

  /**
   * Element out of the page: drawer destroyed, unless the element is added again at once (moved)
   */
  disconnectedCallback() {
    queueMicrotask(() => {
      if (this.isConnected || !this.#unmount) return;

      this.#unmount();
      this.#unmount = undefined;
      this.#drawer = null;
    });
  }

  /**
   * Attribute followed changed: setting of the drawer
   * @param name Name of the attribute
   * @param _previous Previous value
   * @param value New value, null once removed
   */
  attributeChangedCallback(name: string, _previous: string | null, value: string | null) {
    if (name === 'read-only') {
      // boolean attribute, also `read-only="false"`
      this.readOnly = value !== null && value !== 'false';
    } else if (name === 'theme') {
      this.theme = (value ?? undefined) as Theme | undefined;
    } else {
      this.language = (value ?? undefined) as Language | 'auto' | undefined;
    }
  }

  /**
   * Options of the `options` attribute (JSON, for pages without script)
   * @returns Options, undefined without attribute or when it is not JSON (warning)
   */
  private _readOptions(): Partial<DrawerOptions> | undefined {
    const json = this.getAttribute('options');

    if (!json) return;
    try {
      return JSON.parse(json) as Partial<DrawerOptions>;
    } catch {
      console.warn(`<${this.localName}>: options attribute is not JSON, ignored`);
    }
  }

  /**
   * Settings given to the drawer once created: readOnly, theme and language when they differ from its own ones
   */
  private _applySettings() {
    if (this.#drawer)
      applySettings(this.#drawer, { readOnly: this.#readOnly, theme: this.#theme, language: this.#language });
  }

  /**
   * User given to the drawer once created, unless it is equal to the last one given
   */
  private _applyUser() {
    if (!this.#drawer || this.#user === undefined) return;

    const key = JSON.stringify(this.#user);

    if (key === this.#userKey) return;
    this.#userKey = key;
    this.#drawer.setUser(this.#user);
  }

  /**
   * Property set on the element before its class was defined (own property hiding the setter): set again through the
   * setter
   * @param property Name of the property
   */
  private _upgrade(property: (typeof properties)[number]) {
    if (!Object.hasOwn(this, property)) return;

    const element = this as unknown as Record<string, unknown>;
    const value = element[property];

    delete element[property];
    element[property] = value;
  }
}

/**
 * Define the element under a name (`free-drawing` is defined by the package in a browser)
 * @param name Name of the element, with a dash
 * @returns Class of the element of this name (already defined: the class defined)
 */
export function defineFreeDrawing(name = 'free-drawing'): typeof FreeDrawingElement {
  const defined = customElements.get(name);

  if (defined) return defined as typeof FreeDrawingElement;

  // a class is defined under one name only
  const element = name === 'free-drawing' ? FreeDrawingElement : class extends FreeDrawingElement {};

  customElements.define(name, element);
  return element;
}
