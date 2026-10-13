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

  constructor(drawer: Drawer) {
    super(drawer, 'text', 'Text', TextIcon, 't');

    this.overlay = new TextOverlay(drawer);
  }

  protected onActive(): void {
    this.initEvents();
    this.updateCursor();
    this.overlay.show();
  }
  protected onDesactive(): void {
    this.removeEvents();
    this.overlay.hide();
  }

  /**
   * Add text node to layer
   * @param text Text content
   * @returns
   */
  addTextNode(text: string = '') {
    const { x, y } = this.drawer._getRelativePointerPos();
    const draggable = this.drawer.activeTool === 'selection';
    const { textStyle } = this.drawer.options;

    const textNode = new Text({
      ...textStyle,
      text,
      x,
      y,
      name: shapeName.text,
      fill: this.drawer.options.strokeColor,
      opacity: this.drawer.options.opacity,
      draggable,
      // keep about the same number of characters per line whatever the font size
      width: textStyle.fontSize * 6,
    });

    if (text) {
      // fit width to the widest line (not the one with most characters)
      const widths = text.split('\n').map((line) => textNode.measureSize(line).width);
      textNode.width(Math.ceil(Math.max(...widths)));
    }
    this.addTextNodeEvents(textNode);

    this.drawer.drawLayer.add(textNode);

    const selectWidget = this.drawer.getWidget<SelectWidget>('selection');
    selectWidget?.setActive(true);

    return textNode;
  }

  addTextNodeEvents(textNode: Text) {
    textNode.on('dblclick', (e) => {
      this.editTextNode(e.target as Text);
    });
  }

  protected initEvents(): void {
    this.drawer.stage.on('click tap', () => {
      this.#lastText = this.addTextNode();
      this.editTextNode(this.#lastText);
    });
  }

  editTextNode(textNode: Text) {
    textNode.hide();
    const selectWidget = this.drawer.toolbar.getWidget<SelectWidget>('selection');
    selectWidget?.transformer.hide();
    const textarea = this._createTextarea(textNode);
    const rotation = textNode.rotation();
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

  private _createTextarea(textNode: Text) {
    const textPosition = textNode.absolutePosition();
    const areaPosition = {
      x: this.drawer.stage.container().offsetLeft + textPosition.x,
      y: this.drawer.stage.container().offsetTop + textPosition.y + 5,
    };
    const textarea = document.createElement('textarea');
    this.drawer.$drawerContainer.appendChild(textarea);

    textarea.value = textNode.text();
    textarea.style.position = 'absolute';
    textarea.style.top = areaPosition.y + 2 + 'px';
    textarea.style.left = areaPosition.x + 'px';
    textarea.style.width = (textNode.width() * textNode.scaleX() - textNode.padding() * 2) * this.drawer.stage.scaleX() + 'px';
    textarea.style.height = textNode.height() - textNode.padding() * 2 + 5 + 'px';
    textarea.style.fontSize = textNode.fontSize() * this.drawer.stage.scaleX() * textNode.scaleX() + 'px';
    textarea.style.border = 'none';
    textarea.style.padding = '0px';
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
    textarea.style.transformOrigin = 'left top';
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

  protected removeEvents(): void {
    this.drawer.stage.off('click tap');
  }
  public updateCursor(): void {
    this.drawer.$stageContainer.style.cursor = 'text';
  }
}
