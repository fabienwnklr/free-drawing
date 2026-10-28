import { describe, expect, it } from 'vitest';
import type { Group } from 'konva/lib/Group';
import { Rect } from 'konva/lib/shapes/Rect';
import { Text } from 'konva/lib/shapes/Text';
import type { Drawer } from '@/Drawer';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { searchHighlightsName } from '@/components/SearchBar/SearchBar';
import { shapeName } from '@/constants';
import { findTexts, normalizeSearch } from '@/utils/search';
import { createFrame } from '@/utils/frame';
import { createDrawer, keydown } from './helpers';

/** Free text of the drawing */
const addText = (drawer: Drawer, text: string, x: number, y: number) =>
  drawer.addShape(new Text({ name: shapeName.text, text, x, y, fontSize: 16 })) as Text;

/** Text typed in the search field */
const type = (drawer: Drawer, value: string) => {
  drawer.search.$input.value = value;
  drawer.search.$input.dispatchEvent(new Event('input'));
};

/** Key pressed in the search field */
const press = (drawer: Drawer, init: KeyboardEventInit) =>
  drawer.search.$input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));

/** Highlights of the texts found */
const highlights = (drawer: Drawer) =>
  drawer.selectionLayer.findOne<Group>(`.${searchHighlightsName}`)?.getChildren() ?? [];

describe('Search of texts', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Texts containing a search, case and accents ignored, visible ones in reading order, titles of frames', () => {
    const drawer = createDrawer();
    const layer = drawer.drawLayer;
    const second = addText(drawer, 'Réunion de lundi', 300, 100);
    const first = addText(drawer, 'Ordre du jour: REUNION', 50, 100);
    const third = addText(drawer, 'Compte rendu (réunion)', 0, 400);
    const hidden = addText(drawer, 'réunion cachée', 0, 600);
    const frame = drawer.addShape(createFrame({ x: 0, y: 800, width: 200, height: 100, label: 'Réunions' }));

    hidden.visible(false);
    expect(normalizeSearch('Été À')).toBe('ete a');
    expect(findTexts(layer, '  reunion ')).toEqual([first, second, third, expect.any(Text)]);
    expect(findTexts(layer, 'reunion')[3].getParent()).toBe(frame);
    expect(findTexts(layer, '   ')).toEqual([]);
    expect(findTexts(layer, 'absent')).toEqual([]);

    // a text a little higher on the right: same line, after
    const right = addText(drawer, 'Plan', 600, 500);
    const left = addText(drawer, 'Plan', 100, 504);

    expect(findTexts(layer, 'plan')).toEqual([left, right]);
  });

  it('Ctrl+F: texts found highlighted, Enter and Shift+Enter from one to the next, view moved to the current one', () => {
    const drawer = createDrawer();
    const near = addText(drawer, 'Todo: plan', 100, 100);
    const far = addText(drawer, 'Todo: ship', 5000, 3000);

    keydown(drawer, { key: 'f', code: 'KeyF', ctrlKey: true });
    expect(drawer.search.isVisible()).toBe(true);
    expect(document.activeElement).toBe(drawer.search.$input);
    type(drawer, 'todo');
    expect(drawer.search.results).toEqual([near, far]);
    expect(drawer.search.$count.textContent).toBe('1 of 2');
    expect(highlights(drawer)).toHaveLength(2);
    // current one outlined
    expect(highlights(drawer).map((rect) => !!(rect as Rect).stroke())).toEqual([true, false]);

    const position = drawer.stage.position();

    press(drawer, { key: 'Enter' });
    expect(drawer.search.$count.textContent).toBe('2 of 2');
    // far away: shown
    expect(drawer.stage.position()).not.toEqual(position);
    const view = drawer.getViewArea();
    expect(far.x()).toBeGreaterThan(view.x);
    expect(far.x()).toBeLessThan(view.x + view.width);
    press(drawer, { key: 'Enter' });
    expect(drawer.search.$count.textContent).toBe('1 of 2');
    press(drawer, { key: 'Enter', shiftKey: true });
    expect(drawer.search.$count.textContent).toBe('2 of 2');

    // text changed: no longer found
    far.text('Done: ship');
    drawer.stage.fire('change');
    expect(drawer.search.results).toEqual([near]);
    expect(drawer.search.$count.textContent).toBe('1 of 1');

    type(drawer, 'nothing');
    expect(drawer.search.$count.textContent).toBe('No results');
    expect(drawer.search.$nextButton.disabled).toBe(true);
    expect(highlights(drawer)).toHaveLength(0);

    // Escape closes, highlights removed
    type(drawer, 'todo');
    press(drawer, { key: 'Escape' });
    expect(drawer.search.isVisible()).toBe(false);
    expect(highlights(drawer)).toHaveLength(0);
  });

  it('Keys of the field are not shortcuts of the drawer; palette and context menu open the search', () => {
    const drawer = createDrawer();
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
    const rect = drawer.addShape(new Rect({ name: shapeName.rect, width: 50, height: 50 }));

    addText(drawer, 'Plan', 100, 100);
    selectWidget.setActive(true);
    selectWidget.select([rect]);
    drawer.search.show('pl');
    press(drawer, { key: 'Delete' });
    press(drawer, { key: 'Backspace' });
    expect(rect.getLayer()).toBe(drawer.drawLayer);
    drawer.search.hide();

    drawer.showCommandPalette();
    const labels = [...drawer.commandPalette!.$list.querySelectorAll('.drawer-commands-label')].map(
      ($label) => $label.textContent
    );

    drawer.commandPalette!.hide();
    expect(labels).toContain('Search texts');
  });
});
