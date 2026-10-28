import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import { createDrawer, drag, fireMouse, keydown } from './helpers';

describe('Keep tool', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Kept by default: drawing tool stays active', () => {
    const drawer = createDrawer({ language: 'en' });
    const $button = drawer.toolbar.$keepToolButton!;

    expect(drawer.options.keepTool).toBe(true);
    expect(drawer.getPreferences().keepTool).toBe(true);
    // first button of toolbar, then a separator
    expect(drawer.toolbar.$toolbarRoot.firstElementChild!.contains($button)).toBe(true);
    expect(drawer.toolbar.$toolbarRoot.children[1].getAttribute('role')).toBe('separator');
    expect($button.getAttribute('aria-label')).toBe('Keep tool active');
    expect($button.getAttribute('aria-keyshortcuts')).toBe('Q');
    expect($button.getAttribute('aria-pressed')).toBe('true');

    drawer.getWidget<BaseWidget>('square')!.setActive(true);
    drag(drawer, [10, 10], [60, 60]);
    expect(drawer.getDrawingShapes()).toHaveLength(1);
    expect(drawer.activeTool).toBe('square');
    expect(drawer.getSelectedShapes()).toEqual([]);
  });

  it('Not kept: selection tool activated, drawn shape not selected', () => {
    const drawer = createDrawer();

    drawer.setKeepTool(false);
    drawer.getWidget<BaseWidget>('square')!.setActive(true);
    // simple click, nothing drawn: tool kept
    fireMouse(drawer, 'mousedown', 10, 10);
    fireMouse(drawer, 'mouseup', 10, 10);
    expect(drawer.activeTool).toBe('square');

    drag(drawer, [10, 10], [60, 60]);
    const [rect] = drawer.getDrawingShapes();

    expect(drawer.activeTool).toBe('selection');
    expect(drawer.getSelectedShapes()).toEqual([]);
    // draggable as other shapes with selection tool
    expect(rect.draggable()).toBe(true);

    // freehand tools too
    drawer.getWidget<BaseWidget>('brush')!.setActive(true);
    drag(drawer, [100, 100], [150, 120]);
    expect(drawer.getDrawingShapes()).toHaveLength(2);
    expect(drawer.activeTool).toBe('selection');
    expect(drawer.getSelectedShapes()).toEqual([]);
  });

  it('Toggled with button and Q, saved preference, one event', async () => {
    const drawer = createDrawer();
    const $button = drawer.toolbar.$keepToolButton!;
    const onChange = vi.fn();

    drawer.on('drawer.preferences.change', onChange);
    $button.click();
    await Promise.resolve();
    expect(drawer.options.keepTool).toBe(false);
    expect($button.getAttribute('aria-pressed')).toBe('false');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toMatchObject({ keepTool: false });
    expect(createDrawer({ localStorageKey: drawer.options.localStorageKey }).getPreferences().keepTool).toBe(false);

    keydown(drawer, { key: 'q' });
    await Promise.resolve();
    expect(drawer.options.keepTool).toBe(true);
    expect($button.getAttribute('aria-pressed')).toBe('true');

    // not with modifiers
    keydown(drawer, { key: 'q', ctrlKey: true });
    keydown(drawer, { key: 'Q', shiftKey: true });
    expect(drawer.options.keepTool).toBe(true);

    drawer.setPreferences({ keepTool: false });
    await Promise.resolve();
    expect($button.getAttribute('aria-pressed')).toBe('false');
  });

  it('Preferences dialog, command palette and help', () => {
    const drawer = createDrawer({ language: 'en' });

    drawer.showPreferences();
    const modal = drawer.preferencesModal!;

    expect(modal.$keepTool!.checked).toBe(true);
    expect(modal.$keepTool!.closest('label')!.textContent).toContain('Keep tool active');
    // applied at once, kept by Save
    modal.$keepTool!.click();
    expect(drawer.options.keepTool).toBe(false);
    modal.$saveButton.click();
    expect(drawer.options.keepTool).toBe(false);

    drawer.showCommandPalette();
    const palette = drawer.commandPalette!;
    const command = palette.commands.find(({ id }) => id.includes('keep tool'))!;

    expect(command).toMatchObject({ label: 'Keep tool active', shortcut: 'Q', checked: false });
    command.run();
    expect(drawer.options.keepTool).toBe(true);
    palette.hide();

    expect(drawer.help.$modal.textContent).toContain('Keep tool active');
  });

  it('Without selection tool: no button, tool kept', () => {
    const drawer = createDrawer({ widgets: ['brush', 'square'], keepTool: false });

    expect(drawer.toolbar.$keepToolButton).toBeNull();
    expect(drawer.toolbar.$toolbarRoot.querySelector('[role="separator"]')).toBeNull();
    drawer.getWidget<BaseWidget>('square')!.setActive(true);
    drag(drawer, [10, 10], [60, 60]);
    expect(drawer.activeTool).toBe('square');
    keydown(drawer, { key: 'q' });
    expect(drawer.options.keepTool).toBe(false);
  });
});
