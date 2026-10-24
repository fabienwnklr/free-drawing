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
});
