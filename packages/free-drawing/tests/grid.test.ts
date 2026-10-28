import { describe, expect, it } from 'vitest';
import type { Context } from 'konva/lib/Context';
import { Rect } from 'konva/lib/shapes/Rect';
import type { Shape } from 'konva/lib/Shape';
import type { GridStyle } from '@/@types/drawer';
import { gridSize, shapeName } from '@/constants';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { drawGrid, gridRotationSnaps, gridShapeStyle, gridStep, snapToGrid } from '@/utils/grid';
import { createDrawer } from './helpers';

/**
 * Grid drawn in an area, as segments and dots
 * @param style Style of the grid
 * @param scale Zoom level
 * @returns Segments drawn (from, to) and dots (rectangles)
 */
const drawn = (style: GridStyle, scale = 1) => {
  const lines: number[][] = [];
  const dots: number[][] = [];
  let from: number[] = [];
  const ctx = {
    beginPath() {},
    moveTo: (x: number, y: number) => (from = [x, y]),
    lineTo: (x: number, y: number) => lines.push([...from, x, y]),
    rect: (x: number, y: number, w: number) => dots.push([x + w / 2, y + w / 2]),
    strokeShape() {},
    fillShape() {},
  } as unknown as Context;

  drawGrid(ctx, {} as Shape, { x: 0, y: 0, width: 200, height: 120 }, scale, style);

  return { lines, dots };
};

describe('Grid styles', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Drawn in the view: squares, dots at their crossings, lines of ruled paper, triangles of isometric paper', () => {
    const squares = drawn('squares');

    // vertical then horizontal lines every gridSize
    expect(squares.lines.filter(([x1, , x2]) => x1 === x2).map(([x]) => x)).toEqual([0, 40, 80, 120, 160, 200]);
    expect(squares.lines.filter(([, y1, , y2]) => y1 === y2).map(([, y]) => y)).toEqual([0, 40, 80, 120]);
    expect(drawn('dots').dots).toHaveLength(6 * 4);
    expect(drawn('dots').dots[1]).toEqual([0, 40]);
    expect(drawn('lines').lines.every(([, y1, , y2]) => y1 === y2)).toBe(true);

    // isometric: vertical lines and lines at 30 degrees through the corners of the triangles
    const isometric = drawn('isometric').lines;
    const angles = new Set(
      isometric.map(([x1, y1, x2, y2]) => Math.round((Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI))
    );

    expect([...angles].sort((a, b) => a - b)).toEqual([-30, 30, 90]);
    expect(gridShapeStyle('dots')).toMatchObject({ fill: expect.any(String) });
    expect(gridShapeStyle('squares')).toMatchObject({ dash: [3, 3] });

    // zoomed out: lines at least 10 px apart on screen, lines of the grid all the same
    expect(gridStep(1)).toBe(gridSize);
    expect(gridStep(0.1)).toBe(gridSize * 4);
    expect(
      drawn('squares', 0.1)
        .lines.filter(([x1, , x2]) => x1 === x2)
        .map(([x]) => x)
    ).toEqual([0, 160]);
  });

  it('Snapped to the grid: crossings, heights of the lines, corners of the triangles; rotation by 30 degrees', () => {
    expect(snapToGrid({ x: 47, y: 75 }, 'squares')).toEqual({ x: 40, y: 80 });
    expect(snapToGrid({ x: 47, y: 75 }, 'dots')).toEqual({ x: 40, y: 80 });
    expect(snapToGrid({ x: 47, y: 75 }, 'lines')).toEqual({ x: 47, y: 80 });

    // second column of corners: shifted by half a side
    const width = (gridSize * Math.sqrt(3)) / 2;
    const corner = snapToGrid({ x: width + 3, y: 22 }, 'isometric');

    expect(corner.x).toBeCloseTo(width);
    expect(corner.y).toBe(gridSize / 2);
    expect(snapToGrid({ x: -width - 2, y: -18 }, 'isometric')).toMatchObject({ y: -gridSize / 2 });
    expect(snapToGrid({ x: 4, y: 37 }, 'isometric')).toEqual({ x: 0, y: 40 });

    expect(gridRotationSnaps('squares')).toEqual([0, 90, 180, 270]);
    expect(gridRotationSnaps('isometric')).toHaveLength(12);
  });

  it('Style of the grid: preference drawn again, saved, read again; shapes dragged snap to it', async () => {
    const drawer = createDrawer({ language: 'en' });
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
    const gridShape = () => drawer.gridLayer.findOne<Shape>(`.${shapeName.gridLine}`)!;

    expect(drawer.options.gridStyle).toBe('squares');
    drawer.showGrid();
    expect(gridShape().dash()).toEqual([3, 3]);

    drawer.setGridStyle('isometric');
    expect(gridShape().dash()).toBeUndefined();
    expect(selectWidget.transformer.rotationSnaps()).toHaveLength(12);
    expect(drawer.getPreferences().gridStyle).toBe('isometric');
    await Promise.resolve();
    expect(JSON.parse(localStorage.getItem(`${drawer.options.localStorageKey}-preferences`)!).gridStyle).toBe(
      'isometric'
    );
    expect(createDrawer({ localStorageKey: drawer.options.localStorageKey }).options.gridStyle).toBe('isometric');

    // drag: snapped to the lines of ruled paper (height only)
    drawer.setPreferences({ gridStyle: 'lines' });

    const rect = drawer.addShape(new Rect({ name: shapeName.rect, x: 0, y: 0, width: 50, height: 50 })) as Rect;

    selectWidget.setActive(true);
    rect.fire('dragstart', { target: rect }, true);
    rect.position({ x: 13, y: 47 });
    rect.fire('dragmove', { target: rect }, true);
    expect(rect.position()).toEqual({ x: 13, y: 40 });
    rect.fire('dragend', { target: rect }, true);
  });

  it('Resize anchors snapped to the grid of the drawing, also with the view moved and zoomed', () => {
    const drawer = createDrawer();
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;

    drawer.showGrid();
    drawer.stage.scale({ x: 2, y: 2 });
    drawer.stage.position({ x: 15, y: 7 });

    // line x = 40 of the drawing is at 95 on screen
    const bound = selectWidget.gridAnchorBound!;

    expect(bound({ x: 92, y: 300 }, { x: 93, y: 301 })).toEqual({ x: 95, y: 300 });
    // far from the grid: not snapped
    expect(bound({ x: 120, y: 300 }, { x: 122, y: 301 })).toEqual({ x: 122, y: 301 });

    drawer.setGridStyle('lines');
    // line y = 40 at 87 on screen, x free
    expect(bound({ x: 122, y: 85 }, { x: 124, y: 86 })).toEqual({ x: 124, y: 87 });
  });

  it('Preferences dialog and command palette choose the style (the palette shows the grid)', () => {
    const drawer = createDrawer({ language: 'fr' });

    drawer.showPreferences();

    const modal = drawer.preferencesModal!;

    expect([...modal.$gridStyle.options].map(($o) => $o.text)).toEqual(['Carreaux', 'Points', 'Lignes', 'Isométrique']);
    modal.$gridStyle.value = 'dots';
    modal.save();
    expect(drawer.options.gridStyle).toBe('dots');

    drawer.showCommandPalette();

    const option = [...drawer.commandPalette!.$list.querySelectorAll<HTMLElement>('[role="option"]')].find(
      ($o) => $o.textContent?.includes('Grille : Isométrique')
    )!;

    option.click();
    expect([drawer.options.gridStyle, drawer.grid]).toEqual(['isometric', true]);
    drawer.commandPalette!.hide();
  });
});
