import { describe, expect, it, beforeAll, vi } from 'vitest';
import { Drawer } from '@/Drawer';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import type { LineWidget } from '@/components/toolbar/widgets/Line/Line';
import type { EraserWidget } from '@/components/toolbar/widgets/Eraser/Eraser';
import type { BrushWidget } from '@/components/toolbar/widgets/Brush/Brush';
import type { Line } from 'konva/lib/shapes/Line';
import type { Text } from 'konva/lib/shapes/Text';
import { matchesShortcut } from '@/utils/HotKey';
import { createDrawer, fireMouse, keydown, setPointer } from './helpers';

beforeAll(() => {
  function noOp() {}

  if (typeof window.URL.createObjectURL === 'undefined') {
    Object.defineProperty(window.URL, 'createObjectURL', { value: noOp });
  }
});

describe('Test drawer event', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Ctrl + A selects all shapes', () => {
    const drawer = createDrawer();
    const textWidget = drawer.getWidget<TextWidget>('text')!;
    textWidget.addTextNode('hello');
    textWidget.addTextNode('world');
    const selectWidget = drawer.getWidget<SelectWidget>('selection');

    expect(selectWidget?.transformer.nodes().length).eq(0);

    // not page text selection (browser select all)
    expect(keydown(drawer, { key: 'a', ctrlKey: true })).toBe(false);

    expect(selectWidget?.transformer.nodes().length).eq(2);
  });

  it('Ctrl + A in a field of drawer: its text for text fields, else shapes (not page text)', () => {
    const drawer = createDrawer();
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
    const $text = document.createElement('input');
    const $range = document.createElement('input');
    const ctrlA = ($target: HTMLElement) =>
      $target.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true, bubbles: true, cancelable: true }));

    drawer.getWidget<TextWidget>('text')!.addTextNode('hello');
    $range.type = 'range';
    drawer.$drawerContainer.append($text, $range);

    expect(ctrlA($text)).toBe(true);
    expect(selectWidget.transformer.nodes()).toHaveLength(0);
    expect(ctrlA($range)).toBe(false);
    expect(selectWidget.transformer.nodes()).toHaveLength(1);
    $text.remove();
    $range.remove();
  });

  it('Pointer down on canvas focuses drawer when focus is out of it (page, app bar)', () => {
    const drawer = createDrawer();
    const $outside = document.createElement('button');
    const $tool = drawer.toolbar.getButton(drawer.getWidget<BrushWidget>('brush')!);

    document.body.append($outside);
    $outside.focus();
    drawer.$stageContainer.dispatchEvent(new Event('pointerdown'));
    expect(document.activeElement).toBe(drawer.$drawerContainer);

    // already in drawer: kept
    $tool.focus();
    drawer.$stageContainer.dispatchEvent(new Event('pointerdown'));
    expect(document.activeElement).toBe($tool);
    $outside.remove();
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
    const length = drawer.undoRedo.entries.length;

    keydown(drawer, { key: 'Backspace' });

    expect(drawer.undoRedo.entries.length).toBe(length);
  });

  it('Shortcuts whatever the keyboard: Caps Lock, Option of macOS, AZERTY, another alphabet, not AltGr', () => {
    const drawer = createDrawer();
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('hello');
    drawer.stage.fire('change');
    const grid = drawer.getPreferences().grid;

    // Caps Lock
    keydown(drawer, { key: 'A', code: 'KeyA', ctrlKey: true });
    expect(drawer.getSelectedShapes()).toEqual([text]);

    // Option of macOS changes characters: Option + G gives ©
    keydown(drawer, { key: '©', code: 'KeyG', altKey: true });
    expect(drawer.getPreferences().grid).toBe(!grid);

    // AZERTY: letter typed, not its place on a QWERTY keyboard
    const fit = vi.spyOn(drawer, 'fitTextWidth');
    keydown(drawer, { key: 'W', code: 'KeyZ', shiftKey: true });
    keydown(drawer, { key: 'Z', code: 'KeyW', shiftKey: true });
    expect(fit).toHaveBeenCalledTimes(1);

    // AZERTY of macOS: Option + Z on the key of QWERTY W, known once Z was typed
    keydown(drawer, { key: 'z', code: 'KeyW' });
    keydown(drawer, { key: 'Ω', code: 'KeyW', altKey: true });
    expect(drawer.getPreferences().zen).toBe(true);
    keydown(drawer, { key: 'Ω', code: 'KeyW', altKey: true });
    // layout of other tests
    keydown(drawer, { key: 'w', code: 'KeyW' });

    // another alphabet: Ctrl + Z of a Russian keyboard
    const undo = vi.spyOn(drawer.undoRedo, 'undo');
    keydown(drawer, { key: 'я', code: 'KeyZ', ctrlKey: true });
    expect(undo).toHaveBeenCalledTimes(1);

    // AltGr (Ctrl + Alt) types characters: ś of a Polish keyboard does not save
    const saveNow = vi.spyOn(drawer, 'saveNow').mockResolvedValue();
    keydown(drawer, { key: 'ś', code: 'KeyS', ctrlKey: true, altKey: true });
    expect(saveNow).not.toHaveBeenCalled();

    // commands of plugins
    expect(matchesShortcut(new KeyboardEvent('keydown', { key: 'z', code: 'KeyW', altKey: true }), 'Alt+Z')).toBe(true);
    expect(matchesShortcut(new KeyboardEvent('keydown', { key: 'Dead', code: 'KeyN', altKey: true }), 'Alt+N')).toBe(
      true
    );
    expect(
      matchesShortcut(new KeyboardEvent('keydown', { key: 'M', code: 'Semicolon', ctrlKey: true }), 'Ctrl+M')
    ).toBe(true);
  });

  it('Change without modification does not add history', () => {
    const drawer = createDrawer();
    drawer.getWidget<TextWidget>('text')!.addTextNode('hello');
    drawer.stage.fire('change');
    const length = drawer.undoRedo.entries.length;

    drawer.stage.fire('change');

    expect(drawer.undoRedo.entries.length).toBe(length);
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
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' }));

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
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' }));

    expect(text.isVisible()).toBe(true);
    expect(text.text()).toBe('hello');
  });

  it('Press elsewhere validates the edited text: touch (no click) or click', async () => {
    const drawer = createDrawer();
    const textWidget = drawer.getWidget<TextWidget>('text')!;
    const text = textWidget.addTextNode('hello');
    const editor = () => drawer.$drawerContainer.querySelector('textarea');
    const tick = () => new Promise((resolve) => setTimeout(resolve));

    textWidget.editTextNode(text);
    await tick();
    editor()!.value = 'tapped';
    // in the field: still edited
    editor()!.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    expect(editor()).not.toBeNull();
    // tap on the canvas
    drawer.stage.content.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    expect(editor()).toBeNull();
    expect(text.text()).toBe('tapped');

    textWidget.editTextNode(text);
    await tick();
    editor()!.value = 'clicked';
    document.body.click();
    expect(editor()).toBeNull();
    expect(text.text()).toBe('clicked');
  });

  it('Enter or Escape ending a composition (Chinese, Japanese, Korean) keeps fields open', () => {
    const drawer = createDrawer();
    const textWidget = drawer.getWidget<TextWidget>('text')!;
    const text = textWidget.addTextNode('hello');
    const key = ($field: Element, init: KeyboardEventInit) =>
      $field.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));
    const editor = () => drawer.$drawerContainer.querySelector('textarea');

    textWidget.editTextNode(text);
    editor()!.value = '你好';
    key(editor()!, { key: 'Enter', code: 'Enter', isComposing: true });
    // Safari: key of code 229 ends the composition, not composing
    key(editor()!, { key: 'Enter', code: 'Enter', keyCode: 229 });
    key(editor()!, { key: 'Escape', code: 'Escape', isComposing: true });
    expect(editor()).not.toBeNull();

    // Enter of the numeric keypad validates too
    key(editor()!, { key: 'Enter', code: 'NumpadEnter' });
    expect(editor()).toBeNull();
    expect(text.text()).toBe('你好');

    // name in the layers panel, link
    drawer.layersPanel!.toggle(true);
    drawer
      .layersPanel!.$list.querySelector<HTMLElement>('.drawer-layers-name')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'F2', bubbles: true }));
    const $name = drawer.layersPanel!.$list.querySelector('input')!;
    key($name, { key: 'Enter', isComposing: true });
    expect($name.isConnected).toBe(true);
    key($name, { key: 'Enter' });
    expect($name.isConnected).toBe(false);
    drawer.layersPanel!.toggle(false);

    drawer.getWidget<SelectWidget>('selection')!.select([text]);
    drawer.linkEditor!.edit();
    drawer.linkEditor!.$input.value = 'example.com';
    key(drawer.linkEditor!.$input, { key: 'Enter', isComposing: true });
    expect(drawer.getShapeLink(text)).toBeNull();
    key(drawer.linkEditor!.$input, { key: 'Enter' });
    expect(drawer.getShapeLink(text)).toBe('https://example.com/');
  });

  it('Text editing area is on text, with room around glyphs', () => {
    const drawer = createDrawer();
    const textWidget = drawer.getWidget<TextWidget>('text')!;
    const text = textWidget.addTextNode('hello');
    text.position({ x: 300, y: 200 });
    textWidget.editTextNode(text);

    const textarea = drawer.$drawerContainer.querySelector('textarea')!;
    const spacing = parseFloat(textarea.style.padding);

    // room for accents / italic, not cut by textarea
    expect(spacing).toBeGreaterThan(0);
    // text inside textarea is at text position (no shift)
    expect(parseFloat(textarea.style.top) + spacing).toBe(200);
    expect(parseFloat(textarea.style.left) + spacing).toBe(300);
    // same width as text, so lines wrap the same way
    expect(parseFloat(textarea.style.width) - spacing * 2).toBeCloseTo(text.width());
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

  it('Eraser click erases the pressed shape, whatever its opacity, not with right or middle button', () => {
    const drawer = createDrawer();
    fireMouse(drawer, 'mousedown', 10, 10);
    fireMouse(drawer, 'mouseup', 150, 80);
    const line = drawer.drawLayer.children[0] as Line;
    const onChange = vi.fn();
    line.opacity(0.5);

    drawer.getWidget<EraserWidget>('eraser')!.setActive(true);
    drawer.on('drawer.change', onChange);
    // no hit canvas in jsdom
    vi.spyOn(drawer.drawLayer, 'getIntersection').mockReturnValue(line);
    for (const button of [1, 2]) {
      fireMouse(drawer, 'mousedown', 10, 10, { button });
      fireMouse(drawer, 'mouseup', 10, 10, { button });
    }
    expect(line.getLayer()).toBe(drawer.drawLayer);
    expect(line.opacity()).toBe(0.5);

    // stroke starting on the shape
    fireMouse(drawer, 'mousedown', 10, 10);
    fireMouse(drawer, 'mouseup', 10, 10);
    expect(drawer.drawLayer.children.length).toBe(0);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('Eraser finds thin shapes crossed quickly, along the pointer path', () => {
    const drawer = createDrawer();
    fireMouse(drawer, 'mousedown', 100, 10);
    fireMouse(drawer, 'mouseup', 100, 200);
    const line = drawer.drawLayer.children[0] as Line;

    drawer.getWidget<EraserWidget>('eraser')!.setActive(true);
    // vertical line 2px wide at x = 100
    vi.spyOn(drawer.drawLayer, 'getIntersection').mockImplementation(({ x }) => (x >= 100 && x <= 102 ? line : null));
    fireMouse(drawer, 'mousedown', 10, 50);
    // one move across the line
    fireMouse(drawer, 'mousemove', 300, 50);
    expect(line.opacity()).toBeCloseTo(0.2);
    fireMouse(drawer, 'mouseup', 300, 50);

    expect(drawer.drawLayer.children.length).toBe(0);
  });

  it('Eraser shows a trail behind pointer, faded out after pointer up', async () => {
    const drawer = createDrawer();
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const trail = () => drawer.selectionLayer.findOne<Line>('.trail');
    drawer.getWidget<EraserWidget>('eraser')!.setActive(true);

    fireMouse(drawer, 'mousedown', 10, 10);
    fireMouse(drawer, 'mousemove', 50, 30);
    fireMouse(drawer, 'mousemove', 90, 50);
    await wait(50);
    expect(trail()?.points().length).toBeGreaterThan(0);
    // not found by eraser hit detection
    expect(trail()?.listening()).toBe(false);

    fireMouse(drawer, 'mouseup', 90, 50);
    await wait(400);
    expect(trail()).toBeUndefined();
  });

  it('Eraser fades shapes to erase, their opacity restored if erasing stops', () => {
    const drawer = createDrawer();
    fireMouse(drawer, 'mousedown', 10, 10);
    fireMouse(drawer, 'mouseup', 150, 80);
    const line = drawer.drawLayer.children[0] as Line;
    const eraser = drawer.getWidget<EraserWidget>('eraser')!;
    line.opacity(0.5);

    eraser.setActive(true);
    // no hit canvas in jsdom: shape under pointer once moved
    vi.spyOn(drawer.drawLayer, 'getIntersection').mockImplementation(({ x }) => (x > 40 ? line : null));
    fireMouse(drawer, 'mousedown', 10, 10);
    expect(line.opacity()).toBe(0.5);
    fireMouse(drawer, 'mousemove', 50, 30);
    fireMouse(drawer, 'mousemove', 60, 30);
    // faded once, still visible
    expect(line.opacity()).toBeCloseTo(0.1);
    expect(line.visible()).toBe(true);

    // tool changed before pointer up: shape kept as it was, action ended
    drawer.getWidget<BrushWidget>('brush')!.setActive(true);
    expect(line.opacity()).toBe(0.5);
    expect(drawer.drawLayer.children.length).toBe(1);
    expect(eraser.inAction).toBe(false);
    expect(drawer.$drawerContainer.style.getPropertyValue('--drawer-pointer-events')).toBe('all');
  });

  it('Text tool adds a text on click, not on right or middle click', () => {
    const drawer = createDrawer();
    const texts = () => drawer.drawLayer.find('Text');

    drawer.getWidget<TextWidget>('text')!.setActive(true);
    fireMouse(drawer, 'click', 100, 100, { button: 2 });
    fireMouse(drawer, 'click', 100, 100, { button: 1 });
    expect(texts().length).toBe(0);

    fireMouse(drawer, 'click', 100, 100);
    expect(texts().length).toBe(1);
    // empty text removed when editing is cancelled
    const $textarea = document.querySelector<HTMLTextAreaElement>('.drawer-container textarea')!;
    $textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    expect(texts().length).toBe(0);
  });

  it('Text tool kept after a text (keepTool): the press validating it adds none, a click on a text edits it', async () => {
    const drawer = createDrawer({ keepTool: true });
    const textWidget = drawer.getWidget<TextWidget>('text')!;
    const texts = () => drawer.drawLayer.find<Text>('Text');
    const editor = () => drawer.$drawerContainer.querySelector('textarea');
    const panelShown = () => textWidget.overlay.$overlayContainer.classList.contains('show');
    const tick = () => new Promise((resolve) => setTimeout(resolve));
    /** Press and click of the mouse on the canvas: the window sees the pointer down first */
    const click = (x: number, y: number) => {
      drawer.stage.content.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
      fireMouse(drawer, 'mousedown', x, y);
      fireMouse(drawer, 'mouseup', x, y);
      fireMouse(drawer, 'click', x, y);
    };

    textWidget.setActive(true);
    expect(panelShown()).toBe(true);
    click(100, 100);
    // options panel hidden while the text is edited: a press on it would validate the text
    expect(panelShown()).toBe(false);
    await tick();
    editor()!.value = 'first';
    // press elsewhere: text validated, no other text, tool and its panel kept
    click(300, 300);
    expect(texts().map((text) => text.text())).toEqual(['first']);
    expect(editor()).toBeNull();
    expect(drawer.activeTool).toBe('text');
    expect(panelShown()).toBe(true);
    expect(drawer.getSelectedShapes()).toEqual([]);

    // next click: new text, validated by Enter
    click(300, 300);
    await tick();
    editor()!.value = 'second';
    editor()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter' }));
    expect(texts().map((text) => text.text())).toEqual(['first', 'second']);
    expect(drawer.activeTool).toBe('text');

    // click on a text: edited, no new text
    const [first] = texts();

    drawer.stage.content.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    first.fire('mousedown', { evt: { button: 0 } }, true);
    first.fire('click', { evt: { button: 0 } }, true);
    expect(editor()!.value).toBe('first');
    await tick();
    editor()!.value = 'first edited';
    editor()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter' }));
    expect(texts().map((text) => text.text())).toEqual(['first edited', 'second']);

    // empty text removed, tool kept
    click(500, 100);
    editor()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' }));
    expect(texts()).toHaveLength(2);
    expect(drawer.activeTool).toBe('text');
    expect(panelShown()).toBe(true);
  });

  it('Text tool not kept: selection tool back with the validated text selected', async () => {
    const drawer = createDrawer({ keepTool: false });
    const textWidget = drawer.getWidget<TextWidget>('text')!;
    const editor = () => drawer.$drawerContainer.querySelector('textarea');

    textWidget.setActive(true);
    fireMouse(drawer, 'mousedown', 100, 100);
    fireMouse(drawer, 'click', 100, 100);
    // tool kept while the text is edited
    expect(drawer.activeTool).toBe('text');
    editor()!.value = 'hello';
    editor()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter' }));

    const [text] = drawer.drawLayer.find<Text>('Text');

    expect(drawer.activeTool).toBe('selection');
    expect(drawer.getSelectedShapes()).toEqual([text]);

    // cancelled: nothing drawn, tool kept
    textWidget.setActive(true);
    fireMouse(drawer, 'mousedown', 300, 300);
    fireMouse(drawer, 'click', 300, 300);
    editor()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' }));
    expect(drawer.activeTool).toBe('text');
    expect(drawer.drawLayer.find('Text')).toHaveLength(1);
  });

  it('Wheel zoom keeps the point under cursor', () => {
    const drawer = createDrawer();
    drawer.stage.scale({ x: 2, y: 2 });
    drawer.stage.position({ x: -300, y: -200 });
    const pointer = { x: 800, y: 500 };
    const pointUnderCursor = () => drawer.stage.getAbsoluteTransform().copy().invert().point(pointer);
    const before = pointUnderCursor();

    setPointer(drawer, pointer.x, pointer.y);
    drawer.stage.fire('wheel', { evt: { deltaY: -100, preventDefault() {} } });

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
    drawer.on('drawer.change', onChange);

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
    const localStorageKey = `test-${Math.random()}`;
    const create = () => new Drawer(document.getElementById('test') as HTMLDivElement, { localStorageKey });

    const first = create();
    first.getWidget<TextWidget>('text')!.addTextNode('hello');
    first.stage.fire('change');
    create().stage.fire('change');
    const third = create();

    expect(third.selectionLayer.find('Transformer').length).toBe(1);
    expect(third.getDrawingShapeByName('text').length).toBe(1);
  });

  it('Events are named drawer.<subject>.<action>, names of previous versions are still listened with a warning', () => {
    const drawer = createDrawer();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // not konva warnings
    const deprecations = () => warn.mock.calls.map(([message]) => message).filter((m) => m.startsWith('free-drawing'));
    const onSelection = vi.fn();
    const onReadOnly = vi.fn();
    const onChange = vi.fn();
    const onOptions = vi.fn();
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('hello');

    drawer.on('drawer.selection.change', onSelection);
    drawer.on('drawer.readonly.change', onReadOnly);
    drawer.getWidget<SelectWidget>('selection')!.select([text]);
    drawer.setReadOnly(true);
    expect(onSelection).toHaveBeenCalledWith([text]);
    expect(onReadOnly).toHaveBeenCalledWith(true);
    expect(deprecations()).toEqual([]);

    drawer.on('change', onChange);
    drawer.on('fd.options.change', onOptions);
    drawer.stage.fire('change');
    drawer.setStrokeWidth(8);
    expect(onChange).toHaveBeenCalledWith(drawer);
    expect(onOptions).toHaveBeenCalledWith(expect.objectContaining({ strokeWidth: 8 }));
    expect(deprecations()).toEqual([
      'free-drawing: "change" event is deprecated, use "drawer.change"',
      'free-drawing: "fd.options.change" event is deprecated, use "drawer.options.change"',
    ]);

    // removed with previous name too, warned once
    drawer.off('change', onChange);
    drawer.stage.fire('change');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(deprecations().length).toBe(2);
    warn.mockRestore();
  });
});
