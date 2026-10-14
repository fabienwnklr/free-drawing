import { describe, expect, it, beforeAll } from 'vitest';
import { Drawer } from '@/Drawer';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import type { LineWidget } from '@/components/toolbar/widgets/Line/Line';
import type { BrushWidget } from '@/components/toolbar/widgets/Brush/Brush';
import { defaultOptions } from '@/constants';
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

  it('Color choices have a custom color input', () => {
    const drawer = createDrawer();
    const overlay = drawer.getWidget<BrushWidget>('brush')!.overlay;
    const $input = overlay.$strokeColorBtnContainer.querySelector<HTMLInputElement>('input[type="color"]')!;
    const pressed = () => overlay.$strokeColorBtnContainer.querySelectorAll('[aria-pressed="true"]').length;

    expect($input.getAttribute('aria-label')).toBe('Custom color');
    // no transparent stroke (invisible drawing)
    expect(overlay.$strokeColorBtnContainer.querySelector('[data-stroke-color="transparent"]')).toBeNull();

    $input.value = '#123456';
    $input.dispatchEvent(new Event('change'));
    expect(drawer.options.strokeColor).toBe('#123456');
    expect($input.classList.contains('active')).toBe(true);
    expect(pressed()).toBe(0);

    // palette color, same as one of buttons whatever its notation
    drawer.setStrokeColor('#000000');
    expect(overlay.$strokeColorBtnContainer.querySelector('[data-stroke-color="#000"]')?.getAttribute('aria-pressed')).toBe(
      'true'
    );
    expect($input.classList.contains('active')).toBe(false);
    // picker opens on current color
    expect($input.value).toBe('#000000');
  });

  it('Background color can be transparent or custom, menu stays open while picking', () => {
    const drawer = createDrawer();
    const setting = drawer.setting;
    const $transparent = setting.$bgColorBtnContainer.querySelector<HTMLButtonElement>('[data-bg-color="transparent"]')!;
    const $input = setting.$bgColorBtnContainer.querySelector<HTMLInputElement>('input[type="color"]')!;

    expect($transparent.getAttribute('aria-label')).toBe('Transparent');
    $transparent.click();
    expect(drawer.background.fill()).toBe('transparent');
    expect($transparent.getAttribute('aria-pressed')).toBe('true');

    setting.show();
    $input.click();
    expect(setting.isShown()).toBe(true);

    $input.value = '#abcdef';
    $input.dispatchEvent(new Event('change'));
    expect(drawer.background.fill()).toBe('#abcdef');
    expect($input.classList.contains('active')).toBe(true);
    expect($transparent.getAttribute('aria-pressed')).toBe('false');
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

  it('Position widget shows view position, back to origin with its button', () => {
    const drawer = createDrawer();
    const position = drawer.position!;
    const text = () => position.$coordinates.textContent?.replace(/\s+/g, ' ').trim();

    expect(position.$positionContainer.isConnected).toBe(true);
    expect(text()).toBe('x 0 y 0');
    expect(position.$btnRecenter.getAttribute('aria-label')).toBe('Back to origin');

    // pan: view moved by 200, -100
    drawer.stage.position({ x: -200, y: 100 });
    drawer.stage.fire('dragmove');
    expect(text()).toBe('x 200 y −100');
    expect(position.getPosition()).toEqual({ x: 200, y: -100 });

    // zoom (buttons, keyboard): on view center, position does not change
    drawer.setZoomLevel(2);
    expect(text()).toBe('x 200 y −100');
    drawer.setZoomLevel(0.5);
    expect(position.getPosition()).toEqual({ x: 200, y: -100 });

    position.$btnRecenter.click();
    expect(position.getPosition()).toEqual({ x: 0, y: 0 });
    expect(drawer.getZoomLevel()).toBe(0.5);
    expect(text()).toBe('x 0 y 0');

    // reset zoom of zoom widget is also at origin
    drawer.zoom!.resetZoom();
    expect(text()).toBe('x 0 y 0');

    // hidden in zen mode
    drawer.setting.toggleZenMode();
    expect(position.$positionContainer.style.display).toBe('none');
  });

  it('Position widget can be disabled', () => {
    const drawer = createDrawer({ positionWidget: false });

    expect(drawer.position).toBeUndefined();
    expect(drawer.$drawerContainer.querySelector('.drawer-position-container')).toBeNull();
  });
});
