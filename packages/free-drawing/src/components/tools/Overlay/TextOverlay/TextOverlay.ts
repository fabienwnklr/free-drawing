import type { Drawer } from '@/Drawer';
import type { OptionsChange, TextStyle } from '@/@types/drawer';
import { Shape, ShapeConfig } from 'konva/lib/Shape';
import { Group } from 'konva/lib/Group';
import { Text } from 'konva/lib/shapes/Text';
import { BaseOverlay } from '@/components/tools/Overlay/BaseOverlay';
import { dataAttributes } from '@/constants';
import { setPressed } from '@/utils/dom';
import AlignLeftIcon from '@/icons/align-left.svg?raw';
import AlignCenterIcon from '@/icons/align-center.svg?raw';
import AlignRightIcon from '@/icons/align-right.svg?raw';
import '@/components/tools/Overlay/TextOverlay/text-overlay.scss';
import type { TranslationKey } from '@/i18n/en';

const fontFamilies = ['Ubuntu', 'Arial', 'Verdana', 'Georgia', 'Times New Roman', 'Courier New', 'Comic Sans MS'];

const fontSizes: { label: string; title: TranslationKey; value: number }[] = [
  { label: 'S', title: 'text.small', value: 12 },
  { label: 'M', title: 'text.medium', value: 16 },
  { label: 'L', title: 'text.large', value: 24 },
  { label: 'XL', title: 'text.extraLarge', value: 32 },
];

const fontStyles: { label: string; title: TranslationKey; attr: string; value: string }[] = [
  { label: 'B', title: 'text.bold', attr: dataAttributes.fontStyle, value: 'bold' },
  { label: 'I', title: 'text.italic', attr: dataAttributes.fontStyle, value: 'italic' },
  { label: 'U', title: 'text.underline', attr: dataAttributes.textDecoration, value: 'underline' },
  { label: 'S', title: 'text.strikethrough', attr: dataAttributes.textDecoration, value: 'line-through' },
];

const textAligns: { icon: string; title: TranslationKey; value: TextStyle['align'] }[] = [
  { icon: AlignLeftIcon, title: 'text.alignLeft', value: 'left' },
  { icon: AlignCenterIcon, title: 'text.alignCenter', value: 'center' },
  { icon: AlignRightIcon, title: 'text.alignRight', value: 'right' },
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
    super(drawer, { widthBtns: false, colorTitle: 'overlay.color', label: 'overlay.text' });
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

  private _createFontFamilyField() {
    const { $container, $btnContainer } = this._createSection('text.fontFamily');
    this.$fontFamilyContainer = $container;

    this.$fontFamilySelect = document.createElement('select');
    this.$fontFamilySelect.classList.add('overlay-picker__select');
    this.$fontFamilySelect.setAttribute('aria-labelledby', $container.getAttribute('aria-labelledby')!);

    fontFamilies.forEach((fontFamily) => {
      const $option = document.createElement('option');
      $option.value = fontFamily;
      $option.textContent = fontFamily;
      // preview font in list
      $option.style.fontFamily = fontFamily;
      this.$fontFamilySelect.append($option);
    });

    this.$fontFamilySelect.addEventListener('change', () => {
      this.drawer.setTextStyle({ fontFamily: this.$fontFamilySelect.value });
      this.drawer.focus();
    });

    // keyboard navigation in list must not trigger drawer shortcuts (tools, move selection...)
    this.$fontFamilySelect.addEventListener('keydown', (e) => e.stopPropagation());

    $btnContainer.append(this.$fontFamilySelect);
  }

  private _createFontSizeFields() {
    const { $container, $btnContainer } = this._createSection('text.fontSize');
    this.$fontSizeContainer = $container;
    this.$fontSizeBtnContainer = $btnContainer;

    fontSizes.forEach((size) => {
      const $btn = this._createButton(size.label, dataAttributes.fontSize, size.value.toString(), size.title);
      $btn.addEventListener('click', () => this.drawer.setTextStyle({ fontSize: size.value }));
      this.$fontSizeBtnContainer.append($btn);
    });
  }

  private _createFontStyleFields() {
    const { $container, $btnContainer } = this._createSection('text.style');
    this.$fontStyleContainer = $container;
    this.$fontStyleBtnContainer = $btnContainer;

    fontStyles.forEach((style) => {
      const $btn = this._createButton(style.label, style.attr, style.value, style.title);
      $btn.classList.add(`text-style-${style.value}`);
      $btn.addEventListener('click', () => {
        // toggle buttons, bold & italic (or underline & line-through) can be combined
        setPressed($btn, !$btn.classList.contains('active'));
        this.drawer.setTextStyle(this._getToggledStyle(style.attr));
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
    const { $container, $btnContainer } = this._createSection('text.align');
    this.$textAlignContainer = $container;
    this.$textAlignBtnContainer = $btnContainer;

    textAligns.forEach((align) => {
      const $btn = this._createButton(align.icon, dataAttributes.textAlign, align.value, align.title);
      $btn.addEventListener('click', () => this.drawer.setTextStyle({ align: align.value }));
      this.$textAlignBtnContainer.append($btn);
    });
  }

  show(shape?: (Shape<ShapeConfig> | Group)[]) {
    super.show(shape);

    const text = shape?.find((s): s is Text => s instanceof Text);

    this.updateTextFields(text ? this._getTextStyle(text) : this.drawer.options.textStyle);
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

  updateFields(change: OptionsChange) {
    super.updateFields(change);

    if (change.textStyle) this.updateTextFields(change.textStyle);
  }

  /**
   * Update text fields state, only given style keys are updated
   * @param {Partial<TextStyle>} style
   */
  updateTextFields(style: Partial<TextStyle>) {
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
        const $btn = this.$fontStyleBtnContainer.querySelector<HTMLElement>(`[${dataAttributes.fontStyle}="${value}"]`);

        if ($btn) setPressed($btn, fontStyle.includes(value));
      });
    }

    if (textDecoration !== undefined) {
      ['underline', 'line-through'].forEach((value) => {
        const $btn = this.$fontStyleBtnContainer.querySelector<HTMLElement>(
          `[${dataAttributes.textDecoration}="${value}"]`
        );

        if ($btn) setPressed($btn, textDecoration.includes(value));
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
