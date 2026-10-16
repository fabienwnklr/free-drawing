import { describe, expect, it } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import { Line } from 'konva/lib/shapes/Line';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import { shapeName } from '@/constants';
import { createDrawer } from './helpers';

/** Section shown in its panel */
const shown = ($section: HTMLElement) => $section.style.display !== 'none';

describe('Selection overlay', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Mixed selection shows the options of every kind of selected shape, each one applied to its shapes', () => {
    const drawer = createDrawer({ language: 'en' });
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('hello');
    const rect = drawer.addShape(
      new Rect({ name: shapeName.rect, width: 80, height: 40, stroke: '#000', strokeWidth: 5, fill: '#a5d8ff' })
    ) as Rect;
    const stroke = drawer.addShape(
      new Line({ name: shapeName.line, points: [0, 0, 10, 10, 20, 0], fill: '#000', closed: true })
    ) as Line;
    const overlay = selectWidget.overlay;
    const title = () => overlay.$strokeColorContainer.querySelector('.title')!.textContent;

    selectWidget.select([text, rect, stroke]);
    expect(drawer.getWidget<TextWidget>('text')!.overlay.$overlayContainer.classList.contains('show')).toBe(false);
    expect(overlay.$overlayContainer.classList.contains('show')).toBe(true);
    expect(
      [
        overlay.$fillColorContainer,
        overlay.$strokeWidthContainer,
        overlay.$strokeStyleContainer,
        overlay.$edgesContainer,
        overlay.$fontFamilyContainer,
        overlay.$fontSizeContainer,
        overlay.$fontStyleContainer,
        overlay.$textAlignContainer,
      ].map(shown)
    ).toEqual([true, true, true, true, true, true, true, true]);
    // color of shapes and texts
    expect(title()).toBe('Color');
    // background of the rectangle, not of the first selected shape
    expect(overlay.$fillColorBtnContainer.querySelector('[aria-pressed="true"]')?.getAttribute('data-fill-color')).toBe(
      '#a5d8ff'
    );

    // each option changes the shapes it applies to
    const textWidth = text.strokeWidth();

    drawer.setTextStyle({ fontSize: 32 });
    drawer.setFillColor('#ffc9c9');
    drawer.setStrokeWidth(8);
    expect(text.fontSize()).toBe(32);
    expect([rect.fill(), stroke.fill()]).toEqual(['#ffc9c9', '#000']);
    expect([rect.strokeWidth(), text.strokeWidth()]).toEqual([8, textWidth]);

    // without texts: no text fields, stroke color
    selectWidget.select([rect, stroke]);
    expect(shown(overlay.$fontFamilyContainer)).toBe(false);
    expect(title()).toBe('Stroke');

    // texts only: text panel
    selectWidget.select([text]);
    expect(drawer.getWidget<TextWidget>('text')!.overlay.$overlayContainer.classList.contains('show')).toBe(true);
    expect(overlay.$overlayContainer.classList.contains('show')).toBe(false);
  });
});
