import { describe, expect, it, vi } from 'vitest';
import { createDrawer } from './helpers';

/** Classes of elements of a container, in order */
const classes = ($el: Element) => [...$el.children].map(($child) => $child.classList[0]);

describe('Layout', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Container in drawer element: canvas, header, panels, footer, then dialogs and toasts', () => {
    const drawer = createDrawer({ language: 'en' });
    const { layout } = drawer;
    const $container = layout.$container;

    expect(drawer.$el.firstElementChild).toBe($container);
    expect($container.getAttribute('role')).toBe('application');
    expect($container.tabIndex).toBe(0);
    expect($container.getAttribute('aria-label')).toBe('Drawing board');
    expect($container.lang).toBe('en');
    // panels of interface created with drawer before footer (tab order)
    expect(classes($container).slice(0, 2)).toEqual(['konvajs-content', 'drawer-header-container']);
    expect($container.lastElementChild).toBe(layout.$footer);
    expect(classes(layout.$header)).toEqual([
      'drawer-dropdown-container',
      'drawer-layers-button-container',
      'drawer-library-button-container',
      'drawer-position-container',
      'drawer-save-button-container',
    ]);
    expect(classes(layout.$footerStart)).toEqual(['drawer-zoom-container', 'drawer-undoredo-container']);
    expect(classes(layout.$footer)).toEqual([
      'drawer-footer-left',
      'drawer-toolbar-container',
      'drawer-help-container',
    ]);

    // added later: after footer
    drawer.toast('Hello');
    expect($container.lastElementChild!.classList.contains('drawer-toasts')).toBe(true);

    // regions of previous versions
    expect(drawer.$drawerContainer).toBe($container);
    expect(drawer.$headerContainer).toBe(layout.$header);
    expect(drawer.$footerContainer).toBe(layout.$footer);
    expect(drawer.$footerLeftElement).toBe(layout.$footerStart);
  });

  it('Elements added to regions, after another one, hidden in zen mode', () => {
    const drawer = createDrawer();
    const { layout } = drawer;
    const $first = document.createElement('div');
    const $second = document.createElement('div');
    const $floating = document.createElement('div');

    layout.add('header', $first, { hideInZen: true });
    layout.add('header', $second, { after: drawer.setting.$dropdownContainer });
    layout.add('floating', $floating);
    expect(layout.$header.lastElementChild).toBe($first);
    expect(drawer.setting.$dropdownContainer.nextElementSibling).toBe($second);
    expect(layout.$container.lastElementChild).toBe($floating);

    drawer.setting.toggleZenMode();
    expect(layout.zen).toBe(true);
    expect(drawer.setting.zenMode).toBe(true);
    expect(layout.$container.classList.contains('is-zen')).toBe(true);
    expect($first.classList.contains('drawer-zen-hidden')).toBe(true);
    expect($second.classList.contains('drawer-zen-hidden')).toBe(false);
    // zoom, position, help, undo / redo, layers button and panel hidden; toolbar and menu shown
    for (const $el of [
      drawer.zoom!.$zoomContainer,
      drawer.position!.$positionContainer,
      drawer.help.$helpContainer,
      drawer.undoRedo.$undoRedoContainer,
      drawer.layersPanel!.$buttonContainer,
      drawer.layersPanel!.$panel,
    ]) {
      expect($el.classList.contains('drawer-zen-hidden')).toBe(true);
    }
    expect(drawer.toolbar.$toolbarContent.classList.contains('drawer-zen-hidden')).toBe(false);
    expect(drawer.setting.$dropdownContainer.classList.contains('drawer-zen-hidden')).toBe(false);

    drawer.setting.toggleZenMode();
    expect(layout.$container.classList.contains('is-zen')).toBe(false);
  });

  it('Drawer of the size of the window follows it, unless `followWindow` is false (sized by its app)', () => {
    const observed: Element[] = [];
    const isFull = (drawer: ReturnType<typeof createDrawer>) => drawer.$drawerContainer.classList.contains('is-full');

    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(800);
    vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(600);
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe($el: Element) {
          observed.push($el);
        }
        disconnect() {}
      }
    );
    try {
      expect(isFull(createDrawer({ width: 800, height: 600 }))).toBe(true);
      expect(observed).toContain(document.documentElement);
      // components follow their host, of the size of the window when mounted or hidden
      observed.length = 0;
      expect(isFull(createDrawer({ width: 800, height: 600, followWindow: false }))).toBe(false);
      expect(observed).not.toContain(document.documentElement);
      expect(isFull(createDrawer({ width: 300, height: 200, followWindow: true }))).toBe(true);
    } finally {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    }
  });

  it('Interface ignores pointer during pointer actions', () => {
    const drawer = createDrawer();
    const pointerEvents = () => drawer.layout.$container.style.getPropertyValue('--drawer-pointer-events');

    drawer.layout.setPointerEvents('none');
    expect(pointerEvents()).toBe('none');
    drawer.UIPointerEvents('all');
    expect(pointerEvents()).toBe('all');
  });

  it('Compact interface while the footer does not fit on one line', () => {
    const drawer = createDrawer();
    const { layout } = drawer;
    const compact = () => layout.$container.classList.contains('is-compact');
    let needed = 0;

    // footer parts as wide as needed (no layout in tests), drawer as wide as its stage
    Object.defineProperty(layout.$footer, 'clientWidth', { get: () => drawer.stage.width(), configurable: true });
    Object.defineProperty(layout.$footer, 'scrollWidth', {
      get: () => Math.max(needed - (layout.zen ? 300 : 0), drawer.stage.width()),
      configurable: true,
    });
    needed = 1000;
    drawer.setSize(1200, 800);
    expect(compact()).toBe(false);

    // narrow drawer (phone)
    drawer.setSize(390, 800);
    expect(compact()).toBe(true);
    drawer.setSize(1200, 800);
    expect(compact()).toBe(false);

    // zen mode: footer start hidden
    drawer.setSize(900, 800);
    expect(compact()).toBe(true);
    drawer.setting.toggleZenMode();
    expect(compact()).toBe(false);
    drawer.setting.toggleZenMode();
    expect(compact()).toBe(true);

    // element of an app added to the footer
    drawer.setSize(1100, 800);
    expect(compact()).toBe(false);
    needed = 1150;
    layout.add('footerStart', document.createElement('button'));
    expect(compact()).toBe(true);
  });

  it('Settings menu and context menu taller than the drawer scroll in it', () => {
    const drawer = createDrawer();
    const { setting, contextMenu } = drawer;
    const $container = drawer.$drawerContainer;
    const rect = (top: number, bottom: number) => ({ top, bottom }) as DOMRect;

    // drawer of 300 px, menu 100 px below its top: 12 px kept below the menu
    $container.getBoundingClientRect = () => rect(0, 300);
    setting.$menu.getBoundingClientRect = () => rect(100, 700);
    setting.$button.click();
    expect(setting.$menu.style.maxHeight).toBe('188px');
    // drawer resized while shown
    $container.getBoundingClientRect = () => rect(0, 250);
    window.dispatchEvent(new Event('resize'));
    expect(setting.$menu.style.maxHeight).toBe('138px');
    setting.hide();

    // context menu: height of the drawer, 4 px from its edges
    Object.defineProperty($container, 'clientHeight', { value: 300, configurable: true });
    $container.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    expect(contextMenu.isVisible()).toBe(true);
    expect(contextMenu.$menu.style.maxHeight).toBe('292px');
    contextMenu.hide();
  });
});
