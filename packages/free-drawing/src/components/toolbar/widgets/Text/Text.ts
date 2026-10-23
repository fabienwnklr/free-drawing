import type { Drawer } from '@/Drawer';
import { getDrawingShape, getFrameOfTitle } from '@/utils/frame';
import { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import TextIcon from '@/icons/text.svg?raw';
import type { Node } from 'konva/lib/Node';
import { Text } from 'konva/lib/shapes/Text';
import type { Vector2d } from 'konva/lib/types';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { shapeName } from '@/constants';
import { TextOverlay } from '@/components/tools/Overlay/TextOverlay/TextOverlay';
import { isComposing, placeInView } from '@/utils/dom';

/**
 * Text tool: a click adds a text (or edits the text clicked) in a textarea placed over it; once validated, the tool is
 * kept (`keepTool`) or the selection tool comes back with the text selected. A double click on any text (or title of
 * a frame) edits it, whatever the active tool.
 */
export class TextWidget extends BaseWidget {
  /** A text is edited in the textarea */
  isEditing: boolean = false;
  /** Next edit started by a click of this tool (see `_initEventsTextarea`) */
  #byTool = false;
  /** A press on the canvas ended the edit of a text, the tool kept: its click adds no text */
  #pressEndedEdit = false;
  /** Current press ended the edit of a text: its click adds no text */
  #skipClick = false;
  overlay: TextOverlay;
  protected cursor = 'text';

  /**
   * Create the text tool, shortcut T: double click on texts of the drawing edits them, fonts preloaded
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'text', 'Text', TextIcon, 't');

    this.overlay = new TextOverlay(drawer);

    // listen on layer, so any text is editable (created, loaded, restored from history...)
    this.drawer.drawLayer.on('dblclick.edit dbltap.edit', (e) => {
      if (this._isEditable(e.target) && !this.drawer.readOnly) {
        this.editTextNode(e.target);
      }
    });

    this._loadFonts();
  }

  /**
   * A font is loaded by browser when first used in page: texts measured (width, line breaks) or drawn before
   * use a fallback font. Load fonts of texts (default one and saved texts ones), then layout texts again.
   */
  private async _loadFonts() {
    if (!document.fonts) return;

    const texts = () => this.drawer.drawLayer.find<Text>(`.${shapeName.text}`);
    const fontFamilies = new Set([this.drawer.options.textStyle.fontFamily, ...texts().map((t) => t.fontFamily())]);

    try {
      await Promise.all([...fontFamilies].map((fontFamily) => document.fonts.load(`16px "${fontFamily}"`)));
    } catch {
      // font unavailable, fallback font is kept
      return;
    }

    for (const text of texts()) text._setTextData();
    this.drawer.drawLayer.batchDraw();
  }

  /**
   * Text of the drawing or title of a frame, edited by a double click or a click of this tool
   * @param node Node under the pointer
   * @returns true for a text that can be edited
   */
  private _isEditable(node: Node): node is Text {
    return node instanceof Text && (node.hasName(shapeName.text) || !!getFrameOfTitle(node));
  }

  /**
   * New text at a position of drawing (pointer by default, center of view when it is out of canvas), in the frame
   * containing it, then selection tool active (paste)
   * @param text Content, its width fits its longest line when given
   * @param position Top left corner of the text, in drawing coordinates
   * @returns The added text node
   */
  addTextNode(text: string = '', position: Vector2d = this.drawer._getRelativePointerPos()) {
    const textNode = this._createText(text, position);

    this.drawer.getWidget<SelectWidget>('selection')?.setActive(true);

    return textNode;
  }

  /**
   * New text added to the drawing (style of the options), in the frame containing it
   * @param text Content, its width fits its longest line when given
   * @param position Top left corner of the text, in drawing coordinates
   * @returns The added text node
   */
  private _createText(text: string, { x, y }: Vector2d) {
    const { textStyle } = this.drawer.options;

    const textNode = new Text({
      ...textStyle,
      text,
      x,
      y,
      name: shapeName.text,
      fill: this.drawer.options.strokeColor,
      opacity: this.drawer.options.opacity,
      // keep about the same number of characters per line whatever the font size
      width: textStyle.fontSize * 6,
    });

    if (text) {
      // fit width to the widest line (not the one with most characters)
      const widths = text.split('\n').map((line) => textNode.measureSize(line).width);
      textNode.width(Math.ceil(Math.max(...widths)));
    }

    this.drawer.addShape(textNode);
    this.drawer.placeInFrames([textNode]);

    return textNode;
  }

  /**
   * Click edits the text under the pointer, else adds an empty text there and edits it (not right or middle button,
   * nor the click whose press validated a text). Options panel hidden meanwhile: a press on it would validate the text.
   */
  protected initEvents(): void {
    this.onStage('mousedown touchstart', (e) => {
      // no mouse events of the browser after a tap: their click would add another text
      if (e.type === 'touchstart') e.evt.preventDefault();
      this.#skipClick = this.#pressEndedEdit;
      this.#pressEndedEdit = false;
    });
    this.onStage('click tap', (e) => {
      if (e.evt.button > 0 || this.#skipClick) return;

      const textNode = this._isEditable(e.target)
        ? e.target
        : this._createText('', this.drawer._getRelativePointerPos());

      this.overlay.hide();
      this.#byTool = true;
      this.editTextNode(textNode);
    });
  }

  /**
   * Tool changed: no click to skip
   */
  protected onDesactive(): void {
    this.#pressEndedEdit = false;
    this.#skipClick = false;
  }

  /**
   * Text validated after a click of this tool: tool kept (`keepTool`) with its options panel, else selection tool back
   * with the text (or frame of the title) selected
   * @param textNode Text edited
   */
  private _afterEdit(textNode: Text) {
    this.afterDraw();
    if (this.drawer.activeWidget === this) {
      this.showToolOverlay();
      return;
    }
    this.drawer.getWidget<SelectWidget>('selection')?.select([getDrawingShape(textNode, this.drawer.drawLayer)]);
  }

  /**
   * Edit a text in a textarea at its place (same font, size, rotation), text and transformer hidden meanwhile.
   * Enter or a press elsewhere (mouse, touch, pen, click) validates, Shift + Enter adds a line, Escape cancels; an
   * empty text is removed.
   * @param textNode Text of drawing, or title of a frame
   */
  editTextNode(textNode: Text) {
    textNode.hide();
    const selectWidget = this.drawer.toolbar.getWidget<SelectWidget>('selection');
    selectWidget?.transformer.hide();
    const textarea = this._createTextarea(textNode);
    // rotation of its groups too
    const rotation = textNode.getAbsoluteRotation();
    let transform = '';
    if (rotation) {
      transform += `rotateZ(${rotation}deg)`;
    }

    let px = 0;
    // also we need to slightly move textarea on firefox
    // because it jumps a bit
    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    if (isFirefox) {
      px += 2 + Math.round(textNode.fontSize() / 20);
    }
    transform += `translateY(-${px}px)`;

    textarea.style.transform = transform;

    // reset height
    textarea.style.height = 'auto';
    // after browsers resized it we can set actual value
    textarea.style.height = `${textarea.scrollHeight + 3}px`;

    textarea.focus();

    this.isEditing = true;
    this._initEventsTextarea(textNode, textarea);
  }

  /**
   * Textarea over a text, in `floating` region: same position, size, font and color whatever zoom and scale, with
   * room around it for glyphs higher than line height
   * @param textNode Text edited, its absolute position and scale place the textarea
   * @returns the textarea, added to the layout
   */
  private _createTextarea(textNode: Text) {
    // zoom and scale of text and its groups
    const scale = textNode.getAbsoluteScale().x;
    const fontSize = textNode.fontSize() * scale;
    // room around text: glyphs higher than line height (accents) or italic overhang would be cut by textarea,
    // textarea is moved back by the same amount so text stays exactly on canvas text
    const spacing = Math.ceil(fontSize * 0.25);
    const textPosition = textNode.absolutePosition();
    const textPadding = textNode.padding() * scale;
    const textarea = document.createElement('textarea');
    // colors of drawing in dark mode
    textarea.classList.add('drawer-text-editor');
    this.drawer.layout.add('floating', textarea);

    textarea.value = textNode.text();
    textarea.style.position = 'absolute';
    // konva places lines like css (font box centered in line height); in the drawer, wherever it is in the page (below
    // the bar of an app...)
    placeInView(this.drawer, textarea, textPosition.x + textPadding - spacing, textPosition.y + textPadding - spacing);
    // content width is text width (border-box), so lines wrap the same way
    textarea.style.width = `${(textNode.width() - textNode.padding() * 2) * scale + spacing * 2}px`;
    textarea.style.height = `${(textNode.height() - textNode.padding() * 2) * scale + spacing * 2}px`;
    textarea.style.fontSize = `${fontSize}px`;
    textarea.style.border = 'none';
    textarea.style.padding = `${spacing}px`;
    textarea.style.margin = '0px';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'none';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.zIndex = '999';
    textarea.style.lineHeight = textNode.lineHeight().toString();
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.fontStyle = textNode.fontStyle().includes('italic') ? 'italic' : 'normal';
    textarea.style.fontWeight = textNode.fontStyle().includes('bold') ? 'bold' : 'normal';
    textarea.style.textDecoration = textNode.textDecoration();
    textarea.style.opacity = textNode.opacity().toString();
    // rotation around text position, not textarea corner
    textarea.style.transformOrigin = `${spacing}px ${spacing}px`;
    textarea.style.textAlign = textNode.align();
    // texts are filled with a color, not a gradient
    textarea.style.color = textNode.fill() as string;
    // titles of frames: one line, field widened while typing (see `_initEventsTextarea`)
    if (getFrameOfTitle(textNode)) {
      textarea.wrap = 'off';
      textarea.style.whiteSpace = 'pre';
    }

    return textarea;
  }

  /**
   * Textarea grows with its content; Enter or a click out of it sets the text, Escape keeps the previous one.
   * Then textarea removed, text shown again (removed if empty, except frame titles which rename their frame) and
   * change fired; edited after a click of this tool: see `_afterEdit`.
   * @param textNode Text edited, hidden until the textarea is removed
   * @param textarea Textarea over the text, created by `_createTextarea`
   */
  private _initEventsTextarea(textNode: Text, textarea: HTMLTextAreaElement) {
    const byTool = this.#byTool;

    this.#byTool = false;

    const title = !!getFrameOfTitle(textNode);
    // titles of frames on one line: pasted line breaks become spaces
    const value = () => (title ? textarea.value.replace(/\s*\n\s*/g, ' ') : textarea.value);
    const minWidth = textarea.offsetWidth;
    const removeTextarea = () => {
      // keep focus on clicked element (e.g. font select of text overlay)
      const hasFocus = document.activeElement === textarea;
      textarea.parentNode?.removeChild(textarea);
      window.removeEventListener('pointerdown', handleOutsideClick, true);
      window.removeEventListener('click', handleOutsideClick, true);
      this.isEditing = false;
      if (hasFocus) this.drawer.focus();

      const selectWidget = this.drawer.toolbar.getWidget<SelectWidget>('selection');
      // hidden during edition
      selectWidget?.transformer.show();

      // title of frame: its name, never empty
      const frame = getFrameOfTitle(textNode);

      if (frame) this.drawer.setShapeLabel(frame, textNode.text(), false);

      // Do not keep empty text (new text cancelled with Escape or validated empty)
      if (!frame && textNode.text() === '') {
        textNode.destroy();
        selectWidget?.transformer.nodes([]);
        selectWidget?.hideOverlay();
        // tool kept, as after a simple click of a shape tool
        if (byTool && this.drawer.activeWidget === this) this.showToolOverlay();
        return;
      }

      textNode.show();
      selectWidget?.transformer.forceUpdate();

      this.drawer.stage.fire('change');
      if (byTool && this.drawer.activeWidget === this) this._afterEdit(textNode);
    };

    // title wider than the field: field widened, not wrapped into the frame
    textarea.addEventListener('input', () => {
      if (!title) return;
      textarea.style.width = `${minWidth}px`;
      textarea.style.width = `${Math.max(minWidth, textarea.scrollWidth + 2)}px`;
    });
    textarea.addEventListener('keydown', (e) => {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight + textNode.fontSize()}px`;
      // Enter or Escape ending a composition (Chinese, Japanese, Korean...): text still edited
      if (isComposing(e)) return;
      // hide on enter (also of the numeric keypad)
      // but don't hide on shift + enter (new line, not in titles of frames)
      if (e.key === 'Enter' && !e.shiftKey) {
        textNode.text(value());
        removeTextarea();
      } else if (e.key === 'Enter' && title) {
        e.preventDefault();
      }
      // on esc do not set value back to node
      if (e.key === 'Escape') {
        removeTextarea();
      }
    });

    const handleOutsideClick = (e: Event) => {
      if (e.target !== textarea) {
        textNode.text(value());
        removeTextarea();
        // press on the canvas, tool kept: its click adds no text (pointer down comes before konva mouse down and
        // touch start, see `initEvents`)
        this.#pressEndedEdit =
          e.type === 'pointerdown' &&
          this.drawer.activeWidget === this &&
          this.drawer.stage.content.contains(e.target as globalThis.Node);
      }
    };
    setTimeout(() => {
      // capture phase, so text is committed before the press is handled (e.g. text overlay buttons); pointer down
      // for touch too (a tap on the canvas gives no click: konva prevents the default of touch start), click for
      // buttons activated with the keyboard
      const options = { capture: true, signal: this.drawer.signal };

      window.addEventListener('pointerdown', handleOutsideClick, options);
      window.addEventListener('click', handleOutsideClick, options);
    });
  }
}
