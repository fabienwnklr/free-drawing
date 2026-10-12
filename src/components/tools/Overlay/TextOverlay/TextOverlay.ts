import type { Drawer } from '@/Drawer';
import type { TextStyle } from '@/@types/drawer';
import { Shape, ShapeConfig } from 'konva/lib/Shape';
import { Group } from 'konva/lib/Group';
import { Text } from 'konva/lib/shapes/Text';
import { BaseOverlay } from '../BaseOverlay';
import { dataAttributes } from '@/constants';
import AlignLeftIcon from '@/icons/align-left.svg?raw';
import AlignCenterIcon from '@/icons/align-center.svg?raw';
import AlignRightIcon from '@/icons/align-right.svg?raw';
import './text-overlay.scss';

const fontFamilies = ['Ubuntu', 'Arial', 'Verdana', 'Georgia', 'Times New Roman', 'Courier New', 'Comic Sans MS'];

const fontSizes = [
  { label: 'S', value: 12 },
  { label: 'M', value: 16 },
  { label: 'L', value: 24 },
  { label: 'XL', value: 32 },
];

const fontStyles = [
  { label: 'B', title: 'Bold', attr: dataAttributes.fontStyle, value: 'bold' },
  { label: 'I', title: 'Italic', attr: dataAttributes.fontStyle, value: 'italic' },
  { label: 'U', title: 'Underline', attr: dataAttributes.textDecoration, value: 'underline' },
  { label: 'S', title: 'Strikethrough', attr: dataAttributes.textDecoration, value: 'line-through' },
];

const textAligns: { icon: string; title: string; value: TextStyle['align'] }[] = [
  { icon: AlignLeftIcon, title: 'Align left', value: 'left' },
  { icon: AlignCenterIcon, title: 'Align center', value: 'center' },
  { icon: AlignRightIcon, title: 'Align right', value: 'right' },
];

/**
 * Text tool (font family, size, style, align) with common tool (color, opacity)
 */
export class TextOverlay extends BaseOverlay {
  $fontFamilyContainer!: HTMLDivElement;
  $fontFamilySelect!: HTMLSelectElement;

  $fontSizeContainer!: HTMLDivElement;
  $fontSizeBtnContainer!: HTMLDivElement;

  $fontStyleContainer!: HTMLDivElement;
  $fontStyleBtnContainer!: HTMLDivElement;

  $textAlignContainer!: HTMLDivElement;
  $textAlignBtnContainer!: HTMLDivElement;

  constructor(drawer: Drawer) {
    super(drawer, { widthBtns: false, colorTitle: 'Color' });
    this.$overlayContainer.classList.add('drawer-text-overlay');

    this._createFontFamilyField();
    this._createFontSizeFields();
    this._createFontStyleFields();
    this._createTextAlignFields();

    // Text fields go between color and opacity
    this.$opacityContainer.before(
      this.$fontFamilyContainer,
      this.$fontSizeContainer,
      this.$fontStyleContainer,
      this.$textAlignContainer
    );
  }

  private _createSection(title: string) {
    const $container = document.createElement('div');
    $container.classList.add(this.selectors.container);

    const $title = document.createElement('h6');
    $title.classList.add('title');
    $title.innerText = title;

    const $btnContainer = document.createElement('div');
    $btnContainer.classList.add(this.selectors.buttonContainer);

    $container.append($title, $btnContainer);

    return { $container, $btnContainer };
  }

  private _createButton(content: string, attr: string, value: string, title?: string) {
    const $btn = document.createElement('button');

    $btn.innerHTML = content;
    $btn.setAttribute(attr, value);
    $btn.classList.add('drawer-button', this.selectors.button);
    if (title) $btn.title = title;

    return $btn;
  }

  private _setActiveBtn($btnContainer: HTMLDivElement, $btn: Element | null) {
    $btnContainer.querySelector(`.${this.selectors.button}.active`)?.classList.remove('active');
    $btn?.classList.add('active');
  }

  private _createFontFamilyField() {
    const { $container, $btnContainer } = this._createSection('Font family');
    this.$fontFamilyContainer = $container;

    this.$fontFamilySelect = document.createElement('select');
    this.$fontFamilySelect.classList.add('overlay-picker__select');

    fontFamilies.forEach((fontFamily) => {
      const $option = document.createElement('option');
      $option.value = fontFamily;
      $option.innerText = fontFamily;
      // preview font in list
      $option.style.fontFamily = fontFamily;
      this.$fontFamilySelect.append($option);
    });

    this.$fontFamilySelect.addEventListener('change', () => {
      const fontFamily = this.$fontFamilySelect.value;
      this.$fontFamilySelect.style.fontFamily = fontFamily;
      this.drawer.setTextStyle({ fontFamily }, false);
      this.drawer.focus();
    });

    // keyboard navigation in list must not trigger drawer shortcuts (tools, move selection...)
    this.$fontFamilySelect.addEventListener('keydown', (e) => e.stopPropagation());

    $btnContainer.append(this.$fontFamilySelect);
  }

  private _createFontSizeFields() {
    const { $container, $btnContainer } = this._createSection('Font size');
    this.$fontSizeContainer = $container;
    this.$fontSizeBtnContainer = $btnContainer;

    fontSizes.forEach((size) => {
      const $btn = this._createButton(size.label, dataAttributes.fontSize, size.value.toString());
      $btn.addEventListener('click', () => {
        this._setActiveBtn(this.$fontSizeBtnContainer, $btn);
        this.drawer.setTextStyle({ fontSize: size.value }, false);
      });
      this.$fontSizeBtnContainer.append($btn);
    });
  }

  private _createFontStyleFields() {
    const { $container, $btnContainer } = this._createSection('Style');
    this.$fontStyleContainer = $container;
    this.$fontStyleBtnContainer = $btnContainer;

    fontStyles.forEach((style) => {
      const $btn = this._createButton(style.label, style.attr, style.value, style.title);
      $btn.classList.add(`text-style-${style.value}`);
      $btn.addEventListener('click', () => {
        // toggle buttons, bold & italic (or underline & line-through) can be combined
        $btn.classList.toggle('active');
        this.drawer.setTextStyle(this._getToggledStyle(style.attr), false);
      });
      this.$fontStyleBtnContainer.append($btn);
    });
  }

  /**
   * Build fontStyle or textDecoration value from active toggle buttons
   * @param attr data attribute of toggled button
   */
  private _getToggledStyle(attr: string): Partial<TextStyle> {
    const isActive = (value: string) => !!this.$fontStyleBtnContainer.querySelector(`[${attr}="${value}"].active`);

    if (attr === dataAttributes.fontStyle) {
      const fontStyle = ['italic', 'bold'].filter(isActive).join(' ') || 'normal';
      return { fontStyle: fontStyle as TextStyle['fontStyle'] };
    }

    const textDecoration = ['underline', 'line-through'].filter(isActive).join(' ');
    return { textDecoration: textDecoration as TextStyle['textDecoration'] };
  }

  private _createTextAlignFields() {
    const { $container, $btnContainer } = this._createSection('Align');
    this.$textAlignContainer = $container;
    this.$textAlignBtnContainer = $btnContainer;

    textAligns.forEach((align) => {
      const $btn = this._createButton(align.icon, dataAttributes.textAlign, align.value, align.title);
      $btn.addEventListener('click', () => {
        this._setActiveBtn(this.$textAlignBtnContainer, $btn);
        this.drawer.setTextStyle({ align: align.value }, false);
      });
      this.$textAlignBtnContainer.append($btn);
    });
  }

  show(shape?: (Shape<ShapeConfig> | Group)[]) {
    super.show(shape);

    const text = shape?.find((s): s is Text => s instanceof Text);

    this.updateFields(text ? this._getTextStyle(text) : this.drawer.options.textStyle);
  }

  private _getTextStyle(text: Text): TextStyle {
    return {
      fontFamily: text.fontFamily(),
      fontSize: text.fontSize(),
      fontStyle: text.fontStyle() as TextStyle['fontStyle'],
      textDecoration: text.textDecoration() as TextStyle['textDecoration'],
      align: text.align() as TextStyle['align'],
    };
  }

  /**
   * Update fields state, only given style keys are updated
   * @param {Partial<TextStyle>} style
   */
  updateFields(style: Partial<TextStyle>) {
    const { fontFamily, fontSize, fontStyle, textDecoration, align } = style;

    if (fontFamily !== undefined) {
      this.$fontFamilySelect.value = fontFamily;
      this.$fontFamilySelect.style.fontFamily = fontFamily;
    }

    if (fontSize !== undefined) {
      this._setActiveBtn(
        this.$fontSizeBtnContainer,
        this.$fontSizeBtnContainer.querySelector(`[${dataAttributes.fontSize}="${fontSize}"]`)
      );
    }

    if (fontStyle !== undefined) {
      ['bold', 'italic'].forEach((value) => {
        this.$fontStyleBtnContainer
          .querySelector(`[${dataAttributes.fontStyle}="${value}"]`)
          ?.classList.toggle('active', fontStyle.includes(value));
      });
    }

    if (textDecoration !== undefined) {
      ['underline', 'line-through'].forEach((value) => {
        this.$fontStyleBtnContainer
          .querySelector(`[${dataAttributes.textDecoration}="${value}"]`)
          ?.classList.toggle('active', textDecoration.includes(value));
      });
    }

    if (align !== undefined) {
      this._setActiveBtn(
        this.$textAlignBtnContainer,
        this.$textAlignBtnContainer.querySelector(`[${dataAttributes.textAlign}="${align}"]`)
      );
    }
  }
}
