import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Drawer, DrawerOptions } from '@fabwcie/free-drawing';
import { FreeDrawingElement, defineFreeDrawing } from '../src/index.js';

let count = 0;
const elements: HTMLElement[] = [];

/**
 * Options of a drawer of the test: own storage key, no auto save
 * @param options Other options
 * @returns Options of the element
 */
function options(options: Partial<DrawerOptions> = {}): Partial<DrawerOptions> {
  return { localStorageKey: `element-${++count}`, autoSave: false, ...options };
}

/**
 * Element added to the page, drawer created
 * @param element Element of the test, its properties and attributes set
 * @returns Drawer of the element
 */
async function connect(element: FreeDrawingElement): Promise<Drawer> {
  elements.push(element);
  document.body.append(element);
  await vi.waitFor(() => expect(element.drawer).not.toBeNull());
  return element.drawer!;
}

/**
 * New `<free-drawing>` with options
 * @param settings Options of the drawer
 * @returns Element, not in the page
 */
function create(settings: Partial<DrawerOptions> = {}) {
  const element = document.createElement('free-drawing');

  element.options = options(settings);
  return element;
}

// library loaded by the element (its sources transformed once): not counted in the wait of the first test
beforeAll(async () => {
  await import('@fabwcie/free-drawing');
});

afterEach(async () => {
  for (const element of elements.splice(0)) element.remove();
  // drawers destroyed (after a microtask: moved elements keep theirs)
  await Promise.resolve();
});

describe('<free-drawing>', () => {
  it('defined by the package: drawer created in the element, ready event, options, style of the element', async () => {
    const element = create();
    const ready = vi.fn();

    expect(customElements.get('free-drawing')).toBe(FreeDrawingElement);
    expect(element).toBeInstanceOf(FreeDrawingElement);
    element.addEventListener('drawerready', (event) => ready(event.detail));

    const drawer = await connect(element);

    expect(element.querySelector('canvas')).not.toBeNull();
    expect(element.firstElementChild).toBe(drawer.$el);
    expect(drawer.options.localStorageKey).toBe(`element-${count}`);
    await vi.waitFor(() => expect(ready).toHaveBeenCalledWith(drawer));
    // block of the page, any style of the app wins
    expect(document.head.textContent).toContain(
      ':where(free-drawing:not([hidden])) { display: block; overflow: hidden; contain: inline-size; }'
    );
  });

  it('attributes and properties followed: read only, theme, language, user', async () => {
    const element = create();

    element.setAttribute('read-only', '');
    element.setAttribute('theme', 'dark');
    element.setAttribute('language', 'fr');
    element.user = { id: 'u1', name: 'Ada' };

    const drawer = await connect(element);
    const setUser = vi.spyOn(drawer, 'setUser');

    expect(drawer.readOnly).toBe(true);
    expect(drawer.isDarkMode()).toBe(true);
    expect(drawer.i18n.language).toBe('fr');
    expect(drawer.getUserId()).toBe('u1');

    element.removeAttribute('read-only');
    element.setAttribute('theme', 'light');
    element.language = 'de';
    expect(drawer.readOnly).toBe(false);
    expect(drawer.isDarkMode()).toBe(false);
    expect(drawer.i18n.language).toBe('de');
    element.setAttribute('read-only', 'false');
    expect(drawer.readOnly).toBe(false);
    element.readOnly = true;
    expect(drawer.readOnly).toBe(true);

    // equal user: not given again
    element.user = { id: 'u1', name: 'Ada' };
    expect(setUser).not.toHaveBeenCalled();
    element.user = { id: 'u2', name: 'Bob' };
    expect(setUser).toHaveBeenCalledWith({ id: 'u2', name: 'Bob' });
  });

  it('in a shadow root (component of Lit...): style of the element added to it; not created: error event', async () => {
    const shadowHost = document.createElement('div');
    const shadow = shadowHost.attachShadow({ mode: 'open' });
    const element = create();

    document.body.append(shadowHost);
    elements.push(shadowHost);
    shadow.append(element);
    await vi.waitFor(() => expect(element.drawer).not.toBeNull());
    expect(shadow.textContent).toContain(':where(free-drawing:not([hidden])) { display: block;');

    // plugin without name: refused by the drawer
    const failed = create({ plugins: [class {} as never] });
    const onError = vi.fn();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    failed.addEventListener('drawererror', (event) => onError(event.detail));
    elements.push(failed);
    document.body.append(failed);
    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(expect.any(Error)));
    error.mockRestore();
  });

  it('settings given as options are kept without attribute', async () => {
    const drawer = await connect(create({ readOnly: true, theme: 'dark', language: 'es' }));

    expect(drawer.readOnly).toBe(true);
    expect(drawer.isDarkMode()).toBe(true);
    expect(drawer.i18n.language).toBe('es');
  });

  it('drawer kept when the element is moved, destroyed once it leaves the page', async () => {
    const element = create();
    const drawer = await connect(element);
    const destroy = vi.spyOn(drawer, 'destroy');
    const other = document.createElement('section');

    document.body.append(other);
    other.append(element);
    await Promise.resolve();
    expect(destroy).not.toHaveBeenCalled();
    expect(element.drawer).toBe(drawer);

    element.remove();
    await vi.waitFor(() => expect(destroy).toHaveBeenCalledOnce());
    expect(element.drawer).toBeNull();
    expect(element.querySelector('canvas')).toBeNull();
    other.remove();

    // back in the page: a new drawer
    expect(await connect(element)).not.toBe(drawer);
  });

  it('change event gives the drawer', async () => {
    const element = create();
    const drawer = await connect(element);
    const change = vi.fn();

    element.addEventListener('drawerchange', (event) => change(event.detail));
    drawer.stage.fire('change');
    expect(change).toHaveBeenCalledWith(drawer);
  });

  it('options of the JSON attribute (page without script), invalid JSON ignored', async () => {
    const element = document.createElement('free-drawing');
    const key = `element-attribute-${++count}`;

    element.setAttribute('options', JSON.stringify({ localStorageKey: key, autoSave: false, readOnly: true }));

    const drawer = await connect(element);

    expect(drawer.options.localStorageKey).toBe(key);
    expect(drawer.readOnly).toBe(true);

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const invalid = document.createElement('free-drawing');

    invalid.setAttribute('options', '{ not json');
    invalid.setAttribute('theme', 'dark');
    await connect(invalid);
    expect(warn).toHaveBeenCalledWith('<free-drawing>: options attribute is not JSON, ignored');
    warn.mockRestore();
  });

  it('other names; properties set before the element is defined are kept', async () => {
    const element = document.createElement('board-late') as FreeDrawingElement;
    const key = `element-late-${++count}`;

    // set by a framework before the class is defined: own properties of an unknown element
    Object.assign(element, { options: options({ localStorageKey: key }), theme: 'dark' });
    elements.push(element);
    document.body.append(element);

    const Board = defineFreeDrawing('board-late');

    expect(Board).not.toBe(FreeDrawingElement);
    expect(defineFreeDrawing('board-late')).toBe(Board);
    expect(element).toBeInstanceOf(FreeDrawingElement);
    await vi.waitFor(() => expect(element.drawer).not.toBeNull());
    expect(element.drawer!.options.localStorageKey).toBe(key);
    expect(element.drawer!.isDarkMode()).toBe(true);
    expect(document.head.textContent).toContain(':where(board-late:not([hidden]))');
  });
});
