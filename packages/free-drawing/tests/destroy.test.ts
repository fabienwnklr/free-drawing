import { afterEach, describe, expect, it, vi } from 'vitest';
import { stages } from 'konva/lib/Stage';
import { Plugin } from '@/plugins/Plugin';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import { createDrawer } from './helpers';

const tick = () => new Promise((resolve) => setTimeout(resolve));

/** Plugin telling it was destroyed */
class WatcherPlugin extends Plugin {
  static pluginName = 'watcher';
  /** `destroy` called */
  destroyed = false;

  /**
   * Destroyed with the drawer
   * @returns Listeners of the plugin removed
   */
  destroy() {
    this.destroyed = true;
    return super.destroy();
  }
}

describe('Destroy', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Listeners of the page added by the drawer are removed with it (signal of the drawer)', async () => {
    const added: string[] = [];

    for (const target of [window, document] as EventTarget[]) {
      const add = target.addEventListener.bind(target);

      vi.spyOn(target, 'addEventListener').mockImplementation((type, listener, options) => {
        // window listeners of konva: one set for every stage of the window
        if (new Error().stack?.includes('node_modules/konva')) return add(type, listener, options);
        added.push(type);
        // every listener of the page goes with the drawer
        expect((options as AddEventListenerOptions | undefined)?.signal, type).toBeInstanceOf(AbortSignal);
        add(type, listener, options);
      });
    }

    const drawer = createDrawer({ collaboration: true });
    const signals = new Set<AbortSignal>();

    for (const target of [window, document]) {
      for (const [, , options] of (target.addEventListener as unknown as { mock: { calls: unknown[][] } }).mock.calls) {
        const signal = (options as AddEventListenerOptions | undefined)?.signal;

        if (signal) signals.add(signal);
      }
    }
    // dialogs, menus and text edition shown: their listeners too
    drawer.showPreferences();
    await tick();
    drawer.preferencesModal!.hide();
    drawer.setting.show();
    drawer.setting.hide();
    drawer.getWidget<TextWidget>('text')!.editTextNode(drawer.getWidget<TextWidget>('text')!.addTextNode('edited'));
    await tick();

    expect(added).toEqual(
      expect.arrayContaining(['beforeunload', 'paste', 'click', 'resize', 'keydown', 'pointerdown'])
    );
    expect([...signals]).toEqual([drawer.signal]);
    await drawer.destroy();
    expect(drawer.signal.aborted).toBe(true);
  });

  it('Destroyed: plugins destroyed, tool deactivated, stage destroyed, element emptied, page events ignored', async () => {
    const drawer = createDrawer({ plugins: [WatcherPlugin] });
    const $el = drawer.$el;
    const watcher = drawer.plugins.get(WatcherPlugin)!;
    const brush = drawer.getWidget<BaseWidget>('brush')!;
    const paste = vi.fn();

    brush.setActive(true);
    drawer.on('change', paste);
    await drawer.destroy();

    expect(watcher.destroyed).toBe(true);
    expect(brush.$button.getAttribute('aria-pressed')).toBe('false');
    expect($el.children).toHaveLength(0);
    expect(stages).not.toContain(drawer.stage);

    // text pasted in the page: not added to a removed drawer
    const event = new Event('paste', { bubbles: true });

    Object.defineProperty(event, 'clipboardData', { value: { getData: () => 'pasted' } });
    document.dispatchEvent(event);
    expect(paste).not.toHaveBeenCalled();
    // twice: nothing more
    await drawer.destroy();
  });
});
