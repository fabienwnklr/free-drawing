import { describe, expect, it, beforeAll } from 'vitest';
import { Drawer } from '../src/Drawer';
import type { SelectWidget } from '../src/components/toolbar/widgets/Select/Select';
import type { TextWidget } from '../src/components/toolbar/widgets/Text/Text';
import type { LineWidget } from '../src/components/toolbar/widgets/Line/Line';
import { defaultOptions } from '../src/constants';
import { createDrawer, keydown } from './helpers';

beforeAll(() => {
  function noOp() {}

  if (typeof window.URL.createObjectURL === 'undefined') {
    Object.defineProperty(window.URL, 'createObjectURL', { value: noOp });
  }
});

const tick = () => new Promise((resolve) => setTimeout(resolve));

describe('User interface', () => {
  document.body.innerHTML = `<div id="test"></div><div id="test2"></div>`;

  it('Keyboard undo / redo update buttons', () => {
    const drawer = createDrawer();
    drawer.getWidget<TextWidget>('text')!.addTextNode('hello');
    drawer.stage.fire('change');

    keydown(drawer, { key: 'z', ctrlKey: true });
    expect(drawer.undoRedo.$btnUndo.disabled).toBe(true);
    expect(drawer.undoRedo.$btnRedo.disabled).toBe(false);

    // cmd on mac
    keydown(drawer, { key: 'y', metaKey: true });
    expect(drawer.getDrawingShapes().length).toBe(1);
    expect(drawer.undoRedo.$btnUndo.disabled).toBe(false);
    expect(drawer.undoRedo.$btnRedo.disabled).toBe(true);
  });

  it('Undo clears selection overlay', () => {
    const drawer = createDrawer();
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('hello');
    drawer.stage.fire('change');
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
    selectWidget.transformer.nodes([text]);
    selectWidget.showOverlay([text]);

    drawer.undoRedo.undo();

    expect(drawer.getWidget<TextWidget>('text')!.overlay.$overlayContainer.classList.contains('show')).toBe(false);
  });

  it('Toast is removed from page once hidden', () => {
    const drawer = createDrawer();
    const toast = drawer.toast('hello', 'info', 0);

    toast.hide();
    toast.$toastContainer.dispatchEvent(new Event('animationend'));

    expect(toast.$toastContainer.isConnected).toBe(false);
  });

  it('Disabled widget can not be activated', () => {
    const drawer = createDrawer();
    const lineWidget = drawer.getWidget<LineWidget>('line')!;

    lineWidget.toggleDisable();
    lineWidget.setActive(true);
    expect(lineWidget.$button.disabled).toBe(true);
    expect(drawer.activeTool).toBe('brush');

    lineWidget.toggleDisable();
    lineWidget.setActive(true);
    expect(lineWidget.$button.disabled).toBe(false);
    expect(drawer.activeTool).toBe('line');
  });

  it('Settings background buttons reflect background color', () => {
    const drawer = createDrawer();
    const activeBg = () =>
      (drawer.setting.$bgColorBtnContainer.querySelector('.active') as HTMLElement | null)?.dataset.bgColor;

    expect(activeBg()).toBe('#fff');

    drawer.setBgColor('#f8f9fa');
    expect(activeBg()).toBe('#f8f9fa');
    expect(drawer.setting.$zenModeButton.textContent).toContain('Alt+Z');
  });

  it('Arrow keys move is saved once, on key release', () => {
    const drawer = createDrawer();
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('hello');
    drawer.stage.fire('change');
    drawer.getWidget<SelectWidget>('selection')!.transformer.nodes([text]);
    const length = drawer.undoRedo.appHistory.length;

    for (let i = 0; i < 3; i++) keydown(drawer, { key: 'ArrowRight' });
    expect(drawer.undoRedo.appHistory.length).toBe(length);

    drawer.$drawerContainer.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }));
    expect(drawer.undoRedo.appHistory.length).toBe(length + 1);
  });

  it('Ctrl + Delete / Backspace ask to clear canvas without deleting selection', () => {
    const drawer = createDrawer();
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('hello');
    drawer.getWidget<SelectWidget>('selection')!.transformer.nodes([text]);

    keydown(drawer, { key: 'Backspace', ctrlKey: true });

    expect(drawer.getDrawingShapes().length).toBe(1);
    expect(drawer.clearConfirmModal?.isVisible()).toBe(true);
  });

  it('Paste adds text', () => {
    const drawer = createDrawer();
    const paste = new Event('paste', { bubbles: true });
    Object.defineProperty(paste, 'clipboardData', { value: { getData: () => 'pasted text' } });

    drawer.$drawerContainer.dispatchEvent(paste);

    expect((drawer.getDrawingShapeByName('text')[0] as unknown as { text(): string })?.text()).toBe('pasted text');
  });

  it('Modal opened by a click stays open, closes on outside click', async () => {
    const drawer = createDrawer();

    drawer.help.$button.click();
    await tick();
    expect(drawer.help.isVisible()).toBe(true);

    document.body.click();
    expect(drawer.help.isVisible()).toBe(false);

    drawer.help.show();
    await tick();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(drawer.help.isVisible()).toBe(false);
  });

  it('Reset restores drawer initial drawing options, keeps instance options', () => {
    const localStorageKey = 'test-' + Math.random();
    const drawer = createDrawer({ localStorageKey, strokeColor: '#e03131' });
    drawer.getWidget<TextWidget>('text')!.addTextNode('hello');
    drawer.setStrokeColor('#1971c2');
    drawer.setBgColor('#fffce8');

    drawer.resetDrawer();

    expect(drawer.getDrawingShapes().length).toBe(0);
    expect(drawer.options.strokeColor).toBe('#e03131');
    expect(drawer.options.localStorageKey).toBe(localStorageKey);
    expect(drawer.background.fill()).toBe('#fff');
    expect(defaultOptions.strokeColor).toBe('#000');
  });

  it('Several drawers on a page are independent', () => {
    const first = createDrawer();
    const second = new Drawer(document.getElementById('test2') as HTMLDivElement, {
      autoSave: false,
      localStorageKey: 'test-' + Math.random(),
    });

    first.UIPointerEvents('none');

    expect(first.$drawerContainer.style.getPropertyValue('--drawer-pointer-events')).toBe('none');
    expect(second.$drawerContainer.style.getPropertyValue('--drawer-pointer-events')).toBe('');
    expect(document.documentElement.style.getPropertyValue('--drawer-pointer-events')).toBe('');
    expect(first.options.id).not.toBe(second.options.id);
  });
});
