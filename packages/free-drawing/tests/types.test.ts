import { describe, expect, it } from 'vitest';
import { Group } from 'konva/lib/Group';
// as an app imports them from the package: checked by the type check of the tests
import type {
  ConfirmModal,
  DrawerLayout,
  Frame,
  History,
  I18n,
  MicroEvent,
  Toast,
  Toolbar,
  TouchGestures,
  UndoRedo,
} from '@/index';
import { createFrame } from '@/utils/frame';
import { createDrawer } from './helpers';

// event of a plugin added to the events of the drawer (declaration merging), as a plugin does with the package
declare module '@/index' {
  interface DrawerEventMap {
    'stamps.count': [count: number];
  }
}

describe('Types of the public API', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Classes of members and results of the drawer exported as types', () => {
    const drawer = createDrawer();
    const events: MicroEvent = drawer;
    const layout: DrawerLayout = drawer.layout;
    const i18n: I18n = drawer.i18n;
    const toolbar: Toolbar = drawer.toolbar;
    const gestures: TouchGestures = drawer.gestures;
    const undoRedo: UndoRedo = drawer.undoRedo;
    // undo / redo buttons of the history
    const history: History = drawer.undoRedo;
    const toast: Toast = drawer.toast('Saved', 'info', 0);
    const frame: Frame = createFrame({ x: 0, y: 0, width: 100, height: 100, label: 'Frame' });
    const confirm: ConfirmModal | null = drawer.clearConfirmModal;

    expect([events, layout, i18n, toolbar, gestures, undoRedo, history, toast]).not.toContain(undefined);
    expect(frame).toBeInstanceOf(Group);
    expect(confirm).toBeNull();
    toast.destroy();
  });

  it('Events typed: listeners get their arguments, unknown names and other listeners are errors, events of plugins added', () => {
    const drawer = createDrawer();
    const seen: unknown[] = [];

    drawer.on('drawer.readonly.change', (readOnly) => seen.push(readOnly === true));
    drawer.on('drawer.selection.change', (shapes) => seen.push(shapes.length));
    drawer.on('stamps.count', (count) => seen.push(count + 1));
    drawer.setReadOnly(true);
    drawer.trigger('stamps.count', 2);
    // selection cleared first by read only
    expect(seen).toEqual([0, true, 3]);

    // @ts-expect-error unknown event
    drawer.on('drawer.unknown', () => {});
    // @ts-expect-error listener of other arguments
    drawer.on('drawer.readonly.change', (readOnly: string) => readOnly);
    // @ts-expect-error arguments of another event
    drawer.trigger('stamps.count', 'two');
    drawer.off('drawer.unknown' as 'drawer.change');
  });
});
