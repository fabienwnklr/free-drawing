import { Drawer } from '@/Drawer';
import { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import TextIcon from '@/icons/text.svg?raw';
import { Text } from 'konva/lib/shapes/Text';
import { SelectWidget } from '@/components/toolbar/widgets/Select/Select';

export class TextWidget extends BaseWidget {
  #lastText!: Text;
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
  protected initEvents(): void {
    this.drawer.stage.on('click tap', () => {
      const { x, y } = this.drawer._getRelativePointerPos();

      this.#lastText = new Text({
        text: '',
        x,
        y,
        fontSize: 15,
        width: 50,
        name: 'text',
        padding: 5,
      });

      this.drawer.layer.add(this.#lastText);

      this.editTextNode(this.#lastText);

      setTimeout(() => {
        const selectWidget = this.drawer.toolbar.getWidget<SelectWidget>('selection');
        if (selectWidget) {
          selectWidget.setActive(true);
        }
      }, 100);

      this.#lastText.on('transform', function () {
        // reset scale, so only with is changing by transformer
        this.setAttrs({
          width: this.width() * this.scaleX(),
          scaleX: 1,
        });
      });

      this.#lastText.on('dblclick', (e) => {
        this.editTextNode(e.target as Text);
      });
    });
  }

  editTextNode(textNode: Text) {
    textNode.hide();
    const selectWidget = this.drawer.toolbar.getWidget<SelectWidget>('selection');
    if (selectWidget) {
      selectWidget.transformer.hide();
    }
    const textPosition = textNode.absolutePosition();
    const areaPosition = {
      x: this.drawer.stage.container().offsetLeft + textPosition.x,
      y: this.drawer.stage.container().offsetTop + textPosition.y + 5,
    };
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    textarea.value = textNode.text();
    textarea.style.position = 'absolute';
    textarea.style.top = areaPosition.y + 2 + 'px';
    textarea.style.left = areaPosition.x + 'px';
    textarea.style.width = textNode.width() - textNode.padding() * 2 + 'px';
    textarea.style.height = textNode.height() - textNode.padding() * 2 + 5 + 'px';
    textarea.style.fontSize = textNode.fontSize() + 'px';
    textarea.style.border = 'none';
    textarea.style.padding = '0px';
    textarea.style.margin = '0px';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'none';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.lineHeight = textNode.lineHeight().toString();
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.transformOrigin = 'left top';
    textarea.style.textAlign = textNode.align();
    textarea.style.color = textNode.fill();
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

    const removeTextarea = () => {
      textarea.parentNode?.removeChild(textarea);
      window.removeEventListener('click', handleOutsideClick);

      // Do not consider empty textarea
      if (textarea.value === '') {
        textNode.destroy();
        return;
      }

      textNode.show();

      const selectWidget = this.drawer.toolbar.getWidget<SelectWidget>('selection');
      selectWidget?.transformer.show();
      selectWidget?.transformer.forceUpdate();
    };

    const setTextareaWidth = (newWidth: number) => {
      // some extra fixes on different browsers
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
      if (isSafari || isFirefox) {
        newWidth = Math.ceil(newWidth);
      }

      const isEdge = document.DOCUMENT_NODE || /Edge/.test(navigator.userAgent);
      if (isEdge) {
        newWidth += 1;
      }
      textarea.style.width = newWidth + 'px';
      textarea.style.width = newWidth + 'px';
    };

    textarea.addEventListener('keydown', (e) => {
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

    textarea.addEventListener('keydown', () => {
      const scale = textNode.getAbsoluteScale().x;
      setTextareaWidth(textNode.width() * scale);
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + textNode.fontSize() + 'px';
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
