import { describe, expect, it, beforeAll } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import { Ellipse } from 'konva/lib/shapes/Ellipse';
import { Arrow } from 'konva/lib/shapes/Arrow';
import { Line } from 'konva/lib/shapes/Line';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import type { BaseOverlay } from '@/components/tools/Overlay/BaseOverlay';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { AvailableTools } from '@/@types/toolbar';
import { createDrawer, drag } from './helpers';

beforeAll(() => {
  function noOp() {}

  if (typeof window.URL.createObjectURL === 'undefined') {
    Object.defineProperty(window.URL, 'createObjectURL', { value: noOp });
  }
});

const drawerWithTool = (tool: AvailableTools) => {
  const drawer = createDrawer({ strokeColor: '#1971c2', strokeWidth: 8, strokeStyle: 'dashed' });
  drawer.getWidget<BaseWidget>(tool)!.setActive(true);
  return drawer;
};

describe('Shape tools', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Rectangle is drawn by drag, square with shift', () => {
    const drawer = drawerWithTool('square');

    drag(drawer, [110, 60], [10, 10]);
    drag(drawer, [200, 200], [300, 240], { shiftKey: true });

    const [rect, square] = drawer.getDrawingShapes() as Rect[];
    expect(rect).toBeInstanceOf(Rect);
    expect(rect.getAttrs()).toMatchObject({ x: 10, y: 10, width: 100, height: 50 });
    expect(rect.stroke()).toBe('#1971c2');
    expect(rect.strokeWidth()).toBe(8);
    // dash proportional to stroke width
    expect(rect.dash()).toEqual([16, 24]);
    expect(rect.lineCap()).toBe('round');
    expect(square.getAttrs()).toMatchObject({ x: 200, y: 200, width: 100, height: 100 });
  });

  it('Ellipse is drawn in drag box, circle with shift', () => {
    const drawer = drawerWithTool('circle');

    drag(drawer, [10, 10], [110, 60]);
    drag(drawer, [200, 200], [300, 240], { shiftKey: true });

    const [ellipse, circle] = drawer.getDrawingShapes() as Ellipse[];
    expect(ellipse).toBeInstanceOf(Ellipse);
    expect(ellipse.getAttrs()).toMatchObject({ x: 60, y: 35, radiusX: 50, radiusY: 25 });
    expect(circle.radiusX()).toBe(circle.radiusY());
  });

  it('Arrow head is filled and sized with stroke width', () => {
    const drawer = drawerWithTool('arrow');

    drag(drawer, [10, 10], [110, 60]);

    const [arrow] = drawer.getDrawingShapes() as Arrow[];
    expect(arrow).toBeInstanceOf(Arrow);
    expect(arrow.points()).toEqual([10, 10, 110, 60]);
    expect(arrow.fill()).toBe('#1971c2');
    const pointer = arrow.pointerLength();

    drawer.getWidget<SelectWidget>('selection')!.transformer.nodes([arrow]);
    drawer.setStrokeWidth(12);
    expect(arrow.pointerLength()).toBeGreaterThan(pointer);
  });

  it('Line snaps to 45 degrees with shift', () => {
    const drawer = drawerWithTool('line');

    drag(drawer, [0, 0], [100, 90], { shiftKey: true });

    const [line] = drawer.getDrawingShapes() as Line[];
    const [x1, y1, x2, y2] = line.points();
    expect(line.points().length).toBe(4);
    expect(x1).toBe(0);
    expect(y1).toBe(0);
    // same length as drag, on 45 degrees
    expect(Math.hypot(x2, y2)).toBeCloseTo(Math.hypot(100, 90));
    expect(x2).toBeCloseTo(y2);
  });

  it('Click without drag draws nothing', () => {
    for (const tool of ['square', 'circle', 'arrow', 'line'] as AvailableTools[]) {
      const drawer = drawerWithTool(tool);
      drag(drawer, [50, 50], [50, 50]);
      expect(drawer.getDrawingShapes().length).toBe(0);
    }
  });

  it('Shapes are restored by undo / redo', () => {
    const drawer = drawerWithTool('square');
    drag(drawer, [10, 10], [110, 60]);
    drawer.getWidget<BaseWidget>('circle')!.setActive(true);
    drag(drawer, [10, 10], [110, 60]);
    drawer.getWidget<BaseWidget>('arrow')!.setActive(true);
    drag(drawer, [10, 10], [110, 60]);

    drawer.undoRedo.undo();
    drawer.undoRedo.redo();

    expect(drawer.getDrawingShapes().map((s) => s.getClassName())).toEqual(['Rect', 'Ellipse', 'Arrow']);
  });

  it('Shape tools share an overlay with stroke style', () => {
    const drawer = drawerWithTool('square');
    const overlay = drawer.getWidget<BaseWidget>('square')!.overlay as BaseOverlay;

    expect(drawer.getWidget<BaseWidget>('arrow')!.overlay).toBe(overlay);
    expect(overlay.$overlayContainer.classList.contains('show')).toBe(true);
    expect(overlay.$strokeStyleContainer.style.display).not.toBe('none');
  });

  it('Selection overlay shows stroke style for outline shapes only', () => {
    const drawer = drawerWithTool('square');
    drag(drawer, [10, 10], [110, 60]);
    drawer.getWidget<BaseWidget>('brush')!.setActive(true);
    drag(drawer, [200, 200], [300, 260]);
    const [rect, brushLine] = drawer.getDrawingShapes();
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;

    selectWidget.showOverlay([rect]);
    expect(selectWidget.overlay.$strokeStyleContainer.style.display).not.toBe('none');

    selectWidget.showOverlay([rect, brushLine]);
    expect(selectWidget.overlay.$strokeStyleContainer.style.display).toBe('none');
  });

  it('Canvas background does not fill selected shapes', () => {
    const drawer = drawerWithTool('square');
    drag(drawer, [10, 10], [110, 60]);
    const rect = drawer.getDrawingShapes()[0] as Rect;
    drawer.getWidget<SelectWidget>('selection')!.transformer.nodes([rect]);

    drawer.setBgColor('#f5faff');

    expect(drawer.background.fill()).toBe('#f5faff');
    expect(rect.fill()).toBeUndefined();
  });

  it('Stroke styles: dashes and dots follow stroke width', () => {
    const drawer = drawerWithTool('line');
    const overlay = drawer.getWidget<BaseWidget>('line')!.overlay as BaseOverlay;
    const pressedStyle = () =>
      overlay.$strokeStyleBtnContainer.querySelector('[aria-pressed="true"]')?.getAttribute('data-stroke-style');
    const styles = Array.from(overlay.$strokeStyleBtnContainer.querySelectorAll('[data-stroke-style]'));

    expect(styles.map((b) => [b.getAttribute('data-stroke-style'), b.getAttribute('aria-label')])).toEqual([
      ['solid', 'Solid'],
      ['dashed', 'Dashed'],
      ['dotted', 'Dotted'],
    ]);
    expect(pressedStyle()).toBe('dashed');

    // dots: zero length dashes with round caps
    drawer.setStrokeStyle('dotted');
    drawer.setStrokeWidth(5);
    drag(drawer, [10, 10], [200, 10]);
    const line = drawer.getDrawingShapes()[0] as Line;
    expect(line.dash()).toEqual([0, 10]);
    expect(pressedStyle()).toBe('dotted');

    // selected shape: style and width change its dash
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
    selectWidget.setActive(true);
    selectWidget.transformer.nodes([line]);
    drawer.setStrokeWidth(12);
    expect(line.dash()).toEqual([0, 24]);
    drawer.setStrokeStyle('dashed');
    expect(line.dash()).toEqual([24, 36]);
    drawer.setStrokeStyle('solid');
    expect(line.dash()).toBeUndefined();
  });

  it('Dash arrays of previous versions give dashed style', () => {
    const drawer = createDrawer({ strokeDash: [33, 10] });

    expect(drawer.options.strokeStyle).toBe('dashed');
    drawer.setStrokeStyle([]);
    expect(drawer.options.strokeStyle).toBe('solid');
    drawer.setStrokeStyle([33, 33]);
    expect(drawer.options.strokeStyle).toBe('dashed');

    // shape of a previous version: dash recomputed with its style when width changes
    const rect = drawer.addShape(new Rect({ name: 'drawer-rect', width: 50, height: 50, stroke: '#000', dash: [33, 10] }));
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
    selectWidget.transformer.nodes([rect]);
    drawer.setStrokeWidth(3);
    expect(rect.dash()).toEqual([6, 9]);
  });
});
