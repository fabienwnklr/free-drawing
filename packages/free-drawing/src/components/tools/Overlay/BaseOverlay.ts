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
import { Shape, type ShapeConfig } from 'konva/lib/Shape';
import type { Group } from 'konva/lib/Group';
import { Text } from 'konva/lib/shapes/Text';
import { dataAttributes, drawerEvents, edgesShapes, fillShapes, shapeName, strokeStyleShapes } from '@/constants';
import { ColorPicker } from '@/components/ColorPicker/ColorPicker';
import { createButton, setLabel, setPressed, uniqueId } from '@/utils/dom';
import { getEdges, getStrokeStyle } from '@/utils/stroke';
import type { TranslationKey } from '@/i18n/en';

/**
 * Sections shown by an overlay and their titles, given by each subclass
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

/**
 * Options panel of a tool or of the selection, common to all shapes: stroke and background colors, stroke width and
 * style, corners, opacity and stacking order. Buttons only call drawer setters, fields follow `drawer.options.change`
 */
export class BaseOverlay {
  /** Panel element (region named by `label` option) in floating region, shown with `show` */
  $overlayContainer: HTMLDivElement;
  /** Drawer whose options and selection the fields change */
  drawer: Drawer;

  /** Stroke color section (text color for texts), titled by `colorTitle` option or `setColorTitle` */
  $strokeColorContainer!: HTMLDivElement;
  /** Key of the title of stroke color section */
  #colorTitle: TranslationKey = 'overlay.stroke';
  /** Element of stroke color buttons */
  $strokeColorBtnContainer!: HTMLDivElement;
  /** Stroke color choice calling `drawer.setStrokeColor`, without transparent: drawing would be invisible */
  strokeColorPicker!: ColorPicker;

  /** Background color section, shown with `fillBtns` option or `toggleFillBtns` (rectangle and ellipse) */
  $fillColorContainer!: HTMLDivElement;
  /** Element of background color buttons */
  $fillColorBtnContainer!: HTMLDivElement;
  /** Background color choice calling `drawer.setFillColor`, transparent for no fill */
  fillColorPicker!: ColorPicker;

  /** Stroke width section, hidden with `widthBtns` option false */
  $strokeWidthContainer!: HTMLDivElement;
  /** Element of stroke width buttons (line icons of each width) */
  $strokeWidthBtnContainer!: HTMLDivElement;

  /** Stroke style section (solid, dashed, dotted), shown with `styleBtns` option or `toggleStyleBtns` */
  $strokeStyleContainer!: HTMLDivElement;
  /** Element of stroke style buttons */
  $strokeStyleBtnContainer!: HTMLDivElement;

  /** Corners section, shown with `toggleEdgesBtns` (rectangles) */
  $edgesContainer!: HTMLDivElement;
  /** Element of sharp and round buttons and of radius field */
  $edgesBtnContainer!: HTMLDivElement;
  /** Corner radius field, empty for a radius following size (round) */
  $edgesRadius!: HTMLInputElement;

  /** Opacity section: title and range */
  $opacityContainer!: HTMLDivElement;
  /** Opacity range from 0 to 10 (tenths), applied on change */
  $opacityRange!: HTMLInputElement;

  /** Stacking order section (back, backward, forward, front), shown only for selected shapes */
  $orderContainer!: HTMLDivElement;

  /** CSS classes of sections and of their buttons, shared with subclasses */
  selectors = {
    /** Class of a section (title and fields) */
    container: 'overlay-picker-container',
    /** Class of the fields element of a section */
    buttonContainer: 'overlay-picker-btn-container',
    /** Class of section buttons, those set pressed by `_setActiveBtn` */
    button: 'overlay-picker__button',
  };

  /** Sections and titles given by the subclass, defaults when missing */
  options?: Partial<OverlayOptions>;

  /**
   * Create the panel and its sections in floating region (hidden until `show`), fields following option changes
   * @param drawer Drawer whose options and selection the fields change
   * @param options Sections shown and titles, defaults for missing ones
   */
  constructor(drawer: Drawer, options?: Partial<OverlayOptions>) {
    this.options = options;
    this.drawer = drawer;
    this.$overlayContainer = document.createElement('div');
    this.$overlayContainer.classList.add('drawer-overlay-container', 'tool');
    this.$overlayContainer.setAttribute('role', 'region');
    drawer.i18n.translate((t) =>
      this.$overlayContainer.setAttribute('aria-label', t(options?.label ?? 'overlay.tool'))
    );

    this.drawer.layout.add('floating', this.$overlayContainer);

    this._init();

    // keep fields in sync with options, whatever changes them (any overlay, API...)
    this.drawer.on(drawerEvents.optionsChange, (change: OptionsChange) => this.updateFields(change));
  }

  /**
   * Create every section, then append them in panel order
   */
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

  /**
   * Stroke color section: palette (black, red, green, blue, orange) and custom color
   */
  private _createStrokeColorFields() {
    this.#colorTitle = this.options?.colorTitle ?? 'overlay.stroke';

    const { $container, $btnContainer } = this._createSection(this.#colorTitle);
    const $title = $container.querySelector<HTMLElement>('.title')!;

    this.$strokeColorContainer = $container;
    this.$strokeColorBtnContainer = $btnContainer;
    // title changed by setColorTitle
    this.drawer.i18n.translate((t) => ($title.textContent = t(this.#colorTitle)));

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

  /**
   * Background color section: light colors and transparent, hidden unless `fillBtns` option
   */
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

  /**
   * Stroke width section: a line icon of each width, hidden with `widthBtns` option false
   */
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

  /**
   * Stroke style section (solid, dashed, dotted), hidden unless `styleBtns` option
   */
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

  /**
   * Corners section: sharp and round buttons, radius field, hidden until `toggleEdgesBtns`
   */
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

  /**
   * Opacity section: range named by its title, announced as percentage
   */
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

  /**
   * Stacking order section: buttons calling `drawer.reorderShapes`, with their shortcut
   */
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
   * @param text Key of the title text, translated again on language change
   * @returns Title element with a unique id (for `aria-labelledby`)
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
   * @param title Key of the section title
   * @returns Section element (title then fields element) and its fields element, not appended yet
   */
  protected _createSection(title: TranslationKey) {
    /** Section element: group named by its title */
    const $container = document.createElement('div');
    const $title = this._createTitle(title);
    /** Element of the section fields, after its title */
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
   * @param content HTML of the button: svg icon or short text
   * @param attr Data attribute holding the value, used by `updateFields` to find the active button
   * @param value Option value the button chooses
   * @param label Key of the accessible name
   * @returns Button not pressed, not appended yet
   */
  protected _createButton(content: string, attr: string, value: string, label: TranslationKey) {
    const $btn = createButton('drawer-button', this.selectors.button);

    $btn.innerHTML = content;
    $btn.setAttribute(attr, value);
    this.drawer.i18n.translate((t) => setLabel($btn, t(label)));
    setPressed($btn, false);

    return $btn;
  }

  /**
   * Append sections at the end of the panel
   * @param elements Sections appended in this order
   */
  appendContent(elements: HTMLElement[]) {
    this.$overlayContainer.append(...elements);
  }

  /**
   * Show panel with fields of first given shape, else of drawer options (tool options)
   * @param shape selected shapes, stacking order section shown only for them
   */
  show(shape?: (Shape<ShapeConfig> | Group)[]) {
    this.$overlayContainer.classList.add('show');
    // stacking order only for selected shapes, not for tool options
    this.$orderContainer.style.display = shape?.length ? '' : 'none';

    const { strokeColor, fillColor, strokeWidth, strokeStyle, edges, opacity } = this.drawer.options;
    const shapes = (shape ?? []).filter((s): s is Shape<ShapeConfig> => s instanceof Shape);
    let data: OptionsChange = { strokeColor, fillColor, strokeWidth, strokeStyle, edges, opacity };

    if (shapes.length) {
      const [first] = shapes;
      // each section shows the first selected shape it applies to
      const find = (names: string[]) => shapes.find((s) => names.some((name) => s.hasName(name)));
      const filled = find(fillShapes);
      const outlined = shapes.find((s) => !(s instanceof Text) && !s.hasName(shapeName.highlighter)) ?? first;

      data = {
        // text color is stored in fill
        strokeColor: (first.stroke() || first.fill()) as ColorLike,
        // no fill is transparent
        fillColor: filled ? ((filled.fill() || 'transparent') as ColorLike) : fillColor,
        strokeWidth: outlined.strokeWidth(),
        strokeStyle: getStrokeStyle((find(strokeStyleShapes) ?? first).dash()),
        edges: getEdges((find(edgesShapes) ?? first).getAttr('cornerRadius')),
        opacity: first.opacity(),
      };
    }

    this.updateFields(data);
  }

  /**
   * Set given button active in its container (null to only remove active one)
   * @param $btnContainer Fields element whose buttons are updated
   * @param $btn Button set pressed, the others are released; null releases all
   */
  protected _setActiveBtn($btnContainer: HTMLDivElement, $btn: Element | null) {
    for (const $b of $btnContainer.querySelectorAll<HTMLElement>(`.${this.selectors.button}`)) {
      setPressed($b, $b === $btn);
    }
  }

  /**
   * Update fields state, only given keys are updated
   * @param change Changed options (from `drawer.options.change`) or values of the shape shown
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
   * @param visible True to show the section, false to hide it
   */
  toggleStyleBtns(visible: boolean) {
    this.$strokeStyleContainer.style.display = visible ? '' : 'none';
  }

  /**
   * Show / hide background color buttons, only relevant for rectangle and ellipse
   * @param visible True to show the section, false to hide it
   */
  toggleFillBtns(visible: boolean) {
    this.$fillColorContainer.style.display = visible ? '' : 'none';
  }

  /**
   * Show / hide corners buttons, only relevant for rectangles
   * @param visible True to show the section, false to hide it
   */
  toggleEdgesBtns(visible: boolean) {
    this.$edgesContainer.style.display = visible ? '' : 'none';
  }

  /**
   * Show / hide stroke width buttons, not relevant for texts and highlights
   * @param visible True to show the section, false to hide it
   */
  toggleWidthBtns(visible: boolean) {
    this.$strokeWidthContainer.style.display = visible ? '' : 'none';
  }

  /**
   * Change the title of the color section: stroke of shapes, color when it is also the one of texts
   * @param title Key of the title, e.g. `'overlay.stroke'` or `'overlay.color'`
   */
  setColorTitle(title: TranslationKey) {
    this.#colorTitle = title;
    this.$strokeColorContainer.querySelector('.title')!.textContent = this.drawer.t(title);
  }

  /**
   * Hide panel (tool deactivated, selection cleared...)
   */
  hide() {
    this.$overlayContainer.classList.remove('show');
  }
}
