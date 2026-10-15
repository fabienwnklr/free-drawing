import { describe, expect, it, beforeAll } from 'vitest';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import type { BrushWidget } from '@/components/toolbar/widgets/Brush/Brush';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { createDrawer } from './helpers';

beforeAll(() => {
  function noOp() {}

  if (typeof window.URL.createObjectURL === 'undefined') {
    Object.defineProperty(window.URL, 'createObjectURL', { value: noOp });
  }
});

const tick = () => new Promise((resolve) => setTimeout(resolve));
const key = ($el: Element, key: string, init: KeyboardEventInit = {}) =>
  $el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }));
const label = ($el: Element | null | undefined) => $el?.getAttribute('aria-label');
const labelledBy = ($el: Element | null | undefined) =>
  document.getElementById($el?.getAttribute('aria-labelledby') ?? '')?.textContent?.trim();

describe('Accessibility', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Drawer is focusable in tab order and labelled', () => {
    const drawer = createDrawer();

    expect(drawer.$drawerContainer.tabIndex).toBe(0);
    expect(drawer.$drawerContainer.getAttribute('role')).toBe('application');
    expect(label(drawer.$drawerContainer)).toBe('Drawing board');
  });

  it('Drawer shows focus only when focused with keyboard', () => {
    const drawer = createDrawer();
    const $container = drawer.$drawerContainer;
    const focusWithKey = (key: string) => {
      $container.blur();
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      $container.focus();
    };

    focusWithKey('Tab');
    expect($container.classList.contains('drawer-keyboard-focus')).toBe(true);

    $container.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect($container.classList.contains('drawer-keyboard-focus')).toBe(false);

    // other keys (text validated with Enter...) do not show it
    focusWithKey('Enter');
    expect($container.classList.contains('drawer-keyboard-focus')).toBe(false);
  });

  it('Every button has an accessible name, icons are hidden', () => {
    const drawer = createDrawer();
    drawer.clearCanvas();
    const buttons = Array.from(drawer.$drawerContainer.querySelectorAll('button'));
    const unnamed = buttons.filter((btn) => !label(btn) && !btn.textContent?.trim());
    const icons = Array.from(drawer.$drawerContainer.querySelectorAll('svg'));

    expect(unnamed.map((btn) => btn.outerHTML.slice(0, 100))).toEqual([]);
    // no form submit when drawer is in a form
    expect(buttons.filter((btn) => btn.type !== 'button').map((btn) => btn.outerHTML.slice(0, 100))).toEqual([]);
    expect(icons.filter((svg) => svg.getAttribute('aria-hidden') !== 'true').length).toBe(0);
    drawer.clearConfirmModal!.hide();
  });

  it('Toolbar exposes active tool and shortcuts, arrows move focus (roving tabindex)', () => {
    const drawer = createDrawer();
    const root = drawer.toolbar.$toolbarRoot;
    const buttons = Array.from(drawer.toolbar.widgets.values()).map((w) => w.$button);
    const brush = drawer.getWidget<BaseWidget>('brush')!.$button;
    const eraser = drawer.getWidget<BaseWidget>('eraser')!.$button;

    expect(root.getAttribute('role')).toBe('toolbar');
    expect(label(root)).toBe('Tools');
    expect(label(brush)).toBe('Brush');
    expect(brush.getAttribute('aria-pressed')).toBe('true');
    expect(eraser.getAttribute('aria-pressed')).toBe('false');
    expect(brush.getAttribute('aria-keyshortcuts')).toBe('B');
    expect(buttons.filter((b) => b.tabIndex === 0)).toEqual([brush]);

    brush.focus();
    key(brush, 'ArrowRight');
    expect(document.activeElement).toBe(eraser);
    expect(buttons.filter((b) => b.tabIndex === 0)).toEqual([eraser]);

    key(eraser, 'End');
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
    key(document.activeElement!, 'ArrowRight');
    expect(document.activeElement).toBe(buttons[0]);

    // activating a tool (shortcut) moves the tab stop on it
    drawer.getWidget<BaseWidget>('text')!.setActive(true);
    expect(buttons.filter((b) => b.tabIndex === 0)).toEqual([drawer.getWidget<BaseWidget>('text')!.$button]);
  });

  it('Arrows in toolbar do not move selected shapes', () => {
    const drawer = createDrawer();
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('hello');
    drawer.getWidget<SelectWidget>('selection')!.transformer.nodes([text]);
    const x = text.x();
    const button = drawer.getWidget<BaseWidget>('selection')!.$button;

    button.focus();
    key(button, 'ArrowRight');

    expect(text.x()).toBe(x);
  });

  it('Overlay fields are labelled groups with pressed state', () => {
    const drawer = createDrawer();
    const overlay = drawer.getWidget<BrushWidget>('brush')!.overlay;
    const color = (value: string) => overlay.$strokeColorBtnContainer.querySelector(`[data-stroke-color="${value}"]`);

    expect(overlay.$overlayContainer.getAttribute('role')).toBe('region');
    expect(label(overlay.$overlayContainer)).toBe('Brush options');
    expect(overlay.$strokeColorContainer.getAttribute('role')).toBe('group');
    expect(labelledBy(overlay.$strokeColorContainer)).toBe('Stroke');
    expect(label(color('#000'))).toBe('Black');
    expect(color('#000')?.getAttribute('aria-pressed')).toBe('true');

    drawer.setStrokeColor('#e03131');
    expect(color('#e03131')?.getAttribute('aria-pressed')).toBe('true');
    expect(color('#000')?.getAttribute('aria-pressed')).toBe('false');

    expect(labelledBy(overlay.$opacityRange)).toBe('Opacity');
    drawer.setOpacity(0.5);
    expect(overlay.$opacityRange.getAttribute('aria-valuetext')).toBe('50%');

    const textOverlay = drawer.getWidget<TextWidget>('text')!.overlay;
    const bold = textOverlay.$fontStyleBtnContainer.querySelector('[data-font-style="bold"]');
    expect(label(bold)).toBe('Bold');
    drawer.setTextStyle({ fontStyle: 'bold' });
    expect(bold?.getAttribute('aria-pressed')).toBe('true');
    expect(labelledBy(textOverlay.$fontFamilySelect)).toBe('Font family');
  });

  it('Icon buttons of zoom, history, help and menu are labelled', () => {
    const drawer = createDrawer();

    expect(label(drawer.zoom!.$btnMinus)).toBe('Zoom out');
    expect(label(drawer.zoom!.$btnPlus)).toBe('Zoom in');
    // percentage formatted with user locale
    expect(label(drawer.zoom!.$btnReset)).toMatch(/^Reset zoom \(100\s?%\)$/);
    expect(label(drawer.undoRedo.$btnUndo)).toBe('Undo');
    expect(drawer.undoRedo.$btnUndo.getAttribute('aria-keyshortcuts')).toBe('Control+Z');
    expect(label(drawer.undoRedo.$btnRedo)).toBe('Redo');
    expect(label(drawer.help.$button)).toBe('Help');
    expect(drawer.help.$button.getAttribute('aria-haspopup')).toBe('dialog');
    expect(label(drawer.setting.$button)).toBe('Menu');
  });

  it('Settings menu exposes its expanded state, Escape closes it', () => {
    const drawer = createDrawer();
    const setting = drawer.setting;

    expect(setting.$button.getAttribute('aria-expanded')).toBe('false');
    expect(setting.$button.getAttribute('aria-controls')).toBe(setting.$menu.id);

    setting.$button.click();
    expect(setting.$button.getAttribute('aria-expanded')).toBe('true');

    key(setting.$clearCanvasButton, 'Escape');
    expect(setting.isShown()).toBe(false);
    expect(setting.$button.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(setting.$button);
  });

  it('Settings menu items expose what they do', () => {
    const drawer = createDrawer();
    const setting = drawer.setting;

    expect(setting.$clearCanvasButton.getAttribute('aria-haspopup')).toBe('dialog');
    expect(setting.$clearCanvasButton.getAttribute('aria-keyshortcuts')).toBe('Control+Delete');
    expect(setting.$clearStorageButton.getAttribute('aria-haspopup')).toBe('dialog');
    expect(setting.$toggleGridButton.getAttribute('aria-keyshortcuts')).toBe('Alt+G');
    expect(setting.$zenModeButton.getAttribute('aria-keyshortcuts')).toBe('Alt+Z');
    expect(label(setting.$githubButton)).toBe('Github (opens in a new tab)');
  });

  it('Toggles of settings and context menu expose their state', () => {
    const drawer = createDrawer();

    drawer.showGrid();
    expect(drawer.setting.$toggleGridButton.getAttribute('aria-pressed')).toBe('true');
    expect(drawer.contextMenu.$gridBtn.getAttribute('role')).toBe('menuitemcheckbox');
    expect(drawer.contextMenu.$gridBtn.getAttribute('aria-checked')).toBe('true');

    drawer.hideGrid();
    expect(drawer.setting.$toggleGridButton.getAttribute('aria-pressed')).toBe('false');
    expect(drawer.contextMenu.$gridBtn.getAttribute('aria-checked')).toBe('false');

    drawer.setting.toggleZenMode();
    expect(drawer.setting.$zenModeButton.getAttribute('aria-pressed')).toBe('true');

    drawer.setBgColor('#f8f9fa');
    const bg = drawer.setting.$bgColorBtnContainer.querySelector('[data-bg-color="#f8f9fa"]');
    expect(bg?.getAttribute('aria-pressed')).toBe('true');
    expect(label(bg)).toBe('Light gray');
  });

  it('Modal is a dialog: focus moves in, stays in, and goes back to opener', async () => {
    const drawer = createDrawer();
    const help = drawer.help;

    help.$button.focus();
    help.$button.click();
    await tick();

    expect(help.$modal.getAttribute('role')).toBe('dialog');
    expect(help.$modal.getAttribute('aria-modal')).toBe('true');
    expect(labelledBy(help.$modal)).toBe('Help');
    expect(help.$modal.contains(document.activeElement)).toBe(true);

    const focusables = Array.from(help.$modal.querySelectorAll<HTMLElement>('button, a[href]'));
    focusables[focusables.length - 1].focus();
    key(document.activeElement!, 'Tab');
    expect(document.activeElement).toBe(focusables[0]);
    key(document.activeElement!, 'Tab', { shiftKey: true });
    expect(document.activeElement).toBe(focusables[focusables.length - 1]);

    key(document.activeElement!, 'Escape');
    expect(help.isVisible()).toBe(false);
    expect(document.activeElement).toBe(help.$button);
  });

  it('Confirm modal is an alert dialog with real buttons, cancel focused', () => {
    const drawer = createDrawer();

    drawer.clearCanvas();
    const modal = drawer.clearConfirmModal!;

    expect(modal.$modal.getAttribute('role')).toBe('alertdialog');
    expect(labelledBy(modal.$modal)).toBe('Remove the whole drawing?');
    expect(modal.$cancelBtn).toBeInstanceOf(HTMLButtonElement);
    expect(modal.$confirmBtn).toBeInstanceOf(HTMLButtonElement);
    expect(document.activeElement).toBe(modal.$cancelBtn);

    modal.$cancelBtn.click();
    expect(modal.isVisible()).toBe(false);
    expect(document.activeElement).toBe(drawer.$drawerContainer);
  });

  it('Options of dialogs are switches, named by their label', () => {
    const drawer = createDrawer({ language: 'en' });

    drawer.showPreferences();
    drawer.showExport();

    const preferences = drawer.preferencesModal!;
    const exportModal = drawer.exportModal!;
    const switches = [
      ...preferences.$modal.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
      ...exportModal.$modal.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    ];

    expect(switches).toHaveLength(6);
    switches.forEach(($switch) => {
      expect($switch.getAttribute('role')).toBe('switch');
      expect($switch.closest('label')!.textContent!.trim()).not.toBe('');
    });
    expect(preferences.$grid.closest('label')!.textContent).toContain('Show grid');

    // still toggled as checkboxes
    preferences.$grid.click();
    expect(drawer.grid).toBe(true);
    exportModal.$background.click();
    expect(exportModal.exportOptions.background).toBe(false);
    preferences.hide();
    exportModal.hide();
  });

  it('Toasts are announced', () => {
    const drawer = createDrawer();

    expect(drawer.toast('Saved', 'info', 0).$toastContainer.getAttribute('role')).toBe('status');
    expect(drawer.toast('Failed', 'error', 0).$toastContainer.getAttribute('role')).toBe('alert');
  });

  it('Context menu is a menu navigable with arrows, Escape closes it', () => {
    const drawer = createDrawer();
    const menu = drawer.contextMenu;

    menu.show();
    const items = Array.from(menu.$menu.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([hidden])'));

    expect(menu.$menu.getAttribute('role')).toBe('menu');
    expect(items.length).toBe(3);
    expect(document.activeElement).toBe(items[0]);

    key(items[0], 'ArrowDown');
    expect(document.activeElement).toBe(items[1]);

    key(items[1], 'Escape');
    expect(menu.$menu.classList.contains('show')).toBe(false);
    expect(document.activeElement).toBe(drawer.$drawerContainer);
  });
});
