import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Drawer } from '@/Drawer';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import { GroupWidget } from '@/components/toolbar/widgets/GroupWidget';
import { LineWidget } from '@/components/toolbar/widgets/Line/Line';
import { ArrowWidget } from '@/components/toolbar/widgets/Arrow/Arrow';
import type { WidgetGroupOptions } from '@/@types/toolbar';
import { createDrawer, keydown } from './helpers';

const shapes: WidgetGroupOptions = { widgets: ['line', 'square', 'circle', 'arrow'], title: 'Shapes' };

const widget = (drawer: Drawer, id: string) => drawer.toolbar.widgets.get(id as BaseWidget['id'])!;

/** Names of buttons of toolbar (widgets and groups), in order */
const buttons = (drawer: Drawer) =>
  [...drawer.toolbar.$toolbarRoot.children].map(($item) =>
    $item.querySelector(':scope > button')!.getAttribute('aria-label')
  );

const key = ($el: HTMLElement, init: KeyboardEventInit) =>
  $el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));

describe('Groups of widgets', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Option groups widgets in one button, at the place of the first one, still widgets of toolbar', () => {
    const drawer = createDrawer({ language: 'en', widgetGroups: [shapes] });
    const [group] = drawer.toolbar.groups;
    const label = (id: string) => widget(drawer, id).$button.getAttribute('aria-label');

    expect(buttons(drawer)).toEqual([...['pan', 'selection', 'brush', 'eraser', 'text'].map(label), 'Shapes']);
    expect(group.widgets.map(({ id }) => id)).toEqual(['line', 'square', 'circle', 'arrow']);
    expect(group.$menu.contains(widget(drawer, 'square').$button)).toBe(true);
    expect(drawer.toolbar.widgets.size).toBe(9);
    expect(drawer.getWidget('circle')).toBe(group.widgets[2]);

    // disclosure of a group of buttons
    expect(group.$button.getAttribute('aria-expanded')).toBe('false');
    expect(group.$button.getAttribute('aria-controls')).toBe(group.$menu.id);
    expect(group.$menu.getAttribute('role')).toBe('group');
    expect(group.$menu.getAttribute('aria-label')).toBe('Shapes');
    expect(group.isShown()).toBe(false);

    // default title, translated
    expect(
      createDrawer({ language: 'fr', widgetGroups: [{ widgets: ['line'] }] }).toolbar.groups[0].$button.title
    ).toBe("Plus d'outils");
  });

  it('Group shows its widgets, a chosen one is active and highlights the group', () => {
    const drawer = createDrawer({ widgetGroups: [shapes] });
    const [group] = drawer.toolbar.groups;
    const [line, square, circle, arrow] = group.widgets;

    // opened on first widget (active one is not in group)
    group.$button.click();
    expect(group.isShown()).toBe(true);
    expect(group.$button.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(line.$button);

    square.$button.click();
    expect(drawer.activeTool).toBe('square');
    expect(group.isShown()).toBe(false);
    expect(group.$button.classList.contains('active')).toBe(true);

    // shortcut of a widget of group: focus on group button
    keydown(drawer, { key: 'c' });
    expect(drawer.activeTool).toBe('circle');
    expect(document.activeElement).toBe(group.$button);
    keydown(drawer, { key: 'b' });
    expect(group.$button.classList.contains('active')).toBe(false);

    // opened on active widget, arrow keys between widgets, Escape closes
    keydown(drawer, { key: 'c' });
    group.$button.click();
    expect(document.activeElement).toBe(circle.$button);
    key(circle.$button, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(arrow.$button);
    key(arrow.$button, { key: 'Escape' });
    expect(group.isShown()).toBe(false);
    expect(document.activeElement).toBe(group.$button);

    // pointer elsewhere closes
    group.$button.click();
    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    expect(group.isShown()).toBe(false);
  });

  it('Tab stop and arrow keys on buttons of toolbar, widgets of groups reached from their group', () => {
    const drawer = createDrawer({ widgetGroups: [shapes] });
    const [group] = drawer.toolbar.groups;
    const text = widget(drawer, 'text');

    widget(drawer, 'square').setActive(true);
    expect(group.$button.tabIndex).toBe(0);
    expect(group.widgets.every(({ $button }) => $button.tabIndex === -1)).toBe(true);
    expect(text.$button.tabIndex).toBe(-1);

    text.$button.focus();
    key(text.$button, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(group.$button);
    key(group.$button, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(widget(drawer, 'pan').$button);
  });

  it('Icon: generic by default, name of an icon or of a widget, svg code without scripts', () => {
    const icon = (options: Partial<WidgetGroupOptions>) =>
      createDrawer({
        widgetGroups: [{ widgets: ['line', 'square'], ...options }],
      }).toolbar.groups[0].$button.querySelector('svg')!;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(icon({}).outerHTML).toContain('M3 13h8v8H3z');
    expect(icon({ icon: 'more' }).querySelectorAll('circle')).toHaveLength(3);
    expect(icon({ icon: 'circle' }).querySelector('circle')).not.toBeNull();

    const svg = icon({
      icon: `<svg viewBox="0 0 24 24" onload="alert(1)"><script>alert(1)</script><path d="M1 1" onclick="alert(1)"/>
        <a href="javascript:alert(1)"><path d="M2 2"/></a></svg>`,
    });

    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('onload')).toBeNull();
    expect(svg.querySelector('script')).toBeNull();
    expect(svg.querySelector('path')!.getAttribute('onclick')).toBeNull();
    expect(svg.querySelector('a')!.getAttribute('href')).toBeNull();
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(warn).not.toHaveBeenCalled();

    // unknown name, invalid code: generic icon
    expect(icon({ icon: 'unknown' }).outerHTML).toContain('M3 13h8v8H3z');
    expect(icon({ icon: '<div></div>' }).outerHTML).toContain('M3 13h8v8H3z');
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('Read only: group disabled with its widgets', () => {
    const drawer = createDrawer({ widgetGroups: [shapes] });
    const [group] = drawer.toolbar.groups;

    drawer.setReadOnly(true);
    expect(group.$button.disabled).toBe(true);
    drawer.setReadOnly(false);
    expect(group.$button.disabled).toBe(false);
  });

  it('Widgets of toolbar only, each in one group; groups of widgets created by code', () => {
    const drawer = createDrawer({
      language: 'en',
      widgets: ['brush', 'square', 'circle'],
      widgetGroups: [{ widgets: ['line', 'circle', 'square'], title: 'Shapes' }, { widgets: ['square'] }],
    });
    const [group] = drawer.toolbar.groups;

    expect(drawer.toolbar.groups).toHaveLength(1);
    expect(group.widgets.map(({ id }) => id)).toEqual(['circle', 'square']);
    expect(buttons(drawer)).toEqual([widget(drawer, 'brush').$button.getAttribute('aria-label'), 'Shapes']);

    // widgets created for a group, added with it
    const lines = new GroupWidget(drawer, {
      widgets: [new LineWidget(drawer), new ArrowWidget(drawer)],
      icon: 'line',
      title: 'Lines',
    });

    drawer.toolbar.addGroup(lines);
    expect(buttons(drawer)).toEqual([widget(drawer, 'brush').$button.getAttribute('aria-label'), 'Shapes', 'Lines']);
    expect(drawer.getWidget('arrow')).toBe(lines.widgets[1]);
    keydown(drawer, { key: 'a' });
    expect(drawer.activeTool).toBe('arrow');
    expect(lines.$button.classList.contains('active')).toBe(true);
    expect(group.$button.classList.contains('active')).toBe(false);
  });
});
