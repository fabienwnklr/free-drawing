import { Drawer } from '@/Drawer';
import { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import TextIcon from '@/icons/text.svg?raw';
import { Text } from 'konva/lib/shapes/Text';
import { SelectWidget } from '@/components/toolbar/widgets/Select/Select';

export class TextWidget extends BaseWidget {
  #lastText!: Text;
  isEditing: boolean = false;

  constructor(drawer: Drawer) {
    super(drawer, 'text', 'Text', TextIcon);
  }

  protected onActive(): void {
    this.initEvents();
    this.updateCursor();
  }
  protected onDesactive(): void {
    this.removeEvents();
  }

  /**
   * Add text node to layer
   * @param text Text content
   * @returns
   */
  addTextNode(text: string = '') {
    const { x, y } = this.drawer._getRelativePointerPos();
    const draggable = this.drawer.activeTool === 'selection';

    const textNode = new Text({
      text,
      x,
      y,
      fontFamily: 'Ubuntu',
      fontSize: 15,
      name: 'text',
      draggable,
      width: 100,
    });

    if (text) {
      textNode.width(textNode.measureSize(text).width);
    }
    this.addTextNodeEvents(textNode);

    this.drawer.layer.add(textNode);

    const selectWidget = this.drawer.toolbar.getWidget<SelectWidget>('selection');
    if (selectWidget) {
      selectWidget.setActive(true);
    }

    return textNode;
  }

  addTextNodeEvents(textNode: Text) {
    textNode.on('transform', function () {
      // reset scale, so only with is changing by transformer
      this.setAttrs({
        width: this.width() * this.scaleX(),
        scaleX: 1,
      });
    });

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
    if (selectWidget) {
      selectWidget.transformer.hide();
    }
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
    textarea.style.width = (textNode.width() - textNode.padding() * 2) * this.drawer.stage.scaleX() + 'px';
    textarea.style.height = textNode.height() - textNode.padding() * 2 + 5 + 'px';
    textarea.style.fontSize = textNode.fontSize() * this.drawer.stage.scaleX() + 'px';
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
    textarea.style.transformOrigin = 'left top';
    textarea.style.textAlign = textNode.align();
    textarea.style.color = textNode.fill();

    return textarea;
  }

  private _initEventsTextarea(textNode: Text, textarea: HTMLTextAreaElement) {
    const removeTextarea = () => {
      textarea.parentNode?.removeChild(textarea);
      window.removeEventListener('click', handleOutsideClick);
      this.isEditing = false;
      this.drawer.$drawerContainer.focus();
      // Do not consider empty textarea
      if (textarea.value === '') {
        textNode.destroy();
        return;
      }

      textNode.show();

      const selectWidget = this.drawer.toolbar.getWidget<SelectWidget>('selection');
      selectWidget?.transformer.show();
      selectWidget?.transformer.forceUpdate();

      this.drawer.stage.fire('change')
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
      window.addEventListener('click', handleOutsideClick);
    });
  }

  protected removeEvents(): void {
    this.drawer.stage.off('click tap');
  }
  public updateCursor(): void {
    this.drawer.$stageContainer.style.cursor = 'text';
  }
}
