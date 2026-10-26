import { describe, expect, it } from 'vitest';
import type { Rect } from 'konva/lib/shapes/Rect';
import type { Text } from 'konva/lib/shapes/Text';
import type { Drawer } from '@/Drawer';
import type { NoteWidget } from '@/components/toolbar/widgets/Note/Note';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { fillShapes, shapeName } from '@/constants';
import { getBoundText } from '@/utils/boundText';
import { parseDrawingFile } from '@/utils/drawingFile';
import { getExportBox, renderSvg } from '@/utils/export';
import { isNote, noteSize } from '@/utils/note';
import { createDrawer, fireMouse } from './helpers';

/**
 * Text written in the textarea of the edited text, validated with Enter
 * @param value Text written
 */
const write = (value: string) => {
  const textarea = document.querySelector<HTMLTextAreaElement>('.drawer-text-editor')!;

  textarea.value = value;
  textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter' }));
};

/** Notes of the drawing */
const notes = (drawer: Drawer) => drawer.drawLayer.find<Rect>(isNote);

/** Click of the active tool at a point of the drawing */
const click = (drawer: Drawer, x: number, y: number) => {
  fireMouse(drawer, 'mousedown', x, y);
  fireMouse(drawer, 'mouseup', x, y);
  fireMouse(drawer, 'click', x, y);
};

describe('Sticky notes', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('A click of the note tool adds a note there and writes in it, then the note is selected', () => {
    const drawer = createDrawer({ keepTool: false });
    const tool = drawer.getWidget<NoteWidget>('note')!;

    tool.setActive(true);
    click(drawer, 300, 200);

    const [note] = notes(drawer);

    // square of the note color centered on the click, a rectangle too
    expect(note.attrs).toMatchObject({ x: 200, y: 100, width: noteSize, height: noteSize, fill: '#ffec99' });
    expect(note.hasName(shapeName.rect)).toBe(true);
    expect(fillShapes.some((name) => note.hasName(name))).toBe(true);
    // shadow drawn by its own function, not saved
    expect(note.sceneFunc()).toBeTypeOf('function');
    expect(JSON.stringify(note.toObject())).not.toContain('shadow');
    expect(drawer.getShapeLabel(note)).toBe('Note');

    write('Call Alice');
    expect(getBoundText(note, drawer.drawLayer)?.text()).toBe('Call Alice');
    expect(drawer.activeTool).toBe('selection');
    expect(drawer.getSelectedShapes()).toContain(note);
    drawer.getWidget<SelectWidget>('selection')!.clearSelection();
  });

  it('A click on a note writes in it, the press ending an edit adds no note with the tool kept', async () => {
    const drawer = createDrawer({ keepTool: true });
    const tool = drawer.getWidget<NoteWidget>('note')!;

    tool.setActive(true);
    click(drawer, 300, 200);
    write('First');
    expect(drawer.activeTool).toBe('note');

    // click on the note: its text edited, no new note
    const [note] = notes(drawer);

    fireMouse(drawer, 'mousedown', 300, 200);
    note.fire('click', { evt: { button: 0 } }, true);
    expect((document.querySelector('.drawer-text-editor') as HTMLTextAreaElement).value).toBe('First');
    await new Promise((resolve) => setTimeout(resolve));
    // a press elsewhere validates it, its click adds no note
    drawer.stage.content.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    click(drawer, 600, 500);
    expect(notes(drawer)).toHaveLength(1);
    // next click: a new note
    click(drawer, 600, 500);
    expect(notes(drawer)).toHaveLength(2);
    write('');
    // empty note kept, without text
    expect(notes(drawer)).toHaveLength(2);
    expect(getBoundText(notes(drawer)[1], drawer.drawLayer)).toBeNull();
  });

  it('Notes take the color chosen in the panel of the tool, and grow with their text', () => {
    const drawer = createDrawer({ keepTool: true });
    const tool = drawer.getWidget<NoteWidget>('note')!;

    tool.setActive(true);
    tool.overlay.$overlayContainer.querySelector<HTMLButtonElement>('[data-note-color="#a5d8ff"]')!.click();
    expect(tool.color).toBe('#a5d8ff');
    click(drawer, 300, 300);
    write(Array.from({ length: 12 }, (_, i) => `Line ${i}`).join('\n'));

    const [note] = notes(drawer);
    const text = getBoundText(note, drawer.drawLayer) as Text;

    expect(note.fill()).toBe('#a5d8ff');
    // taller for its text, top kept
    expect(note.height()).toBeGreaterThan(noteSize);
    expect(note.height()).toBeGreaterThanOrEqual(text.height() + 32);
    expect(note.y()).toBe(200);
    // never shorter than it was
    text.text('Short');
    drawer.stage.fire('change');
    expect(note.height()).toBeGreaterThan(noteSize);
  });

  it('Notes kept by files and exported with their shadow', () => {
    const drawer = createDrawer();
    const note = drawer.getWidget<NoteWidget>('note')!.addNote({ x: 100, y: 100 });
    const file = parseDrawingFile(JSON.stringify(drawer.getDrawingFile()));

    expect(file.shapes[0].attrs).toMatchObject({ name: 'drawer-rect drawer-note', fill: '#ffec99' });
    drawer.loadDrawing(file);
    expect(notes(drawer)[0].sceneFunc()).toBeTypeOf('function');

    const shapes = drawer.getExportShapes(false);
    const svg = renderSvg(shapes, getExportBox(shapes, drawer.drawLayer)!, { background: '#fff' });

    expect(svg).toMatch(/<rect [^>]*fill="#ffec99"[^>]*filter="drop-shadow\(/);
    expect(note.id()).toBeTruthy();
  });
});
