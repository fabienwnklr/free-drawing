import { describe, expect, it, beforeAll } from 'vitest';
import { Drawer } from '../src/Drawer';
import type { TextWidget } from '../src/components/toolbar/widgets/Text/Text';
import type { SelectWidget } from '../src/components/toolbar/widgets/Select/Select';

beforeAll(() => {
  function noOp() {}

  if (typeof window.URL.createObjectURL === 'undefined') {
    Object.defineProperty(window.URL, 'createObjectURL', { value: noOp });
  }
});

describe('Use drawer api', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('setBgColor', () => {
    const drawer = new Drawer(document.getElementById('test') as HTMLDivElement);

    expect(drawer.background.fill()).toBe('#fff');

    drawer.setBgColor('#3ee551');

    expect(drawer.background.fill()).toBe('#3ee551');
  });

  it('setColor', () => {
    const drawer = new Drawer(document.getElementById('test') as HTMLDivElement);

    expect(drawer.options.strokeColor).toBe(drawer.options.strokeColor);

    drawer.setStrokeColor('#2f9e44');

    expect(drawer.options.strokeColor).toBe('#2f9e44');

    // TODO: Write test button color width data-stroke-color=#2f9e44 on brush overlay is active
    // (same for width style and opacity)
  });

  it('setTextStyle', () => {
    const drawer = new Drawer(document.getElementById('test') as HTMLDivElement);

    drawer.setTextStyle({ fontSize: 24, fontStyle: 'italic bold' });

    expect(drawer.options.textStyle.fontSize).toBe(24);
    expect(drawer.options.textStyle.fontStyle).toBe('italic bold');
    // other keys are kept
    expect(drawer.options.textStyle.align).toBe('left');

    const textOverlay = drawer.getWidget<TextWidget>('text')?.overlay;
    const $activeStyles = textOverlay?.$fontStyleBtnContainer.querySelectorAll('.active');

    expect(textOverlay?.$fontSizeBtnContainer.querySelector('.active')?.getAttribute('data-font-size')).toBe('24');
    expect($activeStyles?.length).toBe(2);
  });

  it('setTextStyle on selected text', () => {
    const drawer = new Drawer(document.getElementById('test') as HTMLDivElement, { autoSave: false });
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('Hello world');

    drawer.getWidget<SelectWidget>('selection')!.transformer.nodes([text]);
    drawer.setTextStyle({ fontFamily: 'Arial', fontSize: 32, textDecoration: 'underline', align: 'center' });

    expect(text.fontFamily()).toBe('Arial');
    expect(text.fontSize()).toBe(32);
    expect(text.textDecoration()).toBe('underline');
    expect(text.align()).toBe('center');
  });

  it('setTextStyle keeps width given to text box, scaled with font size', () => {
    const drawer = new Drawer(document.getElementById('test') as HTMLDivElement, { autoSave: false });
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('Hello world');

    drawer.getWidget<SelectWidget>('selection')!.transformer.nodes([text]);
    // resized wider than its content with side anchors
    text.width(400);

    drawer.setTextStyle({ fontStyle: 'bold' });
    drawer.setTextStyle({ fontFamily: 'Arial' });
    expect(text.width()).toBe(400);

    // same line breaks with a twice bigger font
    drawer.setTextStyle({ fontSize: text.fontSize() * 2 });
    expect(text.width()).toBe(800);
  });


});
