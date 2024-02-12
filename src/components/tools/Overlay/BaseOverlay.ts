import type { Drawer } from '@/Drawer';
import type { ColorLike } from '@/@types/drawer';
import LineIcon from '@/icons/line.svg?raw';
import './overlay.scss';
import { Shape, ShapeConfig } from 'konva/lib/Shape';
import { Group } from 'konva/lib/Group';
import { shapeName } from '@/constants';

/**
 * All common tool for all shape (color, opacity for now)
 */

export class BaseOverlay {
  $overlayContainer: HTMLDivElement;
  drawer: Drawer;

  $strokeColorContainer!: HTMLDivElement;
  $strokeColorBtnContainer!: HTMLDivElement;

  $strokeWidthContainer!: HTMLDivElement;
  $strokeWidthBtnContainer!: HTMLDivElement;

  $fontSizeContainer!: HTMLDivElement;
  $fontSizeBtnContainer!: HTMLDivElement;

  $opacityContainer!: HTMLDivElement;
  $opacityRange!: HTMLInputElement;

  selectors = {
    container: 'overlay-picker-container',
    buttonContainer: 'overlay-picker-btn-container',
    button: 'overlay-picker__button',
  };

  constructor(drawer: Drawer) {
    this.drawer = drawer;
    this.$overlayContainer = document.createElement('div');
    this.$overlayContainer.classList.add('drawer-overlay-container', 'tool');

    this.drawer.$drawerContainer.append(this.$overlayContainer);

    this._init();
  }

  private _init() {
    // stroke color
    this._createStrokeColorFields();
    // stroke width
    this._createStrokeWidthFields();
    // font size for text node
    this._createFontsizeFields();
    // opacity
    this._createOpacityField();

    // Then append to dom
    this.appendContent([
      this.$strokeColorContainer,
      this.$strokeWidthContainer,
      this.$fontSizeContainer,
      this.$opacityContainer,
    ]);
  }

  private _createStrokeColorFields() {
    this.$strokeColorContainer = document.createElement('div');
    this.$strokeColorContainer.classList.add(this.selectors.container);

    const $strokeTitle = document.createElement('h6');
    $strokeTitle.classList.add('title');
    $strokeTitle.innerText = 'Stroke';
    this.$strokeColorContainer.append($strokeTitle);

    this.$strokeColorBtnContainer = document.createElement('div');
    this.$strokeColorBtnContainer.classList.add(this.selectors.buttonContainer);
    const $strokeColorButtons: HTMLButtonElement[] = [];

    const strokeColors = ['#000', '#e03131', '#2f9e44', '#1971c2', '#f08c00'] as ColorLike[];

    strokeColors.forEach((color) => {
      const $btn = document.createElement('button');
      $btn.classList.add(this.selectors.button);
      $btn.style.backgroundColor = color;
      $btn.dataset.color = color;
      $btn.addEventListener('click', () => {
        this.$strokeColorBtnContainer.querySelector(`.${this.selectors.button}.active`)?.classList.remove('active');
        $btn.classList.add('active');
        this.drawer.setColor(color);
      });
      $strokeColorButtons.push($btn);
    });
    this.$strokeColorBtnContainer.append(...$strokeColorButtons);
    this.$strokeColorContainer.append(this.$strokeColorBtnContainer);
  }

  private _createStrokeWidthFields() {
    this.$strokeWidthContainer = document.createElement('div');
    this.$strokeWidthContainer.classList.add(this.selectors.container);

    const $widthTitle = document.createElement('h6');
    $widthTitle.classList.add('title');
    $widthTitle.innerText = 'Stroke width';
    this.$strokeWidthContainer.append($widthTitle);

    this.$strokeWidthBtnContainer = document.createElement('div');
    this.$strokeWidthBtnContainer.classList.add(this.selectors.buttonContainer);
    const $strokeWidthButtons: HTMLButtonElement[] = [];

    const strokeSize = [3, 5, 8, 12];

    strokeSize.forEach((width) => {
      const $btn = document.createElement('button');

      $btn.innerHTML = LineIcon.replace('stroke-width="2.5"', `stroke-width="${width}"`);
      $btn.dataset.strokeWidth = width.toString();
      $btn.classList.add('drawer-button', this.selectors.button);
      $btn.addEventListener('click', () => {
        this.$strokeWidthBtnContainer.querySelector(`.${this.selectors.button}.active`)?.classList.remove('active');
        $btn.classList.add('active');
        this.drawer.setStrokeWidth($btn.dataset.strokeWidth as string);
      });
      $strokeWidthButtons.push($btn);
    });
    this.$strokeWidthBtnContainer.append(...$strokeWidthButtons);
    this.$strokeWidthContainer.append(this.$strokeWidthBtnContainer);
  }

  private _createFontsizeFields() {
    this.$fontSizeContainer = document.createElement('div');
    this.$fontSizeContainer.classList.add(this.selectors.container);

    const $fontsizeTitle = document.createElement('h6');
    $fontsizeTitle.classList.add('title');
    $fontsizeTitle.innerText = 'Font size';
    this.$fontSizeContainer.append($fontsizeTitle);

    this.$fontSizeBtnContainer = document.createElement('div');
    this.$fontSizeBtnContainer.classList.add(this.selectors.buttonContainer);
    const $fontsizeButtons: HTMLButtonElement[] = [];

    const fontSize = [
      { label: 'S', value: 10 },
      { label: 'M', value: 15 },
      { label: 'L', value: 20 },
      { label: 'XL', value: 25 },
    ];

    fontSize.forEach((font) => {
      const $btn = document.createElement('button');

      $btn.innerHTML = font.label;
      $btn.dataset.fontSize = font.value.toString();
      $btn.classList.add('drawer-button', this.selectors.button);
      $btn.addEventListener('click', () => {
        this.$fontSizeBtnContainer.querySelector(`.${this.selectors.button}.active`)?.classList.remove('active');
        $btn.classList.add('active');
        this.drawer.setStrokeWidth($btn.dataset.strokeWidth as string);
      });
      $fontsizeButtons.push($btn);
    });
    this.$fontSizeBtnContainer.append(...$fontsizeButtons);
    this.$fontSizeContainer.append(this.$fontSizeBtnContainer);
  }

  private _createOpacityField() {
    this.$opacityContainer = document.createElement('div');
    this.$opacityContainer.classList.add('opacity-container');

    const $opacityTitle = document.createElement('h6');
    $opacityTitle.classList.add('title');
    $opacityTitle.innerText = 'Opacity';
    this.$opacityContainer.append($opacityTitle);

    this.$opacityRange = document.createElement('input');
    this.$opacityRange.type = 'range';
    this.$opacityRange.min = '0';
    this.$opacityRange.max = '10';
    this.$opacityRange.step = '1';

    this.$opacityRange.addEventListener('change', () => {
      const opacity = Number(this.$opacityRange.value) / 10;
      this.drawer.setOpacity(opacity);
    });

    this.$opacityContainer.append(this.$opacityRange);
  }

  appendContent(elements: HTMLElement[]) {
    this.$overlayContainer.append(...elements);
  }

  show(shape?: (Shape<ShapeConfig> | Group)[]) {
    this.$overlayContainer.classList.add('show');

    this.$strokeColorBtnContainer.querySelector(`.${this.selectors.button}.active`)?.classList.remove('active');
    this.$strokeWidthBtnContainer.querySelector(`.${this.selectors.button}.active`)?.classList.remove('active');

    let data = {
      color: this.drawer.options.strokeColor,
      strokeWidth: this.drawer.options.strokeWidth,
      opacity: this.drawer.options.opacity,
    };

    if (shape && shape[0] instanceof Shape) {
      data = {
        color: shape[0].stroke() as ColorLike,
        strokeWidth: shape[0].strokeWidth(),
        opacity: shape[0].opacity(),
      };
    }

    this._updateFields(data, shape);
  }

  private _updateFields(
    data: { color: ColorLike; strokeWidth: number; opacity: number },
    shape?: (Shape<ShapeConfig> | Group)[]
  ) {
    this.$strokeColorBtnContainer.querySelector(`.${this.selectors.button}.active`)?.classList.remove('active');
    this.$strokeWidthBtnContainer.querySelector(`.${this.selectors.button}.active`)?.classList.remove('active');

    const $btnColor = this.$strokeColorBtnContainer.querySelector(`.${this.selectors.button}[data-color="${data.color}"]`);

    if ($btnColor) {
      $btnColor.classList.add('active');
    }

    const hasText = shape?.filter((s) => s.hasName(shapeName.text));
    if (hasText?.length && hasText?.length === shape?.length) {
      this._setupTextOverlay();
    } else {
      this._setupShapeOverlay();
    }

    const $btnStrokeWidth = this.$strokeWidthBtnContainer.querySelector(
      `.${this.selectors.button}[data-stroke-width="${data.strokeWidth}"]`
    );

    if ($btnStrokeWidth) {
      $btnStrokeWidth.classList.add('active');
    }

    this.$opacityRange.value = (data.opacity * 10).toString();
  }

  private _setupTextOverlay() {
    this.$strokeWidthContainer.style.display = 'none';
    this.$fontSizeContainer.style.display = '';
  }

  private _setupShapeOverlay() {
    this.$strokeWidthContainer.style.display = '';
    this.$fontSizeContainer.style.display = 'none';
  }

  hide() {
    this.$overlayContainer.classList.remove('show');
  }
}
