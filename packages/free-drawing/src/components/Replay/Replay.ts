import { Group } from 'konva/lib/Group';
import type { Shape } from 'konva/lib/Shape';
import { Line } from 'konva/lib/shapes/Line';
import { Text } from 'konva/lib/shapes/Text';
import type { DrawingShape } from '@/@types/drawer';
import type { TranslationKey } from '@/@types/i18n';
import type { ReplayState, ReplayStep } from '@/@types/ui';
import '@/components/Slideshow/slideshow.scss';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { drawerEvents, shapeName } from '@/constants';
import type { Drawer } from '@/Drawer';
import CloseIcon from '@/icons/close.svg?raw';
import PauseIcon from '@/icons/pause.svg?raw';
import PlayIcon from '@/icons/play.svg?raw';
import ReplayIcon from '@/icons/replay.svg?raw';
import { createButton, hasFocusOutside, isComposing, setLabel } from '@/utils/dom';
import { frameParts, getFrameContent, isFrame, withFrameShapes, type Frame } from '@/utils/frame';
import { keyLetter } from '@/utils/HotKey';
import { inCreationOrder, outlineLength, partialStroke } from '@/utils/replay';
import { formatShortcut } from '@/utils/shortcut';

/** Name of the group of the copies of the shapes replayed, in the selection layer */
export const replayName = 'drawer-replay';

/** Speeds of the replay, in turn */
export const replaySpeeds = [1, 2, 4];

/** Pause after each shape, at speed 1 (ms) */
const replayGap = 150;

/** Part of the appearance of a filled outline spent drawing it: then its fill appears */
const outlinePart = 0.75;

/**
 * Replay of how a drawing was made: its shapes appear again one after the other, in the order they were created (time
 * of their ids), outlines drawn, brush strokes traced, texts typed, other shapes faded in. The drawing is not changed:
 * its layer is hidden (on screen only), copies of its shapes are drawn in the selection layer. Interface hidden but a
 * bar (start again, play / pause, number, speed, stop), the view on the whole drawing; Space plays or pauses, Left /
 * Right show the previous / next shape, Home / End the start / the whole drawing, Escape stops. View, tool and
 * interface come back once it stops
 */
export class Replay {
  /** Drawer whose drawing is replayed */
  drawer: Drawer;
  /** Bar of the replay: start again, play / pause, number of the shape, speed, stop */
  $bar: HTMLDivElement;
  /** Button starting the replay again */
  $restartButton: HTMLButtonElement;
  /** Button playing or pausing the replay */
  $playButton: HTMLButtonElement;
  /** Number of the shape appearing and of the shapes */
  $count: HTMLSpanElement;
  /** Button changing the speed (1×, 2×, 4×) */
  $speedButton: HTMLButtonElement;
  /** Button stopping the replay */
  $stopButton: HTMLButtonElement;
  /** Shapes replayed, in the order they were created */
  steps: ReplayStep[] = [];
  /** Index of the shape appearing in `steps` (the ones before it shown whole), its length once finished, -1 stopped */
  index = -1;
  /** Shapes appear (else paused) */
  playing = false;
  /** Speed (`replaySpeeds`) */
  speed = 1;
  /** Time spent on the shape appearing, at speed 1 (ms) */
  #elapsed = 0;
  /** Copies of the shapes, in the selection layer (null while stopped) */
  #group: Group | null = null;
  /** State of the drawer before the replay, given back once it stops */
  #state: ReplayState | null = null;
  /** Animation frame of the replay playing */
  #frame = 0;
  /** Time of the last animation frame */
  #last = 0;

  /**
   * Create the hidden bar in the floating region; the replay stops once the drawing is loaded again (selection layer
   * emptied)
   * @param drawer Drawer whose drawing is replayed
   */
  constructor(drawer: Drawer) {
    this.drawer = drawer;

    this.$bar = document.createElement('div');
    this.$bar.classList.add('drawer-slideshow-bar', 'drawer-replay-bar', 'tool');
    this.$bar.setAttribute('role', 'group');
    this.$bar.hidden = true;
    this.$restartButton = this._createButton(ReplayIcon, 'replay.restart', 'Home', () => this.goTo(0, true));
    this.$playButton = this._createButton(PauseIcon, 'replay.pause', 'Space', () => this.toggle());
    this.$count = document.createElement('span');
    this.$count.classList.add('drawer-slideshow-count');
    this.$speedButton = createButton('drawer-button', 'drawer-button-neutral', 'drawer-replay-speed');
    this.$speedButton.addEventListener('click', () => {
      this.setSpeed(replaySpeeds[(replaySpeeds.indexOf(this.speed) + 1) % replaySpeeds.length]);
    });
    this.$stopButton = this._createButton(CloseIcon, 'replay.stop', 'Escape', () => this.stop());
    drawer.i18n.translate((t) => {
      this.$bar.setAttribute('aria-label', t('replay.label'));
      this._updateBar();
    });
    this.$bar.append(this.$restartButton, this.$playButton, this.$count, this.$speedButton, this.$stopButton);
    drawer.layout.add('floating', this.$bar);

    // drawing loaded: copies gone
    drawer.on(drawerEvents.change, () => {
      if (this.active && !this.#group?.getLayer()) this.stop();
    });
  }

  /**
   * Replay going on
   * @returns True while the drawing is replayed (also paused or finished)
   */
  get active(): boolean {
    return this.index >= 0;
  }

  /**
   * Start the replay from the first shape created, the view on the whole drawing. Without shape, told in a toast
   * @returns True when it started, false without shape
   */
  start(): boolean {
    const { drawer } = this;

    if (this.active) return true;

    const shapes = inCreationOrder(withFrameShapes(drawer.getDrawingShapes()).filter((shape) => shape.isVisible()));

    if (!shapes.length) {
      drawer.toast(drawer.t('replay.empty'), 'info');
      return false;
    }

    this.#state = {
      position: drawer.stage.position(),
      scale: drawer.getZoomLevel(),
      tool: drawer.activeWidget ?? null,
    };
    drawer.getWidget<SelectWidget>('selection')?.clearSelection();
    // the view only can move
    this._activate(drawer.getWidget<BaseWidget>('pan') ?? null);
    drawer.$drawerContainer.classList.add('is-presenting');
    this.$bar.hidden = false;
    // drawing hidden on screen only: never saved nor sent
    drawer.drawLayer.getNativeCanvasElement().style.visibility = 'hidden';
    this.#group = new Group({ name: replayName, listening: false });
    drawer.selectionLayer.add(this.#group);
    this.#group.moveToBottom();
    this.steps = this._createSteps(shapes);
    drawer.zoomToFit();
    this.index = 0;
    this.#elapsed = 0;
    this.play();
    drawer.focus();
    drawer.trigger(drawerEvents.replayChange, this.index);

    return true;
  }

  /**
   * Shapes appear again, from the start once finished
   */
  play() {
    if (!this.active) return;
    if (this.index >= this.steps.length) this.goTo(0);
    this.playing = true;
    this.#last = performance.now();
    cancelAnimationFrame(this.#frame);
    this.#frame = requestAnimationFrame((now) => this._tick(now));
    this._updateBar();
  }

  /**
   * Shapes stop appearing, the shape appearing stays as it is
   */
  pause() {
    this.playing = false;
    cancelAnimationFrame(this.#frame);
    this._updateBar();
  }

  /**
   * Play when paused (or finished), pause when playing
   */
  toggle() {
    if (this.playing) this.pause();
    else this.play();
  }

  /**
   * Speed of the replay
   * @param speed 1, 2 or 4 (`replaySpeeds`)
   */
  setSpeed(speed: number) {
    this.speed = speed;
    this._updateBar();
  }

  /**
   * Time passes: the shape appearing goes on, the next ones after it (each one, then a short pause)
   * @param time Time passed (ms), multiplied by the speed
   */
  advance(time: number) {
    let left = time * this.speed;
    const start = this.index;

    while (left > 0 && this.index < this.steps.length) {
      const step = this.steps[this.index];
      const total = step.duration + replayGap;
      const used = Math.min(left, total - this.#elapsed);

      this.#elapsed += used;
      left -= used;
      step.apply(Math.min(1, this.#elapsed / step.duration));
      if (this.#elapsed >= total) {
        this.index += 1;
        this.#elapsed = 0;
      }
    }
    if (this.index >= this.steps.length && this.playing) {
      this.pause();
      this.drawer._announce(this.drawer.t('replay.finished'));
    }
    this.drawer.selectionLayer.batchDraw();
    if (this.index !== start) {
      this._updateBar();
      this.drawer.trigger(drawerEvents.replayChange, this.index);
    }
  }

  /**
   * Shapes before a step shown whole, the others hidden: replay from there
   * @param index Index of the shape appearing next (length of `steps`: whole drawing)
   * @param play Play from there
   */
  goTo(index: number, play: boolean = false) {
    if (!this.active) return;

    this.index = Math.min(Math.max(index, 0), this.steps.length);
    this.#elapsed = 0;
    for (const [i, step] of this.steps.entries()) step.apply(i < this.index ? 1 : 0);
    this.drawer.selectionLayer.batchDraw();
    this._updateBar();
    this.drawer.trigger(drawerEvents.replayChange, this.index);
    if (play) this.play();
  }

  /**
   * Stop the replay: drawing, interface, tool and view of the drawer given back
   */
  stop() {
    if (!this.active) return;

    const { drawer } = this;
    const state = this.#state!;

    this.pause();
    this.index = -1;
    this.steps = [];
    this.#state = null;
    this.#group?.destroy();
    this.#group = null;
    drawer.drawLayer.getNativeCanvasElement().style.visibility = '';
    drawer.selectionLayer.batchDraw();
    this.$bar.hidden = true;
    drawer.$drawerContainer.classList.remove('is-presenting');
    drawer._setView(state.position, state.scale);
    this._activate(state.tool && !state.tool.isDisabled ? state.tool : null);
    if (!hasFocusOutside(drawer.$drawerContainer)) drawer.focus();
    drawer.trigger(drawerEvents.replayChange, -1);
  }

  /**
   * Keys of the drawer during the replay (see `HotKey`): play / pause, previous / next shape, start, end, stop. Other
   * keys do nothing in the drawer, shortcuts of the browser (Ctrl / Cmd) are kept
   * @param e Key pressed in the drawer
   */
  handleKey(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey || isComposing(e)) return;
    // button of the bar pressed with the keyboard: its own action
    if ((e.key === 'Enter' || e.key === ' ') && (e.target as HTMLElement).closest('button')) return;

    if (e.altKey) {
      if (!e.shiftKey || keyLetter(e) !== 'r') return;
      this.stop();
    } else if (e.key === ' ') {
      this.toggle();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      this.pause();
      this.goTo(this.index + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      this.pause();
      this.goTo(this.index - 1);
    } else if (e.key === 'Home') {
      this.goTo(0, this.playing);
    } else if (e.key === 'End') {
      this.pause();
      this.goTo(this.steps.length);
    } else if (e.key === 'Escape') {
      this.stop();
    } else {
      return;
    }
    e.preventDefault();
  }

  /**
   * Animation frame: time passed since the previous one
   * @param now Time of the frame
   */
  private _tick(now: number) {
    if (!this.playing) return;

    // tab hidden meanwhile: one step at most
    this.advance(Math.min(now - this.#last, 500));
    this.#last = now;
    if (this.playing) this.#frame = requestAnimationFrame((time) => this._tick(time));
  }

  /**
   * Copies of the shapes and their appearance: shapes of frames in the copy of their frame (cut by it), shown at their
   * own time
   * @param shapes Shapes of the drawing and of its frames, in the order they were created
   * @returns Steps of the replay, every copy hidden
   */
  private _createSteps(shapes: DrawingShape[]): ReplayStep[] {
    const group = this.#group!;
    const frames = new Map<Frame, Frame>();
    const copyOf = (shape: DrawingShape) => {
      const copy = shape.clone() as DrawingShape;

      // never found for a shape of the drawing (ids searched in the stage)
      for (const node of [copy, ...('find' in copy ? copy.find(() => true) : [])]) node.id('');
      // frames without their shapes: they come at their own time
      if (isFrame(copy)) {
        getFrameContent(copy).destroyChildren();
        frames.set(shape as Frame, copy);
      }

      return copy;
    };
    // frames before their shapes, whatever their time
    const ordered = [...shapes.filter(isFrame), ...shapes.filter((shape) => !isFrame(shape))];
    const copies = new Map(ordered.map((shape) => [shape, copyOf(shape)]));

    for (const shape of shapes) {
      const copy = copies.get(shape)!;
      const frame = shape.getParent()?.getParent();
      const frameCopy = isFrame(frame) ? frames.get(frame) : undefined;

      if (frameCopy) getFrameContent(frameCopy).add(copy);
      else group.add(copy);
    }

    return shapes.map((shape) => {
      const step = this._createStep(shape, copies.get(shape)!);

      step.apply(0);
      return step;
    });
  }

  /**
   * Appearance of a shape: text typed, brush stroke traced, outline drawn (then its fill), other shapes faded in;
   * frames: their box and title only
   * @param shape Shape of the drawing
   * @param copy Its copy shown by the replay
   * @returns Step of the replay
   */
  private _createStep(shape: DrawingShape, copy: DrawingShape): ReplayStep {
    const opacity = copy.opacity();
    const fade = (node: DrawingShape | Shape, duration: number): ReplayStep => ({
      shape,
      copy,
      duration,
      apply: (progress) => {
        node.visible(progress > 0);
        node.opacity(opacity * progress);
      },
    });

    if (isFrame(copy)) {
      const parts = [copy.findOne(`.${frameParts.box}`), copy.findOne(`.${frameParts.title}`)];

      return {
        shape,
        copy,
        duration: 500,
        apply: (progress) => {
          for (const part of parts) part?.opacity(progress);
        },
      };
    }
    if (copy instanceof Text) {
      const text = copy.text();

      return {
        shape,
        copy,
        duration: Math.min(2000, 200 + text.length * 40),
        apply: (progress) => {
          copy.visible(progress > 0);
          copy.text(text.slice(0, Math.ceil(text.length * progress)));
        },
      };
    }
    // brush, highlighter: traced
    if (
      copy instanceof Line &&
      copy.closed() &&
      (copy.hasName(shapeName.line) || copy.hasName(shapeName.highlighter))
    ) {
      const points = copy.points();

      return {
        shape,
        copy,
        duration: Math.min(1500, 200 + points.length * 4),
        apply: (progress) => {
          copy.visible(progress > 0);
          copy.points(partialStroke(points, progress));
        },
      };
    }

    // solid outline: drawn by a moving dash, then its fill
    const length = outlineLength(copy);
    const outlined = copy as Shape;

    if (!length || !outlined.strokeEnabled?.() || !outlined.strokeWidth?.() || outlined.dash?.()?.length) {
      return fade(copy, 500);
    }

    const fill = outlined.fillEnabled();

    return {
      shape,
      copy,
      duration: 800,
      apply: (progress) => {
        const drawn = Math.min(1, progress / outlinePart);

        outlined.visible(progress > 0);
        outlined.dash(drawn < 1 ? [length, length] : []);
        outlined.dashOffset(length * (1 - drawn));
        outlined.fillEnabled(fill && progress >= outlinePart);
      },
    };
  }

  /**
   * Number of the shape appearing in the bar, play button as playing or paused, speed
   */
  private _updateBar() {
    const { t } = this.drawer.i18n;
    const label: TranslationKey = this.playing ? 'replay.pause' : 'replay.play';

    this.$count.textContent = this.active
      ? t('replay.count', { current: Math.min(this.index + 1, this.steps.length), total: this.steps.length })
      : '';
    this.$playButton.innerHTML = this.playing ? PauseIcon : PlayIcon;
    setLabel(this.$playButton, t(label));
    this.$playButton.title = `${t(label)} (${formatShortcut('Space', t)})`;
    this.$speedButton.textContent = `${this.speed}×`;
    setLabel(this.$speedButton, t('replay.speed', { speed: this.speed }));
  }

  /**
   * Tool activated (pan during the replay, the previous tool after it), none deactivates the active one
   * @param tool Tool to activate, null for none
   */
  private _activate(tool: BaseWidget | null) {
    if (tool && !tool.isDisabled) tool.setActive(true);
    else this.drawer.activeWidget?.setActive(false);
  }

  /**
   * Button of the bar: icon, name with its key
   * @param icon Svg markup
   * @param label Key of its name
   * @param shortcut Key doing the same, shown in its tooltip
   * @param action Run on click
   * @returns Button
   */
  private _createButton(icon: string, label: TranslationKey, shortcut: string, action: () => void) {
    const $btn = createButton('drawer-button', 'drawer-button-neutral');

    $btn.innerHTML = icon;
    this.drawer.i18n.translate((t) => {
      setLabel($btn, t(label));
      $btn.title = `${t(label)} (${formatShortcut(shortcut, t)})`;
    });
    $btn.addEventListener('click', action);

    return $btn;
  }
}
