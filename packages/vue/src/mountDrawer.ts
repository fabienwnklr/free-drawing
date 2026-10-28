import type { Drawer, DrawerOptions, DrawerUser, Language, Theme } from '@fabwcie/free-drawing';

/** Settings of a drawer followed by a component: applied when given and different from the ones of the drawer */
export interface DrawerSettings {
  /** Drawing can't be modified by the user (`drawer.setReadOnly`) */
  readOnly?: boolean;
  /** Theme: 'light', 'dark' or 'system' (`drawer.setTheme`): wins over the theme saved in the browser */
  theme?: Theme;
  /** Language of the interface, 'auto' for the one of the browser (`drawer.setLanguage`): wins over the saved one */
  language?: Language | 'auto';
  /** User of the app: id and name in collaboration sessions (`drawer.setUser`), null for an anonymous user */
  user?: DrawerUser | null;
}

/** Calls of a drawer mounted by a component */
export interface MountHandlers {
  /** Drawer created (settings applied), before it is ready */
  created: (drawer: Drawer) => void;
  /** Drawer ready: plugins initialized, drawing of the `storage` option loaded (`drawer.ready`) */
  ready: (drawer: Drawer) => void;
  /** Drawing changed: shapes, background... (`change` event) */
  change: (drawer: Drawer) => void;
}

/**
 * Options of the drawer with the settings of the component: settings not given leave the ones of the options
 * @param options Options of the component
 * @param settings Settings of the component, undefined when not given
 * @returns Options of the drawer
 */
export function withSettings(
  options: Partial<DrawerOptions> | undefined,
  settings: DrawerSettings
): Partial<DrawerOptions> & DrawerSettings {
  return { ...options, ...Object.fromEntries(Object.entries(settings).filter(([, value]) => value !== undefined)) };
}

/**
 * Settings of the component given to the drawer: readOnly, theme and language when they differ from its own ones (the
 * theme and language saved in the browser win over the options)
 * @param drawer Drawer of the component
 * @param settings Settings of the component, undefined ones are left to the drawer
 */
export function applySettings(drawer: Drawer, { readOnly, theme, language }: DrawerSettings) {
  if (readOnly !== undefined) drawer.setReadOnly(readOnly);
  if (theme !== undefined && drawer.theme !== theme) drawer.setTheme(theme);
  if (language !== undefined && drawer.getPreferences().language !== language) drawer.setLanguage(language);
}

/**
 * Drawer created in its own element of the host once the library is loaded (on mount, never on a server): of the size
 * of the host and following it, unless `width` or `height` is given
 * @param host Element of the component
 * @param getOptions Options and settings of the component when the library is loaded
 * @param handlers Calls of the drawer: created, ready, drawing changed
 * @returns Function destroying the drawer, or cancelling its creation
 */
export function mountDrawer(
  host: HTMLElement,
  getOptions: () => Partial<DrawerOptions> & DrawerSettings,
  handlers: MountHandlers
): () => void {
  // own element: a drawer being destroyed (asynchronous) empties its element, not the one of the next drawer
  const $el = document.createElement('div');
  let drawer: Drawer | null = null;
  let observer: ResizeObserver | undefined;
  let unmounted = false;

  host.append($el);
  void import('@fabwcie/free-drawing').then(({ Drawer, drawerEvents }) => {
    if (unmounted) return;

    // undefined settings left to the drawer
    const options: Partial<DrawerOptions> = Object.fromEntries(
      Object.entries(getOptions()).filter(([, value]) => value !== undefined)
    );
    const sized = !!(options.width || options.height);
    const created = new Drawer($el, {
      // size of the host, else of the window (e.g. height of a host whose height comes from its content)
      ...(!sized && host.clientWidth ? { width: host.clientWidth } : {}),
      ...(!sized && host.clientHeight ? { height: host.clientHeight } : {}),
      ...options,
    });

    drawer = created;
    applySettings(created, options);
    if (!sized && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        if (host.clientWidth && host.clientHeight) created.setSize(host.clientWidth, host.clientHeight);
      });
      observer.observe(host);
    }
    created.on(drawerEvents.change, () => handlers.change(created));
    created.ready.then(
      () => {
        if (!unmounted) handlers.ready(created);
      },
      () => {
        // drawing of `storage` not loaded: error shown by the drawer, `drawer.ready` rejected
      }
    );
    handlers.created(created);
  });

  return () => {
    unmounted = true;
    observer?.disconnect();
    void drawer?.destroy();
    $el.remove();
  };
}
