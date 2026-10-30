import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApp, h, nextTick, reactive, ref, type App } from 'vue';
import type { Drawer, DrawerOptions, DrawerUser, Language, Theme } from '@fabwcie/free-drawing';
import { FreeDrawing } from '../src/index.js';

/** Props of the component in a test */
type TestProps = {
  options: Partial<DrawerOptions>;
  readOnly?: boolean;
  theme?: Theme;
  language?: Language | 'auto';
  user?: DrawerUser | null;
  class?: string;
  onReady?: (drawer: Drawer) => void;
  onChange?: (drawer: Drawer) => void;
  onError?: (error: unknown) => void;
};

let count = 0;
let app: App | null = null;
let host: HTMLDivElement;

/**
 * Component rendered in the page with reactive props, drawer created
 * @param props Props of the component, changed by the test
 * @returns Template ref of the component and its key (another key creates another drawer)
 */
async function mount(props: TestProps) {
  const board = ref<InstanceType<typeof FreeDrawing>>();
  const key = ref('a');

  host = document.createElement('div');
  document.body.append(host);
  app = createApp({ render: () => h(FreeDrawing, { ...props, key: key.value, ref: board }) });
  app.mount(host);
  await vi.waitFor(() => expect(board.value?.drawer).toBeTruthy());

  return { board, key };
}

/**
 * Options of a drawer of the test: own storage key, no auto save
 * @returns Options of the component
 */
function options(): Partial<DrawerOptions> {
  return { localStorageKey: `vue-${++count}`, autoSave: false };
}

// library loaded by the component (its sources transformed once): not counted in the wait of the first test
beforeAll(async () => {
  await import('@fabwcie/free-drawing');
});

afterEach(() => {
  app?.unmount();
  app = null;
  host?.remove();
});

describe('FreeDrawing (Vue)', () => {
  it('creates the drawer in its element: template ref, ready, options', async () => {
    const onReady = vi.fn();
    const { board } = await mount({ options: options(), class: 'board', onReady });
    const drawer = board.value!.drawer!;

    expect(host.querySelector('.board')!.firstElementChild).toBe(drawer.$el);
    expect(drawer.$el.querySelector('canvas')).not.toBeNull();
    expect(drawer.options.localStorageKey).toBe(`vue-${count}`);
    // its host followed, not the window (of the size of the window or hidden when mounted)
    expect(drawer.options.followWindow).toBe(false);
    await vi.waitFor(() => expect(onReady).toHaveBeenCalledWith(drawer));
  });

  it('settings followed: read only, theme, language, user', async () => {
    const props = reactive<TestProps>({
      options: options(),
      readOnly: true,
      theme: 'dark',
      language: 'fr',
      user: { id: 'u1', name: 'Ada' },
    });
    const { board } = await mount(props);
    const drawer = board.value!.drawer!;
    const setUser = vi.fn();

    expect(drawer.readOnly).toBe(true);
    expect(drawer.isDarkMode()).toBe(true);
    expect(drawer.i18n.language).toBe('fr');
    expect(drawer.getUserId()).toBe('u1');

    drawer.setUser = setUser;
    // equal user: not given again
    props.user = { id: 'u1', name: 'Ada' };
    await nextTick();
    expect(setUser).not.toHaveBeenCalled();

    Object.assign(props, { readOnly: false, theme: 'light', language: 'de', user: { id: 'u2', name: 'Bob' } });
    await nextTick();
    expect(drawer.readOnly).toBe(false);
    expect(drawer.isDarkMode()).toBe(false);
    expect(drawer.i18n.language).toBe('de');
    expect(setUser).toHaveBeenCalledWith({ id: 'u2', name: 'Bob' });
  });

  it('settings given as options are kept without props', async () => {
    const { board } = await mount({ options: { ...options(), readOnly: true, theme: 'dark', language: 'es' } });
    const drawer = board.value!.drawer!;

    expect(drawer.readOnly).toBe(true);
    expect(drawer.isDarkMode()).toBe(true);
    expect(drawer.i18n.language).toBe('es');
  });

  it('theme and language of the options leave the ones chosen by the user (saved in the browser)', async () => {
    const given = options();

    localStorage.setItem(`${given.localStorageKey}-preferences`, JSON.stringify({ theme: 'light', language: 'de' }));

    const { board } = await mount({ options: { ...given, theme: 'dark', language: 'es' } });
    const drawer = board.value!.drawer!;

    expect(drawer.isDarkMode()).toBe(false);
    expect(drawer.i18n.language).toBe('de');
  });

  it('only the settings changed are given again; drawer not created: error event', async () => {
    const props = reactive<TestProps>({ options: options(), readOnly: false, theme: 'light', language: 'fr' });
    const { board } = await mount(props);
    const drawer = board.value!.drawer!;

    // chosen in the menu, made read only by the app: kept when the theme changes
    drawer.setLanguage('de');
    drawer.setReadOnly(true);
    props.theme = 'dark';
    await nextTick();
    expect(drawer.isDarkMode()).toBe(true);
    expect([drawer.i18n.language, drawer.readOnly]).toEqual(['de', true]);
    app!.unmount();
    host.remove();

    // plugin without name: refused by the drawer
    const onError = vi.fn();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    host = document.createElement('div');
    document.body.append(host);
    app = createApp({
      render: () => h(FreeDrawing, { options: { ...options(), plugins: [class {} as never] }, onError }),
    });
    app.mount(host);
    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(expect.any(Error)));
    error.mockRestore();
  });

  it('change event emitted with the drawer', async () => {
    const onChange = vi.fn();
    const { board } = await mount({ options: options(), onChange });

    board.value!.drawer!.stage.fire('change');

    expect(onChange).toHaveBeenCalledWith(board.value!.drawer);
  });

  it('another key creates another drawer: the destroyed one empties its own element only', async () => {
    const { board, key } = await mount({ options: options() });
    const first = board.value!.drawer!;
    const destroy = vi.spyOn(first, 'destroy');

    key.value = 'b';
    // component rendered again on next tick, its drawer created once mounted
    await vi.waitFor(() => {
      expect(board.value?.drawer).toBeTruthy();
      expect(board.value!.drawer).not.toBe(first);
    });
    // destroy of the first drawer ended
    await destroy.mock.results[0].value;

    const element = host.firstElementChild!;

    expect(element.children).toHaveLength(1);
    expect(element.firstElementChild).toBe(board.value!.drawer!.$el);
  });

  it('drawer destroyed once unmounted', async () => {
    const { board } = await mount({ options: options() });
    const destroy = vi.spyOn(board.value!.drawer!, 'destroy');

    app!.unmount();
    app = null;

    expect(destroy).toHaveBeenCalledOnce();
    expect(host.querySelector('canvas')).toBeNull();
  });
});
