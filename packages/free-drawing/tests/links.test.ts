import { describe, expect, it, vi } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import type { BaseOverlay } from '@/components/tools/Overlay/BaseOverlay';
import { drawerEvents, shapeName } from '@/constants';
import { parseDrawingFile, parseShapeState } from '@/utils/drawingFile';
import { renderSvg } from '@/utils/export';
import { createFrame } from '@/utils/frame';
import { parseLink } from '@/utils/link';
import { shapeLinkName } from '@/utils/shapeLinks';
import { createDrawer } from './helpers';

/** Rectangle of 80 × 40 at (100, 100) */
const createRect = () => new Rect({ name: shapeName.rect, x: 100, y: 100, width: 80, height: 40, stroke: '#000' });

/** Section shown in its panel */
const shown = ($section: HTMLElement) => $section.style.display !== 'none';

/**
 * Key pressed in a field of the panel
 * @param $el field
 * @param key key pressed
 */
const press = ($el: HTMLElement, key: string) =>
  $el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

describe('Links of shapes', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Addresses: web pages and email addresses, normalized, other protocols refused', () => {
    expect(
      ['example.com/page', ' https://example.com ', 'http://localhost:3000/a?b=1#c', 'localhost:3000'].map(parseLink)
    ).toEqual([
      'https://example.com/page',
      'https://example.com/',
      'http://localhost:3000/a?b=1#c',
      'https://localhost:3000/',
    ]);
    expect(['me@example.com', 'mailto:me@example.com'].map(parseLink)).toEqual([
      'mailto:me@example.com',
      'mailto:me@example.com',
    ]);
    expect(
      [
        'javascript:alert(1)',
        'JavaScript://%0aalert(1)',
        'data:text/html,x',
        'ftp://example.com',
        '',
        '  ',
        'https://',
        'a b',
        42,
        null,
        `https://example.com/${'a'.repeat(2048)}`,
      ].map(parseLink)
    ).toEqual(Array(11).fill(null));
  });

  it('Link of selected shapes: set, saved with the drawing, undone, removed, invalid address refused', () => {
    const drawer = createDrawer({ language: 'en' });
    const shape = drawer.addShape(createRect());
    const change = vi.fn();

    // drawing with the shape in history
    drawer.stage.fire('change');
    drawer.on(drawerEvents.change, change);
    drawer.getWidget<SelectWidget>('selection')!.select([shape]);
    expect(drawer.setShapeLink('example.com')).toBe(true);
    expect(drawer.getShapeLink(shape)).toBe('https://example.com/');
    expect(drawer.getDrawingFile().shapes[0].attrs.link).toBe('https://example.com/');
    expect(change).toHaveBeenCalledTimes(1);

    // same link, invalid address: nothing changed
    expect(drawer.setShapeLink('https://example.com')).toBe(false);
    expect(drawer.setShapeLink('javascript:alert(1)')).toBe(false);
    expect(change).toHaveBeenCalledTimes(1);

    drawer.undoRedo.undo();
    expect(drawer.getShapeLink(drawer.getDrawingShapes()[0])).toBe(null);
    drawer.undoRedo.redo();

    const restored = drawer.getDrawingShapes()[0];

    expect(drawer.getShapeLink(restored)).toBe('https://example.com/');
    // removed: no attribute left
    expect(drawer.setShapeLink(null, [restored])).toBe(true);
    expect('link' in restored.attrs).toBe(false);
  });

  it('Links of files, of drawing links and of collaborators: only web pages and email addresses kept', () => {
    const file = parseDrawingFile(
      JSON.stringify({
        type: 'free-drawing',
        shapes: [
          { className: 'Rect', attrs: { link: 'javascript:alert(1)' } },
          { className: 'Rect', attrs: { link: 'example.com' } },
          { className: 'Group', attrs: {}, children: [{ className: 'Rect', attrs: { link: 'data:text/html,x' } }] },
        ],
      })
    );

    expect(file.shapes.map((shape) => shape.attrs)).toEqual([{}, { link: 'https://example.com/' }, {}]);
    expect(file.shapes[2].children![0].attrs).toEqual({});
    expect(
      parseShapeState(JSON.stringify({ className: 'Rect', attrs: { id: 'a', link: 'javascript:x' } }))!.attrs
    ).toEqual({
      id: 'a',
    });
  });

  it('Shapes with a link show an icon opening it (frames at the end of their title), not a drawing shape', () => {
    const drawer = createDrawer({ language: 'en' });
    const shape = drawer.addShape(createRect());
    const frame = drawer.addShape(createFrame({ x: 300, y: 100, width: 200, height: 150, label: 'Frame 1' }));
    const icons = () => drawer.selectionLayer.find(`.${shapeLinkName}`);
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const pressed = vi.fn();

    drawer.drawLayer.draw();
    expect(icons()).toHaveLength(0);

    drawer.setShapeLink('https://example.com', [shape]);
    drawer.setShapeLink('me@example.com', [frame]);
    drawer.drawLayer.draw();

    const box = shape.getClientRect();

    // view coordinates, out of the top right corner of the shape, above the right end of the frame
    expect(icons().map((icon) => icon.getAbsolutePosition())).toEqual([
      { x: box.x + box.width + 8, y: box.y - 30 },
      { x: 478, y: 70 },
    ]);
    expect(drawer.getDrawingShapes()).toEqual([shape, frame]);

    // click opens the link, other buttons don't, press is not one on the drawing
    icons()[1].fire('click', { evt: { button: 0 } });
    expect(open).toHaveBeenCalledWith('mailto:me@example.com', '_blank', 'noopener,noreferrer');
    icons()[0].fire('click', { evt: { button: 2 } });
    expect(open).toHaveBeenCalledTimes(1);
    drawer.stage.on('mousedown.test', pressed);
    icons()[0].fire('mousedown', { evt: { button: 0 } }, true);
    expect(pressed).not.toHaveBeenCalled();

    // selection layer emptied (drawing loaded): icons created again
    drawer.selectionLayer.destroyChildren();
    drawer.drawLayer.draw();
    expect(icons()).toHaveLength(2);

    // svg export: link around the shape
    expect(renderSvg([shape], box)).toContain('<a href="https://example.com/" target="_blank"><g');

    // link removed, hidden shape: no icon
    drawer.setShapeLink(null, [frame]);
    shape.visible(false);
    drawer.drawLayer.draw();
    expect(icons()).toHaveLength(0);
    open.mockRestore();
  });

  it('Actions of the selection panel: duplicate, delete, link editor above the selection', () => {
    const drawer = createDrawer({ language: 'en' });
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
    const shape = drawer.addShape(createRect());
    const other = drawer.addShape(
      new Rect({ name: shapeName.rect, x: 400, y: 100, width: 80, height: 40, fill: '#fff' })
    );
    const { overlay } = selectWidget;
    const editor = drawer.linkEditor!;
    const [duplicate, remove, link] = overlay.$actionsContainer.querySelectorAll<HTMLButtonElement>(
      '.overlay-picker-btn-container > button'
    );
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const toast = vi.spyOn(drawer, 'toast');
    const shortcut = vi.fn();

    // tool options: no actions
    drawer.getWidget<BaseWidget>('square')!.setActive(true);
    expect(shown((drawer.getWidget<BaseWidget>('square')!.overlay as BaseOverlay).$actionsContainer)).toBe(false);

    selectWidget.setActive(true);
    selectWidget.select([shape]);
    expect(shown(overlay.$actionsContainer)).toBe(true);
    expect(
      [duplicate, remove, link].map(($btn) => [
        $btn.getAttribute('aria-label'),
        $btn.title,
        $btn.getAttribute('aria-keyshortcuts'),
      ])
    ).toEqual([
      ['Duplicate', 'Duplicate (Ctrl+D)', 'Control+D'],
      ['Delete', 'Delete (Delete)', 'Delete'],
      ['Link', 'Link', null],
    ]);

    // no link: editor hidden, shown above the selection by the link button, its field focused
    expect(editor.isVisible()).toBe(false);
    link.focus();
    link.click();
    expect(editor.isVisible()).toBe(true);
    expect(Number.parseFloat(editor.$editor.style.top)).toBeLessThan(shape.getClientRect().y);
    expect(document.activeElement).toBe(editor.$input);
    expect([editor.$openBtn.hidden, editor.$removeBtn.hidden]).toEqual([true, true]);

    // Enter applies (once, also on change), typed keys are not shortcuts, focus back on the link button
    drawer.$drawerContainer.addEventListener('keydown', shortcut);
    editor.$input.value = 'example.com';
    press(editor.$input, 'Enter');
    editor.$input.dispatchEvent(new Event('change'));
    expect(shortcut).not.toHaveBeenCalled();
    expect(drawer.getShapeLink(shape)).toBe('https://example.com/');
    expect([editor.isVisible(), editor.$input.value, editor.$openBtn.hidden, editor.$removeBtn.hidden]).toEqual([
      true,
      'https://example.com/',
      false,
      false,
    ]);
    expect(document.activeElement).toBe(link);
    expect(drawer.undoRedo.canUndo()).toBe(true);

    // invalid address: told, nothing changed, Escape shows the link again
    editor.$input.focus();
    editor.$input.value = 'javascript:alert(1)';
    editor.$input.dispatchEvent(new Event('change'));
    expect(toast).toHaveBeenCalledWith('Invalid link: web page (https://…) or email address', 'warning');
    expect(drawer.getShapeLink(shape)).toBe('https://example.com/');
    press(editor.$input, 'Escape');
    expect(editor.$input.value).toBe('https://example.com/');

    editor.$openBtn.click();
    expect(open).toHaveBeenCalledWith('https://example.com/', '_blank', 'noopener,noreferrer');

    // shown for a selection with a link only
    selectWidget.select([other]);
    expect(editor.isVisible()).toBe(false);
    selectWidget.select([shape]);
    expect(editor.isVisible()).toBe(true);

    // address typed, then another shape selected: applied to the shape it was typed for
    editor.$input.focus();
    editor.$input.value = 'example.org';
    selectWidget.select([other]);
    expect([drawer.getShapeLink(shape), drawer.getShapeLink(other)]).toEqual(['https://example.org/', null]);

    // hidden while moved and for locked shapes
    selectWidget.select([shape]);
    const dragging = vi.spyOn(shape, 'isDragging').mockReturnValue(true);

    editor.update();
    expect(editor.isVisible()).toBe(false);
    dragging.mockRestore();
    drawer.setShapesLocked(true);
    expect(editor.isVisible()).toBe(false);
    drawer.setShapesLocked(false);
    selectWidget.select([shape]);
    expect(editor.isVisible()).toBe(true);

    // removed: editor hidden, focus in drawer
    editor.$removeBtn.focus();
    editor.$removeBtn.click();
    expect([drawer.getShapeLink(shape), editor.isVisible()]).toEqual([null, false]);
    expect(document.activeElement).toBe(drawer.$drawerContainer);

    // Escape without link: hidden, focus back where it was (context menu, command palette: drawer)
    editor.edit();
    expect(document.activeElement).toBe(editor.$input);
    press(editor.$input, 'Escape');
    expect(editor.isVisible()).toBe(false);
    expect(document.activeElement).toBe(drawer.$drawerContainer);

    // duplicate: copy selected, delete: selection removed, focus back in drawer
    duplicate.click();
    expect(drawer.getDrawingShapes()).toHaveLength(3);
    remove.click();
    expect(drawer.getDrawingShapes()).toEqual([shape, other]);
    expect(document.activeElement).toBe(drawer.$drawerContainer);

    drawer.$drawerContainer.removeEventListener('keydown', shortcut);
    open.mockRestore();
    toast.mockRestore();
  });
});
