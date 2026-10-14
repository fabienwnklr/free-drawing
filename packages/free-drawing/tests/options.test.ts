import { describe, expect, it, beforeAll, vi } from 'vitest';
import type { Line } from 'konva/lib/shapes/Line';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import type { DrawerOptions } from '@/@types/drawer';
import { widgetNames } from '@/constants';
import { createDrawer, fireMouse, keydown } from './helpers';

beforeAll(() => {
  function noOp() {}

  if (typeof window.URL.createObjectURL === 'undefined') {
    Object.defineProperty(window.URL, 'createObjectURL', { value: noOp });
  }
});

const toolbarIds = (drawer: ReturnType<typeof createDrawer>) => Array.from(drawer.toolbar.widgets.keys());

describe('Widgets option', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('All widgets by default', () => {
    expect(toolbarIds(createDrawer())).toEqual(widgetNames);
  });

  it('List of widgets, in given order', () => {
    const drawer = createDrawer({ widgets: ['eraser', 'brush'] });

    expect(toolbarIds(drawer)).toEqual(['eraser', 'brush']);
    expect(drawer.getWidget('selection')).toBeUndefined();
    expect(drawer.toolbar.$toolbarRoot.querySelectorAll('button').length).toBe(2);
    // default tool (brush) is available
    expect(drawer.activeTool).toBe('brush');
  });

  it('Object of widgets with options', () => {
    const drawer = createDrawer({ widgets: { eraser: {}, brush: { title: 'Pinceau', shortcut: 'p' } } });
    const brush = drawer.getWidget<BaseWidget>('brush')!;

    expect(toolbarIds(drawer)).toEqual(['eraser', 'brush']);
    expect(brush.$button.title).toBe('Pinceau');

    drawer.getWidget<BaseWidget>('eraser')!.setActive(true);
    keydown(drawer, { key: 'b' });
    expect(drawer.activeTool).toBe('eraser');
    keydown(drawer, { key: 'p' });
    expect(drawer.activeTool).toBe('brush');
  });

  it('Shortcut can be disabled', () => {
    const drawer = createDrawer({ widgets: { brush: {}, eraser: { shortcut: false } } });

    keydown(drawer, { key: 'e' });

    expect(drawer.activeTool).toBe('brush');
    expect(drawer.getWidget<BaseWidget>('eraser')!.$button.querySelector('.tool-key-shortcut')).toBeNull();
  });

  it('Initial tool falls back on first widget when not available', () => {
    const drawer = createDrawer({ tool: 'pan', widgets: ['eraser', 'brush'] });

    expect(drawer.activeTool).toBe('eraser');
    expect(drawer.activeWidget.$button.classList.contains('active')).toBe(true);
  });

  it('Unknown widgets are ignored', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const drawer = createDrawer({ widgets: ['brush', 'unknown'] as DrawerOptions['widgets'] });

    expect(toolbarIds(drawer)).toEqual(['brush']);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('Help lists available tools with their shortcuts', () => {
    const drawer = createDrawer({ widgets: { brush: { title: 'Pinceau', shortcut: 'p' }, eraser: {} } });
    const tools = Array.from(drawer.help.$modalBody.querySelectorAll('[data-help-tools] li')).map((li) =>
      li.textContent?.replace(/\s+/g, ' ').trim()
    );

    expect(tools).toEqual(['Pinceau P', 'Eraser E']);
  });

  it('Drawer works without selection widget', () => {
    const drawer = createDrawer({ widgets: ['text', 'brush'] });
    const textWidget = drawer.getWidget<TextWidget>('text')!;
    textWidget.setActive(true);

    const text = textWidget.addTextNode('hello');
    textWidget.editTextNode(text);
    drawer.$drawerContainer.querySelector('textarea')!.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));
    expect(drawer.getDrawingShapeByName('text').length).toBe(1);

    expect(() => {
      drawer.setStrokeColor('#e03131');
      keydown(drawer, { key: 'Delete' });
      keydown(drawer, { key: 'a', ctrlKey: true });
      drawer.undoRedo.undo();
    }).not.toThrow();
  });

  it('Brush options change freehand stroke', () => {
    const draw = (thinning: number) => {
      const drawer = createDrawer({ widgets: { brush: { thinning } } });
      fireMouse(drawer, 'mousedown', 10, 10);
      fireMouse(drawer, 'mousemove', 20, 12);
      fireMouse(drawer, 'mousemove', 120, 40);
      fireMouse(drawer, 'mouseup', 125, 42);
      return (drawer.drawLayer.children[0] as Line).points();
    };

    expect(draw(0)).not.toEqual(draw(0.9));
  });
});
