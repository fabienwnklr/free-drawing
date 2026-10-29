import { describe, expect, it, vi } from 'vitest';
import { Group } from 'konva/lib/Group';
import { Line } from 'konva/lib/shapes/Line';
import { Rect } from 'konva/lib/shapes/Rect';
import { Text } from 'konva/lib/shapes/Text';
import type { Drawer } from '@/Drawer';
import { drawerEvents, shapeName } from '@/constants';
import { replayName } from '@/components/Replay/Replay';
import { createFrame } from '@/utils/frame';
import { creationTime, inCreationOrder, outlineLength, partialStroke } from '@/utils/replay';
import { createDrawer, keydown } from './helpers';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';

/**
 * Id of the library created at a time
 * @param time Time of creation (ms)
 * @returns Id starting with the time in base 36
 */
const idAt = (time: number) => `${time.toString(36)}abcdefgh`;

/** A time of 2026 */
const t0 = 1.79e12;

/**
 * Drawing of the tests, shapes added in another order than created: text, rectangle, freehand stroke
 * @param drawer Drawer of the test
 * @returns The shapes
 */
const addShapes = (drawer: Drawer) => {
  const text = drawer.addShape(new Text({ id: idAt(t0 + 3000), name: shapeName.text, text: 'Hello', x: 10, y: 10 }));
  const rect = drawer.addShape(
    new Rect({
      id: idAt(t0),
      name: shapeName.rect,
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      stroke: '#000',
      strokeWidth: 2,
      fill: '#ffc9c9',
    })
  );
  const stroke = drawer.addShape(
    new Line({
      id: idAt(t0 + 2000),
      name: shapeName.line,
      closed: true,
      fill: '#000',
      points: Array.from({ length: 40 }, (_, i) => [i, i % 2]).flat(),
    })
  );

  drawer.stage.fire('change');
  return { text, rect, stroke };
};

/** Copies of the replay, in the selection layer */
const copies = (drawer: Drawer) => drawer.selectionLayer.findOne<Group>(`.${replayName}`)?.getChildren() ?? [];

describe('Replay of the drawing', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Order of creation read from the ids, shapes without time after the shape below them, groups at their first shape', () => {
    expect(creationTime(idAt(t0))).toBe(t0);
    expect(creationTime('shape-abc')).toBeNull();
    expect(creationTime('zzzzzzzzzz')).toBeNull();
    // 8 letters: not an id of the library
    expect(creationTime('imported')).toBeNull();

    const a = new Rect({ id: idAt(t0 + 5) });
    const b = new Rect({ id: idAt(t0 + 1) });
    // file of another app, above b
    const c = new Rect({ id: 'imported' });
    const group = new Group({ id: idAt(t0 + 9) });

    group.add(new Rect({ id: idAt(t0 + 3) }));
    expect(inCreationOrder([a, b, c, group])).toEqual([b, c, group, a]);
    // frame at its own time, not at the time of its shapes
    const frame = createFrame({ x: 0, y: 0, width: 10, height: 10, label: 'F' });

    frame.id(idAt(t0 + 7));
    expect(inCreationOrder([frame, a])).toEqual([a, frame]);
  });

  it('Outline length of shapes, freehand stroke cut at the same place on both sides', () => {
    expect(outlineLength(new Rect({ width: 10, height: 5 }))).toBe(30);
    expect(outlineLength(new Line({ points: [0, 0, 3, 4, 3, 10] }))).toBe(11);
    expect(partialStroke([0, 0, 1, 0, 2, 0, 3, 0, 3, 1, 2, 1, 1, 1, 0, 1], 0.5)).toEqual([0, 0, 1, 0, 1, 1, 0, 1]);
    expect(partialStroke([0, 0, 1, 1], 0.5)).toEqual([0, 0, 1, 1]);
  });

  it('Read only started during the replay: pan once it stops, the tool of the user once read only ends', () => {
    const drawer = createDrawer();

    addShapes(drawer);
    drawer.getWidget<BaseWidget>('brush')!.setActive(true);
    expect(drawer.replay.start()).toBe(true);
    drawer.setReadOnly(true);
    drawer.replay.stop();
    expect(drawer.activeTool).toBe('pan');
    drawer.setReadOnly(false);
    expect(drawer.activeTool).toBe('brush');
  });

  it('Shapes appear again in the order they were created, the drawing unchanged; interface and view given back', () => {
    const drawer = createDrawer({ language: 'en' });
    const { text, rect, stroke } = addShapes(drawer);
    const before = JSON.stringify(drawer.getDrawingFile());
    const change = vi.fn();
    const steps: number[] = [];

    drawer.stage.position({ x: 30, y: 40 });
    drawer.on(drawerEvents.change, change);
    drawer.on(drawerEvents.replayChange, (index: number) => steps.push(index));
    expect(keydown(drawer, { key: 'R', code: 'KeyR', altKey: true, shiftKey: true })).toBe(false);

    const { replay } = drawer;

    expect(replay.active).toBe(true);
    expect(replay.steps.map(({ shape }) => shape)).toEqual([rect, stroke, text]);
    expect(drawer.$drawerContainer.classList.contains('is-presenting')).toBe(true);
    expect(replay.$bar.hidden).toBe(false);
    expect(drawer.drawLayer.getNativeCanvasElement().style.visibility).toBe('hidden');
    expect(drawer.activeTool).toBe('pan');
    // copies hidden, without ids
    expect(copies(drawer)).toHaveLength(3);
    expect(copies(drawer).every((copy) => !copy.isVisible() && !copy.id())).toBe(true);

    replay.pause();
    // outline drawn by a moving dash, its fill after it
    replay.advance(300);
    const rectCopy = replay.steps[0].copy as Rect;

    expect([rectCopy.isVisible(), rectCopy.fillEnabled(), rectCopy.dash()]).toEqual([true, false, [300, 300]]);
    replay.advance(1000);
    expect([replay.index, rectCopy.fillEnabled(), rectCopy.dash()]).toEqual([1, true, []]);
    // stroke traced
    const strokeCopy = replay.steps[1].copy as Line;

    replay.advance(100);
    expect(strokeCopy.points().length).toBeLessThan(stroke.points().length);
    // text typed
    replay.goTo(2);
    replay.advance(150);
    expect((replay.steps[2].copy as Text).text()).toBe('He');
    expect(replay.$count.textContent).toBe('3 / 3');

    // keys: next, previous, end, play / pause
    keydown(drawer, { key: 'ArrowLeft' });
    expect(replay.index).toBe(1);
    keydown(drawer, { key: 'End' });
    expect(replay.index).toBe(3);
    expect((replay.steps[2].copy as Text).text()).toBe('Hello');
    keydown(drawer, { key: ' ' });
    expect([replay.playing, replay.index]).toEqual([true, 0]);
    keydown(drawer, { key: ' ' });
    expect(replay.playing).toBe(false);
    replay.$speedButton.click();
    expect([replay.speed, replay.$speedButton.textContent]).toEqual([2, '2×']);

    // no edition meanwhile: shortcuts, context menu
    keydown(drawer, { key: 'Delete' });
    drawer.stage.fire('contextmenu', { evt: { preventDefault() {}, clientX: 10, clientY: 10 } });
    expect(drawer.contextMenu.isVisible()).toBe(false);

    keydown(drawer, { key: 'Escape' });
    expect(replay.active).toBe(false);
    expect(copies(drawer)).toHaveLength(0);
    expect(drawer.drawLayer.getNativeCanvasElement().style.visibility).toBe('');
    expect(drawer.$drawerContainer.classList.contains('is-presenting')).toBe(false);
    expect(drawer.stage.position()).toEqual({ x: 30, y: 40 });
    expect(drawer.activeTool).toBe(drawer.options.tool);
    // the drawing never changed
    expect(change).not.toHaveBeenCalled();
    expect(JSON.stringify(drawer.getDrawingFile())).toBe(before);
    expect(steps.at(-1)).toBe(-1);
  });

  it('Shapes of a frame in the copy of their frame; empty drawing told; menu, context menu, palette, help', () => {
    const drawer = createDrawer({ language: 'en' });
    const toast = vi.spyOn(drawer, 'toast');

    expect(drawer.replay.start()).toBe(false);
    expect(toast).toHaveBeenCalledWith('Nothing to replay: the drawing is empty', 'info');

    const frame = drawer.addShape(createFrame({ x: 0, y: 0, width: 300, height: 200, label: 'Plan' }));
    const inside = drawer.addShape(new Rect({ name: shapeName.rect, x: 20, y: 20, width: 50, height: 50 }));

    drawer.placeInFrames([inside]);
    drawer.setting.$replayButton.click();

    const [frameCopy] = copies(drawer) as Group[];

    expect(frameCopy.hasName(shapeName.frame)).toBe(true);
    expect(frameCopy.find(`.${shapeName.rect}`)).toHaveLength(1);
    drawer.replay.stop();
    expect(frame.isVisible()).toBe(true);

    drawer.showCommandPalette();
    const labels = [...drawer.commandPalette!.$list.querySelectorAll('[role="option"]')].map(($o) => $o.textContent);
    drawer.commandPalette!.hide();

    expect(labels.some((label) => label?.includes('Replay the drawing'))).toBe(true);
    expect(drawer.help.$modalBody.textContent).toContain('Replay the drawing');
  });
});
