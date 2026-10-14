import type { Drawer } from '@/Drawer';
import type { ColorLike, Edges, OptionsChange, ShapeOrder, StrokeStyle } from '@/@types/drawer';
import LineIcon from '@/icons/line.svg?raw';
import LineDottedIcon from '@/icons/line-dotted.svg?raw';
import LineDashedIcon from '@/icons/line-dashed.svg?raw';
import EdgesSharpIcon from '@/icons/edges-sharp.svg?raw';
import EdgesRoundIcon from '@/icons/edges-round.svg?raw';
import SendToBackIcon from '@/icons/send-to-back.svg?raw';
import SendBackwardIcon from '@/icons/send-backward.svg?raw';
import BringForwardIcon from '@/icons/bring-forward.svg?raw';
import BringToFrontIcon from '@/icons/bring-to-front.svg?raw';
import '@/components/tools/Overlay/overlay.scss';
import { Shape, ShapeConfig } from 'konva/lib/Shape';
import { Group } from 'konva/lib/Group';
import { dataAttributes, drawerEvents, fillShapes } from '@/constants';
import { ColorPicker } from '@/components/ColorPicker/ColorPicker';
import { createButton, setLabel, setPressed, uniqueId } from '@/utils/dom';
import { getEdges, getStrokeStyle } from '@/utils/stroke';
import type { TranslationKey } from '@/i18n/en';

/**
 * All common tool for all shape (color, opacity for now)
 */

export type OverlayOptions = {
  /** Show stroke style buttons (default false) */
  styleBtns: boolean;
  /** Show stroke width buttons (default true) */
  widthBtns: boolean;
  /** Show background color buttons, for rectangle and ellipse (default false) */
  fillBtns: boolean;
  /** Title of color section (default stroke) */
  colorTitle: TranslationKey;
  /** Accessible name of overlay (default tool options) */
  label: TranslationKey;
};

export class BaseOverlay {
  $overlayContainer: HTMLDivElement;
  drawer: Drawer;

  $strokeColorContainer!: HTMLDivElement;
  $strokeColorBtnContainer!: HTMLDivElement;
  strokeColorPicker!: ColorPicker;

  $fillColorContainer!: HTMLDivElement;
  $fillColorBtnContainer!: HTMLDivElement;
  fillColorPicker!: ColorPicker;

  $strokeWidthContainer!: HTMLDivElement;
  $strokeWidthBtnContainer!: HTMLDivElement;

  $strokeStyleContainer!: HTMLDivElement;
  $strokeStyleBtnContainer!: HTMLDivElement;

  $edgesContainer!: HTMLDivElement;
  $edgesBtnContainer!: HTMLDivElement;
  $edgesRadius!: HTMLInputElement;

  $opacityContainer!: HTMLDivElement;
  $opacityRange!: HTMLInputElement;

  $orderContainer!: HTMLDivElement;

  selectors = {
    container: 'overlay-picker-container',
    buttonContainer: 'overlay-picker-btn-container',
    button: 'overlay-picker__button',
  };

  options?: Partial<OverlayOptions>;

  constructor(drawer: Drawer, options?: Partial<OverlayOptions>) {
    this.options = options;
    this.drawer = drawer;
    this.$overlayContainer = document.createElement('div');
    this.$overlayContainer.classList.add('drawer-overlay-container', 'tool');
    this.$overlayContainer.setAttribute('role', 'region');
    drawer.i18n.translate((t) =>
      this.$overlayContainer.setAttribute('aria-label', t(options?.label ?? 'overlay.tool'))
    );

    this.drawer.$drawerContainer.append(this.$overlayContainer);

    this._init();

    // keep fields in sync with options, whatever changes them (any overlay, API...)
    this.drawer.on(drawerEvents.optionsChange, (change: OptionsChange) => this.updateFields(change));
  }

  private _init() {
    // stroke color
    this._createStrokeColorFields();
    // background color
    this._createFillColorFields();
    // stroke width
    this._createStrokeWidthFields();
    // stroke style
    this._createStrokeStyleFields();
    // corners
    this._createEdgesFields();
    // opacity
    this._createOpacityField();
    // stacking order of selected shapes
    this._createOrderFields();

    // Then append to dom
    this.appendContent([
      this.$strokeColorContainer,
      this.$fillColorContainer,
      this.$strokeWidthContainer,
      this.$strokeStyleContainer,
      this.$edgesContainer,
      this.$opacityContainer,
      this.$orderContainer,
    ]);
  }

  private _createStrokeColorFields() {
    const { $container, $btnContainer } = this._createSection(this.options?.colorTitle ?? 'overlay.stroke');
    this.$strokeColorContainer = $container;
    this.$strokeColorBtnContainer = $btnContainer;

    const strokeColors: { color: ColorLike; label: TranslationKey }[] = [
      { color: '#000', label: 'color.black' },
      { color: '#e03131', label: 'color.red' },
      { color: '#2f9e44', label: 'color.green' },
      { color: '#1971c2', label: 'color.blue' },
      { color: '#f08c00', label: 'color.orange' },
    ];

    // no transparent color: drawing would be invisible
    this.strokeColorPicker = new ColorPicker(this.$strokeColorBtnContainer, {
      i18n: this.drawer.i18n,
      colors: strokeColors,
      attr: dataAttributes.strokeColor,
      buttonClass: this.selectors.button,
      onChange: (color) => this.drawer.setStrokeColor(color),
    });
  }

  private _createFillColorFields() {
    const { $container, $btnContainer } = this._createSection('overlay.background');
    this.$fillColorContainer = $container;
    this.$fillColorBtnContainer = $btnContainer;

    this.fillColorPicker = new ColorPicker(this.$fillColorBtnContainer, {
      i18n: this.drawer.i18n,
      colors: [
        { color: '#ffc9c9', label: 'color.lightRed' },
        { color: '#b2f2bb', label: 'color.lightGreen' },
        { color: '#a5d8ff', label: 'color.lightBlue' },
        { color: '#ffec99', label: 'color.lightYellow' },
      ],
      attr: dataAttributes.fillColor,
      buttonClass: this.selectors.button,
      transparent: true,
      onChange: (color) => this.drawer.setFillColor(color),
    });

    this.toggleFillBtns(!!this.options?.fillBtns);
  }

  private _createStrokeWidthFields() {
    const { $container, $btnContainer } = this._createSection('overlay.strokeWidth');
    this.$strokeWidthContainer = $container;
    this.$strokeWidthBtnContainer = $btnContainer;

    const strokeWidths: { width: number; label: TranslationKey }[] = [
      { width: 3, label: 'width.thin' },
      { width: 5, label: 'width.medium' },
      { width: 8, label: 'width.thick' },
      { width: 12, label: 'width.extraThick' },
    ];

    strokeWidths.forEach(({ width, label }) => {
      const icon = LineIcon.replace('stroke-width="2.5"', `stroke-width="${width}"`);
      const $btn = this._createButton(icon, dataAttributes.strokeWidth, width.toString(), label);

      $btn.addEventListener('click', () => this.drawer.setStrokeWidth(width));
      this.$strokeWidthBtnContainer.append($btn);
    });

    if (this.options?.widthBtns === false) this.$strokeWidthContainer.style.display = 'none';
  }

  private _createStrokeStyleFields() {
    const { $container, $btnContainer } = this._createSection('overlay.strokeStyle');
    this.$strokeStyleContainer = $container;
    this.$strokeStyleBtnContainer = $btnContainer;

    const strokeStyles: { icon: string; style: StrokeStyle; label: TranslationKey }[] = [
      { icon: LineIcon, style: 'solid', label: 'style.solid' },
      { icon: LineDashedIcon, style: 'dashed', label: 'style.dashed' },
      { icon: LineDottedIcon, style: 'dotted', label: 'style.dotted' },
    ];

    strokeStyles.forEach(({ icon, style, label }) => {
      const $btn = this._createButton(icon, dataAttributes.strokeStyle, style, label);

      $btn.addEventListener('click', () => this.drawer.setStrokeStyle(style));
      this.$strokeStyleBtnContainer.append($btn);
    });

    this.toggleStyleBtns(!!this.options?.styleBtns);
  }

  private _createEdgesFields() {
    const { $container, $btnContainer } = this._createSection('overlay.edges');
    this.$edgesContainer = $container;
    this.$edgesBtnContainer = $btnContainer;

    const edges: { icon: string; value: Exclude<Edges, number>; label: TranslationKey }[] = [
      { icon: EdgesSharpIcon, value: 'sharp', label: 'edges.sharp' },
      { icon: EdgesRoundIcon, value: 'round', label: 'edges.round' },
    ];

    edges.forEach(({ icon, value, label }) => {
      const $btn = this._createButton(icon, dataAttributes.edges, value, label);

      $btn.addEventListener('click', () => this.drawer.setEdges(value));
      this.$edgesBtnContainer.append($btn);
    });

    // radius chosen, empty for radius following size
    this.$edgesRadius = document.createElement('input');
    this.$edgesRadius.type = 'number';
    this.$edgesRadius.min = '0';
    this.$edgesRadius.step = '1';
    this.$edgesRadius.classList.add('overlay-picker__input');
    this.drawer.i18n.translate((t) => {
      this.$edgesRadius.placeholder = t('edges.auto');
      setLabel(this.$edgesRadius, t('edges.radius'));
    });
    this.$edgesRadius.addEventListener('change', () => {
      const radius = this.$edgesRadius.valueAsNumber;

      this.drawer.setEdges(Number.isFinite(radius) ? radius : 'round');
    });
    // typed digits and Backspace are not drawer shortcuts (tools, delete selection...)
    this.$edgesRadius.addEventListener('keydown', (e) => e.stopPropagation());
    this.$edgesBtnContainer.append(this.$edgesRadius);

    this.toggleEdgesBtns(false);
  }

  private _createOpacityField() {
    this.$opacityContainer = document.createElement('div');
    this.$opacityContainer.classList.add('opacity-container');

    const $opacityTitle = this._createTitle('overlay.opacity');
    this.$opacityContainer.append($opacityTitle);

    this.$opacityRange = document.createElement('input');
    this.$opacityRange.type = 'range';
    this.$opacityRange.min = '0';
    this.$opacityRange.max = '10';
    this.$opacityRange.step = '1';
    this.$opacityRange.setAttribute('aria-labelledby', $opacityTitle.id);

    this.$opacityRange.addEventListener('input', () => this._updateOpacityText());
    this.$opacityRange.addEventListener('change', () => {
      const opacity = Number(this.$opacityRange.value) / 10;
      this.drawer.setOpacity(opacity);
    });

    this.$opacityContainer.append(this.$opacityRange);
  }

  private _createOrderFields() {
    const { $container, $btnContainer } = this._createSection('overlay.layers');
    this.$orderContainer = $container;

    const orders: { icon: string; order: ShapeOrder; label: TranslationKey; shortcut: string }[] = [
      { icon: SendToBackIcon, order: 'back', label: 'action.sendToBack', shortcut: 'Ctrl+Shift+Down' },
      { icon: SendBackwardIcon, order: 'backward', label: 'action.sendBackward', shortcut: 'Ctrl+Down' },
      { icon: BringForwardIcon, order: 'forward', label: 'action.bringForward', shortcut: 'Ctrl+Up' },
      { icon: BringToFrontIcon, order: 'front', label: 'action.bringToFront', shortcut: 'Ctrl+Shift+Up' },
    ];

    orders.forEach(({ icon, order, label, shortcut }) => {
      // action, not a toggle
      const $btn = createButton('drawer-button', this.selectors.button);

      $btn.innerHTML = icon;
      $btn.setAttribute(dataAttributes.order, order);
      this.drawer.i18n.translate((t) => {
        setLabel($btn, t(label));
        $btn.title = `${t(label)} (${shortcut})`;
      });
      $btn.setAttribute('aria-keyshortcuts', shortcut.replace('Ctrl', 'Control').replace(/Up|Down/, 'Arrow$&'));
      $btn.addEventListener('click', () => this.drawer.reorderShapes(order));
      $btnContainer.append($btn);
    });
  }

  /**
   * Opacity announced as percentage (range is from 0 to 10)
   */
  private _updateOpacityText() {
    this.$opacityRange.setAttribute('aria-valuetext', `${Number(this.$opacityRange.value) * 10}%`);
  }

  /**
   * Section title, referenced by its fields
   */
  protected _createTitle(text: TranslationKey) {
    const $title = document.createElement('h6');

    $title.classList.add('title');
    $title.id = uniqueId('overlay-title');
    this.drawer.i18n.translate((t) => ($title.textContent = t(text)));

    return $title;
  }

  /**
   * Group of fields named by its title
   */
  protected _createSection(title: TranslationKey) {
    const $container = document.createElement('div');
    const $title = this._createTitle(title);
    const $btnContainer = document.createElement('div');

    $container.classList.add(this.selectors.container);
    $container.setAttribute('role', 'group');
    $container.setAttribute('aria-labelledby', $title.id);
    $btnContainer.classList.add(this.selectors.buttonContainer);
    $container.append($title, $btnContainer);

    return { $container, $btnContainer };
  }

  /**
   * Toggle button of a field, `label` is its accessible name (icon or short content)
   */
  protected _createButton(content: string, attr: string, value: string, label: TranslationKey) {
    const $btn = createButton('drawer-button', this.selectors.button);

    $btn.innerHTML = content;
    $btn.setAttribute(attr, value);
    this.drawer.i18n.translate((t) => setLabel($btn, t(label)));
    setPressed($btn, false);

    return $btn;
  }

  appendContent(elements: HTMLElement[]) {
    this.$overlayContainer.append(...elements);
  }

  show(shape?: (Shape<ShapeConfig> | Group)[]) {
    this.$overlayContainer.classList.add('show');
    // stacking order only for selected shapes, not for tool options
    this.$orderContainer.style.display = shape?.length ? '' : 'none';

    const { strokeColor, fillColor, strokeWidth, strokeStyle, edges, opacity } = this.drawer.options;
    let data: OptionsChange = { strokeColor, fillColor, strokeWidth, strokeStyle, edges, opacity };

    if (shape && shape[0] instanceof Shape) {
      const hasFill = fillShapes.some((name) => shape[0].hasName(name));

      data = {
        // text color is stored in fill
        strokeColor: (shape[0].stroke() || shape[0].fill()) as ColorLike,
        // no fill is transparent
        fillColor: hasFill ? ((shape[0].fill() || 'transparent') as ColorLike) : fillColor,
        strokeWidth: shape[0].strokeWidth(),
        strokeStyle: getStrokeStyle(shape[0].dash()),
        edges: getEdges(shape[0].getAttr('cornerRadius')),
        opacity: shape[0].opacity(),
      };
    }

    this.updateFields(data);
  }

  /**
   * Set given button active in its container (null to only remove active one)
   */
  protected _setActiveBtn($btnContainer: HTMLDivElement, $btn: Element | null) {
    $btnContainer
      .querySelectorAll<HTMLElement>(`.${this.selectors.button}`)
      .forEach(($b) => setPressed($b, $b === $btn));
  }

  /**
   * Update fields state, only given keys are updated
   * @param {OptionsChange} change
   */
  updateFields(change: OptionsChange) {
    if (change.strokeColor !== undefined) {
      this.strokeColorPicker.setColor(change.strokeColor);
    }

    if (change.fillColor !== undefined) {
      this.fillColorPicker.setColor(change.fillColor);
    }

    if (change.strokeWidth !== undefined) {
      this._setActiveBtn(
        this.$strokeWidthBtnContainer,
        this.$strokeWidthBtnContainer.querySelector(`[${dataAttributes.strokeWidth}="${change.strokeWidth}"]`)
      );
    }

    if (change.strokeStyle !== undefined) {
      this._setActiveBtn(
        this.$strokeStyleBtnContainer,
        this.$strokeStyleBtnContainer.querySelector(`[${dataAttributes.strokeStyle}="${change.strokeStyle}"]`)
      );
    }

    if (change.edges !== undefined) {
      const { edges } = change;
      const round = edges === 'round' || (typeof edges === 'number' && edges > 0);

      this._setActiveBtn(
        this.$edgesBtnContainer,
        this.$edgesBtnContainer.querySelector(`[${dataAttributes.edges}="${round ? 'round' : 'sharp'}"]`)
      );
      // radius given (or of selected rectangle), empty when following size
      this.$edgesRadius.value = typeof edges === 'number' ? String(edges) : edges === 'sharp' ? '0' : '';
    }

    if (change.opacity !== undefined) {
      this.$opacityRange.value = (change.opacity * 10).toString();
      this._updateOpacityText();
    }
  }

  /**
   * Show / hide stroke style buttons (dash), only relevant for outline shapes
   * @param {boolean} visible
   */
  toggleStyleBtns(visible: boolean) {
    this.$strokeStyleContainer.style.display = visible ? '' : 'none';
  }

  /**
   * Show / hide background color buttons, only relevant for rectangle and ellipse
   * @param {boolean} visible
   */
  toggleFillBtns(visible: boolean) {
    this.$fillColorContainer.style.display = visible ? '' : 'none';
  }

  /**
   * Show / hide corners buttons, only relevant for rectangles
   * @param {boolean} visible
   */
  toggleEdgesBtns(visible: boolean) {
    this.$edgesContainer.style.display = visible ? '' : 'none';
  }

  hide() {
    this.$overlayContainer.classList.remove('show');
  }
}
