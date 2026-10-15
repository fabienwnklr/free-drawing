import { describe, expect, it, beforeAll, vi } from 'vitest';
import { Drawer } from '@/Drawer';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import type { BrushWidget } from '@/components/toolbar/widgets/Brush/Brush';
import type { Text } from 'konva/lib/shapes/Text';
import type { Shape, ShapeConfig } from 'konva/lib/Shape';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import type { BaseOverlay } from '@/components/tools/Overlay/BaseOverlay';
import type { EraserWidget } from '@/components/toolbar/widgets/Eraser/Eraser';
import { crosshairCursor } from '@/constants';
import { createDrawer, drag, fireMouse, keydown, setPointer } from './helpers';

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
    drawer.on('drawer.change', onChange);

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
    drawer.on('drawer.change', onChange);

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

  it('Text selection has side anchors to resize text box, shapes keep all anchors', () => {
    const drawer = createDrawer();
    const textWidget = drawer.getWidget<TextWidget>('text')!;
    textWidget.addTextNode('hello');
    textWidget.addTextNode('world');
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;

    selectWidget.selectAll();
    expect(selectWidget.transformer.enabledAnchors()).toEqual(
      expect.arrayContaining(['middle-left', 'middle-right', 'top-left', 'bottom-right'])
    );
    expect(selectWidget.transformer.enabledAnchors()).not.toContain('top-center');

    drawer.getWidget<BrushWidget>('brush')!.setActive(true);
    fireMouse(drawer, 'mousedown', 10, 10);
    fireMouse(drawer, 'mouseup', 50, 50);
    selectWidget.selectAll();
    expect(selectWidget.transformer.enabledAnchors()).toEqual(selectWidget.defaultAnchors);
  });

  it('Selection is kept at the end of a transform, wherever the pointer is', () => {
    const drawer = createDrawer();
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('hello');
    const transformer = drawer.getWidget<SelectWidget>('selection')!.transformer;
    transformer.nodes([text]);

    // anchor pressed, then released outside of the text
    setPointer(drawer, 50, 50);
    transformer.findOne('.bottom-right')!.fire('mousedown', { evt: { button: 0, preventDefault() {} } }, true);
    fireMouse(drawer, 'mouseup', 900, 600);
    transformer.stopTransform();

    expect(transformer.nodes()).toEqual([text]);

    // a click outside still unselects
    fireMouse(drawer, 'mousedown', 900, 600);
    fireMouse(drawer, 'mouseup', 900, 600);
    expect(transformer.nodes()).toEqual([]);
  });

  it('Side anchors resize text box without scaling text, corners scale it', () => {
    const drawer = createDrawer();
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('hello world');
    const transformer = drawer.getWidget<SelectWidget>('selection')!.transformer;
    const anchor = vi.spyOn(transformer, 'getActiveAnchor');
    text.setAttrs({ width: 100, fontSize: 16 });

    // stretched by side anchor
    anchor.mockReturnValue('middle-right');
    text.scaleX(2);
    transformer.fire('transform', { target: text });
    expect(text.getAttrs()).toMatchObject({ width: 200, scaleX: 1, fontSize: 16 });

    // text already scaled by corners keeps its scale
    text.setAttrs({ scaleX: 3, scaleY: 1.5 });
    transformer.fire('transform', { target: text });
    expect(text.getAttrs()).toMatchObject({ width: 400, scaleX: 1.5, scaleY: 1.5 });

    // corners scale text
    anchor.mockReturnValue('bottom-right');
    text.setAttrs({ scaleX: 2, scaleY: 2 });
    transformer.fire('transform', { target: text });
    expect(text.getAttrs()).toMatchObject({ width: 400, scaleX: 2, scaleY: 2 });
  });

  it('Active widget shows its overlay and cursor, selection overlay only for selected shapes', () => {
    const drawer = createDrawer();
    const widget = (id: Parameters<Drawer['getWidget']>[0]) => drawer.getWidget<BaseWidget>(id)!;
    const shown = (id: Parameters<Drawer['getWidget']>[0]) =>
      !!widget(id).overlay?.$overlayContainer.classList.contains('show');
    const cursor = () => drawer.$stageContainer.style.cursor;

    widget('brush').setActive(true);
    expect(shown('brush')).toBe(true);
    expect(cursor()).toBe(crosshairCursor);

    widget('text').setActive(true);
    expect(shown('brush')).toBe(false);
    expect(shown('text')).toBe(true);
    expect(cursor()).toBe('text');

    widget('square').setActive(true);
    expect(shown('text')).toBe(false);
    expect(shown('square')).toBe(true);

    widget('eraser').setActive(true);
    expect(shown('square')).toBe(false);
    expect(cursor()).toBe(crosshairCursor);

    widget('selection').setActive(true);
    expect(shown('selection')).toBe(false);
    expect(cursor()).toBe('default');
  });

  it('Pointer action of active widget disables shortcuts and UI pointer events', () => {
    const drawer = createDrawer();
    const brush = drawer.getWidget<BrushWidget>('brush')!;
    const pointerEvents = () => drawer.$drawerContainer.style.getPropertyValue('--drawer-pointer-events');

    fireMouse(drawer, 'mousedown', 10, 10);
    expect(brush.inAction).toBe(true);
    // previous name kept
    expect(brush.isPaint).toBe(true);
    expect(drawer._duringAction()).toBe(true);
    expect(pointerEvents()).toBe('none');

    fireMouse(drawer, 'mouseup', 50, 50);
    expect(brush.inAction).toBe(false);
    expect(drawer._duringAction()).toBe(false);
    expect(pointerEvents()).toBe('all');

    const eraser = drawer.getWidget<EraserWidget>('eraser')!;
    eraser.setActive(true);
    fireMouse(drawer, 'mousedown', 300, 300);
    expect(eraser.inAction).toBe(true);
    expect(eraser.isErasing).toBe(true);
    expect(drawer._duringAction()).toBe(true);
  });

  it('Select all replaces active tool overlay by selection overlay', () => {
    const drawer = createDrawer();
    const square = drawer.getWidget<BaseWidget>('square')!;
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
    const shown = (widget: BaseWidget) => !!widget.overlay?.$overlayContainer.classList.contains('show');
    square.setActive(true);

    // nothing to select
    keydown(drawer, { key: 'a', ctrlKey: true });
    expect(shown(square)).toBe(true);
    expect(shown(selectWidget)).toBe(false);

    fireMouse(drawer, 'mousedown', 10, 10);
    fireMouse(drawer, 'mousemove', 100, 80);
    fireMouse(drawer, 'mouseup', 100, 80);
    keydown(drawer, { key: 'a', ctrlKey: true });
    expect(shown(square)).toBe(false);
    expect(shown(selectWidget)).toBe(true);
  });

  it('Rectangles and ellipses have a background color, transparent by default', () => {
    const drawer = createDrawer();
    const square = drawer.getWidget<BaseWidget>('square')!;
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
    const fillShown = (widget: BaseWidget) =>
      (widget.overlay as BaseOverlay).$fillColorContainer.style.display !== 'none';
    const fillPressed = (widget: BaseWidget) =>
      (widget.overlay as BaseOverlay).$fillColorBtnContainer
        .querySelector('[aria-pressed="true"]')
        ?.getAttribute('data-fill-color');

    // shared overlay of shape tools: background only for rectangle and ellipse
    square.setActive(true);
    expect(fillShown(square)).toBe(true);
    expect(fillPressed(square)).toBe('transparent');
    drawer.getWidget<BaseWidget>('line')!.setActive(true);
    expect(fillShown(square)).toBe(false);
    drawer.getWidget<BaseWidget>('circle')!.setActive(true);
    expect(fillShown(square)).toBe(true);

    // transparent: no fill, inside is not hit
    square.setActive(true);
    drag(drawer, [10, 10], [100, 80]);
    const empty = drawer.getDrawingShapes()[0] as Shape<ShapeConfig>;
    expect(empty.fill()).toBeUndefined();

    drawer.setFillColor('#a5d8ff');
    drag(drawer, [200, 10], [300, 80]);
    const filled = drawer.getDrawingShapes()[1] as Shape<ShapeConfig>;
    expect(filled.fill()).toBe('#a5d8ff');
    expect(fillPressed(square)).toBe('#a5d8ff');

    // selection: applied to rectangles and ellipses only
    drawer.getWidget<BaseWidget>('brush')!.setActive(true);
    fireMouse(drawer, 'mousedown', 10, 300);
    fireMouse(drawer, 'mouseup', 150, 380);
    const brushLine = drawer.getDrawingShapes()[2] as Shape<ShapeConfig>;
    selectWidget.setActive(true);
    selectWidget.transformer.nodes([filled]);
    selectWidget.showOverlay([filled]);
    expect(fillShown(selectWidget)).toBe(true);
    expect(fillPressed(selectWidget)).toBe('#a5d8ff');

    drawer.setFillColor('transparent');
    expect(filled.fill()).toBeUndefined();
    expect(filled.toObject().attrs.fill).toBeUndefined();

    selectWidget.transformer.nodes([filled, brushLine]);
    selectWidget.showOverlay([filled, brushLine]);
    expect(fillShown(selectWidget)).toBe(false);
    const brushColor = brushLine.fill();
    drawer.setFillColor('#ffc9c9');
    expect(brushLine.fill()).toBe(brushColor);
    expect(filled.fill()).toBe('#ffc9c9');
  });
});
