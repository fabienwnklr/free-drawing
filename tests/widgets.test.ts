import { describe, expect, it, beforeAll, vi } from 'vitest';
import { Drawer } from '../src/Drawer';
import type { SelectWidget } from '../src/components/toolbar/widgets/Select/Select';
import type { TextWidget } from '../src/components/toolbar/widgets/Text/Text';
import type { BrushWidget } from '../src/components/toolbar/widgets/Brush/Brush';
import type { Text } from 'konva/lib/shapes/Text';
import type { BaseWidget } from '../src/components/toolbar/widgets/BaseWidget';
import { createDrawer, fireMouse, keydown } from './helpers';

beforeAll(() => {
  function noOp() {}

  if (typeof window.URL.createObjectURL === 'undefined') {
    Object.defineProperty(window.URL, 'createObjectURL', { value: noOp });
  }
});

describe('Widgets', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Tool shortcuts use the letter displayed on widget button', () => {
    const drawer = createDrawer();

    keydown(drawer, { key: 'l' });
    expect(drawer.activeTool).toBe('line');

    // caps lock
    keydown(drawer, { key: 'B' });
    expect(drawer.activeTool).toBe('brush');

    // browser / app shortcut, not a tool
    keydown(drawer, { key: 't', ctrlKey: true });
    expect(drawer.activeTool).toBe('brush');
  });

  it('Changing tool keeps stage listeners added outside widgets', () => {
    const drawer = createDrawer();
    const onMouseDown = vi.fn();
    drawer.stage.on('mousedown', onMouseDown);

    drawer.getWidget<SelectWidget>('selection')!.setActive(true);
    drawer.getWidget<BrushWidget>('brush')!.setActive(true);
    fireMouse(drawer, 'mousedown', 10, 10);

    expect(onMouseDown).toHaveBeenCalledTimes(1);
  });

  it('Undo restores editable text, draggable only with selection tool', () => {
    const drawer = createDrawer();
    const textWidget = drawer.getWidget<TextWidget>('text')!;
    textWidget.addTextNode('hello');
    drawer.stage.fire('change');
    textWidget.addTextNode('world');
    drawer.stage.fire('change');

    drawer.undoRedo.undo();

    const [text] = drawer.getDrawingShapeByName('text') as Text[];
    expect(drawer.getDrawingShapeByName('text').length).toBe(1);
    expect(text.text()).toBe('hello');
    expect(text.draggable()).toBe(true);

    text.fire('dblclick', {}, true);
    expect(drawer.$drawerContainer.querySelector('textarea')).not.toBe(null);

    drawer.getWidget<BrushWidget>('brush')!.setActive(true);
    drawer.undoRedo.redo();
    expect(drawer.getDrawingShapes().every((s) => !s.draggable())).toBe(true);
  });

  it('Dragging a text saves state', () => {
    const drawer = createDrawer();
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('hello');
    const onChange = vi.fn();
    drawer.on('change', onChange);

    text.fire('dragend', {}, true);

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('Loaded shapes are draggable only with selection tool', () => {
    const localStorageKey = 'test-' + Math.random();
    const first = createDrawer({ localStorageKey, autoSave: true });
    first.getWidget<TextWidget>('text')!.addTextNode('hello');
    // saved while selection tool is active, so text is draggable in saved state
    first.stage.fire('change');
    localStorage.setItem(localStorageKey + '-tool', 'brush');

    const second = new Drawer(document.getElementById('test') as HTMLDivElement, { localStorageKey });

    expect(second.activeTool).toBe('brush');
    expect(second.getDrawingShapes()[0].draggable()).toBe(false);
  });

  it('Overlay button applies value once and syncs other overlays', () => {
    const drawer = createDrawer();
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('hello');
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
    const textOverlay = drawer.getWidget<TextWidget>('text')!.overlay;
    const brushOverlay = drawer.getWidget<BrushWidget>('brush')!.overlay;
    selectWidget.transformer.nodes([text]);
    const onChange = vi.fn();
    drawer.on('change', onChange);

    textOverlay.$strokeColorBtnContainer.querySelector<HTMLButtonElement>('[data-stroke-color="#e03131"]')!.click();
    expect(text.fill()).toBe('#e03131');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(brushOverlay.$strokeColorBtnContainer.querySelector('.active')?.getAttribute('data-stroke-color')).toBe(
      '#e03131'
    );

    selectWidget.overlay.$strokeWidthBtnContainer.querySelector<HTMLButtonElement>('[data-stroke-width="8"]')!.click();
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('API setters sync overlays', () => {
    const drawer = createDrawer();
    const brushOverlay = drawer.getWidget<BrushWidget>('brush')!.overlay;
    const textOverlay = drawer.getWidget<TextWidget>('text')!.overlay;

    drawer.setStrokeColor('#1971c2');
    drawer.setStrokeWidth(8);
    drawer.setOpacity(0.5);
    drawer.setTextStyle({ align: 'right' });

    for (const overlay of [brushOverlay, textOverlay]) {
      expect(overlay.$strokeColorBtnContainer.querySelector('.active')?.getAttribute('data-stroke-color')).toBe(
        '#1971c2'
      );
      expect(overlay.$opacityRange.value).toBe('5');
    }
    expect(brushOverlay.$strokeWidthBtnContainer.querySelector('.active')?.getAttribute('data-stroke-width')).toBe('8');
    expect(textOverlay.$textAlignBtnContainer.querySelector('.active')?.getAttribute('data-text-align')).toBe('right');
  });

  it('Pan uses visible hand cursors, system ones as fallback', () => {
    const drawer = createDrawer();
    drawer.getWidget<BaseWidget>('pan')!.setActive(true);
    const cursor = () => drawer.$stageContainer.style.cursor;

    expect(cursor()).toContain('data:image/svg+xml');
    expect(cursor().endsWith('grab')).toBe(true);

    fireMouse(drawer, 'mousedown', 10, 10);
    expect(cursor().endsWith('grabbing')).toBe(true);

    fireMouse(drawer, 'mouseup', 10, 10);
    expect(cursor().endsWith('grab')).toBe(true);
  });
});
