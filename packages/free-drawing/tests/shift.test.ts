import { describe, expect, it } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import type { Line } from 'konva/lib/shapes/Line';
import type { Vector2d } from 'konva/lib/types';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import { shapeName } from '@/constants';
import { createDrawer, fireMouse, keydown } from './helpers';

describe('Shift', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Shift pressed or released while drawing constrains shape at once', () => {
    const drawer = createDrawer();

    drawer.getWidget<BaseWidget>('square')!.setActive(true);
    fireMouse(drawer, 'mousedown', 100, 100);
    fireMouse(drawer, 'mousemove', 300, 160);
    const rect = drawer.getDrawingShapes()[0] as Rect;
    const size = () => [rect.width(), rect.height()];
    expect(size()).toEqual([200, 60]);

    keydown(drawer, { key: 'Shift', shiftKey: true });
    expect(size()).toEqual([200, 200]);
    drawer.$drawerContainer.dispatchEvent(new KeyboardEvent('keyup', { key: 'Shift' }));
    expect(size()).toEqual([200, 60]);
    fireMouse(drawer, 'mouseup', 300, 160);
  });

  it('Brush draws a straight stroke from its start with Shift', () => {
    const drawer = createDrawer({ tool: 'brush' });
    const height = () => (drawer.getDrawingShapes()[0] as Line).getClientRect().height;

    fireMouse(drawer, 'mousedown', 100, 100);
    fireMouse(drawer, 'mousemove', 110, 100);
    fireMouse(drawer, 'mousemove', 150, 160);
    fireMouse(drawer, 'mousemove', 200, 100);
    expect(height()).toBeGreaterThan(30);

    fireMouse(drawer, 'mousemove', 300, 100, { shiftKey: true });
    fireMouse(drawer, 'mouseup', 300, 100, { shiftKey: true });
    // width of stroke (and its outline) only
    expect(height()).toBeLessThan(drawer.options.strokeWidth * 3);
  });

  it('Resize keeps proportions with Shift only, texts always', () => {
    const drawer = createDrawer();
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
    const rect = drawer.addShape(new Rect({ name: shapeName.rect, width: 50, height: 20 }));
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('hello');

    selectWidget.select([rect]);
    expect(selectWidget.transformer.keepRatio()).toBe(false);
    expect(selectWidget.transformer.shiftBehavior()).toBe('default');
    selectWidget.select([text]);
    expect(selectWidget.transformer.keepRatio()).toBe(true);
  });

  it('Rotation by 15 degrees with Shift (konva), snaps of grid kept', () => {
    const drawer = createDrawer();
    const { transformer } = drawer.getWidget<SelectWidget>('selection')!;

    // 'none' would turn Shift rotation off
    expect(transformer.shiftBehavior()).toBe('default');
    transformer.rotationSnaps([0, 90, 180, 270]);
    transformer.fire('transformstart', { evt: new MouseEvent('mousedown', { shiftKey: true }) });
    transformer.fire('transformend');
    expect(transformer.rotationSnaps()).toEqual([0, 90, 180, 270]);
  });

  it('Shapes moved horizontally or vertically with Shift', () => {
    const drawer = createDrawer();
    const rect = drawer.addShape(new Rect({ name: shapeName.rect, x: 10, y: 20, width: 50, height: 20 }));
    const bound = (pos: Vector2d, shiftKey: boolean) =>
      rect.dragBoundFunc().call(rect, pos, new MouseEvent('mousemove', { shiftKey }));

    rect.fire('dragstart', {}, true);
    expect(bound({ x: 60, y: 30 }, true)).toEqual({ x: 60, y: 20 });
    expect(bound({ x: 15, y: 90 }, true)).toEqual({ x: 10, y: 90 });
    expect(bound({ x: 60, y: 30 }, false)).toEqual({ x: 60, y: 30 });

    rect.fire('dragend', {}, true);
    expect(rect.dragBoundFunc()).toBeUndefined();
  });
});
