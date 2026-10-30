import { describe, expect, it, vi } from 'vitest';
import type { Group } from 'konva/lib/Group';
import { Text } from 'konva/lib/shapes/Text';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import { replayName } from '@/components/Replay/Replay';
import { getExportBox, renderCanvas, renderSvg } from '@/utils/export';
import { createFrame, getFrameTitle } from '@/utils/frame';
import { cssFontFamily, getContentWidth } from '@/utils/text';
import { createDrawer } from './helpers';

describe('Font of the library', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Font families read by the browser: Ubuntu is the font of the library, then an installed Ubuntu', () => {
    expect(cssFontFamily('Ubuntu')).toBe('free-drawing-ubuntu, Ubuntu');
    expect(cssFontFamily("'Ubuntu', Arial")).toBe('free-drawing-ubuntu, Ubuntu, Arial');
    expect(cssFontFamily('Times New Roman, serif')).toBe('"Times New Roman", serif');
    expect(cssFontFamily('Georgia')).toBe('Georgia');
  });

  it('Texts drawn, measured, edited, replayed and exported with the font of the library, Ubuntu kept in drawings', () => {
    const drawer = createDrawer();
    const textWidget = drawer.getWidget<TextWidget>('text')!;
    const added = textWidget.addTextNode('hello');
    const frame = drawer.addShape(createFrame({ x: 0, y: 200, width: 200, height: 100, label: 'Plan' }));

    for (const node of [added, getFrameTitle(frame)]) {
      expect(node.fontFamily()).toBe('Ubuntu');
      expect(node._getContextFont()).toMatch(/px free-drawing-ubuntu, Ubuntu$/);
    }
    // not in drawings: Ubuntu
    expect(JSON.stringify(drawer.getDrawingFile())).not.toContain('free-drawing-ubuntu');

    // loaded again (files, history, collaboration)
    drawer.loadDrawing(drawer.getDrawingFile());
    const text = drawer.drawLayer.findOne<Text>(`#${added.id()}`)!;

    expect(text._getContextFont()).toContain('free-drawing-ubuntu');
    expect(getContentWidth(text)).toBe(text.width());

    // field of an edit
    textWidget.editTextNode(text);
    const editor = document.querySelector<HTMLTextAreaElement>('.drawer-text-editor')!;

    expect(editor.style.fontFamily).toContain('free-drawing-ubuntu');
    editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    // copies of the replay and of exports (konva clones)
    expect(drawer.replay.start()).toBe(true);
    const copies = drawer.selectionLayer.findOne<Group>(`.${replayName}`)!.find<Text>('Text');

    expect(copies.length).toBeGreaterThan(0);
    for (const copy of copies) expect(copy._getContextFont()).toContain('free-drawing-ubuntu');
    drawer.replay.stop();

    const box = getExportBox([text], drawer.drawLayer)!;

    // fonts of the texts drawn
    const drawn: string[] = [];
    const sceneFunc = vi.spyOn(Text.prototype, '_sceneFunc').mockImplementation(function (this: Text) {
      drawn.push(this._getContextFont());
    });

    renderCanvas([text], box);
    sceneFunc.mockRestore();
    expect(drawn).toEqual([expect.stringContaining('free-drawing-ubuntu')]);
    // svg: an installed Ubuntu out of the page
    expect(renderSvg([text], box)).toContain('font-family="free-drawing-ubuntu, Ubuntu, sans-serif"');
  });

  it('Pasted text as wide as its longest line in the font of the library: lines not wrapped', () => {
    const drawer = createDrawer();
    // the font of the library wider than a fallback one (jsdom: same width whatever the font)
    const charWidth = (text: Text) => (text._getContextFont().includes('free-drawing-ubuntu') ? 10 : 6);
    const { measureSize } = Text.prototype;
    const lineWidth = vi
      .spyOn(Text.prototype as unknown as { _getTextWidth: (text: string) => number }, '_getTextWidth')
      .mockImplementation(function (this: Text, line: string) {
        return line.length * charWidth(this);
      });
    const size = vi.spyOn(Text.prototype, 'measureSize').mockImplementation(function (this: Text, line: string) {
      return { ...measureSize.call(this, line), width: line.length * charWidth(this) };
    });
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('hello world\nhi');

    lineWidth.mockRestore();
    size.mockRestore();
    expect(text.width()).toBe(110);
    expect(text.textArr.map(({ text }) => text)).toEqual(['hello world', 'hi']);
  });
});
