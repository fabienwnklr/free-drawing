import { describe, expect, it, vi } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import { Ellipse } from 'konva/lib/shapes/Ellipse';
import type { Group } from 'konva/lib/Group';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import type { BaseOverlay } from '@/components/tools/Overlay/BaseOverlay';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { shapeName } from '@/constants';
import { getCornerRadius, getEdges } from '@/utils/stroke';
import { createDrawer, drag } from './helpers';

describe('Edges', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Radius of round corners follows rectangle size', () => {
    expect(getCornerRadius(200, 100)).toBe(25);
    expect(getCornerRadius(-40, 400)).toBe(10);
    expect(getCornerRadius(500, 300)).toBe(32);
    expect(getEdges(0)).toBe('sharp');
    expect(getEdges(undefined)).toBe('sharp');
    // radius of round corners
    expect(getEdges(12)).toBe(12);
    expect(getEdges([0, 4, 0, 0])).toBe(4);
    expect(getCornerRadius(200, 100, 'sharp')).toBe(0);
    expect(getCornerRadius(200, 100, 12)).toBe(12);
  });

  it('Rectangles are drawn with round corners when edges are round, buttons only for rectangles', () => {
    const drawer = createDrawer({ tool: 'square', edges: 'round' });
    const overlay = drawer.getWidget<BaseWidget>('square')!.overlay as BaseOverlay;
    const pressed = () => overlay.$edgesBtnContainer.querySelector('.active')?.getAttribute('data-edges');

    expect(overlay.$edgesContainer.style.display).toBe('');
    expect(pressed()).toBe('round');
    drag(drawer, [0, 0], [200, 100]);
    expect((drawer.getDrawingShapes()[0] as Rect).cornerRadius()).toBe(25);

    overlay.$edgesBtnContainer.querySelector<HTMLButtonElement>('[data-edges="sharp"]')!.click();
    expect(drawer.options.edges).toBe('sharp');
    expect(pressed()).toBe('sharp');
    drag(drawer, [300, 0], [500, 100]);
    expect((drawer.getDrawingShapes()[1] as Rect).cornerRadius()).toBe(0);

    // other shape tools
    drawer.getWidget<BaseWidget>('circle')!.setActive(true);
    expect(overlay.$edgesContainer.style.display).toBe('none');
  });

  it('Edges of selected rectangles change, also in groups, ellipses unchanged', () => {
    const drawer = createDrawer();
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
    const rect = drawer.addShape(new Rect({ name: shapeName.rect, width: 80, height: 40 }));
    const other = drawer.addShape(new Rect({ name: shapeName.rect, width: 400, height: 400 }));
    const ellipse = drawer.addShape(new Ellipse({ name: shapeName.ellipse, radiusX: 20, radiusY: 20 }));
    const onOptions = vi.fn();

    selectWidget.select([ellipse]);
    expect(selectWidget.overlay.$edgesContainer.style.display).toBe('none');
    // with a rectangle: applied to it only
    selectWidget.select([rect, ellipse]);
    expect(selectWidget.overlay.$edgesContainer.style.display).toBe('');

    drawer.on('drawer.options.change', onOptions);
    drawer.setEdges('round');
    expect(onOptions).toHaveBeenCalledWith({ edges: 'round' });
    expect(rect.cornerRadius()).toBe(10);
    expect(ellipse.getAttr('cornerRadius')).toBeUndefined();

    const group = drawer.groupShapes([rect, other])! as Group;
    selectWidget.select([group]);
    expect(selectWidget.overlay.$edgesContainer.style.display).toBe('');
    // overlay shows edges of first rectangle
    expect(selectWidget.overlay.$edgesBtnContainer.querySelector('.active')?.getAttribute('data-edges')).toBe('round');
    drawer.setEdges('round');
    expect(other.cornerRadius()).toBe(32);
    drawer.setEdges('sharp');
    expect([rect.cornerRadius(), other.cornerRadius()]).toEqual([0, 0]);

    drawer.resetDrawer();
    expect(drawer.options.edges).toBe('sharp');
  });

  it('Corner radius is chosen in radius field, empty for radius following size', () => {
    const drawer = createDrawer({ tool: 'square' });
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
    const overlay = drawer.getWidget<BaseWidget>('square')!.overlay as BaseOverlay;
    const rect = drawer.addShape(new Rect({ name: shapeName.rect, width: 200, height: 100 }));
    const $radius = overlay.$edgesRadius;
    const setRadius = (value: string) => {
      $radius.value = value;
      $radius.dispatchEvent(new Event('change'));
    };
    const pressed = () => overlay.$edgesBtnContainer.querySelector('.active')?.getAttribute('data-edges');

    expect($radius.getAttribute('aria-label')).toBe('Corner radius');
    expect($radius.value).toBe('0');

    setRadius('8');
    expect(drawer.options.edges).toBe(8);
    expect(pressed()).toBe('round');
    drag(drawer, [300, 0], [500, 100]);
    expect((drawer.getDrawingShapes()[1] as Rect).cornerRadius()).toBe(8);

    setRadius('');
    expect(drawer.options.edges).toBe('round');
    expect($radius.value).toBe('');
    setRadius('-5');
    expect(drawer.options.edges).toBe('sharp');
    expect($radius.value).toBe('0');

    // selected rectangle: its radius shown, chosen one applied
    selectWidget.select([rect]);
    const $selectRadius = selectWidget.overlay.$edgesRadius;
    drawer.setEdges(14.567);
    expect(rect.cornerRadius()).toBe(14.57);
    selectWidget.showOverlay([rect]);
    expect($selectRadius.value).toBe('14.57');

    // Backspace in field does not delete selection
    $selectRadius.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    expect(rect.getLayer()).toBeTruthy();
  });
});
