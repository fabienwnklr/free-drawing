import { describe, expect, it, beforeAll, vi } from 'vitest';
import { Drawer } from '../src/Drawer';
import { SelectWidget } from '../src/components/toolbar/widgets/Select/Select';
import type { TextWidget } from '../src/components/toolbar/widgets/Text/Text';
import type { LineWidget } from '../src/components/toolbar/widgets/Line/Line';
import type { EraserWidget } from '../src/components/toolbar/widgets/Eraser/Eraser';
import type { BrushWidget } from '../src/components/toolbar/widgets/Brush/Brush';
import type { Line } from 'konva/lib/shapes/Line';

beforeAll(() => {
  function noOp() {}

  if (typeof window.URL.createObjectURL === 'undefined') {
    Object.defineProperty(window.URL, 'createObjectURL', { value: noOp });
  }
});

describe('Test drawer event', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  // isolated drawer: no saved state loaded, nothing saved
  const createDrawer = () =>
    new Drawer(document.getElementById('test') as HTMLDivElement, {
      autoSave: false,
      localStorageKey: 'test-' + Math.random(),
    });

  const keydown = (drawer: Drawer, init: KeyboardEventInit) =>
    drawer.$drawerContainer.dispatchEvent(new KeyboardEvent('keydown', { cancelable: true, ...init }));

  const setPointer = (drawer: Drawer, clientX: number, clientY: number) =>
    drawer.stage.setPointersPositions(new MouseEvent('mousemove', { clientX, clientY }));

  const fireMouse = (drawer: Drawer, type: string, x: number, y: number) => {
    setPointer(drawer, x, y);
    drawer.stage.fire(type, { evt: { button: 0, preventDefault() {} } });
  };

  it('Ctrl + A selects all shapes', () => {
    const drawer = createDrawer();
    const textWidget = drawer.getWidget<TextWidget>('text')!;
    textWidget.addTextNode('hello');
    textWidget.addTextNode('world');
    const selectWidget = drawer.getWidget<SelectWidget>('selection');

    expect(selectWidget?.transformer.nodes().length).eq(0);

    keydown(drawer, { key: 'a', ctrlKey: true });

    expect(selectWidget?.transformer.nodes().length).eq(2);
  });

  it('Alt + Z toggles zen mode only', () => {
    const drawer = createDrawer();

    keydown(drawer, { key: 'z', altKey: true });

    expect(drawer.setting.$zenModeButton.classList.contains('active')).toBe(true);
    expect(drawer.getWidget<SelectWidget>('selection')?.snapping).toBe(false);
  });

  it('Only arrow keys are prevented when shapes are selected', () => {
    const drawer = createDrawer();
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('hello');
    drawer.getWidget<SelectWidget>('selection')!.transformer.nodes([text]);
    const x = text.x();

    expect(keydown(drawer, { key: 'F5' })).toBe(true);
    expect(keydown(drawer, { key: 'ArrowRight' })).toBe(false);
    expect(text.x()).toBe(x + 4);
  });

  it('Backspace without selection does not add history', () => {
    const drawer = createDrawer();
    const length = drawer.undoRedo.appHistory.length;

    keydown(drawer, { key: 'Backspace' });

    expect(drawer.undoRedo.appHistory.length).toBe(length);
  });

  it('Change without modification does not add history', () => {
    const drawer = createDrawer();
    drawer.getWidget<TextWidget>('text')!.addTextNode('hello');
    drawer.stage.fire('change');
    const length = drawer.undoRedo.appHistory.length;

    drawer.stage.fire('change');

    expect(drawer.undoRedo.appHistory.length).toBe(length);
  });

  it('Escape on new text removes it', () => {
    const drawer = createDrawer();
    const textWidget = drawer.getWidget<TextWidget>('text')!;
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
    const text = textWidget.addTextNode();
    selectWidget.transformer.nodes([text]);
    textWidget.editTextNode(text);

    const textarea = drawer.$drawerContainer.querySelector('textarea')!;
    textarea.value = 'abc';
    textarea.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));

    expect(drawer.getDrawingShapeByName('text').length).toBe(0);
    expect(selectWidget.transformer.nodes().length).toBe(0);
    expect(selectWidget.transformer.visible()).toBe(true);
  });

  it('Escape on existing text keeps its content', () => {
    const drawer = createDrawer();
    const textWidget = drawer.getWidget<TextWidget>('text')!;
    const text = textWidget.addTextNode('hello');
    textWidget.editTextNode(text);

    const textarea = drawer.$drawerContainer.querySelector('textarea')!;
    textarea.value = '';
    textarea.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));

    expect(text.isVisible()).toBe(true);
    expect(text.text()).toBe('hello');
  });

  it('Brush ignores mouseup without mousedown', () => {
    const drawer = createDrawer();
    fireMouse(drawer, 'mousedown', 10, 10);
    fireMouse(drawer, 'mousemove', 100, 50);
    fireMouse(drawer, 'mouseup', 150, 80);
    const line = drawer.drawLayer.children[0] as Line;
    const points = line.points();

    fireMouse(drawer, 'mouseup', 400, 300);

    expect(line.points()).toEqual(points);
  });

  it('Line ignores mouseup without mousedown', () => {
    const drawer = createDrawer();
    drawer.getWidget<LineWidget>('line')!.setActive(true);
    fireMouse(drawer, 'mousedown', 10, 10);
    fireMouse(drawer, 'mouseup', 150, 80);
    const line = drawer.drawLayer.children[0] as Line;
    const points = line.points();

    fireMouse(drawer, 'mouseup', 400, 300);

    expect(line.points()).toEqual(points);
  });

  it('Eraser removes shape whatever its opacity', () => {
    const drawer = createDrawer();
    fireMouse(drawer, 'mousedown', 10, 10);
    fireMouse(drawer, 'mouseup', 150, 80);
    const line = drawer.drawLayer.children[0] as Line;
    line.opacity(0.5);

    drawer.getWidget<EraserWidget>('eraser')!.setActive(true);
    // no hit canvas in jsdom
    vi.spyOn(drawer.stage, 'getIntersection').mockReturnValue(line);
    fireMouse(drawer, 'mousedown', 10, 10);
    fireMouse(drawer, 'mousemove', 50, 30);
    fireMouse(drawer, 'mouseup', 50, 30);

    expect(drawer.drawLayer.children.length).toBe(0);
  });

  it('Ctrl + wheel zoom keeps the point under cursor', () => {
    const drawer = createDrawer();
    drawer.stage.scale({ x: 2, y: 2 });
    drawer.stage.position({ x: -300, y: -200 });
    const pointer = { x: 800, y: 500 };
    const pointUnderCursor = () => drawer.stage.getAbsoluteTransform().copy().invert().point(pointer);
    const before = pointUnderCursor();

    setPointer(drawer, pointer.x, pointer.y);
    drawer.stage.fire('wheel', { evt: { ctrlKey: true, deltaY: -100, preventDefault() {} } });

    expect(drawer.getZoomLevel()).toBeGreaterThan(2);
    expect(pointUnderCursor().x).toBeCloseTo(before.x);
    expect(pointUnderCursor().y).toBeCloseTo(before.y);
  });

  it('Zoom buttons respect zoom limits', () => {
    const drawer = createDrawer();

    for (let i = 0; i < 40; i++) drawer.zoom!.zoomMinus();
    expect(drawer.getZoomLevel()).toBeCloseTo(0.1);

    for (let i = 0; i < 100; i++) drawer.zoom!.zoomPlus();
    expect(drawer.getZoomLevel()).toBeCloseTo(30);
  });

  it('Transform fires a single change whatever the number of selection activations', () => {
    const drawer = createDrawer();
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
    const brushWidget = drawer.getWidget<BrushWidget>('brush')!;
    for (let i = 0; i < 3; i++) {
      selectWidget.setActive(true);
      brushWidget.setActive(true);
    }
    const onChange = vi.fn();
    drawer.on('change', onChange);

    selectWidget.transformer.fire('transformend');

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('Click selects shape after panning', () => {
    const drawer = createDrawer();
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('hello');
    text.setAttrs({ x: 100, y: 100, width: 100 });
    drawer.stage.position({ x: 150, y: 100 });

    // click on text (absolute position: 250, 200)
    setPointer(drawer, 260, 205);
    text.fire('mousedown', { evt: { button: 0, preventDefault() {} } }, true);
    drawer.stage.fire('mouseup', { evt: { button: 0, preventDefault() {} } });

    expect(drawer.getWidget<SelectWidget>('selection')!.transformer.nodes()).toEqual([text]);
  });

  it('Background color does not change selected text color', () => {
    const drawer = createDrawer();
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('hello');
    drawer.getWidget<SelectWidget>('selection')!.transformer.nodes([text]);
    const fill = text.fill();

    drawer.setBgColor('#fffce8');

    expect(drawer.background.fill()).toBe('#fffce8');
    expect(text.fill()).toBe(fill);
  });

  it('Reload does not duplicate transformer', () => {
    const localStorageKey = 'test-' + Math.random();
    const create = () => new Drawer(document.getElementById('test') as HTMLDivElement, { localStorageKey });

    const first = create();
    first.getWidget<TextWidget>('text')!.addTextNode('hello');
    first.stage.fire('change');
    create().stage.fire('change');
    const third = create();

    expect(third.selectionLayer.find('Transformer').length).toBe(1);
    expect(third.getDrawingShapeByName('text').length).toBe(1);
  });
});
