import { describe, expect, it, vi } from 'vitest';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import type { DrawerStorage } from '@/@types/drawer';
import type { DrawingFile } from '@/@types/file';
import { createDrawer, fireMouse } from './helpers';

const { io } = vi.hoisted(() => ({ io: vi.fn(() => ({})) }));

vi.mock('socket.io-client', () => ({ io }));

/** Pending promises and timers done */
const flush = () => new Promise((resolve) => setTimeout(resolve));

const texts = (drawer: ReturnType<typeof createDrawer>) => drawer.getDrawingShapes().map((shape) => shape.attrs.text);

const addText = (drawer: ReturnType<typeof createDrawer>, text: string) => {
  drawer.getWidget<TextWidget>('text')!.addTextNode(text);
  drawer.stage.fire('change');
};

const toasts = (drawer: ReturnType<typeof createDrawer>) =>
  [...drawer.$drawerContainer.querySelectorAll('.drawer-toast')].map(($toast) => $toast.textContent?.trim());

/** Drawing file with given texts */
const fileWith = (...values: string[]): DrawingFile => {
  const source = createDrawer();

  for (const value of values) addText(source, value);
  return source.getDrawingFile();
};

describe('Integration in an app', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Storage option loads drawing on init, then saves it on each change', async () => {
    const storage = { load: vi.fn(async () => fileWith('stored')), save: vi.fn() };
    const drawer = createDrawer({ autoSave: true, storage, language: 'en' });

    // loading
    expect(texts(drawer)).toEqual([]);
    expect(drawer.$drawerContainer.getAttribute('aria-busy')).toBe('true');

    await drawer.ready;
    expect(texts(drawer)).toEqual(['stored']);
    expect(drawer.$drawerContainer.hasAttribute('aria-busy')).toBe(false);
    // history starts from loaded drawing, not saved again, nothing in localStorage
    expect(drawer.undoRedo.canUndo()).toBe(false);
    expect(storage.save).not.toHaveBeenCalled();
    expect(localStorage.getItem(drawer.options.localStorageKey)).toBeNull();

    addText(drawer, 'new');
    await flush();
    expect(storage.save).toHaveBeenCalledTimes(1);
    expect((storage.save.mock.calls[0] as unknown as [DrawingFile])[0].shapes).toHaveLength(2);
    // given object kept (methods of a class instance)
    expect(drawer.options.storage).toBe(storage);
  });

  it('Storage: nothing saved before drawing is loaded, one save at a time, last drawing saved after', async () => {
    let load: (file: DrawingFile | null) => void = () => {};
    const ends: (() => void)[] = [];
    const storage: DrawerStorage = {
      load: () => new Promise((resolve) => (load = resolve)),
      save: vi.fn(() => new Promise<void>((resolve) => ends.push(resolve))),
    };
    const drawer = createDrawer({ autoSave: true, storage });

    addText(drawer, 'before load');
    expect(storage.save).not.toHaveBeenCalled();

    // nothing stored: drawing kept
    load(null);
    await drawer.ready;
    expect(texts(drawer)).toEqual(['before load']);

    addText(drawer, 'a');
    addText(drawer, 'b');
    addText(drawer, 'c');
    expect(storage.save).toHaveBeenCalledTimes(1);

    ends[0]();
    await flush();
    // changes made meanwhile saved once, with last drawing
    expect(storage.save).toHaveBeenCalledTimes(2);
    expect(vi.mocked(storage.save).mock.calls[1][0].shapes).toHaveLength(4);
    ends[1]();
    await flush();
    expect(storage.save).toHaveBeenCalledTimes(2);
  });

  it('Storage errors: load failure stops saving until loaded again, save failure shown once', async () => {
    const storage = {
      load: vi.fn<() => Promise<DrawingFile | null>>(() => Promise.reject(new Error('offline'))),
      save: vi.fn(() => Promise.reject(new Error('server down'))),
    };
    const drawer = createDrawer({ autoSave: true, storage, language: 'en' });

    await expect(drawer.ready).rejects.toThrow('offline');
    expect(toasts(drawer)).toEqual(["Drawing can't be loaded: offline"]);
    // stored drawing not replaced
    addText(drawer, 'a');
    await flush();
    expect(storage.save).not.toHaveBeenCalled();

    storage.load.mockResolvedValue(fileWith('stored'));
    await drawer.loadFromStorage();
    expect(texts(drawer)).toEqual(['stored']);

    addText(drawer, 'b');
    await flush();
    addText(drawer, 'c');
    await flush();
    expect(storage.save).toHaveBeenCalledTimes(2);
    expect(toasts(drawer).filter((text) => text?.startsWith("Drawing can't be saved"))).toEqual([
      "Drawing can't be saved: server down",
    ]);
  });

  it('Storage: drawer removed during a save or a load saves nothing more, only the last load started is applied', async () => {
    const ends: (() => void)[] = [];
    const loads: ((file: DrawingFile | null) => void)[] = [];
    const storage: DrawerStorage = {
      load: vi.fn(() => new Promise<DrawingFile | null>((resolve) => loads.push(resolve))),
      save: vi.fn(() => new Promise<void>((resolve) => ends.push(resolve))),
    };
    const drawer = createDrawer({ autoSave: true, storage });

    loads[0](fileWith('stored'));
    await drawer.ready;
    addText(drawer, 'a');
    addText(drawer, 'b');
    expect(storage.save).toHaveBeenCalledTimes(1);

    // removed during the save: the changes made meanwhile are not saved from its emptied stage
    await drawer.destroy();
    ends[0]();
    await flush();
    expect(storage.save).toHaveBeenCalledTimes(1);
    expect(vi.mocked(storage.save).mock.calls[0][0].shapes).toHaveLength(2);

    // loads of an app switching drawings: the slower first one is outdated
    const other = createDrawer({ autoSave: true, storage });

    loads[1](fileWith('first'));
    await other.ready;
    const first = other.loadFromStorage();
    const second = other.loadFromStorage();

    loads[3](fileWith('second'));
    await second;
    loads[2](fileWith('outdated'));
    await first;
    expect(texts(other)).toEqual(['second']);
    expect(other.$drawerContainer.hasAttribute('aria-busy')).toBe(false);

    // removed while loading: nothing loaded nor saved
    const saves = vi.mocked(storage.save).mock.calls.length;
    const third = other.loadFromStorage();

    await other.destroy();
    loads[4](fileWith('late'));
    await third;
    await flush();
    expect(storage.save).toHaveBeenCalledTimes(saves);
  });

  it('Save running when another drawing is loaded: changes made meanwhile not saved into the other one', async () => {
    const ends: (() => void)[] = [];
    const targets: string[] = [];
    let target = 'first';
    const storage: DrawerStorage = {
      load: vi.fn(async () => fileWith(target)),
      save: vi.fn(() => {
        targets.push(target);
        return new Promise<void>((resolve) => ends.push(resolve));
      }),
    };
    const drawer = createDrawer({ autoSave: true, storage });

    await drawer.ready;
    addText(drawer, 'a');
    // during the save
    addText(drawer, 'b');
    // the app opens another drawing
    target = 'second';
    const load = drawer.loadFromStorage();

    ends[0]();
    await load;
    await flush();
    expect(targets).toEqual(['first']);
    expect(texts(drawer)).toEqual(['second']);
    expect(drawer.hasUnsavedChanges()).toBe(false);
  });

  it('Save of the previous drawing running once another one is loaded: changes of the loaded one saved after it', async () => {
    const ends: (() => void)[] = [];
    const targets: string[] = [];
    let target = 'first';
    const storage: DrawerStorage = {
      load: vi.fn(async () => fileWith(target)),
      save: vi.fn(() => {
        targets.push(target);
        return new Promise<void>((resolve) => ends.push(resolve));
      }),
    };
    const drawer = createDrawer({ autoSave: true, storage });

    await drawer.ready;
    addText(drawer, 'a');
    target = 'second';
    await drawer.loadFromStorage();
    // changed during the save of the first drawing
    addText(drawer, 'b');
    ends[0]();
    await flush();
    expect(targets).toEqual(['first', 'second']);
    expect(vi.mocked(storage.save).mock.calls[1][0].shapes.map((shape) => shape.attrs.text)).toEqual(['second', 'b']);
    ends[1]();
    await flush();
    expect(drawer.hasUnsavedChanges()).toBe(false);
  });

  it('Changes made while a drawing is loading kept over the loaded drawing (one change), a stroke ended first', async () => {
    let load: (file: DrawingFile | null) => void = () => {};
    const storage: DrawerStorage = {
      load: () => new Promise((resolve) => (load = resolve)),
      save: vi.fn(async () => {}),
    };
    const drawer = createDrawer({ autoSave: true, storage });

    load(fileWith('stored'));
    await drawer.ready;

    // loaded again (changed elsewhere), slow download
    const reload = drawer.loadFromStorage();

    addText(drawer, 'meanwhile');
    load(fileWith('stored', 'elsewhere'));
    await reload;
    expect(texts(drawer)).toEqual(['stored', 'elsewhere', 'meanwhile']);
    await flush();
    expect(vi.mocked(storage.save).mock.lastCall![0].shapes).toHaveLength(3);
    expect(drawer.hasUnsavedChanges()).toBe(false);
    drawer.undoRedo.undo();
    expect(texts(drawer)).toEqual(['stored', 'elsewhere']);

    // loaded during a stroke: applied once it ends, the stroke kept
    const again = drawer.loadFromStorage();

    drawer.getWidget<BaseWidget>('brush')!.setActive(true);
    fireMouse(drawer, 'mousedown', 10, 10);
    load(fileWith('third'));
    await flush();
    expect(texts(drawer)).toEqual(['stored', 'elsewhere', undefined]);
    fireMouse(drawer, 'mousemove', 50, 50);
    fireMouse(drawer, 'mouseup', 50, 50);
    await again;
    expect(drawer.getDrawingShapes().map((shape) => shape.attrs.text ?? shape.getClassName())).toEqual([
      'third',
      'Line',
    ]);
  });

  it('Toast message is shown as text (error messages of a server)', () => {
    const { $toastContainer } = createDrawer().toast('<img src=x onerror=alert(1)>', 'error', 0);

    expect($toastContainer.querySelector('img')).toBeNull();
    expect($toastContainer.textContent).toContain('<img src=x onerror=alert(1)>');
    // icon kept
    expect($toastContainer.querySelector('svg')).not.toBeNull();
  });

  it('User option gives id and name of collaboration sessions, setUser on login or logout', () => {
    const drawer = createDrawer({ user: { id: 'user-1', name: 'Ada' } });

    expect(drawer.user).toEqual({ id: 'user-1', name: 'Ada' });
    expect(drawer.getUserId()).toBe('user-1');
    expect(drawer.getUserName()).toBe('Ada');
    expect(drawer.getCollaborationLink('room')).toContain('&by=user-1');

    // changed in dialog for this visit
    drawer.setUserName('Ada L.');
    expect(drawer.getUserName()).toBe('Ada L.');

    drawer.setUser({ id: 'user-2', name: 'Grace' });
    expect(drawer.getUserId()).toBe('user-2');
    expect(drawer.getUserName()).toBe('Grace');

    // anonymous: id and name kept in browser
    drawer.setUser(null);
    expect(drawer.getUserId()).not.toBe('user-2');
    expect(drawer.getUserId()).toBe(drawer.getUserId());
    expect(drawer.getUserName()).toBe('Ada L.');
  });

  it('Preferences: read, applied together, one event for several changes', async () => {
    const drawer = createDrawer({ language: 'en' });
    const onChange = vi.fn();

    // tests drawers do not save on each change
    expect(drawer.getPreferences()).toEqual({
      theme: 'light',
      language: 'en',
      grid: false,
      snapping: false,
      zen: false,
      autoSave: false,
      keepTool: true,
      shapeRecognition: false,
      gridStyle: 'squares',
      wheelAction: 'zoom',
    });
    drawer.on('preferences.change', onChange);

    drawer.setPreferences({ theme: 'dark', language: 'fr', grid: true });
    await Promise.resolve();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      theme: 'dark',
      language: 'fr',
      grid: true,
      snapping: false,
      zen: false,
      autoSave: false,
      keepTool: true,
      shapeRecognition: false,
      gridStyle: 'squares',
      wheelAction: 'zoom',
    });
    expect(drawer.isDarkMode()).toBe(true);
    expect(drawer.language).toBe('fr');
    expect(drawer.grid).toBe(true);

    // from interface: snapping hides grid
    drawer.setting.toggleSnapping();
    await Promise.resolve();
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith({
      theme: 'dark',
      language: 'fr',
      grid: false,
      snapping: true,
      zen: false,
      autoSave: false,
      keepTool: true,
      shapeRecognition: false,
      gridStyle: 'squares',
      wheelAction: 'zoom',
    });

    // same values: no event
    drawer.setPreferences({ theme: 'dark', snapping: true });
    drawer.setTheme('dark');
    await Promise.resolve();
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('Collaboration options give server url and data read by server on connection', async () => {
    const auth = { token: 'secret' };
    const createSocket = (drawer: ReturnType<typeof createDrawer>) =>
      (drawer as unknown as { _createSocket(): Promise<unknown> })._createSocket();

    await createSocket(createDrawer({ collaboration: { url: 'https://draw.example', auth } }));
    expect(io).toHaveBeenLastCalledWith('https://draw.example', { forceNew: true, auth });

    // page origin
    await createSocket(createDrawer({ collaboration: { auth } }));
    expect(io).toHaveBeenLastCalledWith({ forceNew: true, auth });
    await createSocket(createDrawer({ collaboration: 'https://other.example' }));
    expect(io).toHaveBeenLastCalledWith('https://other.example', { forceNew: true });
  });

  it('Dialog of a drawer removed from page does not take keys of page anymore', () => {
    const drawer = createDrawer();
    const $input = document.createElement('input');
    const onKeydown = vi.fn();

    drawer.help.show();
    // view of app changed
    drawer.$el.replaceChildren();
    document.body.append($input);
    $input.addEventListener('keydown', onKeydown);

    $input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(onKeydown).toHaveBeenCalledTimes(1);
    expect($input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }))).toBe(
      true
    );
    $input.remove();
  });
});
