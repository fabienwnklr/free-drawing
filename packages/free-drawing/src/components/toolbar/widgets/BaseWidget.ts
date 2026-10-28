import type { AvailableTools, WidgetOptions, ToolOverlay } from '@/@types/toolbar';
import type { Drawer } from '@/Drawer';
import { stringToNode } from '@/utils/functions';
import { getWidgetOptions } from '@/utils/widgets';
import type { KonvaEventListener } from 'konva/lib/Node';
import type { Stage } from 'konva/lib/Stage';
import type { DrawingShape } from '@/@types/drawer';

import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { createButton, disableElement, enableElement, setLabel, setPressed } from '@/utils/dom';
import type { TranslationKey } from '@/@types/i18n';

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
  /** Button runs an action (`setActive(true)`), the widget never becomes the active tool (e.g. image tool) */
  readonly actionOnly: boolean = false;
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
  /** Window listeners of the pointer action in progress (pointer out of the canvas), removed when it ends */
  #actionListeners: AbortController | null = null;
  /** Finger of the touch action in progress (`Touch.identifier`), null for a mouse or an unknown finger */
  #touchId: number | null = null;
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

    drawer.i18n.translate((t) =>
      setLabel(this.$button, this.options.title ?? (drawer.i18n.has(key) ? t(key) : title ?? id))
    );
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
    // active tool disabled (its plugin disabled): another tool, its drawing stopped (read only chooses its own)
    if (disabled && !this.drawer.readOnly && this.drawer.activeWidget === this) this.drawer._leaveDisabledTool();
  }

  /** Widget can not be activated (see `setDisabled`) */
  get isDisabled() {
    return this.disabled;
  }

  /**
   * Listen stage events while widget is active.
   * Events are namespaced with widget id, so they are removed on deactivation without removing other listeners.
   * One pointer at a time: during a pointer action, another press (second finger, other button) is ignored, and a
   * touch action ends when its finger is lifted, where it is lifted. Touches of a two finger gesture are ignored.
   * @param events Space separated event names
   * @param handler Konva listener called with the stage event
   */
  protected onStage(events: string, handler: KonvaEventListener<Stage, any>) {
    const namespaced = events
      .split(' ')
      .map((event) => `${event}.${this.id}`)
      .join(' ');

    this.drawer.stage.on(namespaced, (e) => {
      const evt = e.evt as TouchEvent;

      // two finger gesture (zoom, move of the view): touches ignored until every finger is lifted
      if (this.drawer.gestures?.active && e.type.startsWith('touch')) return;
      // Space held: the view is moved
      if (this.drawer.spacePan?.active) return;
      if (this.inAction && (e.type === 'mousedown' || e.type === 'touchstart')) return;
      if (this.inAction && e.type === 'touchend') {
        const touch = [...(evt.changedTouches ?? [])].find(({ identifier }) => identifier === this.#touchId);

        // another finger lifted (finger unknown: one still on the screen)
        if (this.#touchId !== null ? !touch : evt.touches?.length) return;
        // konva points the first finger still on the screen
        if (touch)
          this.drawer.stage.setPointersPositions({ touches: [], changedTouches: [touch] } as unknown as TouchEvent);
      }

      const started = !this.inAction;

      handler.call(this.drawer.stage, e);
      // finger of the action started
      if (started && this.inAction) this.#touchId = evt.changedTouches?.[0]?.identifier ?? null;
    });
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
   * Overlay shown again (selection cleared), only for a tool showing it while active (not the frame tool, sharing the
   * overlay of shape tools: it would stay shown once the tool is changed)
   */
  showToolOverlay() {
    if (this.showOverlayOnActive) this.overlay?.show();
  }

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
   * Pointer action starts (pointer down): shortcuts are disabled and UI (toolbar, overlays...) ignores pointer, pointer
   * followed out of the canvas until it is released
   */
  protected startAction() {
    this.inAction = true;
    this.drawer.layout.setPointerEvents('none');
    this._followPointer();
  }

  /**
   * Pointer action cancelled (two finger gesture of the drawer: zoom and move of the view): its result is discarded
   * (`onCancel`: shape being drawn removed...), then it ends without change
   */
  cancelAction() {
    this.onCancel?.();
    if (this.inAction) this.endAction();
  }

  /**
   * Result of the pointer action discarded before it is cancelled (see `cancelAction`), also called without action
   */
  protected onCancel?(): void;

  /**
   * Pointer action ends (pointer up)
   */
  protected endAction() {
    this.inAction = false;
    this.#touchId = null;
    this.#actionListeners?.abort();
    this.#actionListeners = null;
    this.drawer.layout.setPointerEvents('all');
    this.drawer._onActionEnd();
  }

  /**
   * Pointer out of the canvas during a pointer action (konva listens to its canvas only): its moves and its release
   * are sent to the stage as konva events at its position, so the action follows it and ends where it is released.
   * Also ended by a mouse moved without pressed button (released while the window was left) or a cancelled touch
   */
  private _followPointer() {
    const { stage } = this.drawer;
    const controller = new AbortController();
    const { signal } = controller;
    const send = (type: string, evt: MouseEvent | TouchEvent) => {
      stage.setPointersPositions(evt);
      stage.fire(type, { evt });
    };
    const onMouse = (evt: MouseEvent) => {
      if (!this.inAction) return;

      const { target } = evt;
      // also fired on the window (not a node)
      const outside = !(target instanceof globalThis.Node && stage.content.contains(target));

      if (evt.type === 'mousemove' && evt.buttons === 0) send('mouseup', evt);
      else if (outside) send(evt.type, evt);
      else return;
      // released out of the canvas: konva forgets the pointer there
      if (outside && !this.inAction) {
        stage._pointerPositions = [];
        stage._changedPointerPositions = [];
      }
    };

    // action started again without end (second finger...): listened once
    this.#actionListeners?.abort();
    this.#actionListeners = controller;
    // before konva handles them on its canvas
    window.addEventListener('mousemove', onMouse, { capture: true, signal });
    window.addEventListener('mouseup', onMouse, { capture: true, signal });
    window.addEventListener('touchcancel', (evt) => this.inAction && send('touchend', evt), { capture: true, signal });
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
      // shortcuts of the drawer, unless the user is in a field or a dialog, or out of the drawer
      this.drawer._takeFocus();
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
