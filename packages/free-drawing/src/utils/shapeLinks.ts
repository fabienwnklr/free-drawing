import { Group } from 'konva/lib/Group';
import type { KonvaEventObject, Node } from 'konva/lib/Node';
import { Path } from 'konva/lib/shapes/Path';
import { Rect } from 'konva/lib/shapes/Rect';
import type { DrawingShape } from '@/@types/drawer';
import type { Drawer } from '@/Drawer';
import LinkIcon from '@/icons/link.svg?raw';
import { isFrame } from '@/utils/frame';
import { parseLink } from '@/utils/link';

/** Name of the group of link icons, in the selection layer */
export const shapeLinksName = 'drawer-shape-links';

/** Name of the icon of a shape link (a click opens it) */
export const shapeLinkName = 'drawer-shape-link';

/** Size of a link icon on screen in px, whatever the zoom */
const iconSize = 22;

/** Space between the box of a shape (and its resize anchors) and its link icon, on screen in px */
const iconGap = 8;

/** Color of link icons: primary color of the drawer (canvas: no css variable) */
const iconColor = '#646cff';

/** Path of the link icon, from its svg file (box of 24) */
const linkPath = [...LinkIcon.matchAll(/ d="([^"]+)"/g)].map(([, d]) => d).join(' ');

/**
 * Icons of shapes having a link (`Drawer.setShapeLink`) in the selection layer, at their top right corner (end of the
 * title row of frames): same size whatever the zoom, a click opens the link (also in read only), its address shown on
 * hover. Placed again each time the drawing is drawn (moves, zoom, changes, loading...), not exported
 */
export class ShapeLinks {
  /** Drawer whose shape links are shown */
  drawer: Drawer;
  /** Group of icons in view coordinates (stage transform cancelled), created again once the selection layer is emptied */
  #group: Group | null = null;
  /** Icon of each shape with a link */
  #icons = new Map<Node, Group>();

  /**
   * Show icons of linked shapes, updated after each drawing of the draw layer
   * @param drawer Drawer whose shape links are shown
   */
  constructor(drawer: Drawer) {
    this.drawer = drawer;
    drawer.drawLayer.on('draw.links', () => this.update());
  }

  /**
   * Icons of visible shapes with a link (shapes of groups and frames too) created, placed at their shape or removed
   */
  update() {
    const { drawer } = this;
    const linked = drawer.drawLayer.find((node: Node) => node.isVisible() && !!parseLink(node.getAttr('link')));

    if (!linked.length && !this.#icons.size) return;

    // selection layer emptied (drawing loaded): icons created again
    if (!this.#group?.getLayer()) {
      this.#group = new Group({ name: shapeLinksName });
      this.#icons.clear();
      drawer.selectionLayer.add(this.#group);
    }

    const { stage } = drawer;
    const scale = stage.scaleX();

    // children in view coordinates, as client rects of shapes
    this.#group.setAttrs({ x: -stage.x() / scale, y: -stage.y() / scale, scaleX: 1 / scale, scaleY: 1 / scale });

    for (const [node, icon] of this.#icons) {
      if (linked.includes(node)) continue;
      icon.destroy();
      this.#icons.delete(node);
    }
    for (const node of linked) {
      const icon = this.#icons.get(node) ?? this._createIcon(node, this.#group);
      const box = node.getClientRect();

      // frames: end of their title row, other shapes: out of their top right corner
      icon.position({
        x: isFrame(node) ? box.x + box.width - iconSize : box.x + box.width + iconGap,
        y: box.y - iconSize - iconGap,
      });
    }
    drawer.selectionLayer.batchDraw();
  }

  /**
   * Icon opening the link of a shape on click, its address shown on hover
   * @param node shape with a link
   * @param group group of icons
   * @returns icon added to the group
   */
  private _createIcon(node: Node, group: Group): Group {
    const { drawer } = this;
    const icon = new Group({ name: shapeLinkName });
    const scale = (iconSize - 6) / 24;
    // press on the icon: not on the drawing (no selection, drawing nor panning)
    const stop = (e: KonvaEventObject<Event>) => {
      e.cancelBubble = true;
    };

    icon.add(
      new Rect({ width: iconSize, height: iconSize, cornerRadius: 6, fill: '#fff', stroke: iconColor, strokeWidth: 1 }),
      new Path({
        data: linkPath,
        x: 3,
        y: 3,
        scaleX: scale,
        scaleY: scale,
        stroke: iconColor,
        strokeWidth: 1.75,
        lineCap: 'round',
        lineJoin: 'round',
        listening: false,
      })
    );
    icon.on('mousedown touchstart', stop);
    icon.on('mousemove', (e) => {
      // pointer action going on (drawing, selection rectangle...): not stopped by the icon
      if (drawer._duringAction()) return;
      stop(e);
      drawer.$stageContainer.style.cursor = 'pointer';
    });
    icon.on('mouseenter', () => {
      drawer.$stageContainer.title = parseLink(node.getAttr('link')) ?? '';
    });
    icon.on('mouseleave', () => {
      drawer.$stageContainer.title = '';
      drawer.activeWidget?.updateCursor();
    });
    icon.on('click tap', (e) => {
      stop(e);
      // main button only
      if ((e.evt as MouseEvent).button) return;
      drawer.openShapeLink(node as DrawingShape);
    });
    group.add(icon);
    this.#icons.set(node, icon);

    return icon;
  }
}
