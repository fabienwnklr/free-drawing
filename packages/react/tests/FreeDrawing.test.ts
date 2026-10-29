import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { StrictMode, act, createElement, createRef, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { Drawer } from '@fabwcie/free-drawing';
import { FreeDrawing, type FreeDrawingProps } from '../src/index.js';

// updates of React in tests are wrapped in act
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let count = 0;
let root: Root | null = null;
let host: HTMLDivElement;

/**
 * Component rendered in the page, drawer created
 * @param element Element of the test
 * @param ref Ref of the drawer, set once it is created
 */
async function render(element: ReactElement, ref: { current: Drawer | null }) {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root!.render(element));
  await act(() => vi.waitFor(() => expect(ref.current).not.toBeNull()));
}

/**
 * Props of a drawer of the test: own storage key, no auto save
 * @param props Other props
 * @returns Props of the component
 */
function props(props: Partial<FreeDrawingProps> = {}): FreeDrawingProps {
  return { options: { localStorageKey: `react-${++count}`, autoSave: false }, ...props };
}

// library loaded by the component (its sources transformed once): not counted in the wait of the first test
beforeAll(async () => {
  await import('@fabwcie/free-drawing');
});

afterEach(async () => {
  await act(async () => root?.unmount());
  root = null;
  host?.remove();
});

describe('FreeDrawing (React)', () => {
  it('creates the drawer in its element: ref, ready, options', async () => {
    const ref = createRef<Drawer>();
    const onReady = vi.fn();

    await render(createElement(FreeDrawing, { ...props({ onReady, className: 'board' }), ref }), ref);

    const element = host.querySelector('.board')!;

    expect(element.querySelector('canvas')).not.toBeNull();
    expect(ref.current!.options.localStorageKey).toBe(`react-${count}`);
    await act(() => vi.waitFor(() => expect(onReady).toHaveBeenCalledWith(ref.current)));
  });

  it('one drawer in strict mode (mounted, unmounted and mounted again)', async () => {
    const ref = createRef<Drawer>();

    await render(createElement(StrictMode, null, createElement(FreeDrawing, { ...props(), ref })), ref);

    const element = host.firstElementChild!;

    expect(element.children).toHaveLength(1);
    expect(element.firstElementChild).toBe(ref.current!.$el);
    expect(ref.current!.$el.querySelector('canvas')).not.toBeNull();
  });

  it('another key creates another drawer: the destroyed one empties its own element only', async () => {
    const ref = createRef<Drawer>();
    const base = props();

    await render(createElement(FreeDrawing, { ...base, key: 'a', ref }), ref);

    const first = ref.current!;
    const destroy = vi.spyOn(first, 'destroy');

    await act(async () => root!.render(createElement(FreeDrawing, { ...base, key: 'b', ref })));
    await act(() => vi.waitFor(() => expect(ref.current).not.toBeNull()));
    // destroy of the first drawer ended
    await act(() => destroy.mock.results[0].value);

    const element = host.firstElementChild!;

    expect(ref.current).not.toBe(first);
    expect(element.children).toHaveLength(1);
    expect(element.firstElementChild).toBe(ref.current!.$el);
    expect(ref.current!.$el.querySelector('canvas')).not.toBeNull();
  });

  it('settings followed: read only, theme, language, user', async () => {
    const ref = createRef<Drawer>();
    const setUser = vi.fn();
    const base = props({ readOnly: true, theme: 'dark', language: 'fr', user: { id: 'u1', name: 'Ada' } });
    const view = (settings: Partial<FreeDrawingProps>) => createElement(FreeDrawing, { ...base, ...settings, ref });

    await render(view({}), ref);

    const drawer = ref.current!;

    expect(drawer.readOnly).toBe(true);
    expect(drawer.isDarkMode()).toBe(true);
    expect(drawer.i18n.language).toBe('fr');
    expect(drawer.getUserId()).toBe('u1');

    drawer.setUser = setUser;
    // equal user of another render: not given again
    await act(async () => root!.render(view({ user: { id: 'u1', name: 'Ada' } })));
    expect(setUser).not.toHaveBeenCalled();

    await act(async () =>
      root!.render(view({ readOnly: false, theme: 'light', language: 'de', user: { id: 'u2', name: 'Bob' } }))
    );
    expect(drawer.readOnly).toBe(false);
    expect(drawer.isDarkMode()).toBe(false);
    expect(drawer.i18n.language).toBe('de');
    expect(setUser).toHaveBeenCalledWith({ id: 'u2', name: 'Bob' });
  });

  it('only the settings changed are given again: language chosen in the menu, read only kept', async () => {
    const ref = createRef<Drawer>();
    const base = props({ readOnly: false, theme: 'light', language: 'fr' });

    await render(createElement(FreeDrawing, { ...base, ref }), ref);
    const drawer = ref.current!;

    // chosen by the user in the menu, made read only by the app (a session): kept when the theme changes
    drawer.setLanguage('de');
    drawer.setReadOnly(true);
    await act(async () => root!.render(createElement(FreeDrawing, { ...base, theme: 'dark', ref })));
    expect(drawer.isDarkMode()).toBe(true);
    expect([drawer.i18n.language, drawer.readOnly]).toEqual(['de', true]);
  });

  it('drawer not created (invalid options): error given to onError, logged', async () => {
    const onError = vi.fn();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const base = props();

    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    await act(async () =>
      root!.render(
        createElement(FreeDrawing, {
          ...base,
          // plugin without name: refused by the drawer
          options: { ...base.options, plugins: [class {} as never] },
          onError,
        })
      )
    );
    await act(() => vi.waitFor(() => expect(onError).toHaveBeenCalledWith(expect.any(Error))));
    expect(error).toHaveBeenCalledWith('[free-drawing] drawer not created', expect.any(Error));
    error.mockRestore();
  });

  it('settings given as options are kept without props', async () => {
    const ref = createRef<Drawer>();
    const base = props();

    await render(
      createElement(FreeDrawing, {
        ...base,
        options: { ...base.options, readOnly: true, theme: 'dark', language: 'es' },
        ref,
      }),
      ref
    );

    expect(ref.current!.readOnly).toBe(true);
    expect(ref.current!.isDarkMode()).toBe(true);
    expect(ref.current!.i18n.language).toBe('es');
  });

  it('theme and language of the options leave the ones chosen by the user (saved in the browser)', async () => {
    const ref = createRef<Drawer>();
    const base = props();

    localStorage.setItem(
      `${base.options!.localStorageKey}-preferences`,
      JSON.stringify({ theme: 'light', language: 'de' })
    );
    await render(
      createElement(FreeDrawing, { ...base, options: { ...base.options, theme: 'dark', language: 'es' }, ref }),
      ref
    );

    expect(ref.current!.isDarkMode()).toBe(false);
    expect(ref.current!.i18n.language).toBe('de');
  });

  it('change event calls the last onChange', async () => {
    const ref = createRef<Drawer>();
    const first = vi.fn();
    const last = vi.fn();
    const base = props();

    await render(createElement(FreeDrawing, { ...base, onChange: first, ref }), ref);
    await act(async () => root!.render(createElement(FreeDrawing, { ...base, onChange: last, ref })));
    ref.current!.stage.fire('change');

    expect(first).not.toHaveBeenCalled();
    expect(last).toHaveBeenCalledWith(ref.current);
  });

  it('drawer destroyed once unmounted', async () => {
    const ref = createRef<Drawer>();

    await render(createElement(FreeDrawing, { ...props(), ref }), ref);

    const drawer = ref.current!;
    const destroy = vi.spyOn(drawer, 'destroy');

    await act(async () => root!.unmount());
    root = null;

    expect(destroy).toHaveBeenCalledOnce();
    expect(ref.current).toBeNull();
    expect(host.querySelector('canvas')).toBeNull();
  });
});
