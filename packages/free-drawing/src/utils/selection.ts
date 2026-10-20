import type { IRect } from 'konva/lib/types';
import type { ViewArea } from '@/@types/ui';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { Drawer } from '@/Drawer';
import { getFrameTitle, isFrame } from '@/utils/frame';

/**
 * Box around boxes
 * @param boxes boxes in the same coordinates, one at least
 * @returns smallest box containing them
 */
export function unionRect(boxes: IRect[]): IRect {
  const x = Math.min(...boxes.map((box) => box.x));
  const y = Math.min(...boxes.map((box) => box.y));

  return {
    x,
    y,
    width: Math.max(...boxes.map((box) => box.x + box.width)) - x,
    height: Math.max(...boxes.map((box) => box.y + box.height)) - y,
  };
}

/**
 * Box of selected shapes in view while elements next to the selection are shown (selection menu, link editor)
 * @param drawer drawer whose selection is placed
 * @returns client rect around selected shapes (view coordinates), null without selection, in read only, during a
 * pointer action, a drag or a transform, or out of view
 */
export function getSelectionBox(drawer: Drawer): IRect | null {
  const transformer = drawer.getWidget<SelectWidget>('selection')?.transformer;
  const nodes = transformer?.nodes() ?? [];

  if (
    !transformer ||
    !nodes.length ||
    !transformer.isVisible() ||
    drawer.readOnly ||
    drawer._duringAction() ||
    transformer.isTransforming() ||
    nodes.some((node) => node.isDragging())
  ) {
    return null;
  }

  const box = unionRect(nodes.map((node) => node.getClientRect()));
  const { stage } = drawer;

  // out of view
  if (box.x > stage.width() || box.y > stage.height() || box.x + box.width < 0 || box.y + box.height < 0) return null;

  return box;
}

/**
 * Box of the selection with what is drawn around it, to place elements out of it: transformer (box, resize and
 * rotation anchors wherever rotation puts them) and titles of selected frames (above their box)
 * @param drawer drawer with a selection widget and selected shapes
 * @returns client rect in view coordinates
 */
export function getSelectionSurroundings(drawer: Drawer): IRect {
  const transformer = drawer.getWidget<SelectWidget>('selection')!.transformer;

  // hidden anchors are not counted
  return unionRect([
    transformer.getClientRect(),
    ...drawer
      .getSelectedShapes()
      .filter(isFrame)
      .map((frame) => getFrameTitle(frame).getClientRect()),
  ]);
}

/**
 * Part of the view where elements next to the selection are placed: without its edges, the options panel (right) nor
 * the toolbar of the footer
 * @param drawer drawer showing them
 * @param gap space kept from the edges (px)
 * @returns edges of the area in view (px)
 */
export function getPlacementArea(drawer: Drawer, gap: number): ViewArea {
  const { stage } = drawer;
  const view = drawer.$stageContainer.getBoundingClientRect();
  // options of the tool or of the selection shown
  const panels = [...drawer.$drawerContainer.querySelectorAll<HTMLElement>('.drawer-overlay-container.show')]
    .map(($panel) => $panel.getBoundingClientRect())
    .filter((rect) => rect.width > 0);

  return {
    left: gap,
    top: gap,
    right: Math.min(stage.width(), ...panels.map((rect) => rect.left - view.left)) - gap,
    bottom: stage.height() - drawer.layout.$footer.offsetHeight - gap,
  };
}

/**
 * Element placed in view: absolute position in the drawer container (floating region) from view coordinates
 * @param drawer drawer holding the element
 * @param $el element of the floating region
 * @param left left of the element in view (px)
 * @param top top of the element in view (px)
 */
export function placeInView(drawer: Drawer, $el: HTMLElement, left: number, top: number) {
  const view = drawer.$stageContainer.getBoundingClientRect();
  const container = drawer.$drawerContainer.getBoundingClientRect();

  $el.style.left = `${left + view.left - container.left}px`;
  $el.style.top = `${top + view.top - container.top}px`;
}
