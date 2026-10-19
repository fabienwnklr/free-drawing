import type { AvailableTools, WidgetOptions } from '@/@types/toolbar';
import type { Drawer } from '@/Drawer';
import { stringToNode } from '@/utils/functions';
import { getWidgetOptions } from '@/utils/widgets';
import type { KonvaEventListener } from 'konva/lib/Node';
import type { Stage } from 'konva/lib/Stage';
import type { DrawingShape } from '@/@types/drawer';

/**
 * Options of a tool, shown while it is active (`BaseOverlay` and others)
 */
export type ToolOverlay = {
  /** Element of the overlay, in the `floating` region of the layout */
  $overlayContainer: HTMLElement;
  /** Show overlay: fields show options of given shapes (selection), else options of drawer */
  show(shapes?: DrawingShape[]): void;
  /** Hide overlay */
  hide(): void;
};
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { createButton, disableElement, enableElement, setLabel, setPressed } from '@/utils/dom';
import { type TranslationKey, en } from '@/i18n/en';

/**
 * Base of every toolbar widget (tool): button with icon and shortcut, widget options (`title`, `shortcut` from
 * `widgets` option) and lifecycle. `setActive(true)` deactivates the previous widget, then calls `initEvents`,
 * `updateCursor`, shows `overlay` and calls `onActive`; deactivation calls `removeEvents`, hides `overlay` and
 * calls `onDesactive`. Pointer actions are wrapped in `startAction` / `endAction`.
 */
export abstract class BaseWidget {
  /** Container of the button in toolbar (or menu of its group), with a class from widget id */
  protected readonly $container: HTMLElement;
  /** Icon of the button */
  private $icon: SVGElement;
  /** Widget can not be activated, see `setDisabled` */
  private disabled: boolean = false;
  /** Button activating the widget, pressed while it is active, named by the title of the tool */
  $button: HTMLButtonElement;
  /** Id of the tool, key of the widget in toolbar (`drawer.getWidget(id)`) and namespace of its stage events */
  id: AvailableTools;
  /** Key activating the tool, lower case (`shortcut` widget option, else default of the widget), none if undefined */
  shortcut: string | undefined;
  /** Options of the tool (color, width...), shown while widget is active (see `showOverlayOnActive`) */
  declare overlay?: ToolOverlay;
  /** Widget options given with drawer `widgets` option */
  readonly options: WidgetOptions;
  /** Pointer action in progress (drawing, erasing, selecting...), see `startAction` / `endAction` */
  inAction: boolean = false;
  /** Show `overlay` while widget is active (false when overlay depends on something else, e.g. selection) */
  protected showOverlayOnActive: boolean = true;
  /** Stage cursor while widget is active */
  protected cursor: string = 'default';

  /**
   * Create the button of the widget (added to toolbar by `addTo`) and its shortcut
   * @param drawer Drawer of this widget
   * @param id Id of the tool, also its translation key `tools.<id>`
   * @param title Title of the button without `title` option nor translation of the id
   * @param $icon Icon of the button: svg element or svg markup
   * @param shortcut Default key activating the tool, replaced by `shortcut` option
   */
  constructor(
    /** Drawer of this widget */
    protected drawer: Drawer,
    id: AvailableTools,
    title: string,
    $icon: SVGElement | string,
    shortcut?: string
  ) {
    this.id = id;
    this.options = getWidgetOptions(drawer.options.widgets, id);
    this.$container = document.createElement('div');
    this.$container.classList.add(
      `drawer-tool-container`,
      `drawer-tool-button-container`,
      `drawer-internal-widgetId--${id.replace(/\W/g, '-')}`
    );
    this.$button = createButton('drawer-button');
    // title option, else translated title of tool
    const key = `tools.${id}` as TranslationKey;

    drawer.i18n.translate((t) => setLabel(this.$button, this.options.title ?? (key in en ? t(key) : title ?? id)));
    setPressed(this.$button, false);
    this.$icon = typeof $icon === 'string' ? stringToNode<SVGElement>($icon) : $icon;
    // compared to lower case key (caps lock), false disables shortcut
    this.shortcut = this.options.shortcut === false ? undefined : (this.options.shortcut ?? shortcut)?.toLowerCase();
    if (this.shortcut) this.$button.setAttribute('aria-keyshortcuts', this.shortcut.toUpperCase());

    this._initEvents();
  }

  /**
   * Adds the button of this widget (icon, shortcut letter) in its container, at the end of `parent`
   * @param parent Element receiving the button container: toolbar root or menu of a group
   * @internal
   */
  addTo(parent: HTMLElement) {
    this.$container.appendChild(this.$button);

    this.$button.append(this.$icon);
    if (this.shortcut) {
      const $shortcut = document.createElement('div');
      $shortcut.classList.add('tool-key-shortcut');
      // announced with aria-keyshortcuts
      $shortcut.setAttribute('aria-hidden', 'true');
      $shortcut.textContent = this.shortcut;
      this.$button.append($shortcut);
    }
    parent.appendChild(this.$container);
  }

  /**
   * Disable / enable widget, a disabled widget can not be activated
   */
  toggleDisable() {
    this.setDisabled(!this.disabled);
  }

  /**
   * Disable or enable widget: a disabled widget can not be activated and its button is disabled (also its group
   * when all its widgets are). Drawing tools are disabled in read only.
   * @param disabled Disable widget
   */
  setDisabled(disabled: boolean) {
    this.disabled = disabled;

    if (disabled) {
      disableElement(this.$button);
    } else {
      enableElement(this.$button);
    }
    // group disabled with its widgets
    this.drawer.toolbar?.update();
  }

  /** Widget can not be activated (see `setDisabled`) */
  get isDisabled() {
    return this.disabled;
  }

  /**
   * Listen stage events while widget is active.
   * Events are namespaced with widget id, so they are removed on deactivation without removing other listeners.
   * @param events Space separated event names
   * @param handler Konva listener called with the stage event
   */
  protected onStage(events: string, handler: KonvaEventListener<Stage, any>) {
    const namespaced = events
      .split(' ')
      .map((event) => `${event}.${this.id}`)
      .join(' ');

    this.drawer.stage.on(namespaced, handler);
  }

  /**
   * Add widget events (with `onStage`), called on activation
   */
  protected initEvents(): void {}

  /**
   * Remove widget events, called on deactivation
   */
  protected removeEvents(): void {
    this.drawer.stage.off(`.${this.id}`);
  }

  /**
   * Called on activation, after events, cursor and overlay setup
   */
  protected onActive(): void {}

  /**
   * Called on deactivation, after events removal and overlay hidden
   */
  protected onDesactive(): void {}

  /**
   * Shift pressed or released during a pointer action (square, circle, straight line...), without pointer move
   * @param constrain Shift pressed
   */
  protected onConstrainChange?(constrain: boolean): void;

  /**
   * Set stage cursor to the `cursor` of widget: on activation, and to restore it after a temporary one (pan grabbing)
   */
  public updateCursor(): void {
    this.drawer.$stageContainer.style.cursor = this.cursor;
  }

  /**
   * Pointer action starts (pointer down): shortcuts are disabled and UI (toolbar, overlays...) ignores pointer
   */
  protected startAction() {
    this.inAction = true;
    this.drawer.layout.setPointerEvents('none');
  }

  /**
   * Pointer action ends (pointer up)
   */
  protected endAction() {
    this.inAction = false;
    this.drawer.layout.setPointerEvents('all');
    this.drawer._onActionEnd();
  }

  /**
   * Shapes being drawn shown to collaborators while drawing (final state is sent on change)
   * @param shapes Shapes in their current state, sent as a live change of the collaboration session
   */
  protected shareLive(...shapes: DrawingShape[]) {
    this.drawer.collaboration?.sendLive(shapes);
  }

  /**
   * Unselect shapes, with selection widget (implemented by it)
   */
  clearSelection() {
    this.drawer.getWidget<SelectWidget>('selection')?.clearSelection();
  }

  /**
   * Shape drawn with this tool: selection tool activated, nothing selected, unless tool is kept (`keepTool` preference)
   */
  protected afterDraw() {
    const selectWidget = this.drawer.getWidget<SelectWidget>('selection');

    if (this.drawer.options.keepTool || !selectWidget || selectWidget.isDisabled) return;

    selectWidget.setActive(true);
  }

  /**
   * Button click activates widget. Shift pressed or released during a pointer action of the active widget calls
   * `onConstrainChange`. Listened while widget exists, unlike `initEvents`.
   */
  private _initEvents() {
    this.$button.addEventListener('click', () => {
      this.setActive(true);
    });

    const onShift = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && this.inAction && this.drawer.activeWidget === this) {
        this.onConstrainChange?.(e.type === 'keydown');
      }
    };

    this.drawer.$drawerContainer.addEventListener('keydown', onShift);
    this.drawer.$drawerContainer.addEventListener('keyup', onShift);
  }

  /**
   * Activate widget (nothing if disabled): previous widget deactivated, button pressed, then `initEvents`,
   * `updateCursor`, `overlay` shown (if `showOverlayOnActive`), `onActive` and drawer focused.
   * Deactivate it: pointer action ended, `removeEvents`, `overlay` hidden, `onDesactive`, button released.
   * @param active Activate (true) or deactivate (false) widget
   */
  setActive(active: boolean) {
    if (active) {
      if (this.disabled) return;

      if (this.drawer.activeWidget) {
        this.drawer.activeWidget.setActive(false);
      }
      this.drawer.toolbar.setActiveWidget(this);
      setPressed(this.$button, true);
      this.initEvents();
      this.updateCursor();
      if (this.showOverlayOnActive) this.overlay?.show();
      this.onActive();
      this.drawer.focus();
    } else {
      // pointer action stopped by tool change: shortcuts and UI usable again
      if (this.inAction) this.endAction();
      this.removeEvents();
      if (this.showOverlayOnActive) this.overlay?.hide();
      this.onDesactive();
      setPressed(this.$button, false);
    }
  }
}
