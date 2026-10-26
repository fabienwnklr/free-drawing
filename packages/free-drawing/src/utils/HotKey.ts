import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import type { ShapeOrder } from '@/@types/drawer';
import type { KeyboardLayoutNavigator } from '@/@types/ui';
import { unbindMoved } from '@/utils/binding';
import type { Drawer } from '@/Drawer';

/** Types of inputs with editable text */
const textInputTypes = ['text', 'search', 'number', 'email', 'url', 'tel', 'password'];

/** Letters of the keyboard layout by physical key (`KeyQ`: 'a' on AZERTY), read from the browser or typed */
const layoutLetters = new Map<string, string>();
/** Letters of the layout asked to the browser (once for the page) */
let layoutAsked = false;

/**
 * Letters of the keyboard layout from the Keyboard API (Chromium), once: letters typed since are kept (layout changed)
 */
function askLayout() {
  if (layoutAsked) return;
  layoutAsked = true;
  (navigator as KeyboardLayoutNavigator).keyboard
    ?.getLayoutMap?.()
    .then((map) => {
      for (const [code, key] of map) {
        if (/^[a-z]$/i.test(key) && !layoutLetters.has(code)) layoutLetters.set(code, key.toLowerCase());
      }
    })
    // not allowed (frame of another origin): letters typed only
    .catch(() => {});
}

/**
 * Letter of the physical key of a key event typed without Alt, remembered for the keys whose character Alt changes
 * @param e Key pressed
 */
function learnLetter(e: KeyboardEvent) {
  if (!e.altKey && /^[a-z]$/i.test(e.key) && /^Key[A-Z]$/.test(e.code)) layoutLetters.set(e.code, e.key.toLowerCase());
}

/**
 * Letter of a key event, in lowercase (whatever Shift or Caps Lock): the letter typed, else with Option of macOS
 * (changing it) the letter of its physical key on the keyboard layout (read in Chromium or typed before), else (keyboard
 * of another alphabet) the letter at its place on a QWERTY keyboard, as Ctrl shortcuts of systems. Not with AltGr
 * (Ctrl + Alt), which types other characters
 * @param e Key pressed
 * @returns Letter, or value of another key in lowercase (`delete`, `,`, `f2`...)
 */
export function keyLetter(e: KeyboardEvent): string {
  const key = e.key.toLowerCase();
  const code = /^Key([A-Z])$/.exec(e.code)?.[1];

  if (/^[a-z]$/.test(key) || !code || (e.ctrlKey && e.altKey)) return key;

  return (e.altKey && layoutLetters.get(e.code)) || code.toLowerCase();
}

/**
 * Key event of a shortcut: `Ctrl` (also Cmd), `Shift` and `Alt` exactly as given, then the key: a digit by its place
 * (Shift changes it), a letter by `keyLetter` (Alt and Caps Lock change characters), else by its value (`Delete`,
 * `F2`...)
 * @param e Key pressed
 * @param shortcut Keys separated by `+`, e.g. `Ctrl+Shift+M`, `Alt+P`, `Delete`
 * @returns true when the event is the shortcut
 */
export function matchesShortcut(e: KeyboardEvent, shortcut: string): boolean {
  const keys = shortcut.split('+').map((key) => key.trim().toLowerCase());
  const key = keys.pop() ?? '';
  const ctrl = keys.includes('ctrl') || keys.includes('cmd');

  if (ctrl !== (e.ctrlKey || e.metaKey) || keys.includes('shift') !== e.shiftKey || keys.includes('alt') !== e.altKey) {
    return false;
  }
  if (/^\d$/.test(key)) return e.code === `Digit${key}` || e.code === `Numpad${key}`;

  return keyLetter(e) === key;
}

/**
 * Keyboard shortcuts of drawer, listened on its container: tools, selection (move, delete, duplicate, group, order,
 * flip, rotate), history, files, panels. Nothing runs during a pointer action, shortcuts modifying the drawing do
 * nothing in read only.
 */
export class HotKey {
  /** Drawer whose shortcuts are handled */
  drawer: Drawer;

  /**
   * Listens to shortcuts on keydown of the drawer container
   * @param drawer drawer whose shortcuts are handled
   */
  constructor(drawer: Drawer) {
    this.drawer = drawer;

    const DELTA = 4;
    const arrowMoves: Record<string, { x: number; y: number }> = {
      ArrowLeft: { x: -DELTA, y: 0 },
      ArrowUp: { x: 0, y: -DELTA },
      ArrowRight: { x: DELTA, y: 0 },
      ArrowDown: { x: 0, y: DELTA },
    };
    // stacking order of selection with Ctrl / Cmd
    const orderKeys: Record<string, ShapeOrder> = {
      ArrowUp: 'forward',
      ArrowDown: 'backward',
      'Shift+ArrowUp': 'front',
      'Shift+ArrowDown': 'back',
    };
    // selection moved with arrow keys, saved on key release (not on each repeated keydown)
    let arrowMoved = false;

    askLayout();
    this.drawer.$drawerContainer.addEventListener('keydown', (e) => {
      learnLetter(e);
      if (this.drawer._duringAction()) return;

      // Ctrl on Windows / Linux, Cmd on Mac
      const mod = e.ctrlKey || e.metaKey;
      // whatever Caps Lock, Option of macOS, layout
      const letter = keyLetter(e);
      const selectWidget = this.drawer.getWidget<SelectWidget>('selection');
      const selectedNodes = selectWidget?.transformer.nodes() ?? [];
      // locked shapes are selected to be unlocked, not modified
      const locked = !!selectWidget?.isLocked();
      const editable = locked ? [] : selectedNodes;
      // fields keep their keys (arrows of opacity, select all of a text field...)
      const inField = (e.target as HTMLElement).matches('input, select, textarea');
      // Ctrl + A selects text of these fields, else text of page (range, checkbox...)
      const inTextField =
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLInputElement && textInputTypes.includes(e.target.type));
      // read only: shortcuts modifying drawing do nothing
      const edit = !this.drawer.readOnly;

      // commands of plugins, before shortcuts of the library
      if (!inField && this.drawer.plugins._runShortcut(e)) {
        e.preventDefault();
        return;
      }

      if (edit && (e.key === 'Backspace' || e.key === 'Delete')) {
        if (mod) {
          // asks confirmation, selection is kept if canceled
          this.drawer.clearCanvas();
        } else if (editable.length) {
          this.drawer.deleteShapes();
        }
      }

      if (mod && !e.shiftKey && letter === 'a' && !inTextField) {
        if (edit) selectWidget?.selectAll();
        // shapes, not page text (browser select all)
        e.preventDefault();
      }

      // instead of browser bookmark
      if (edit && mod && !e.shiftKey && letter === 'd' && editable.length && !inField) {
        e.preventDefault();
        this.drawer.duplicateShapes();
      }

      // instead of browser find next
      if (edit && mod && letter === 'g' && editable.length && !inField) {
        e.preventDefault();
        if (e.shiftKey) this.drawer.ungroupShapes();
        else this.drawer.groupShapes();
      }

      const order = mod ? orderKeys[`${e.shiftKey ? 'Shift+' : ''}${e.key}`] : undefined;

      if (edit && editable.length && order && !inField) {
        this.drawer.reorderShapes(order);
        e.preventDefault();
      } else if (edit && editable.length && e.key in arrowMoves && !inField) {
        // only arrow keys, other keys keep their default behavior (F5, Tab...)
        if (!arrowMoved) unbindMoved(editable);
        for (const shape of editable) shape.move(arrowMoves[e.key]);
        arrowMoved = true;
        e.preventDefault();
      }

      // flip or rotate selection by a quarter turn, fit width of texts (Shift + letter is not a tool shortcut)
      if (edit && !mod && !e.altKey && e.shiftKey && editable.length && !inField) {
        if (letter === 'h') this.drawer.flipShapes('horizontal');
        if (letter === 'v') this.drawer.flipShapes('vertical');
        if (letter === 'r') this.drawer.rotateShapes(90);
        if (letter === 'l') this.drawer.rotateShapes(-90);
        if (letter === 'w') this.drawer.fitTextWidth();
      }

      // lock selection, unlock locked one (still selected)
      if (edit && mod && e.shiftKey && letter === 'l' && selectedNodes.length && !inField) {
        e.preventDefault();
        this.drawer.setShapesLocked(!locked);
      }

      // copy the style of the selection, paste it on the selection (Ctrl + Alt: not AltGr typing a character, see
      // `keyLetter`)
      if (mod && e.altKey && !e.shiftKey && !inField && (letter === 'c' || letter === 'v')) {
        e.preventDefault();
        if (letter === 'c' && selectedNodes.length) this.drawer.copyStyle();
        if (letter === 'v' && edit && editable.length) this.drawer.pasteStyle();
      }

      // copy selection (whole drawing without selection) as image
      if (e.altKey && e.shiftKey && !mod && (letter === 'c' || letter === 's') && !inField) {
        e.preventDefault();
        this.drawer.copyImage(letter === 'c' ? 'png' : 'svg');
      }

      // Toolbar shortcut, the letter displayed on widget button (whatever caps lock)
      if (!mod && !e.altKey && !e.shiftKey) {
        const widget = Array.from(this.drawer.toolbar.widgets.values()).find((w) => w.shortcut === letter);

        if (widget) {
          widget.setActive(true);
          this.drawer.toolbar.getButton(widget).focus();
          return;
        }

        // keep tool after drawing (button of toolbar)
        if (letter === 'q' && this.drawer.toolbar.$keepToolButton && !inField) {
          this.drawer.setKeepTool(!this.drawer.options.keepTool);
        }
      }

      // view on the whole drawing, on the selection, at 100 %: keys of digits whatever the layout (Shift types them on
      // AZERTY), not in fields
      if (e.shiftKey && !mod && !e.altKey && !inField && this.drawer.options.zoom) {
        if (e.code === 'Digit1') this.drawer.zoomToFit();
        if (e.code === 'Digit2') this.drawer.zoomToSelection();
        if (e.code === 'Digit0') this.drawer.setZoomLevel(1);
      }

      // view options, not in fields (Option of macOS types other characters there)
      if (e.altKey && !e.shiftKey && !mod && !inField) {
        if (letter === 's') this.drawer.setting.toggleSnapping();
        if (letter === 'z') this.drawer.setting.toggleZenMode();
        if (letter === 'g') this.drawer.setting.toggleGrid();
        if (letter === 'l') this.drawer.layersPanel?.toggle();
        if (letter === 'b') this.drawer.libraryPanel?.toggle();
      }

      if (edit && mod && !e.shiftKey && letter === 'z') {
        this.drawer.undoRedo.undo();
      }

      // instead of browser save page and open file: drawing saved (storage, auto save off), Shift: file downloaded
      if (mod && !e.altKey && letter === 's') {
        e.preventDefault();
        if (e.shiftKey) this.drawer.saveAs();
        else this.drawer.saveNow();
      }

      if (mod && !e.shiftKey && letter === 'o') {
        e.preventDefault();
        if (edit) this.drawer.open();
      }

      if (mod && e.key === ',' && !inField) {
        e.preventDefault();
        this.drawer.showPreferences();
      }

      // search of the texts of the drawing, instead of the search of the page
      if (mod && !e.shiftKey && !e.altKey && letter === 'f') {
        e.preventDefault();
        this.drawer.search.show();
      }

      // instead of browser search
      if (mod && letter === 'k' && !inField && this.drawer.options.commandPalette) {
        e.preventDefault();
        this.drawer.showCommandPalette();
      }

      if (mod && e.shiftKey && letter === 'e') {
        e.preventDefault();
        this.drawer.showExport();
      }

      // Ctrl + Shift + Z: redo of macOS
      if (edit && mod && ((!e.shiftKey && letter === 'y') || (e.shiftKey && letter === 'z'))) {
        e.preventDefault();
        this.drawer.undoRedo.redo();
      }

      if (e.altKey && e.shiftKey && !mod && letter === 'd') {
        e.preventDefault();
        this.drawer.toggleDarkMode();
      }
    });

    this.drawer.$drawerContainer.addEventListener('keyup', (e) => {
      if (arrowMoved && e.key in arrowMoves) {
        arrowMoved = false;
        // frames entered or left shown
        this.drawer.frameHighlight.flash(this.drawer.placeInFrames(this.drawer.getSelectedShapes()));
        this.drawer.stage.fire('change');
      }
    });

    // Ctrl / Cmd + V, clipboard data is available without permission (unlike navigator.clipboard). Listened on the
    // document: out of editable elements, Chromium fires it on the body, not on the focused element
    document.addEventListener(
      'paste',
      (e) => {
        const target = e.target as HTMLElement;

        if (!this.drawer.$drawerContainer.contains(document.activeElement)) return;
        if (this.drawer._duringAction() || this.drawer.readOnly) return;
        // pasted in a field of the drawer (search, name, link, radius...): text of the field
        if (target.matches('input, textarea, select') || target.isContentEditable) return;

        // image copied (screenshot, file, image of a page): added at the pointer
        const image = [...(e.clipboardData?.files ?? [])].find((file) => file.type.startsWith('image/'));

        if (image) {
          e.preventDefault();
          void this.drawer.addImage(image, this.drawer._getRelativePointerPos());
          return;
        }

        const text = e.clipboardData?.getData('text');

        if (text) {
          e.preventDefault();
          this.drawer.getWidget<TextWidget>('text')?.addTextNode(text);
          this.drawer.stage.fire('change');
        }
      },
      { signal: this.drawer.signal }
    );
  }
}
