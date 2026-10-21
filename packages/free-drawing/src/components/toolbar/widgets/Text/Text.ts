import type { Drawer } from '@/Drawer';
import { getFrameOfTitle } from '@/utils/frame';
import { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import TextIcon from '@/icons/text.svg?raw';
import { Text } from 'konva/lib/shapes/Text';
import type { Vector2d } from 'konva/lib/types';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { shapeName } from '@/constants';
import { TextOverlay } from '@/components/tools/Overlay/TextOverlay/TextOverlay';
import { isComposing, placeInView } from '@/utils/dom';

/**
 * Text tool: a click adds a text and edits it in a textarea placed over it. A double click on any text (or title of
 * a frame) edits it, whatever the active tool.
 */
export class TextWidget extends BaseWidget {
  #lastText!: Text;
  /** A text is edited in the textarea */
  isEditing: boolean = false;
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
      // texts and titles of frames
      const editable = e.target.hasName(shapeName.text) || !!getFrameOfTitle(e.target);

      if (e.target instanceof Text && editable && !this.drawer.readOnly) {
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
   * New text at a position of drawing (pointer by default, center of view when it is out of canvas), in the frame
   * containing it, then selection tool active
   * @param text Content, its width fits its longest line when given
   * @param position Top left corner of the text, in drawing coordinates
   * @returns The added text node
   */
  addTextNode(text: string = '', { x, y }: Vector2d = this.drawer._getRelativePointerPos()) {
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

    const selectWidget = this.drawer.getWidget<SelectWidget>('selection');
    selectWidget?.setActive(true);

    return textNode;
  }

  /**
   * Click adds an empty text at pointer and edits it (not right or middle button)
   */
  protected initEvents(): void {
    this.onStage('click tap', (e) => {
      if (e.evt.button > 0) return;
      this.#lastText = this.addTextNode();
      this.editTextNode(this.#lastText);
    });
  }

  /**
   * Edit a text in a textarea at its place (same font, size, rotation), text and transformer hidden meanwhile.
   * Enter or a click elsewhere validates, Shift + Enter adds a line, Escape cancels; an empty text is removed.
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
   * change fired.
   * @param textNode Text edited, hidden until the textarea is removed
   * @param textarea Textarea over the text, created by `_createTextarea`
   */
  private _initEventsTextarea(textNode: Text, textarea: HTMLTextAreaElement) {
    const title = !!getFrameOfTitle(textNode);
    // titles of frames on one line: pasted line breaks become spaces
    const value = () => (title ? textarea.value.replace(/\s*\n\s*/g, ' ') : textarea.value);
    const minWidth = textarea.offsetWidth;
    const removeTextarea = () => {
      // keep focus on clicked element (e.g. font select of text overlay)
      const hasFocus = document.activeElement === textarea;
      textarea.parentNode?.removeChild(textarea);
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
        return;
      }

      textNode.show();
      selectWidget?.transformer.forceUpdate();

      this.drawer.stage.fire('change');
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

    const handleOutsideClick = (e: MouseEvent) => {
      if (e.target !== textarea) {
        textNode.text(value());
        removeTextarea();
      }
    };
    setTimeout(() => {
      // capture phase, so text is committed before the click is handled (e.g. text overlay buttons)
      window.addEventListener('click', handleOutsideClick, true);
    });
  }
}
