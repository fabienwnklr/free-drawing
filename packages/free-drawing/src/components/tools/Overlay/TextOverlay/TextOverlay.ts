import type { Drawer } from '@/Drawer';
import type { OptionsChange, TextStyle } from '@/@types/drawer';
import type { Shape, ShapeConfig } from 'konva/lib/Shape';
import type { Group } from 'konva/lib/Group';
import { Text } from 'konva/lib/shapes/Text';
import { BaseOverlay } from '@/components/tools/Overlay/BaseOverlay';
import type { OverlayOptions, FontStyleChoice } from '@/@types/toolbar';
import { dataAttributes } from '@/constants';
import { setPressed } from '@/utils/dom';
import AlignLeftIcon from '@/icons/align-left.svg?raw';
import AlignCenterIcon from '@/icons/align-center.svg?raw';
import AlignRightIcon from '@/icons/align-right.svg?raw';
import '@/components/tools/Overlay/TextOverlay/text-overlay.scss';
import type { TextChoice, IconChoice } from '@/@types/ui';

const fontFamilies = ['Ubuntu', 'Arial', 'Verdana', 'Georgia', 'Times New Roman', 'Courier New', 'Comic Sans MS'];

/** Font sizes of text options */
const fontSizes: TextChoice<number>[] = [
  { value: 12, label: 'text.small', text: 'S' },
  { value: 16, label: 'text.medium', text: 'M' },
  { value: 24, label: 'text.large', text: 'L' },
  { value: 32, label: 'text.extraLarge', text: 'XL' },
];

/** Font styles and decorations of text options, combined */
const fontStyles: FontStyleChoice[] = [
  { value: 'bold', label: 'text.bold', text: 'B', attr: dataAttributes.fontStyle },
  { value: 'italic', label: 'text.italic', text: 'I', attr: dataAttributes.fontStyle },
  { value: 'underline', label: 'text.underline', text: 'U', attr: dataAttributes.textDecoration },
  { value: 'line-through', label: 'text.strikethrough', text: 'S', attr: dataAttributes.textDecoration },
];

/** Alignments of text options */
const textAligns: IconChoice<TextStyle['align']>[] = [
  { value: 'left', label: 'text.alignLeft', icon: AlignLeftIcon },
  { value: 'center', label: 'text.alignCenter', icon: AlignCenterIcon },
  { value: 'right', label: 'text.alignRight', icon: AlignRightIcon },
];

/**
 * Text tool (font family, size, style, align) with common tool (color, opacity)
 */
export class TextOverlay extends BaseOverlay {
  /** Font family section */
  $fontFamilyContainer!: HTMLDivElement;
  /** Font family list, each option previewed in its font */
  $fontFamilySelect!: HTMLSelectElement;
  /** Font family chosen with the pointer (focus back to the drawer), else with the keyboard (focus kept in the list) */
  #fontChosenWithPointer = false;

  /** Font size section */
  $fontSizeContainer!: HTMLDivElement;
  /** Element of font size buttons (S, M, L, XL) */
  $fontSizeBtnContainer!: HTMLDivElement;

  /** Font style section */
  $fontStyleContainer!: HTMLDivElement;
  /** Element of bold, italic, underline and strikethrough toggle buttons */
  $fontStyleBtnContainer!: HTMLDivElement;

  /** Text alignment section */
  $textAlignContainer!: HTMLDivElement;
  /** Element of left, center and right alignment buttons */
  $textAlignBtnContainer!: HTMLDivElement;

  /**
   * Create the text panel: common sections without stroke width, text sections between color and opacity
   * @param drawer Drawer whose text options and selected texts the fields change
   * @param options Options of the panel, e.g. stroke width shown by the selection panel
   */
  constructor(drawer: Drawer, options?: Partial<OverlayOptions>) {
    super(drawer, { widthBtns: false, colorTitle: 'overlay.color', label: 'overlay.text', ...options });
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

  /**
   * Font family section: list of fonts, focus back to drawer once chosen with the pointer; with the keyboard, arrows
   * choose at once and focus stays in the list to browse the fonts
   */
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

    this.$fontFamilySelect.addEventListener('pointerdown', () => (this.#fontChosenWithPointer = true));
    this.$fontFamilySelect.addEventListener('change', () => {
      this.drawer.setTextStyle({ fontFamily: this.$fontFamilySelect.value });
      // drawer shortcuts again after a choice with the pointer
      if (this.#fontChosenWithPointer) this.drawer.focus();
    });

    // keyboard navigation in list must not trigger drawer shortcuts (tools, move selection...)
    this.$fontFamilySelect.addEventListener('keydown', (e) => {
      this.#fontChosenWithPointer = false;
      e.stopPropagation();
    });

    $btnContainer.append(this.$fontFamilySelect);
  }

  /**
   * Font size section: a button per size of `fontSizes`
   */
  private _createFontSizeFields() {
    const { $container, $btnContainer } = this._createSection('text.fontSize');
    this.$fontSizeContainer = $container;
    this.$fontSizeBtnContainer = $btnContainer;

    fontSizes.forEach((size) => {
      const $btn = this._createButton(size.text, dataAttributes.fontSize, size.value.toString(), size.label);
      $btn.addEventListener('click', () => this.drawer.setTextStyle({ fontSize: size.value }));
      this.$fontSizeBtnContainer.append($btn);
    });
  }

  /**
   * Font style section: toggle buttons combined into `fontStyle` and `textDecoration`
   */
  private _createFontStyleFields() {
    const { $container, $btnContainer } = this._createSection('text.style');
    this.$fontStyleContainer = $container;
    this.$fontStyleBtnContainer = $btnContainer;

    fontStyles.forEach((style) => {
      const $btn = this._createButton(style.text, style.attr, style.value, style.label);
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
   * @returns `fontStyle` (italic and bold, else normal) or `textDecoration` (empty for none) of active buttons
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

  /**
   * Text alignment section: left, center and right buttons
   */
  private _createTextAlignFields() {
    const { $container, $btnContainer } = this._createSection('text.align');
    this.$textAlignContainer = $container;
    this.$textAlignBtnContainer = $btnContainer;

    textAligns.forEach((align) => {
      const $btn = this._createButton(align.icon, dataAttributes.textAlign, align.value, align.label);
      $btn.addEventListener('click', () => this.drawer.setTextStyle({ align: align.value }));
      this.$textAlignBtnContainer.append($btn);
    });
  }

  /**
   * Show panel, text fields with style of first selected text, else of `textStyle` option
   * @param shape selected shapes, stacking order section shown only for them
   */
  show(shape?: (Shape<ShapeConfig> | Group)[]) {
    super.show(shape);

    const text = shape?.find((s): s is Text => s instanceof Text);

    this.updateTextFields(text ? this._getTextStyle(text) : this.drawer.options.textStyle);
  }

  /**
   * Text style of a text node, shown by text fields
   * @param text Selected text node whose style is read
   * @returns Font family, size, style, decoration and alignment of the text
   */
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
   * Show / hide text sections (font family, size, style, alignment), e.g. selection with texts
   * @param visible True to show the sections, false to hide them
   */
  toggleTextFields(visible: boolean) {
    for (const $section of [
      this.$fontFamilyContainer,
      this.$fontSizeContainer,
      this.$fontStyleContainer,
      this.$textAlignContainer,
    ]) {
      $section.style.display = visible ? '' : 'none';
    }
  }

  /**
   * Update common fields, then text fields when text style changed
   * @param change Changed options (from `drawer.options.change`) or values of the shape shown
   */
  updateFields(change: OptionsChange) {
    super.updateFields(change);

    if (change.textStyle) this.updateTextFields(change.textStyle);
  }

  /**
   * Update text fields state, only given style keys are updated
   * @param style Text style of the selected text or of `textStyle` option, possibly partial
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
