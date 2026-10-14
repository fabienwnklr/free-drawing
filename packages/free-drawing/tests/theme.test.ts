import { describe, expect, it, vi, afterEach } from 'vitest';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import { createDrawer, keydown } from './helpers';

const isDark = (drawer: ReturnType<typeof createDrawer>) => drawer.$drawerContainer.classList.contains('drawer-dark');

describe('Dark mode', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('Theme option, menu item and shortcut switch dark mode, choice saved', () => {
    const drawer = createDrawer();
    const onTheme = vi.fn();
    const $item = drawer.setting.$darkModeButton;

    expect(drawer.theme).toBe('light');
    expect(isDark(drawer)).toBe(false);
    expect($item.getAttribute('aria-pressed')).toBe('false');
    expect($item.getAttribute('aria-keyshortcuts')).toBe('Alt+Shift+D');

    drawer.on('drawer.theme.change', onTheme);
    $item.click();
    expect(drawer.isDarkMode()).toBe(true);
    expect(isDark(drawer)).toBe(true);
    expect($item.getAttribute('aria-pressed')).toBe('true');
    expect(onTheme).toHaveBeenCalledWith(true);
    expect(JSON.parse(localStorage.getItem(drawer.options.localStorageKey + '-preferences')!).theme).toBe('dark');

    // saved choice used instead of option
    const reloaded = createDrawer({ localStorageKey: drawer.options.localStorageKey, theme: 'light' });
    expect(reloaded.isDarkMode()).toBe(true);
    expect(reloaded.setting.$darkModeButton.getAttribute('aria-pressed')).toBe('true');

    expect(keydown(drawer, { key: 'Î', code: 'KeyD', altKey: true, shiftKey: true })).toBe(false);
    expect(drawer.theme).toBe('light');
    expect(isDark(drawer)).toBe(false);

    expect(createDrawer({ theme: 'dark' }).isDarkMode()).toBe(true);
  });

  it('System theme follows device', () => {
    let listener = () => {};
    const media = { matches: true, addEventListener: (_: string, fn: () => void) => (listener = fn) };

    vi.stubGlobal('matchMedia', () => media);
    const drawer = createDrawer({ theme: 'system' });
    expect(isDark(drawer)).toBe(true);

    media.matches = false;
    listener();
    expect(isDark(drawer)).toBe(false);

    // chosen theme not changed by device
    drawer.setTheme('dark');
    media.matches = false;
    listener();
    expect(isDark(drawer)).toBe(true);
  });

  it('Colors of drawing shown as in dark mode: swatches, text editor, export', () => {
    const drawer = createDrawer({ theme: 'dark' });
    const overlay = drawer.getWidget<BaseWidget>('brush')!.overlay!;
    const $black = overlay.$strokeColorBtnContainer.querySelector<HTMLElement>('[data-stroke-color="#000"]')!;

    expect($black.style.getPropertyValue('--swatch-color')).toBe('#000');
    expect($black.style.getPropertyValue('--swatch-dark-color')).toBe('#ededed');

    const textWidget = drawer.getWidget<TextWidget>('text')!;
    textWidget.editTextNode(textWidget.addTextNode('hello'));
    expect(drawer.$drawerContainer.querySelector('textarea')!.classList.contains('drawer-text-editor')).toBe(true);

    drawer.showExport();
    expect(drawer.exportModal!.$dark.checked).toBe(true);
  });
});
