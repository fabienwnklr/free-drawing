import type { Container } from 'konva/lib/Container';
import { Group } from 'konva/lib/Group';
import type { Node } from 'konva/lib/Node';
import { Rect } from 'konva/lib/shapes/Rect';
import { Text } from 'konva/lib/shapes/Text';
import type { DrawingShape } from '@/@types/drawer';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import { drawerEvents, shapeLabels, shapeName } from '@/constants';
import type { Drawer } from '@/Drawer';
import { getBoundText, getContainer, isContainer } from '@/utils/boundText';
import { isComposing, uniqueId } from '@/utils/dom';
import { getFrameContent, getShapeFrame, isFrame } from '@/utils/frame';
import { getSlideTitle, inReadingOrder } from '@/utils/slides';

/** Name of the outline of the shape reached without selection (read only), in the selection layer */
export const navigationOutlineName = 'drawer-navigation-outline';

/** Space between a shape reached without selection and its outline, on screen in px */
const outlinePadding = 4;

/**
 * Keyboard navigation between the shapes of the drawing, with the focus on the drawer itself (not on its buttons or
 * fields): Enter reaches the first shape, Tab / Shift + Tab the next / previous one in reading order among the shapes
 * of the same drawing, frame or group (around at the end), Enter the shapes of a group or frame (or edits a text),
 * Shift + Enter the group or frame of the shape, Escape leaves the shapes (then Tab goes to the interface). The shape
 * reached is selected (outlined in read only: no selection there), shown in the view and described to screen readers:
 * name, type, text, shapes inside, ends of an arrow, link, locked, number among its shapes
 */
export class ShapeNavigation {
  /** Drawer whose shapes are reached */
  drawer: Drawer;
  /** Keys of the navigation, read by screen readers with the name of the drawer (`aria-describedby`) */
  $description: HTMLSpanElement;
  /** Shape reached without selection (read only), outlined */
  #current: DrawingShape | null = null;
  /** Outline of the shape reached without selection, in the selection layer */
  #outline: Rect | null = null;

  /**
   * Description of the keys given to the drawer; the outline follows its shape (changes of other users) and is removed
   * once the drawer can be modified again
   * @param drawer Drawer whose shapes are reached
   */
  constructor(drawer: Drawer) {
    this.drawer = drawer;
    this.$description = document.createElement('span');
    this.$description.id = uniqueId('drawer-navigation');
    this.$description.hidden = true;
    drawer.i18n.translate((t) => (this.$description.textContent = t('navigation.description')));
    drawer.layout.add('floating', this.$description);
    drawer.$drawerContainer.setAttribute('aria-describedby', this.$description.id);

    drawer.on(drawerEvents.change, () => this._placeOutline());
    drawer.on(drawerEvents.readOnlyChange, () => this._outline(null));
  }

  /**
   * Shape reached: the selected one (not the text of a selected shape), the outlined one without selection
   * @returns shape reached, null without one
   */
  get current(): DrawingShape | null {
    const selectWidget = this._selectWidget;

    if (!selectWidget) return this.#current;

    const nodes = selectWidget.transformer.nodes() as DrawingShape[];

    return nodes.find((node) => !getContainer(node, this.drawer.drawLayer)) ?? nodes[0] ?? null;
  }

  /**
   * Selection tool reaching the shapes, unless the drawer can't be modified (read only) or has no selection tool
   * @returns selection widget, undefined when shapes are outlined instead
   */
  private get _selectWidget(): SelectWidget | undefined {
    const selectWidget = this.drawer.getWidget<SelectWidget>('selection');

    return this.drawer.readOnly || selectWidget?.isDisabled ? undefined : selectWidget;
  }

  /**
   * Shapes reached from one another: visible drawing shapes of a parent, but texts of shapes (described with them), in
   * reading order
   * @param parent Draw layer, content of a frame or group
   * @returns shapes of the parent
   */
  getShapes(parent: Container = this.drawer.drawLayer): DrawingShape[] {
    const layer = this.drawer.drawLayer;
    const shapes = (parent.getChildren() as DrawingShape[]).filter(
      (shape) => shape.isVisible() && !getContainer(shape, layer)
    );

    return inReadingOrder(shapes, (shape) => shape.getClientRect({ relativeTo: layer }));
  }

  /**
   * Reach the next (or previous) shape among the shapes of the current one, the first (last) one of the drawing
   * without current shape
   * @param step 1 for the next shape, -1 for the previous one
   * @returns shape reached, null without shape
   */
  next(step: number = 1): DrawingShape | null {
    const current = this.current;
    const shapes = this.getShapes(current?.getParent() ?? this.drawer.drawLayer);
    const index = current ? shapes.indexOf(current) : -1;

    if (!shapes.length) return null;

    return this.reach(
      index < 0 ? shapes.at(step > 0 ? 0 : -1)! : shapes[(index + step + shapes.length) % shapes.length]
    );
  }

  /**
   * Reach the first shape of the current group or frame, the first shape of the drawing without current shape
   * @returns shape reached, null without shape inside (or a locked group: selected as a whole)
   */
  enter(): DrawingShape | null {
    const current = this.current;

    if (!current) return this.next();

    const inside = this._inside(current);
    const [first] = inside && (current.isListening() || !this._selectWidget) ? this.getShapes(inside) : [];

    return first ? this.reach(first) : null;
  }

  /**
   * Reach the group or frame of the current shape
   * @returns group or frame reached, null for a shape of the drawing
   */
  exit(): DrawingShape | null {
    const current = this.current;
    const parent = current?.getParent();

    if (!current || !parent || parent === this.drawer.drawLayer) return null;

    return this.reach(getShapeFrame(current) ?? (parent as Group));
  }

  /**
   * Shape reached: selected (with the selection tool), else outlined; shown in the view, described to screen readers
   * @param shape Shape of the drawing, of a frame or of a group
   * @returns the shape
   */
  reach(shape: DrawingShape): DrawingShape {
    const { drawer } = this;
    const selectWidget = this._selectWidget;

    if (selectWidget) {
      if (drawer.activeWidget !== selectWidget) selectWidget.setActive(true);
      selectWidget.select([shape]);
    } else {
      this._outline(shape);
    }
    drawer._showInView(shape.getClientRect({ relativeTo: drawer.drawLayer }));
    drawer._announce(this.describe(shape));

    return shape;
  }

  /**
   * Leave the shapes: selection cleared, outline removed
   */
  clear() {
    this._selectWidget?.clearSelection();
    this._outline(null);
  }

  /**
   * Description of a shape read by screen readers: name given by the user (title of a frame), type, text, number of
   * shapes inside, shapes linked by an arrow, link, locked, frame or group holding it, number among its shapes
   * @param shape Shape of the drawing, of a frame or of a group
   * @returns description in the language of the drawer
   */
  describe(shape: DrawingShape): string {
    const { drawer } = this;
    const layer = drawer.drawLayer;
    // attributes read from node (konva types those of each class, not of a shape or group)
    const node: Node = shape;
    const text = this._text(shape);
    const inside = this._inside(shape);
    const parent = shape.getParent();
    // frame, else group holding the shape (not the draw layer)
    const holder = getShapeFrame(shape) ?? (parent instanceof Group ? parent : null);
    const shapes = this.getShapes(parent ?? layer);
    const linkedName = (id: unknown) => {
      const linked = id ? layer.findOne((n: Node) => n.id() === id) : undefined;

      return linked ? this._name(linked as DrawingShape) : null;
    };
    const start = shape.hasName(shapeName.arrow) ? linkedName(node.getAttr('startBinding')) : null;
    const end = shape.hasName(shapeName.arrow) ? linkedName(node.getAttr('endBinding')) : null;
    const link = drawer.getShapeLink(shape);

    return [
      this._givenName(shape),
      this._type(shape),
      text && drawer.t('navigation.text', { text: text.replace(/\s*\n\s*/g, ', ') }),
      inside && drawer.t('navigation.shapes', { count: this.getShapes(inside).length }),
      start && drawer.t('navigation.from', { name: start }),
      end && drawer.t('navigation.to', { name: end }),
      link && drawer.t('navigation.link', { link }),
      !shape.isListening() && drawer.t('navigation.locked'),
      holder && drawer.t('navigation.in', { name: this._name(holder) }),
      drawer.t('navigation.index', { index: shapes.indexOf(shape) + 1, count: shapes.length }),
    ]
      .filter(Boolean)
      .join(', ');
  }

  /**
   * Short name of a shape in the description of another one (ends of an arrow, frame or group holding it)
   * @param shape Shape of the drawing
   * @returns name given by the user, else first line of its text, else its type
   */
  private _name(shape: DrawingShape): string {
    return this._givenName(shape) || this._text(shape)?.split('\n')[0].trim() || this._type(shape);
  }

  /**
   * Name given by the user to a shape
   * @param shape Shape of the drawing
   * @returns its name (title of a frame), empty without
   */
  private _givenName(shape: DrawingShape): string {
    const node: Node = shape;

    return isFrame(shape) ? getSlideTitle(shape) : String(node.getAttr('label') ?? '').trim();
  }

  /**
   * Text of a shape: a text, or the text of a rectangle, ellipse, path shape or arrow
   * @param shape Shape of the drawing
   * @returns its text, undefined without
   */
  private _text(shape: DrawingShape): string | undefined {
    const text = shape instanceof Text ? shape : isContainer(shape) ? getBoundText(shape, this.drawer.drawLayer) : null;

    return text?.text().trim() || undefined;
  }

  /**
   * Type of a shape
   * @param shape Shape of the drawing
   * @returns translated type (rectangle, note, frame...), class name of a shape of a plugin
   */
  private _type(shape: DrawingShape): string {
    const type = Object.keys(shapeLabels).find((name) => shape.hasName(name));

    return type ? this.drawer.t(shapeLabels[type]) : shape.getClassName();
  }

  /**
   * Keys of the navigation, with the focus on the drawer itself (its buttons and fields keep their keys). Called by
   * `HotKey`
   * @param e Keydown of the drawer
   * @returns true when the key was used (its default prevented by `HotKey`)
   */
  handleKey(e: KeyboardEvent): boolean {
    if (e.target !== this.drawer.$drawerContainer || e.ctrlKey || e.metaKey || e.altKey || isComposing(e)) return false;

    // without shape reached, Tab goes to the interface of the drawer
    if (e.key === 'Tab') return !!this.current && !!this.next(e.shiftKey ? -1 : 1);
    if (e.key === 'Enter') return e.shiftKey ? !!this.exit() : this._enter();
    if (e.key === 'Escape' && this.current) {
      this.clear();
      this.drawer._announce(this.drawer.t('navigation.left'));
      return true;
    }

    return false;
  }

  /**
   * Enter: first shape of the drawing, of the group or frame reached, else text of the shape reached edited (as a
   * double click)
   * @returns true when a shape was reached or a text edited
   */
  private _enter(): boolean {
    const current = this.current;

    if (!current || this._inside(current)) return !!this.enter();

    const selectWidget = this._selectWidget;
    const textWidget = this.drawer.getWidget<TextWidget>('text');

    if (!selectWidget || !textWidget || !current.isListening() || !(current instanceof Text || isContainer(current))) {
      return false;
    }

    // a text of a shape left empty is removed (and the selection with it): the shape selected again
    const onEnd = () => {
      if (current.getLayer()) selectWidget.select([current]);
    };

    if (current instanceof Text) textWidget.editTextNode(current, onEnd);
    else textWidget.editTextOf(current, onEnd);

    return true;
  }

  /**
   * Shapes inside a shape
   * @param shape Shape of the drawing
   * @returns content of a frame, the group itself, null for other shapes
   */
  private _inside(shape: DrawingShape): Container | null {
    if (isFrame(shape)) return getFrameContent(shape);

    return shape instanceof Group ? shape : null;
  }

  /**
   * Outline the shape reached without selection, remove the outline
   * @param shape Shape reached, null to remove the outline
   */
  private _outline(shape: DrawingShape | null) {
    this.#current = shape;
    if (!shape) {
      this.#outline?.destroy();
      this.#outline = null;
      return;
    }
    this._placeOutline();
  }

  /**
   * Place the outline around the shape reached without selection (created again once the selection layer is emptied),
   * removed with its shape
   */
  private _placeOutline() {
    const shape = this.#current;
    const { selectionLayer, drawLayer } = this.drawer;

    if (!shape) return;
    if (!shape.getLayer() || !shape.isVisible()) {
      this._outline(null);
      return;
    }
    if (!this.#outline?.getLayer()) {
      this.#outline = new Rect({
        name: navigationOutlineName,
        stroke: '#646cff',
        strokeWidth: 2,
        dash: [6, 4],
        strokeScaleEnabled: false,
        listening: false,
      });
      selectionLayer.add(this.#outline);
    }

    const box = shape.getClientRect({ relativeTo: drawLayer });
    const padding = outlinePadding / this.drawer.getZoomLevel();

    this.#outline.setAttrs({
      x: box.x - padding,
      y: box.y - padding,
      width: box.width + padding * 2,
      height: box.height + padding * 2,
    });
    selectionLayer.batchDraw();
  }
}
