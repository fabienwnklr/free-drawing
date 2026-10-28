import { describe, expect, it, beforeAll, vi } from 'vitest';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import type { BrushWidget } from '@/components/toolbar/widgets/Brush/Brush';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { createDrawer } from './helpers';

beforeAll(() => {
  function noOp() {}

  if (typeof window.URL.createObjectURL === 'undefined') {
    Object.defineProperty(window.URL, 'createObjectURL', { value: noOp });
  }
});

const tick = () => new Promise((resolve) => setTimeout(resolve));
const key = ($el: Element, key: string, init: KeyboardEventInit = {}) =>
  $el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }));
const label = ($el: Element | null | undefined) => $el?.getAttribute('aria-label');
const labelledBy = ($el: Element | null | undefined) =>
  document.getElementById($el?.getAttribute('aria-labelledby') ?? '')?.textContent?.trim();

describe('Accessibility', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Drawer is focusable in tab order and labelled', () => {
    const drawer = createDrawer();

    expect(drawer.$drawerContainer.tabIndex).toBe(0);
    expect(drawer.$drawerContainer.getAttribute('role')).toBe('application');
    expect(label(drawer.$drawerContainer)).toBe('Drawing board');
  });

  it('Drawer shows focus only when focused with keyboard', () => {
    const drawer = createDrawer();
    const $container = drawer.$drawerContainer;
    const focusWithKey = (key: string) => {
      $container.blur();
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      $container.focus();
    };

    focusWithKey('Tab');
    expect($container.classList.contains('drawer-keyboard-focus')).toBe(true);

    $container.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect($container.classList.contains('drawer-keyboard-focus')).toBe(false);

    // other keys (text validated with Enter...) do not show it
    focusWithKey('Enter');
    expect($container.classList.contains('drawer-keyboard-focus')).toBe(false);
  });

  it('Every button has an accessible name, icons are hidden', () => {
    const drawer = createDrawer();
    drawer.clearCanvas();
    const buttons = Array.from(drawer.$drawerContainer.querySelectorAll('button'));
    const unnamed = buttons.filter((btn) => !label(btn) && !btn.textContent?.trim());
    const icons = Array.from(drawer.$drawerContainer.querySelectorAll('svg'));

    expect(unnamed.map((btn) => btn.outerHTML.slice(0, 100))).toEqual([]);
    // no form submit when drawer is in a form
    expect(buttons.filter((btn) => btn.type !== 'button').map((btn) => btn.outerHTML.slice(0, 100))).toEqual([]);
    expect(icons.filter((svg) => svg.getAttribute('aria-hidden') !== 'true').length).toBe(0);
    drawer.clearConfirmModal!.hide();
  });

  it('Toolbar exposes active tool and shortcuts, arrows move focus (roving tabindex)', () => {
    const drawer = createDrawer();
    const root = drawer.toolbar.$toolbarRoot;
    // buttons of toolbar: keep tool, widgets and group of more tools (not separator)
    const buttons = [...root.children].flatMap(
      ($item) => $item.querySelector<HTMLButtonElement>(':scope > button') ?? []
    );
    const brush = drawer.getWidget<BaseWidget>('brush')!.$button;
    const eraser = drawer.getWidget<BaseWidget>('eraser')!.$button;

    expect(buttons[0]).toBe(drawer.toolbar.$keepToolButton);
    expect(root.getAttribute('role')).toBe('toolbar');
    expect(label(root)).toBe('Tools');
    expect(label(brush)).toBe('Brush');
    expect(brush.getAttribute('aria-pressed')).toBe('true');
    expect(eraser.getAttribute('aria-pressed')).toBe('false');
    expect(brush.getAttribute('aria-keyshortcuts')).toBe('B');
    expect(buttons.filter((b) => b.tabIndex === 0)).toEqual([brush]);

    brush.focus();
    key(brush, 'ArrowRight');
    expect(document.activeElement).toBe(eraser);
    expect(buttons.filter((b) => b.tabIndex === 0)).toEqual([eraser]);

    key(eraser, 'End');
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
    key(document.activeElement!, 'ArrowRight');
    expect(document.activeElement).toBe(buttons[0]);

    // activating a tool (shortcut) moves the tab stop on it
    drawer.getWidget<BaseWidget>('text')!.setActive(true);
    expect(buttons.filter((b) => b.tabIndex === 0)).toEqual([drawer.getWidget<BaseWidget>('text')!.$button]);
  });

  it('Arrows in toolbar do not move selected shapes', () => {
    const drawer = createDrawer();
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('hello');
    drawer.getWidget<SelectWidget>('selection')!.transformer.nodes([text]);
    const x = text.x();
    const button = drawer.getWidget<BaseWidget>('selection')!.$button;

    button.focus();
    key(button, 'ArrowRight');

    expect(text.x()).toBe(x);
  });

  it('Arrows of the other direction in menus, toolbar and layers rows do not move selected shapes either', () => {
    const drawer = createDrawer();
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('hello');
    drawer.stage.fire('change');
    drawer.getWidget<SelectWidget>('selection')!.select([text]);
    const position = text.position();
    const keys = ($item: HTMLElement, ...names: string[]) => {
      for (const name of names) expect(key($item, name)).toBe(true);
    };

    // vertical menu
    drawer.contextMenu.show();
    keys(
      drawer.contextMenu.$menu.querySelector<HTMLElement>('[role^="menuitem"]:not([hidden])')!,
      'ArrowLeft',
      'ArrowRight'
    );
    drawer.contextMenu.hide();
    // horizontal toolbars
    keys(drawer.selectionMenu!.$duplicateBtn, 'ArrowUp', 'ArrowDown');
    keys(drawer.getWidget<BaseWidget>('brush')!.$button, 'ArrowUp', 'ArrowDown');
    // row of a shape (not a group: nothing to expand)
    drawer.layersPanel!.toggle(true);
    keys(drawer.layersPanel!.$list.querySelector<HTMLElement>('.drawer-layers-name')!, 'ArrowLeft', 'ArrowRight');
    expect(text.position()).toEqual(position);
    drawer.layersPanel!.toggle(false);

    // on the drawer
    key(drawer.$drawerContainer, 'ArrowRight');
    expect(text.x()).toBeGreaterThan(position.x);
  });

  it('Overlay fields are labelled groups with pressed state', () => {
    const drawer = createDrawer();
    const overlay = drawer.getWidget<BrushWidget>('brush')!.overlay;
    const color = (value: string) => overlay.$strokeColorBtnContainer.querySelector(`[data-stroke-color="${value}"]`);

    expect(overlay.$overlayContainer.getAttribute('role')).toBe('region');
    expect(label(overlay.$overlayContainer)).toBe('Brush options');
    expect(overlay.$strokeColorContainer.getAttribute('role')).toBe('group');
    expect(labelledBy(overlay.$strokeColorContainer)).toBe('Stroke');
    expect(label(color('#000'))).toBe('Black');
    expect(color('#000')?.getAttribute('aria-pressed')).toBe('true');

    drawer.setStrokeColor('#e03131');
    expect(color('#e03131')?.getAttribute('aria-pressed')).toBe('true');
    expect(color('#000')?.getAttribute('aria-pressed')).toBe('false');

    expect(labelledBy(overlay.$opacityRange)).toBe('Opacity');
    drawer.setOpacity(0.5);
    expect(overlay.$opacityRange.getAttribute('aria-valuetext')).toBe('50%');

    const textOverlay = drawer.getWidget<TextWidget>('text')!.overlay;
    const bold = textOverlay.$fontStyleBtnContainer.querySelector('[data-font-style="bold"]');
    expect(label(bold)).toBe('Bold');
    drawer.setTextStyle({ fontStyle: 'bold' });
    expect(bold?.getAttribute('aria-pressed')).toBe('true');
    expect(labelledBy(textOverlay.$fontFamilySelect)).toBe('Font family');
  });

  it('Drawer created or tool changed: focus of a field or a dialog kept, page never scrolled to the drawer', () => {
    const $field = document.createElement('input');
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');

    document.body.append($field);
    $field.focus();
    const drawer = createDrawer();

    // created while the user types in the page
    expect(document.activeElement).toBe($field);
    // tool changed by code (e.g. right to draw removed by the owner of a collaboration session)
    drawer.setReadOnly(true);
    expect(drawer.activeTool).toBe('pan');
    expect(document.activeElement).toBe($field);
    drawer.setReadOnly(false);

    // in a dialog of the drawer
    drawer.showPreferences();
    const $inDialog = document.activeElement;

    expect(drawer.preferencesModal!.$modal.contains($inDialog)).toBe(true);
    drawer.getWidget<BaseWidget>('pan')!.setActive(true);
    expect(document.activeElement).toBe($inDialog);
    drawer.preferencesModal!.hide();

    // nothing focused: drawer focused (its shortcuts), page not scrolled
    $field.remove();
    drawer.getWidget<BaseWidget>('selection')!.setActive(true);
    expect(document.activeElement).toBe(drawer.$drawerContainer);
    expect(focus).toHaveBeenLastCalledWith({ preventScroll: true });
    focus.mockRestore();
  });

  it('Font list browsed with the keyboard, drawer focused again after a choice with the pointer', () => {
    const drawer = createDrawer();
    const textWidget = drawer.getWidget<TextWidget>('text')!;
    const $select = textWidget.overlay.$fontFamilySelect;
    const choose = (font: string) => {
      $select.value = font;
      $select.dispatchEvent(new Event('change', { bubbles: true }));
    };

    textWidget.setActive(true);
    $select.focus();
    // arrow: font chosen at once by the browser, focus kept to browse the fonts
    key($select, 'ArrowDown');
    choose('Arial');
    expect(drawer.options.textStyle.fontFamily).toBe('Arial');
    expect(document.activeElement).toBe($select);

    // pointer: list closed by the choice, drawer focused (its shortcuts)
    $select.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    choose('Georgia');
    expect(drawer.options.textStyle.fontFamily).toBe('Georgia');
    expect(document.activeElement).toBe(drawer.$drawerContainer);
  });

  it('Icon buttons of zoom, history, help and menu are labelled', () => {
    const drawer = createDrawer();

    expect(label(drawer.zoom!.$btnMinus)).toBe('Zoom out');
    expect(label(drawer.zoom!.$btnPlus)).toBe('Zoom in');
    // percentage formatted with user locale
    expect(label(drawer.zoom!.$btnReset)).toMatch(/^Reset zoom \(100\s?%\)$/);
    expect(label(drawer.undoRedo.$btnUndo)).toBe('Undo');
    expect(drawer.undoRedo.$btnUndo.getAttribute('aria-keyshortcuts')).toBe('Control+Z');
    expect(label(drawer.undoRedo.$btnRedo)).toBe('Redo');
    expect(label(drawer.help.$button)).toBe('Help');
    expect(drawer.help.$button.getAttribute('aria-haspopup')).toBe('dialog');
    expect(label(drawer.setting.$button)).toBe('Menu');
  });

  it('Settings menu exposes its expanded state, Escape closes it', () => {
    const drawer = createDrawer();
    const setting = drawer.setting;

    expect(setting.$button.getAttribute('aria-expanded')).toBe('false');
    expect(setting.$button.getAttribute('aria-controls')).toBe(setting.$menu.id);

    setting.$button.click();
    expect(setting.$button.getAttribute('aria-expanded')).toBe('true');

    key(setting.$clearCanvasButton, 'Escape');
    expect(setting.isShown()).toBe(false);
    expect(setting.$button.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(setting.$button);
  });

  it('Settings menu items expose what they do', () => {
    const drawer = createDrawer();
    const setting = drawer.setting;

    expect(setting.$clearCanvasButton.getAttribute('aria-haspopup')).toBe('dialog');
    expect(setting.$clearCanvasButton.getAttribute('aria-keyshortcuts')).toBe('Control+Delete');
    expect(setting.$clearStorageButton.getAttribute('aria-haspopup')).toBe('dialog');
    expect(setting.$toggleGridButton.getAttribute('aria-keyshortcuts')).toBe('Alt+G');
    expect(setting.$zenModeButton.getAttribute('aria-keyshortcuts')).toBe('Alt+Z');
    expect(label(setting.$githubButton)).toBe('Github (opens in a new tab)');

    // new tab, not a window named blank, without access to the page
    const open = vi.spyOn(window, 'open').mockReturnValue(null);

    setting.$githubButton.click();
    expect(open).toHaveBeenCalledWith('https://github.com/fabienwnklr/free-drawing', '_blank', 'noopener,noreferrer');
    open.mockRestore();
  });

  it('Toggles of settings and context menu expose their state', () => {
    const drawer = createDrawer();

    drawer.showGrid();
    expect(drawer.setting.$toggleGridButton.getAttribute('aria-pressed')).toBe('true');
    expect(drawer.contextMenu.$gridBtn.getAttribute('role')).toBe('menuitemcheckbox');
    expect(drawer.contextMenu.$gridBtn.getAttribute('aria-checked')).toBe('true');

    drawer.hideGrid();
    expect(drawer.setting.$toggleGridButton.getAttribute('aria-pressed')).toBe('false');
    expect(drawer.contextMenu.$gridBtn.getAttribute('aria-checked')).toBe('false');

    drawer.setting.toggleZenMode();
    expect(drawer.setting.$zenModeButton.getAttribute('aria-pressed')).toBe('true');

    drawer.setBgColor('#f8f9fa');
    const bg = drawer.setting.$bgColorBtnContainer.querySelector('[data-bg-color="#f8f9fa"]');
    expect(bg?.getAttribute('aria-pressed')).toBe('true');
    expect(label(bg)).toBe('Light gray');
  });

  it('Modal is a dialog: focus moves in, stays in, and goes back to opener', async () => {
    const drawer = createDrawer();
    const help = drawer.help;

    help.$button.focus();
    help.$button.click();
    await tick();

    expect(help.$modal.getAttribute('role')).toBe('dialog');
    expect(help.$modal.getAttribute('aria-modal')).toBe('true');
    expect(labelledBy(help.$modal)).toBe('Help');
    expect(help.$modal.contains(document.activeElement)).toBe(true);

    const focusables = Array.from(help.$modal.querySelectorAll<HTMLElement>('button, a[href]'));
    focusables[focusables.length - 1].focus();
    key(document.activeElement!, 'Tab');
    expect(document.activeElement).toBe(focusables[0]);
    key(document.activeElement!, 'Tab', { shiftKey: true });
    expect(document.activeElement).toBe(focusables[focusables.length - 1]);

    key(document.activeElement!, 'Escape');
    expect(help.isVisible()).toBe(false);
    expect(document.activeElement).toBe(help.$button);
  });

  it('Tab stays in dialogs: hidden buttons and options skipped, one stop per radio group', () => {
    const drawer = createDrawer({ collaboration: true });

    // no session: link, users and stop button hidden, start button last
    drawer.showCollaboration();
    const collaboration = drawer.collaborationModal!;
    const $close = collaboration.$modal.querySelector<HTMLElement>('[data-modal=close]')!;

    expect(collaboration.$stopButton.hidden).toBe(true);
    collaboration.$startButton.focus();
    key(document.activeElement!, 'Tab');
    expect(document.activeElement).toBe($close);
    key(document.activeElement!, 'Tab', { shiftKey: true });
    expect(document.activeElement).toBe(collaboration.$startButton);
    collaboration.hide();

    // nothing to export: buttons disabled, "selection only" hidden, checked scale is the last stop
    drawer.showExport();
    const exportModal = drawer.exportModal!;
    const [, $scale2, $scale3] = exportModal.$scales;
    const $exportClose = exportModal.$modal.querySelector<HTMLElement>('[data-modal=close]')!;

    expect(exportModal.$buttons.every(($btn) => $btn.disabled)).toBe(true);
    $scale2.focus();
    key(document.activeElement!, 'Tab');
    expect(document.activeElement).toBe($exportClose);
    key(document.activeElement!, 'Tab', { shiftKey: true });
    expect(document.activeElement).toBe($scale2);
    // other radio of the group (clicked): Tab leaves the group too
    $scale3.focus();
    key(document.activeElement!, 'Tab');
    expect(document.activeElement).toBe($exportClose);
    exportModal.hide();
  });

  it('Confirm modal is an alert dialog with real buttons, cancel focused', () => {
    const drawer = createDrawer();

    drawer.clearCanvas();
    const modal = drawer.clearConfirmModal!;

    expect(modal.$modal.getAttribute('role')).toBe('alertdialog');
    expect(labelledBy(modal.$modal)).toBe('Remove the whole drawing?');
    expect(modal.$cancelBtn).toBeInstanceOf(HTMLButtonElement);
    expect(modal.$confirmBtn).toBeInstanceOf(HTMLButtonElement);
    expect(document.activeElement).toBe(modal.$cancelBtn);

    modal.$cancelBtn.click();
    expect(modal.isVisible()).toBe(false);
    expect(document.activeElement).toBe(drawer.$drawerContainer);
  });

  it('Click out of a dialog or the settings menu keeps focus given to the page, else gives it back to the drawer', async () => {
    const drawer = createDrawer();
    const { help, setting } = drawer;
    const $field = document.createElement('input');

    document.body.append($field);
    // focus moved by the press of the click, then click hiding them
    const clickOn = ($el: HTMLElement) => {
      $el.focus();
      $el.click();
    };

    // field of the page, out of the drawer: focus kept there
    help.$button.focus();
    help.$button.click();
    await tick();
    clickOn($field);
    expect(help.isVisible()).toBe(false);
    expect(document.activeElement).toBe($field);

    setting.$button.click();
    setting.$clearCanvasButton.focus();
    clickOn($field);
    expect(setting.isShown()).toBe(false);
    expect(document.activeElement).toBe($field);

    // drawer clicked: focus back to the opener of the dialog, to the drawer for the menu
    help.$button.focus();
    help.$button.click();
    await tick();
    clickOn(drawer.$drawerContainer);
    expect(help.isVisible()).toBe(false);
    expect(document.activeElement).toBe(help.$button);

    setting.$button.click();
    setting.$clearCanvasButton.focus();
    drawer.$drawerContainer.click();
    expect(setting.isShown()).toBe(false);
    expect(document.activeElement).toBe(drawer.$drawerContainer);
    $field.remove();
  });

  it('Options of dialogs are switches, named by their label', () => {
    const drawer = createDrawer({ language: 'en' });

    drawer.showPreferences();
    drawer.showExport();

    const preferences = drawer.preferencesModal!;
    const exportModal = drawer.exportModal!;
    const switches = [
      ...preferences.$modal.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
      ...exportModal.$modal.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    ];

    expect(switches).toHaveLength(10);
    switches.forEach(($switch) => {
      expect($switch.getAttribute('role')).toBe('switch');
      expect($switch.closest('label')!.textContent!.trim()).not.toBe('');
    });
    expect(preferences.$grid.closest('label')!.textContent).toContain('Show grid');

    // still toggled as checkboxes
    preferences.$grid.click();
    expect(preferences.$grid.checked).toBe(true);
    exportModal.$background.click();
    expect(exportModal.exportOptions.background).toBe(false);
    preferences.hide();
    exportModal.hide();
  });

  it('Toasts are read in live regions kept in the page: of the drawer, of the dialog shown', () => {
    const drawer = createDrawer();
    /** Messages of a part of a live region */
    const read = ($region: Element, role: string) =>
      [...$region.querySelector(`[role="${role}"]`)!.children].map(($message) => $message.textContent);

    // in the page before the first message (a region added with its text is not always read)
    expect(drawer.$liveRegion.isConnected).toBe(true);
    vi.useFakeTimers();
    try {
      const saved = drawer.toast('Saved', 'info', 0);

      drawer.toast('Failed', 'error', 0);
      // the visible toast is not a live region: read once
      expect(saved.$toastContainer.getAttribute('role')).toBeNull();
      expect(read(drawer.$liveRegion, 'status')).toEqual(['Saved']);
      expect(read(drawer.$liveRegion, 'alert')).toEqual(['Failed']);

      // dialog shown: its own region (out of an aria-modal dialog, nothing is read)
      drawer.showPreferences();
      drawer.toast('Copied', 'info', 0);
      expect(read(drawer.preferencesModal!.$modal.querySelector('.drawer-live-region')!, 'status')).toEqual(['Copied']);
      expect(read(drawer.$liveRegion, 'status')).toEqual(['Saved']);
      drawer.preferencesModal!.hide();

      // messages removed after a while: the same message is read again
      vi.advanceTimersByTime(7000);
      expect(read(drawer.$liveRegion, 'status')).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('Context menu is a menu navigable with arrows, Escape closes it', () => {
    const drawer = createDrawer();
    const menu = drawer.contextMenu;

    menu.show();
    const items = Array.from(menu.$menu.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([hidden])'));

    expect(menu.$menu.getAttribute('role')).toBe('menu');
    // paste, insert image, snapping, grid
    expect(items.length).toBe(4);
    expect(document.activeElement).toBe(items[0]);

    key(items[0], 'ArrowDown');
    expect(document.activeElement).toBe(items[1]);

    key(items[1], 'Escape');
    expect(menu.$menu.classList.contains('show')).toBe(false);
    expect(document.activeElement).toBe(drawer.$drawerContainer);
  });
});

describe('Focus and keys of the interface', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  /** Drawer with a text selected */
  const withText = (options = {}) => {
    const drawer = createDrawer({ language: 'en', ...options });
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('hello');

    drawer.stage.fire('change');
    drawer.getWidget<SelectWidget>('selection')!.select([text]);
    return { drawer, text };
  };

  it('Arrows on a button out of a list do not move shapes; a press on the canvas gives the focus to the drawer', () => {
    const { drawer, text } = withText();
    const x = text.x();
    // undo: a button out of the toolbar and menus
    const { $btnUndo } = drawer.undoRedo;

    $btnUndo.focus();
    key($btnUndo, 'ArrowRight');
    expect(text.x()).toBe(x);
    drawer.$stageContainer.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(document.activeElement).toBe(drawer.$drawerContainer);
    key(drawer.$drawerContainer, 'ArrowRight');
    expect(text.x()).toBeGreaterThan(x);
  });

  it('Rows of the layers panel not reordered in read only; panel hidden with the focus in it: focus on its button', () => {
    const { drawer, text } = withText();
    const other = drawer.getWidget<TextWidget>('text')!.addTextNode('other');
    const panel = drawer.layersPanel!;

    drawer.stage.fire('change');
    panel.toggle(true);
    drawer.setReadOnly(true);
    const $row = panel.$list.querySelector<HTMLElement>('.drawer-layers-name')!;

    $row.focus();
    key($row, 'ArrowDown', { altKey: true });
    expect(drawer.getDrawingShapes()).toEqual([text, other]);
    drawer.setReadOnly(false);

    panel.$list.querySelector<HTMLElement>('.drawer-layers-name')!.focus();
    panel.toggle(false);
    expect(document.activeElement).toBe(panel.$button);
    // zen mode hiding it: on the drawer
    panel.toggle(true);
    panel.$list.querySelector<HTMLElement>('.drawer-layers-name')!.focus();
    drawer.layout.setZen(true);
    expect(document.activeElement).toBe(drawer.$drawerContainer);
    drawer.layout.setZen(false);
  });

  it('Buttons hidden or disabled by their own action keep the focus in the drawer', () => {
    const { drawer } = withText();
    const { $btnUndo } = drawer.undoRedo;
    const menu = drawer.selectionMenu!;

    // undo at the end of history
    $btnUndo.focus();
    $btnUndo.click();
    expect($btnUndo.disabled).toBe(true);
    expect(document.activeElement).toBe(drawer.$drawerContainer);

    // lock: unlock focused
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('locked');

    drawer.stage.fire('change');
    drawer.getWidget<SelectWidget>('selection')!.select([text]);
    menu.update();
    menu.$lockBtn.focus();
    menu.$lockBtn.click();
    menu.update();
    expect(document.activeElement).toBe(menu.$unlockBtn);
  });

  it('Escape ending a composition (input method) does not close a dialog', () => {
    const drawer = createDrawer();

    drawer.showPreferences();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', isComposing: true }));
    expect(drawer.preferencesModal!.isVisible()).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(drawer.preferencesModal!.isVisible()).toBe(false);
  });

  it('Read only without pan tool: the toolbar still reached with Tab; help without the panels not shown', () => {
    const drawer = createDrawer({ widgets: ['selection', 'brush'], layersPanel: false, language: 'en' });
    const buttons = (drawer.toolbar as unknown as { _getButtons(): HTMLButtonElement[] })._getButtons();

    drawer.setReadOnly(true);
    expect(buttons.filter(($btn) => $btn.tabIndex === 0).map(($btn) => $btn.disabled)).toEqual([false]);
    drawer.setReadOnly(false);
    expect(buttons.find(($btn) => $btn.tabIndex === 0)).toBe(drawer.toolbar.getButton(drawer.activeWidget));

    drawer.help.show();
    expect(drawer.help.$modalBody.textContent).not.toContain('Alt+L');
    drawer.help.hide();
  });

  it('Search and command palette finding nothing: read once', () => {
    const drawer = createDrawer({ language: 'en' });
    const announce = vi.spyOn(drawer, '_announce');
    const type = ($input: HTMLInputElement, value: string) => {
      $input.value = value;
      $input.dispatchEvent(new Event('input'));
    };

    drawer.search.show();
    type(drawer.search.$input, 'nothing');
    type(drawer.search.$input, 'nothing here');
    expect(announce.mock.calls.filter(([message]) => message === 'No results')).toHaveLength(1);
    drawer.search.hide();

    drawer.showCommandPalette();
    type(drawer.commandPalette!.$input, 'zzzz');
    type(drawer.commandPalette!.$input, 'zzzzz');
    expect(announce.mock.calls.filter(([message]) => message === 'No command found')).toHaveLength(1);
    drawer.commandPalette!.hide();
  });

  it('Link of a shape opened with the keyboard in read only: Enter on the shape reached, command palette', () => {
    const drawer = createDrawer({ language: 'en' });
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('site');
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);

    drawer.setShapeLink('example.com', [text]);
    drawer.stage.fire('change');
    drawer.setReadOnly(true);
    drawer.focus();
    // first shape, then its link
    key(drawer.$drawerContainer, 'Enter');
    expect(drawer.navigation.current).toBe(text);
    key(drawer.$drawerContainer, 'Enter');
    expect(open).toHaveBeenCalledWith('https://example.com/', '_blank', 'noopener,noreferrer');

    drawer.showCommandPalette();
    expect(drawer.commandPalette!.commands.map(({ id }) => id)).toContain('open link url web page');
    drawer.commandPalette!.hide();
    open.mockRestore();
  });
});
