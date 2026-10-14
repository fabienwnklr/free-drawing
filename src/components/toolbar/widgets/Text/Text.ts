import { Drawer } from '@/Drawer';
import { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import TextIcon from '@/icons/text.svg?raw';
import { Text } from 'konva/lib/shapes/Text';
import { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { shapeName } from '@/constants';
import { TextOverlay } from '@/components/tools/Overlay/TextOverlay/TextOverlay';

export class TextWidget extends BaseWidget {
  #lastText!: Text;
  isEditing: boolean = false;
  overlay: TextOverlay;
  protected cursor = 'text';

  constructor(drawer: Drawer) {
    super(drawer, 'text', 'Text', TextIcon, 't');

    this.overlay = new TextOverlay(drawer);

    // listen on layer, so any text is editable (created, loaded, restored from history...)
    this.drawer.drawLayer.on('dblclick.edit dbltap.edit', (e) => {
      if (e.target instanceof Text && e.target.hasName(shapeName.text) && !this.drawer.readOnly) {
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

    texts().forEach((text) => text._setTextData());
    this.drawer.drawLayer.batchDraw();
  }

  /**
   * Add text node to layer
   * @param text Text content
   * @returns
   */
  addTextNode(text: string = '') {
    const { x, y } = this.drawer._getRelativePointerPos();
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

    const selectWidget = this.drawer.getWidget<SelectWidget>('selection');
    selectWidget?.setActive(true);

    return textNode;
  }

  protected initEvents(): void {
    this.onStage('click tap', () => {
      this.#lastText = this.addTextNode();
      this.editTextNode(this.#lastText);
    });
  }

  editTextNode(textNode: Text) {
    textNode.hide();
    const selectWidget = this.drawer.toolbar.getWidget<SelectWidget>('selection');
    selectWidget?.transformer.hide();
    const textarea = this._createTextarea(textNode);
    // rotation of its groups too
    const rotation = textNode.getAbsoluteRotation();
    let transform = '';
    if (rotation) {
      transform += 'rotateZ(' + rotation + 'deg)';
    }

    let px = 0;
    // also we need to slightly move textarea on firefox
    // because it jumps a bit
    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    if (isFirefox) {
      px += 2 + Math.round(textNode.fontSize() / 20);
    }
    transform += 'translateY(-' + px + 'px)';

    textarea.style.transform = transform;

    // reset height
    textarea.style.height = 'auto';
    // after browsers resized it we can set actual value
    textarea.style.height = textarea.scrollHeight + 3 + 'px';

    textarea.focus();

    this.isEditing = true;
    this._initEventsTextarea(textNode, textarea);
  }

  /**
   * Vertical offset between canvas text and textarea text (unscaled): konva centers the middle of the em box
   * in each line, css centers the font box (ascent + descent). Negative when canvas text is higher.
   * @param {Text} textNode
   */
  private _baselineOffset(textNode: Text) {
    const ctx = document.createElement('canvas').getContext('2d');

    if (!ctx) return 0;

    ctx.font = textNode._getContextFont();
    ctx.textBaseline = 'alphabetic';
    const { fontBoundingBoxAscent: ascent, fontBoundingBoxDescent: descent } = ctx.measureText('M');
    ctx.textBaseline = 'middle';
    const middleAboveBaseline = ascent - ctx.measureText('M').fontBoundingBoxAscent;
    const offset = middleAboveBaseline - (ascent - descent) / 2;

    // font box metrics not supported (old browsers)
    return Number.isFinite(offset) ? offset : 0;
  }

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
    this.drawer.$drawerContainer.appendChild(textarea);

    textarea.value = textNode.text();
    textarea.style.position = 'absolute';
    textarea.style.top =
      this.drawer.stage.container().offsetTop +
      textPosition.y +
      textPadding -
      spacing +
      this._baselineOffset(textNode) * scale +
      'px';
    textarea.style.left = this.drawer.stage.container().offsetLeft + textPosition.x + textPadding - spacing + 'px';
    // content width is text width (border-box), so lines wrap the same way
    textarea.style.width = (textNode.width() - textNode.padding() * 2) * scale + spacing * 2 + 'px';
    textarea.style.height = (textNode.height() - textNode.padding() * 2) * scale + spacing * 2 + 'px';
    textarea.style.fontSize = fontSize + 'px';
    textarea.style.border = 'none';
    textarea.style.padding = spacing + 'px';
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
    textarea.style.color = textNode.fill();

    return textarea;
  }

  private _initEventsTextarea(textNode: Text, textarea: HTMLTextAreaElement) {
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

      // Do not keep empty text (new text cancelled with Escape or validated empty)
      if (textNode.text() === '') {
        textNode.destroy();
        selectWidget?.transformer.nodes([]);
        selectWidget?.hideOverlay();
        return;
      }

      textNode.show();
      selectWidget?.transformer.forceUpdate();

      this.drawer.stage.fire('change');
    };

    textarea.addEventListener('keydown', (e) => {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + textNode.fontSize() + 'px';
      // hide on enter
      // but don't hide on shift + enter
      if (e.code === 'Enter' && !e.shiftKey) {
        textNode.text(textarea.value);
        removeTextarea();
      }
      // on esc do not set value back to node
      if (e.code === 'Escape') {
        removeTextarea();
      }
    });

    const handleOutsideClick = (e: MouseEvent) => {
      if (e.target !== textarea) {
        textNode.text(textarea.value);
        removeTextarea();
      }
    };
    setTimeout(() => {
      // capture phase, so text is committed before the click is handled (e.g. text overlay buttons)
      window.addEventListener('click', handleOutsideClick, true);
    });
  }
}
