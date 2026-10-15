import { describe, expect, it } from 'vitest';
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
      'drawer-position-container',
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
    [
      drawer.zoom!.$zoomContainer,
      drawer.position!.$positionContainer,
      drawer.help.$helpContainer,
      drawer.undoRedo.$undoRedoContainer,
      drawer.layersPanel!.$buttonContainer,
      drawer.layersPanel!.$panel,
    ].forEach(($el) => expect($el.classList.contains('drawer-zen-hidden')).toBe(true));
    expect(drawer.toolbar.$toolbarContent.classList.contains('drawer-zen-hidden')).toBe(false);
    expect(drawer.setting.$dropdownContainer.classList.contains('drawer-zen-hidden')).toBe(false);

    drawer.setting.toggleZenMode();
    expect(layout.$container.classList.contains('is-zen')).toBe(false);
  });

  it('Interface ignores pointer during pointer actions', () => {
    const drawer = createDrawer();
    const pointerEvents = () => drawer.layout.$container.style.getPropertyValue('--drawer-pointer-events');

    drawer.layout.setPointerEvents('none');
    expect(pointerEvents()).toBe('none');
    drawer.UIPointerEvents('all');
    expect(pointerEvents()).toBe('all');
  });
});
