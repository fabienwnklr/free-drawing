import { describe, expect, it, vi } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import type { Drawer } from '@/Drawer';
import { drawerEvents, shapeName } from '@/constants';
import { slideMaskName } from '@/components/Slideshow/Slideshow';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { createFrame, type Frame } from '@/utils/frame';
import { inReadingOrder } from '@/utils/slides';
import { createDrawer, keydown } from './helpers';

/**
 * Frames of a drawing: a row of two (not aligned), a third one below
 * @param drawer Drawer of the test
 * @returns Frames in reading order
 */
const addFrames = (drawer: Drawer): Frame[] => {
  const second = drawer.addShape(createFrame({ x: 500, y: 20, width: 300, height: 200, label: 'Second' })) as Frame;
  const third = drawer.addShape(createFrame({ x: 0, y: 400, width: 600, height: 300, label: '' })) as Frame;
  const first = drawer.addShape(createFrame({ x: 0, y: 0, width: 400, height: 300, label: 'First' })) as Frame;

  drawer.stage.fire('change');
  return [first, second, third];
};

/** Mask around the slide shown */
const mask = (drawer: Drawer) => drawer.selectionLayer.findOne(`.${slideMaskName}`);

/**
 * Frame filling the view: inside it, centered
 * @param drawer Drawer of the test
 * @param frame Frame shown
 */
const expectShown = (drawer: Drawer, frame: Frame) => {
  const view = drawer.getViewArea();
  const box = frame.getClientRect({ relativeTo: drawer.drawLayer });

  expect(view.x).toBeLessThanOrEqual(box.x);
  expect(view.y).toBeLessThanOrEqual(box.y);
  expect(view.x + view.width / 2).toBeCloseTo(box.x + box.width / 2);
  expect(view.y + view.height / 2).toBeCloseTo(box.y + box.height / 2);
};

describe('Slideshow', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Reading order: rows from top to bottom (boxes need not be aligned), left to right in a row', () => {
    const boxes = [
      { name: 'c', x: 0, y: 400, width: 100, height: 100 },
      { name: 'b', x: 500, y: 40, width: 100, height: 100 },
      { name: 'a', x: 0, y: 0, width: 100, height: 100 },
      { name: 'd', x: 300, y: 420, width: 100, height: 100 },
    ];

    expect(inReadingOrder(boxes, (box) => box).map((box) => box.name)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('Without frame: told, nothing started', () => {
    const drawer = createDrawer({ language: 'en' });
    const toast = vi.spyOn(drawer, 'toast');

    drawer.addShape(new Rect({ name: shapeName.rect, width: 10, height: 10 }));
    expect(drawer.slideshow.start()).toBe(false);
    expect(toast).toHaveBeenCalledWith('No slide to present: draw frames, each one is a slide', 'info');
    expect(drawer.slideshow.active).toBe(false);
  });

  it('Frames presented one after the other: view fitted, around masked, interface hidden, keys; state given back', () => {
    const drawer = createDrawer({ language: 'en' });
    const frames = addFrames(drawer);
    const { slideshow } = drawer;
    const changes: number[] = [];
    const announce = vi.spyOn(drawer, '_announce');

    drawer.on(drawerEvents.slideshowChange, (index: number) => changes.push(index));
    drawer.stage.position({ x: 30, y: 40 });
    drawer.getWidget<SelectWidget>('selection')!.setActive(true);
    drawer.getWidget<SelectWidget>('selection')!.select([frames[2]]);
    keydown(drawer, { key: 'P', code: 'KeyP', altKey: true, shiftKey: true });

    // from the selected frame, selection cleared, laser as pointer
    expect(slideshow.active).toBe(true);
    expect(slideshow.slides).toEqual(frames);
    expect(slideshow.index).toBe(2);
    expect(drawer.getSelectedShapes()).toEqual([]);
    expect(drawer.activeTool).toBe('laser');
    expect(drawer.$drawerContainer.classList.contains('is-presenting')).toBe(true);
    expect(slideshow.$bar.hidden).toBe(false);
    expect(slideshow.$count.textContent).toBe('3 / 3');
    expect(slideshow.$title.hidden).toBe(true);
    expect(slideshow.$nextButton.disabled).toBe(true);
    expectShown(drawer, frames[2]);
    expect(mask(drawer)).toBeDefined();
    expect(announce).toHaveBeenLastCalledWith('Slide 3 of 3');

    keydown(drawer, { key: 'Home' });
    expect(slideshow.index).toBe(0);
    expect(slideshow.$title.textContent).toBe('First');
    expect(slideshow.$previousButton.disabled).toBe(true);
    expect(announce).toHaveBeenLastCalledWith('Slide 1 of 3: First');
    expectShown(drawer, frames[0]);

    expect(keydown(drawer, { key: 'ArrowRight' })).toBe(false);
    expect(slideshow.index).toBe(1);
    expectShown(drawer, frames[1]);
    keydown(drawer, { key: ' ' });
    keydown(drawer, { key: 'PageDown' });
    expect(slideshow.index).toBe(2);
    keydown(drawer, { key: 'ArrowLeft' });
    expect(slideshow.index).toBe(1);
    slideshow.$previousButton.click();
    expect(slideshow.index).toBe(0);

    // other shortcuts do nothing: no tool, no shape deleted
    keydown(drawer, { key: 'r' });
    keydown(drawer, { key: 'Delete' });
    expect(drawer.activeTool).toBe('laser');
    expect(drawer.getDrawingShapes()).toHaveLength(3);

    keydown(drawer, { key: 'Escape' });
    expect(slideshow.active).toBe(false);
    expect(drawer.stage.position()).toEqual({ x: 30, y: 40 });
    expect(drawer.activeTool).toBe('selection');
    expect(drawer.$drawerContainer.classList.contains('is-presenting')).toBe(false);
    expect(slideshow.$bar.hidden).toBe(true);
    expect(mask(drawer)).toBeUndefined();
    expect(changes).toEqual([2, 0, 1, 2, 1, 0, -1]);
  });

  it('Slides follow the drawing: frame moved shown again, removed ones left out, stopped without frame', () => {
    const drawer = createDrawer();
    const frames = addFrames(drawer);
    const { slideshow } = drawer;

    slideshow.start(frames[1]);
    expect(slideshow.index).toBe(1);

    // moved by another user: shown again
    frames[1].position({ x: 0, y: 2000 });
    drawer.stage.fire('change');
    expectShown(drawer, frames[1]);

    // reading order again: the moved frame is now last
    expect(slideshow.slides).toEqual([frames[0], frames[2], frames[1]]);
    expect(slideshow.index).toBe(2);

    frames[1].destroy();
    drawer.stage.fire('change');
    expect(slideshow.slides).toEqual([frames[0], frames[2]]);
    expect(slideshow.index).toBe(1);
    expectShown(drawer, frames[2]);

    frames[0].destroy();
    frames[2].destroy();
    drawer.stage.fire('change');
    expect(slideshow.active).toBe(false);
  });

  it('Read only drawers present too; commands of the menu, context menu, palette and help', () => {
    const drawer = createDrawer({ readOnly: true, language: 'en' });

    addFrames(drawer);
    drawer.setting.$slideshowButton.click();
    expect(drawer.slideshow.active).toBe(true);
    // no menu nor text edited during the slideshow
    drawer.stage.fire('contextmenu', { evt: { preventDefault() {}, clientX: 10, clientY: 10 } });
    expect(drawer.contextMenu.isVisible()).toBe(false);
    drawer.slideshow.$stopButton.click();
    expect(drawer.slideshow.active).toBe(false);

    drawer.showCommandPalette();
    const labels = [...drawer.commandPalette!.$list.querySelectorAll('[role="option"]')].map(($o) => $o.textContent);
    drawer.commandPalette!.hide();

    expect(labels.some((label) => label?.includes('Present slides'))).toBe(true);
    expect(drawer.help.$modalBody.textContent).toContain('Present slides');
    expect(drawer.help.$modalBody.textContent).toContain('Next / previous slide');
  });
});
