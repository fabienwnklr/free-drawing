import type { Drawer } from '@/Drawer';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import { arrowNavigation, createButton, disableElement, enableElement, setLabel, uniqueId } from '@/utils/dom';
import { stringToNode } from '@/utils/functions';
import ShapesIcon from '@/icons/shapes.svg?raw';
import MoreIcon from '@/icons/more.svg?raw';
import GridIcon from '@/icons/grid.svg?raw';
import PlusIcon from '@/icons/plus.svg?raw';
import ChevronIcon from '@/icons/chevron.svg?raw';
import PanIcon from '@/icons/pan.svg?raw';
import SelectIcon from '@/icons/select.svg?raw';
import BrushIcon from '@/icons/brush.svg?raw';
import EraserIcon from '@/icons/eraser.svg?raw';
import TextIcon from '@/icons/text.svg?raw';
import LineIcon from '@/icons/line2.svg?raw';
import SquareIcon from '@/icons/square.svg?raw';
import CircleIcon from '@/icons/circle.svg?raw';
import ArrowIcon from '@/icons/arrow.svg?raw';
import TriangleIcon from '@/icons/triangle.svg?raw';
import DiamondIcon from '@/icons/diamond.svg?raw';
import HeartIcon from '@/icons/heart.svg?raw';
import CloudIcon from '@/icons/cloud.svg?raw';
import HighlighterIcon from '@/icons/highlighter.svg?raw';
import LaserIcon from '@/icons/laser.svg?raw';
import FrameIcon from '@/icons/frame.svg?raw';
import type { GroupWidgetOptions } from '@/@types/toolbar';

/** Space between group button and its widgets, between widgets and drawer edges (px) */
const gap = 8;

/** Widgets per line of the menu of a group, at most */
export const groupColumns = 4;

/**
 * Icons of groups by name: generic ones, then icons of widgets
 */
export const groupIcons: Record<string, string> = {
  shapes: ShapesIcon,
  more: MoreIcon,
  grid: GridIcon,
  plus: PlusIcon,
  pan: PanIcon,
  selection: SelectIcon,
  brush: BrushIcon,
  eraser: EraserIcon,
  text: TextIcon,
  line: LineIcon,
  square: SquareIcon,
  circle: CircleIcon,
  arrow: ArrowIcon,
  triangle: TriangleIcon,
  diamond: DiamondIcon,
  heart: HeartIcon,
  cloud: CloudIcon,
  highlighter: HighlighterIcon,
  laser: LaserIcon,
  frame: FrameIcon,
};

/**
 * Svg code of options without what runs code (scripts, event attributes, javascript links), parsed in an inert
 * document (nothing loaded nor run)
 * @param code Svg markup given as group icon
 * @returns Svg element imported in the page, null when the code is not an svg
 */
function parseSvg(code: string): SVGElement | null {
  const svg = new DOMParser().parseFromString(code, 'image/svg+xml').documentElement;

  if (svg.nodeName !== 'svg') return null;

  for (const $el of svg.querySelectorAll('script, foreignObject')) $el.remove();
  for (const $el of [svg, ...svg.querySelectorAll('*')]) {
    [...$el.attributes].forEach(({ name, value }) => {
      if (/^on/i.test(name) || /^\s*javascript:/i.test(value)) $el.removeAttribute(name);
    });
  }

  return document.importNode(svg, true) as unknown as SVGElement;
}

/**
 * Icon of a group: name of `groupIcons` or svg code, default icon for an unknown name or invalid code
 * @param icon Name of `groupIcons` or svg markup, 'shapes' by default
 * @returns Decorative svg element (hidden to assistive technologies)
 */
export function getGroupIcon(icon: string = 'shapes'): SVGElement {
  const $icon = icon.trim().startsWith('<')
    ? parseSvg(icon)
    : groupIcons[icon]
    ? stringToNode<SVGElement>(groupIcons[icon])
    : null;

  if (!$icon) {
    console.warn(`[free-drawing] invalid icon of widget group "${icon.slice(0, 40)}", default one used`);
    return getGroupIcon();
  }
  // decorative, the button is named by its title
  $icon.setAttribute('aria-hidden', 'true');
  $icon.setAttribute('focusable', 'false');

  return $icon;
}

/**
 * Group of toolbar widgets: one button (generic icon by default) shows its widgets above it, highlighted while one
 * of them is active. Its widgets are still widgets of the toolbar (shortcuts, help, command palette, read only),
 * added with it by `toolbar.addGroup`.
 */
export class GroupWidget {
  /** Drawer of this group */
  readonly drawer: Drawer;
  /** Widgets of the group, in menu order */
  readonly widgets: BaseWidget[];
  /** Container of group button and menu in toolbar */
  readonly $container: HTMLDivElement;
  /** Button showing / hiding the menu (disclosure), highlighted while a widget of group is active */
  readonly $button: HTMLButtonElement;
  /** Menu of widget buttons (role `group`), above group button in fixed position, hidden until shown */
  readonly $menu: HTMLDivElement;

  /**
   * Create the group button and the menu of its widgets
   * @param drawer Drawer of this group
   */
  constructor(drawer: Drawer, { widgets, icon, title }: GroupWidgetOptions) {
    this.drawer = drawer;
    this.widgets = widgets;

    this.$container = document.createElement('div');
    this.$container.classList.add('drawer-tool-container', 'drawer-tool-group');
    this.$button = createButton('drawer-button', 'drawer-tool-group-button');
    this.$menu = document.createElement('div');
    this.$menu.classList.add('drawer-tool-group-menu', 'tool');
    this.$menu.id = uniqueId('tool-group');
    this.$menu.setAttribute('role', 'group');
    this.$menu.hidden = true;
    // disclosure: button shows / hides widgets
    this.$button.setAttribute('aria-expanded', 'false');
    this.$button.setAttribute('aria-controls', this.$menu.id);

    const $indicator = stringToNode<SVGElement>(ChevronIcon);

    $indicator.classList.add('drawer-tool-group-indicator');
    this.$button.append(getGroupIcon(icon), $indicator);
    drawer.i18n.translate((t) => {
      const label = title ?? t('toolbar.moreTools');

      setLabel(this.$button, label);
      this.$menu.setAttribute('aria-label', label);
    });

    // lines of `groupColumns` widgets, fewer columns for a smaller group
    this.$menu.style.setProperty('--drawer-group-columns', String(Math.min(groupColumns, widgets.length)));
    for (const widget of widgets) widget.addTo(this.$menu);
    this.$container.append(this.$button, this.$menu);
    this._initEvents();
  }

  /**
   * Adds group button and its widgets to `parent` (toolbar)
   * @param parent Toolbar root receiving the group container
   * @internal
   */
  addTo(parent: HTMLElement) {
    parent.append(this.$container);
    this.update();
  }

  /**
   * Menu of widgets is shown
   * @returns True while the menu is not hidden
   */
  isShown() {
    return !this.$menu.hidden;
  }

  /**
   * Show widgets, focus on active one (else first one): arrow keys move between them
   */
  show() {
    const enabled = this.widgets.filter((widget) => !widget.isDisabled);
    const focused = enabled.find((widget) => widget === this.drawer.activeWidget) ?? enabled[0];

    this.$menu.hidden = false;
    this.$button.setAttribute('aria-expanded', 'true');
    this._place();
    focused?.$button.focus();
  }

  /**
   * Hide widgets (widget chosen, Escape, focus or pointer elsewhere, footer scrolled, window resized)
   */
  hide() {
    this.$menu.hidden = true;
    this.$button.setAttribute('aria-expanded', 'false');
  }

  /**
   * Button highlighted while a widget of group is active, disabled when all its widgets are (read only)
   */
  update() {
    const disabled = this.widgets.every((widget) => widget.isDisabled);

    this.$button.classList.toggle('active', this.widgets.includes(this.drawer.activeWidget as BaseWidget));
    if (disabled) {
      disableElement(this.$button);
      this.hide();
    } else {
      enableElement(this.$button);
    }
  }

  /**
   * Widgets above group button, in drawer: fixed position, not cut by footer (scrolled on narrow screens)
   */
  private _place() {
    const button = this.$button.getBoundingClientRect();
    const drawer = this.drawer.$drawerContainer.getBoundingClientRect();

    // origin of fixed position: viewport, or a transformed element of the page
    this.$menu.style.left = '0px';
    this.$menu.style.top = '0px';

    const origin = this.$menu.getBoundingClientRect();
    const center = button.left + button.width / 2 - origin.width / 2;
    const left = Math.max(drawer.left + gap, Math.min(center, drawer.right - origin.width - gap));

    this.$menu.style.left = `${left - origin.left}px`;
    this.$menu.style.top = `${button.top - gap - origin.height - origin.top}px`;
  }

  /**
   * Button toggles widgets, arrow keys move between them (Up / Down: to the line above or below), Escape closes them
   * (focus back on button), closed when a widget is chosen, focus or pointer goes elsewhere, footer scrolls or window
   * is resized
   */
  private _initEvents() {
    this.$button.addEventListener('click', () => (this.isShown() ? this.hide() : this.show()));
    // widget chosen (activated by its button)
    this.$menu.addEventListener('click', (e) => {
      if ((e.target as Element).closest('button')) this.hide();
    });
    arrowNavigation(
      this.$menu,
      () => this.widgets.filter((widget) => !widget.isDisabled).map((widget) => widget.$button),
      'horizontal'
    );
    // widget of the line above or below (same column), if there is one and it is enabled
    this.$menu.addEventListener('keydown', (e) => {
      const buttons = this.widgets.map((widget) => widget.$button);
      const index = buttons.indexOf(e.target as HTMLButtonElement);
      const next = buttons[index + (e.key === 'ArrowDown' ? groupColumns : -groupColumns)];

      if (index < 0 || !['ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault();
      if (next && !next.disabled) next.focus();
    });
    // Escape closes widgets, focus back on group button (not a drawer shortcut)
    this.$container.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !this.isShown()) return;

      e.stopPropagation();
      this.hide();
      this.$button.focus();
    });
    // closed when focus or pointer goes elsewhere
    this.$container.addEventListener('focusout', (e) => {
      if (!this.$container.contains(e.relatedTarget as Node | null)) this.hide();
    });
    document.addEventListener(
      'pointerdown',
      (e) => {
        if (this.isShown() && !this.$container.contains(e.target as Node)) this.hide();
      },
      { capture: true, signal: this.drawer.signal }
    );
    // no longer above group button: footer or toolbar of a narrow drawer scrolled (scroll does not bubble: capture)
    this.drawer.layout.$footer.addEventListener('scroll', () => this.hide(), true);
    window.addEventListener('resize', () => this.hide(), { signal: this.drawer.signal });
  }
}
