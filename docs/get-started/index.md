# <img src="https://raw.githubusercontent.com/fabienwnklr/free-drawing/master/docs/public/logo.svg" width="36" alt="" /> free-drawing

![image](https://github.com/fabienwnklr/free-drawing/assets/49644785/2a87f2dc-ee59-4cec-87a6-872f06e231fa)

Inspired from [drawer](https://github.com/fabienwnklr/drawer/) is totally rewritting and rethinking for better use to more complexe context.
For simply use, i recommend to you to use [drawer](https://github.com/fabienwnklr/drawer/)

📝 Check documentation [here](https://free-drawing-docs.netlify.app/)

<img src="https://raw.githubusercontent.com/fabienwnklr/free-drawing/master/docs/public/logo.svg" width="17" /> Check demo [here](https://free-drawing-demo.netlify.app/)

## Dependencies

- [KonvaJS](https://konvajs.org/index.html)
- [perfect-freehand](https://github.com/steveruizok/perfect-freehand)

## Contribute

See [Contribute guide](https://github.com/fabienwnklr/free-drawing/blob/master/CONTRIBUTING.md)

## Install

```bash
yarn add @fabwcie/free-drawing konva
```

`konva` (version 10) is a peer dependency, install it with the package.

## Use it

```js
import { Drawer } from '@fabwcie/free-drawing';
import '@fabwcie/free-drawing/style.css';

const $el = document.getElementById('drawer-container');
const drawer = new Drawer($el, {
  /** optional options */
});
```

## Available options

```js
{
  id: 'drawer-1', // id for drawer (unique for each drawer of the page)
  tool: 'brush', // activate tool on init
  width: window.innerWidth, // width of drawer
  height: window.innerHeight, // height of drawer
  strokeWidth: 5, // width for drawing stroke
  strokeStyle: 'solid', // 'solid' | 'dashed' | 'dotted', stroke of lines, arrows, rectangles and ellipses
  strokeColor: '#000', // color for drawing stroke
  fillColor: 'transparent', // background color of rectangles and ellipses, 'transparent' for none
  edges: 'sharp', // corners of rectangles: 'sharp', 'round' (radius following their size) or radius (px), drawer.setEdges(12) for new and selected ones
  zoom: true, // enable/disable zoom on draw
  zoomWidget: true, // enable/disable zoom ui widget
  positionWidget: true, // enable/disable position ui widget (x / y of view, button back to origin)
  selectionMenu: true, // enable/disable menu next to selected shapes (duplicate, rotate, bring forward, send backward, lock, delete)
  commandPalette: true, // enable/disable command palette (menu item, Ctrl / Cmd + K): search and run tools and commands
  theme: 'light', // 'light' | 'dark' | 'system' (device one), theme chosen in menu is saved and used instead
  language: 'auto', // 'auto' (browser one, English when not available) | 'en' | 'fr' | 'es' | 'de', language chosen in menu is saved and used instead
  translations: {}, // texts replacing default ones, by language, see Languages below
  layersPanel: true, // enable/disable layers panel (list of shapes) and its button in header
  saveButton: true, // button in header saving the drawing while auto save is off (dot: changes not saved yet)
  readOnly: false, // drawing can't be modified by user (only pan, zoom, view options, export), API still modifies it
  scaling: 1.11, // scaling on zoom
  autoSave: true, // drawing saved on each change (localStorage or storage), user preference (see Preferences)
  keepTool: true, // drawing tool kept after drawing a shape, else selection tool activated, user preference (see Preferences)
  localStorageKey: 'free-drawing', // localStorage key used for store data, use a different key for each drawer of a page
  storage: null, // drawing saved somewhere else than localStorage (e.g. server of your app), see "Use in an app" below
  user: null, // user of your app ({ id, name }), used in collaboration sessions instead of id and name kept in browser
  plugins: [], // plugins added to the drawer (classes extending Plugin), see Plugins below
  pluginOptions: {}, // options of plugins by plugin name, e.g. { Stamps: { max: 20 } }
  opacity: 1, // opacity of draw
  textStyle: {
    // style of new text
    fontFamily: 'Ubuntu',
    fontSize: 16,
    fontStyle: 'normal', // 'normal' | 'bold' | 'italic' | 'italic bold'
    textDecoration: '', // '' | 'underline' | 'line-through' | 'underline line-through'
    align: 'left', // 'left' | 'center' | 'right'
  },
  collaboration: false, // live collaboration menu: false, true (socket.io server on same origin), server url or { url, auth }
  // toolbar widgets, see below
  widgets: ['pan', 'selection', 'brush', 'eraser', 'text', 'line', 'square', 'circle', 'arrow', 'triangle', 'diamond', 'heart', 'cloud', 'highlighter', 'laser', 'frame'],
  // groups of toolbar widgets, see below
  widgetGroups: [{ widgets: ['triangle', 'diamond', 'heart', 'cloud', 'highlighter', 'laser', 'frame'], icon: 'more' }],
};
```

## Events

Events are named `drawer.<subject>.<action>`:

```js
drawer.on('drawer.change', (drawer) => {
  // drawing changed
});
drawer.off('drawer.change', callback);
```

| Event | Arguments | Description |
| --- | --- | --- |
| `drawer.change` | drawer | Drawing changed (shapes, background, undo / redo, changes of collaborators...) |
| `drawer.options.change` | changed options | Drawing options changed (color, width, style, opacity, text style) |
| `drawer.selection.change` | selected shapes | Selection changed |
| `drawer.readonly.change` | read only state | Read only mode changed |
| `drawer.collaboration.change` | | Collaboration started or stopped, users or rights changed |
| `drawer.theme.change` | dark state | Light or dark theme shown |
| `drawer.language.change` | language | Language of interface changed |
| `drawer.preferences.change` | preferences | Theme, language, grid or snapping changed (one event for several changes) |
| `drawer.unsaved.change` | unsaved | Drawing has changes not saved yet (auto save off, save of `storage` in progress, failed save), or is saved again |
| `drawer.plugin.change` | plugin | Plugin disabled (`forceDisabled`) or enabled again |

Components trigger `drawer.dropdown.hide` (dropdown menu) and `drawer.toast.hide` (`drawer.toast()` result). Names of previous versions (`change`, `fd.options.change`...) still work, with a warning in console.

## Preferences

"Preferences..." of settings menu (Ctrl / Cmd + ,, also in the command palette) opens a dialog: theme (light, dark or system), language, zen mode, grid, snapping to objects, auto save, keep tool active and name in collaboration sessions. Changes are applied together with "Save" ("Cancel", Escape or close keep current preferences) and saved in the browser (`<localStorageKey>-preferences`), also with the `storage` option. An app can save them with the account of its user (see "Use in an app").

```js
drawer.showPreferences();
```

Without auto save (preference or `autoSave` option), changes are saved with the save button of the header (`saveButton` option, a dot shows changes not saved yet) or "Save now" (settings menu, command palette), the menu shows "Not saved" until then, and leaving the page asks a confirmation. Turning auto save on again saves pending changes. With auto save too, changes are not saved until the save succeeds: leaving the page asks a confirmation during a save of `storage` or after a failed save (browser storage full, server unreachable).

```js
drawer.setAutoSave(false);
drawer.hasUnsavedChanges(); // true after a change, until saved (also during a save of storage, after a failed save)
await drawer.saveNow(); // save, "Drawing saved" message
```

"Keep tool active" (pin button at the start of the toolbar, Q, also in the command palette) keeps the drawing tool after drawing a shape. Turned off, the selection tool is activated after drawing (shapes, frames, brush, highlighter), nothing selected. The button is shown with the selection tool only.

```js
drawer.setKeepTool(false);
```

## Dark mode

"Dark mode" of settings menu (Alt+Shift+D) switches between light and dark themes, the choice is saved. In dark mode, the drawing is shown with inverted colors (as exported in dark mode), colors of shapes are kept: color swatches show them as drawn.

```js
drawer.setTheme('dark'); // 'light' | 'dark' | 'system'
drawer.toggleDarkMode();
drawer.isDarkMode();
```

## Languages

Interface is available in English, French, Spanish and German: browser language by default, "Language" of settings menu chooses another one (saved). Every text is translated at once, without reloading.

```js
drawer.setLanguage('fr'); // 'auto' | 'en' | 'fr' | 'es' | 'de'
drawer.language; // language shown: 'fr'
drawer.t('menu.open'); // text of interface in current language: 'Ouvrir'
```

`translations` option replaces texts of interface (keys of [src/i18n/en.ts](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/i18n/en.ts)):

```js
new Drawer($el, {
  translations: {
    fr: { 'menu.open': 'Ouvrir un dessin' },
  },
});
```

## Command palette

"Command palette" of settings menu (Ctrl / Cmd + K) lists the tools and commands available now (edition, selection, view, file, language), with their shortcut and state (grid shown, current tool...). Typing filters them (words of name, case and accents ignored), arrow keys choose one, Enter or click runs it.

```js
drawer.showCommandPalette();
```

## Use in an app

Options and methods to connect the drawer to the server of your app (drawings saved per user, login, preferences). Their types are exported (`import type { DrawerStorage, DrawingFile, Preferences } from '@fabwcie/free-drawing'`). The web app of this repository ([apps/web](https://github.com/fabienwnklr/free-drawing/tree/master/apps/web)) uses them with its server ([apps/server](https://github.com/fabienwnklr/free-drawing/tree/master/apps/server)).

`storage` option saves the drawing elsewhere than localStorage. Its drawing is loaded on init (`drawer.ready` is resolved then), it replaces the drawing and history starts from it. Then `save` is called on each change (with `autoSave`), one call at a time: changes made during a save are saved once it ends, with the last drawing. Nothing is saved before the drawing is loaded, nor if it can't be (error shown, `ready` rejected), so a stored drawing is never replaced by mistake. Changes stay unsaved (`hasUnsavedChanges`) until a promise of `save` is resolved: a rejected one shows its error message and keeps them unsaved. When nothing is stored (`load` gives `null`), the drawing is kept and saved with auto save.

```js
const drawer = new Drawer($el, {
  storage: {
    load: async () => (await fetch('/api/drawings/1')).json(), // drawing file or null
    save: (file) => fetch('/api/drawings/1', { method: 'PUT', body: JSON.stringify(file) }),
  },
});

await drawer.ready;
await drawer.loadFromStorage(); // again, e.g. after login (drawing kept if nothing is stored)
```

`user` option gives the user of your app: their id is used in collaboration sessions (rights given by owners, links) and their name is shown to other users (the user can change it for the current visit). `setUser` changes it on login or logout.

```js
drawer.setUser({ id: 'user-1', name: 'Ada' });
drawer.setUser(null); // anonymous: id and name kept in browser
```

Preferences are the interface settings of the user (theme, language, grid, snapping to objects, zen mode, auto save, keep tool active), saved in the browser by the drawer, to save them with their account too:

```js
drawer.setPreferences(await api.getPreferences()); // given ones only
drawer.on('drawer.preferences.change', (preferences) => api.savePreferences(preferences));
drawer.getPreferences(); // { theme: 'light', language: 'auto', grid: false, snapping: false, zen: false, autoSave: true, keepTool: true }
```

`collaboration` option can also give data read by the server on connection (`socket.handshake.auth`), e.g. a token of the logged in user, or a function giving it on each connection:

```js
new Drawer($el, {
  collaboration: { url: 'https://draw.example.com', auth: (callback) => callback({ token: getToken() }) },
});
```

`layout` adds elements of your app to the interface of the drawer (types `LayoutRegion`, `LayoutItemOptions`): `header` (top left, after settings menu, layers button and position), `footerStart` (bottom left, after zoom and undo / redo), `footer` (bottom, after toolbar and help), `floating` (over the drawing, placed by your styles). Elements can be hidden in zen mode, or placed after another element. `drawer.$drawerContainer` is the container of the drawer (`layout.$container`). When the footer does not fit on one line (narrow drawer, phone), the interface is compact (`is-compact` class of the container): toolbar on its own line, scrolled in it, options panel below the header; call `layout.updateCompact()` after changing the footer other than with `layout.add`.

```js
const $button = document.createElement('button');

drawer.layout.add('header', $button, { hideInZen: true });
drawer.layout.add('header', $other, { after: drawer.setting.$dropdownContainer }); // right after settings menu
```

## Widgets

`widgets` option chooses the toolbar widgets, in the given order. Without it, every widget is available.

```js
// list of widgets
new Drawer($el, { widgets: ['brush', 'eraser'] });

// or object of widgets with their options (an empty object keeps default options)
new Drawer($el, {
  widgets: {
    brush: { title: 'Pinceau', shortcut: 'p', thinning: 0 },
    eraser: {},
    text: { shortcut: false },
  },
});
```

Options of every widget:

- `title`: button tooltip (e.g. translation)
- `shortcut`: keyboard shortcut (a key), `false` to disable it

Brush options (freehand stroke, see [perfect-freehand](https://github.com/steveruizok/perfect-freehand)):

- `thinning`: effect of drawing speed on stroke width, from -1 to 1 (`0.6` by default, `0` for constant width)
- `smoothing`: softness of stroke edges, from 0 to 1 (`1` by default)
- `streamline`: how much stroke is stabilized, from 0 to 1 (`0.5` by default)

Eraser (E): a click erases the shape under pointer, a drag erases every shape it crosses, faded until the pointer is released (changing tool meanwhile keeps them). A shape of a group erases its group, a shape of a frame is erased alone, locked shapes are kept. Right and middle buttons do not erase.

If `tool` option (or the tool saved in localStorage) is not in `widgets`, the first widget is activated.

### Groups of widgets

`widgetGroups` option puts widgets of the toolbar in groups: one button, at the place of the first widget of the group, shows its widgets above it (arrow keys move between them, Escape closes them). It is highlighted while one of its widgets is active, shortcuts of its widgets still work.

```js
new Drawer($el, {
  widgetGroups: [
    { widgets: ['line', 'square', 'circle', 'arrow'], title: 'Shapes' },
    { widgets: ['brush', 'eraser'], icon: 'more' },
  ],
});
```

Options of a group:

- `widgets`: widgets of the group, in this order (widgets of `widgets` option only, a widget is in one group)
- `icon`: `'shapes'` (default), `'more'`, `'grid'`, `'plus'`, the name of a widget (e.g. `'square'`) or svg code (scripts and event attributes are removed)
- `title`: button tooltip ("More tools" translated by default)

The default toolbar groups the tools below in "More tools" (`widgetGroups` replaces this group).

### More tools

- Triangle, diamond (D), heart and cloud: drawn in the dragged box (Shift: in a square), background color and stroke style as rectangles.
- Highlighter (M): wide strokes of its own fluorescent colors (yellow by default, green, blue, pink, orange or custom) and widths, multiplied with the drawing under them so texts stay readable.
- Laser pointer (K): trail following pointer while pressed, fading after a second, never saved. Users of a collaboration session see it with the color of the user's cursor. Usable in read only.
- Frame (F): area with a name above it ("Frame 1"...: double click or layers panel renames it). Shapes entirely in a new frame belong to it, so do shapes drawn, moved or duplicated in it (their center), shapes moved out of it are back in the drawing. While shapes are dragged or resized, they are drawn whole above the drawing (not cut) and the frames they would enter (solid, tinted) or leave (dashed) are highlighted, briefly after a move with arrow keys. Its shapes are moved with it and cut at its edges, selected alone (click), or with it (its name or border). Resizing it does not scale its shapes, frames are not rotated, flipped, grouped nor styled. Exports cut its shapes, without its name.

## Plugins

Other developers add tools, commands, shortcuts and items of the context menu with plugins: classes extending `Plugin`, given to the `plugins` option. `npm create @fabwcie/free-drawing-plugin@latest` creates the package of a plugin from a few questions (name, tool, command, options, styles, languages, tests). The [plugins guide](https://free-drawing-docs.netlify.app/plugins) explains each part, the [plugin template](https://github.com/fabienwnklr/free-drawing/tree/master/packages/plugin-template) is a complete plugin to copy.

```js
import { Drawer, Plugin, BaseWidget, drawerEvents, shapeName } from '@fabwcie/free-drawing';
import { Rect } from 'konva/lib/shapes/Rect';

const starIcon = '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">...</svg>';

// tool of the plugin: a click adds a stamp
class StampWidget extends BaseWidget {
  constructor(drawer) {
    super(drawer, 'stamp', 'Stamp', starIcon, 'p'); // id, title without translation, svg icon, shortcut
  }

  initEvents() {
    // events of the stage while the tool is active
    this.onStage('click tap', () => this.drawer.plugins.get('Stamps').stamp(this.drawer.stage.getRelativePointerPosition()));
  }
}

class Stamps extends Plugin {
  static pluginName = 'Stamps'; // unique name (class names are changed by minification)
  static requires = []; // plugins required: classes (added when missing) or names of given plugins

  constructor(drawer) {
    super(drawer);
    // before the toolbar: texts and tools
    this.addTranslations({
      en: { 'tools.stamp': 'Stamp', 'stamps.center': 'Stamp in the middle' },
      fr: { 'tools.stamp': 'Tampon', 'stamps.center': 'Tamponner au milieu' },
    });
    this.addWidget('stamp', StampWidget);
  }

  init() {
    // drawer created: commands and listeners (a promise returned is waited by drawer.ready)
    this.addCommand({
      id: 'stamp middle center', // English words searched in the command palette
      label: 'stamps.center', // key of its text
      shortcut: 'Alt+P', // shown in help, command palette and context menu
      contextMenu: 'drawing', // item of the context menu of the drawing ('selection': of selected shapes)
      run: () => this.stamp({ x: 300, y: 300 }),
    });
    this.listenTo(this.drawer, drawerEvents.change, () => console.log('drawing changed')); // removed by destroy()
  }

  stamp({ x, y }) {
    this.drawer.addShape(new Rect({ name: `${shapeName.rect} stamp`, x, y, width: 40, height: 40, fill: '#ffec99' }));
    this.drawer.stage.fire('change'); // saved, added to history, sent to collaborators
  }
}

const drawer = new Drawer($el, { plugins: [Stamps] });
drawer.plugins.get(Stamps); // also by name: drawer.plugins.get('Stamps'), drawer.plugins.has(Stamps)
```

- Steps: constructor (before the toolbar: `addWidget`, `addTranslations`), `init()` (drawer created: `addCommand`, `listenTo`...), `afterInit()` (every plugin initialized), `destroy()` (`drawer.plugins.destroy()`, listeners of `listenTo` removed: call `super.destroy()` when overriding it). Required plugins are created and initialized first. A plugin missing, two plugins of the same name or plugins requiring each other throw an error when the drawer is created; an error of `init` is logged, other plugins are still initialized.
- Tools are placed at their place in the `widgets` and `widgetGroups` options (e.g. `widgets: ['selection', 'stamp', 'brush']`), else at the end of the toolbar. Their title is the text of `tools.<id>`, their shortcut is shown in help and command palette. `ShapeWidget` is the base of tools drawing in the dragged box.
- Commands are available unless their `isAvailable()` returns false. Commands with `readOnly: true` do not modify the drawing: also available in read only and while their plugin is disabled. Shortcuts of plugins run before the ones of the library: avoid the ones listed in help.
- `isEnabled` is false in read only, or while the plugin is disabled by `forceDisabled(reason)` (until `clearForceDisabled(reason)` for every reason): its tools and commands modifying the drawing are disabled, `drawer.plugin.change` is triggered.
- Texts: `this.t(key, params)`, in the language of the drawer; the `translations` option can replace them.
- Options: the app gives them by plugin name, the plugin reads them with its defaults: `options = this.getOptions({ max: 0 })` with `pluginOptions: { Stamps: { max: 20 } }`.
- Drawer API useful to plugins: `addShape`, `stage.fire('change')`, `placeInFrames`, `getPointerPosition()` (pointer in drawing coordinates), `getSelectedShapes()`, `getWidget<SelectWidget>('selection')?.select(shapes)`, `layout.add(region, element)`, `toast(message)`.
- Shapes: draw with the shapes of the library (`Line`, `Arrow`, `Rect`, `Ellipse`, `Text`, `Path` and groups of them), marked with a name or attributes. Files, links and collaboration accept only these classes.
- Exported for plugins: `Plugin`, `BaseWidget`, `ShapeWidget`, `drawerEvents`, `shapeName`, `createButton`, `setLabel`, `setPressed`, and types (`PluginClass`, `PluginCommand`, `PluginOptions`, `PluginTranslations`, `SelectWidget`, `WidgetClass`...).

## Selection

With the selection tool:

- a click selects the shape drawn under pointer (a text on a shape is selected alone). Inside of rectangles and ellipses without background is empty: shapes under it are clicked, else the smallest one around pointer is selected;
- Shift + click adds or removes a shape, Alt + click selects the shape behind the selected one (again: next one behind, then back to top);
- a selection rectangle selects the shapes it touches (Shift adds them): lines and strokes where they are drawn, rotated shapes as drawn. Drawn inside a big shape or a frame, it selects the shapes it touches there, not the big shape;
- a pressed shape is selected and dragged alone, the selection is dragged from any place of its box.

The options panel of a selection shows the options of every kind of selected shape: stroke and its style, background, corners, text font, size, style and alignment... Each option changes the selected shapes it applies to (e.g. the background of rectangles and ellipses, the font of texts). A selection of texts only shows the text panel. Frames have no style: a selected frame shows its opacity (of the whole frame: border, title and shapes), its stacking order and the actions. The actions of the panel duplicate (Ctrl+D), delete (Delete) or link the selection.

Links: the link action (panel, context menu, command palette) shows the link of the selection above it, a web page or an email address (`https://` added without protocol, other protocols refused). Enter applies it, Escape cancels, its buttons open or remove it. A shape with a link shows it above itself when selected, and a link icon at its top right corner (at the end of the title of a frame): a click opens the link in a new tab, its address is shown on hover. Links are saved with shapes, shared with collaborators and kept around shapes in svg exports.

```js
drawer.setShapeLink('example.com/roadmap'); // selected shapes by default, false for an invalid address
drawer.getShapeLink(shape); // 'https://example.com/roadmap', null without link
drawer.openShapeLink(shape);
drawer.setShapeLink(null, [shape]); // removed
```

Shift constrains drawing and selected shapes, also pressed or released without moving pointer:

| Action | With Shift |
| --- | --- |
| Draw a rectangle / an ellipse | Square / circle |
| Draw a line / an arrow | Horizontal, vertical or 45° |
| Draw with brush | Straight stroke from its start |
| Resize (corners) | Proportions kept (texts always keep them) |
| Rotate | By 15° |
| Move | Horizontally or vertically |

A menu next to selected shapes duplicates them (Ctrl+D), rotates them by 90° left or right (Shift+L, Shift+R), fits the width of texts to their content (Shift+W: box of the longest line, lines no longer wrapped, text kept in place whatever its alignment), brings them forward, sends them backward, locks them (Ctrl+Shift+L) or deletes them (`selectionMenu` option). It is under the selection, above it near the bottom of the drawer, and hidden while shapes are moved.

```js
const copies = drawer.duplicateShapes(); // selected shapes by default, copies are selected
drawer.deleteShapes([shape]);
drawer.fitTextWidth(); // texts of selection (also of groups), true if one changed
```

## Context menu

A right click on a shape selects it (with the selection tool) and shows actions on the selection, with their shortcuts:

| Action | Shortcut |
| --- | --- |
| Duplicate | Ctrl / Cmd + D |
| Lock or unlock selection | Ctrl / Cmd + Shift + L |
| Delete | Delete |
| Bring to front, forward, send backward, to back | Ctrl / Cmd + (Shift +) Up / Down |
| Rotate 90° right, left (around center of selection) | Shift + R, Shift + L |
| Flip horizontal, vertical (texts are still readable) | Shift + H, Shift + V |
| Fit width to text (texts of selection) | Shift + W |
| Copy as PNG, as SVG (selection, else whole drawing) | Shift + Alt + C, Shift + Alt + S |
| Select all | Ctrl / Cmd + A |

Elsewhere, it shows actions on the drawing: paste, copy as PNG or SVG, select all, snapping to objects, grid. The context menu key (or Shift + F10) opens it with the keyboard.

```js
drawer.rotateShapes(90); // selected shapes by default, degrees clockwise (-90: left)
drawer.flipShapes('horizontal'); // selected shapes by default
await drawer.copyImage('svg'); // svg image and svg code (text), 'png' by default
```

## Layers

The layers button of header (Alt+L) shows the list of shapes, top one first. A row selects its shape, Ctrl / Cmd + click (or Ctrl + Space) adds or removes it, Shift + click (or Shift + arrows) selects the rows from the last one selected (shortcuts shown under the list), a double click (or F2) renames it, its handle (or Alt + Up / Down) moves it in stacking order, its buttons hide, lock or delete it. Hidden shapes are not drawn nor exported, locked shapes can't be moved, transformed nor erased on canvas: a click (or their row) selects them alone, with a dashed box, to unlock them (button of selection menu, context menu, Ctrl+Shift+L). Names, hidden and locked states are saved with shapes.

```js
drawer.layersPanel?.toggle(); // show / hide panel
drawer.setShapeLabel(shape, 'Background'); // empty name gives back default name (text, type)
drawer.getShapeLabel(shape);
drawer.setShapesHidden(true, [shape]); // selected shapes by default
drawer.setShapesLocked(true, [shape]);
```

### Groups

Ctrl+G (or group button of selection menu or layers panel) groups selected shapes, Ctrl+Shift+G ungroups them. A group is moved, transformed, ordered, renamed, hidden, locked, duplicated and deleted as one shape, groups can contain groups. A click selects the group of a shape, Ctrl+click (or its row in layers panel, under its expanded group) selects the shape alone.

```js
const group = drawer.groupShapes([first, second]); // selected shapes by default, of the same group
drawer.ungroupShapes([group]); // shapes keep their look (group transform, hidden, locked)
```

Drawing shapes are konva shapes or groups (`DrawingShape` type): `getDrawingShapes()` and `getSelectedShapes()` may return groups, their shapes are their children.

## Linked arrows

An arrow drawn from a shape to another one (end near or inside them) is linked to them: its ends follow them when they move, are resized or rotated. In a frame, ends are linked to its shapes, to the frame only near its border. With the arrow tool, shapes under pointer show the middle of their sides: an end released near one is fixed to this side (e.g. bottom of a shape to left side of another one), else it stays on the outline aiming at the other end. Ctrl (Cmd) draws an arrow without links. Arrows moved without their shapes (or with removed shapes) are unlinked, copies of arrows and shapes are linked together. Links are `startBinding` / `endBinding` (ids of shapes) and `startAnchor` / `endAnchor` (`top`, `right`, `bottom`, `left`) attributes of arrows.

## Stacking order

"Layers" buttons of selection options (or Ctrl+Up / Ctrl+Down, with Shift to front / back) move selected shapes in front of or behind other shapes:

```js
drawer.reorderShapes('forward'); // 'forward' | 'backward' | 'front' | 'back', selected shapes by default
drawer.reorderShapes('back', [shape]);
```

`forward` / `backward` move shapes above / below the next shape they overlap, `front` / `back` above / below all shapes. Moved shapes keep their relative order.

## Files and links

The settings menu opens and saves drawings as `.freedrawing` files (JSON: background color and shapes), and copies a link to the drawing:

```js
await drawer.saveAs('my-drawing'); // save dialog when the browser has one (Chromium), else download (Ctrl+S)
await drawer.open(); // file chosen by user replaces drawing, undo restores it (Ctrl+O)
const file = drawer.getDrawingFile(); // file content, `drawer.loadDrawing(file)` loads it
const link = await drawer.getLink(); // current page url with compressed drawing: #<drawer id>=<data>
await drawer.copyLink();
```

No server is needed for links: the drawing is in the url hash. A drawer whose `id` is in the hash of the page loads its drawing (undo restores the saved one) and removes it from the url.

Files and links can come from anyone: only drawing shapes are created (lines, arrows, rectangles, ellipses, texts, paths, groups and frames of them), other nodes and frames without their parts are ignored. Attributes of the drawing shapes must have their type (number, text, true / false, list of numbers), other attributes read by Konva (patterns, functions...) are ignored, attributes of data (e.g. of plugins) are kept. All shapes are created before the drawing is replaced: a file that can't be loaded leaves it as it is. Shapes received from other users of a collaboration session are checked the same way.

## Export

"Export image" of settings menu (Ctrl+Shift+E) opens a dialog with a preview: png, svg or pdf image, `.freedrawing` file or png copied to clipboard. Selected shapes are exported when there is a selection (whole drawing can be chosen in dialog), with or without background, in dark mode or not.

```js
drawer.showExport(); // export dialog
const blob = await drawer.exportImage('png', { selected: true, background: true, dark: false, scale: 2 }); // 'png' | 'svg' | 'pdf'
```

Svg is vector (shapes, texts), pdf contains a png quality image of the drawing (jpeg, always with a background).

## Collaboration

`collaboration` option adds "Live collaboration" to settings menu: a dialog to choose a name, start a session in a new room, share its link (or QR code to scan) and stop the session. Opening a room link (`#room=<id>&by=<user id>`) joins the room. Every drawing change (any tool, eraser, moves, styles, background color, undo / redo...) is sent to the other users of the room through a [socket.io](https://socket.io/) server (see [apps/server](https://github.com/fabienwnklr/free-drawing/tree/master/apps/server)), `socket.io-client` and the QR code generator are loaded only then. Undo and redo change only the shapes changed by the user: changes of the other users are kept.

```js
const link = await drawer.startCollaboration(); // new room (or given room id), name of user saved for next sessions
drawer.setUserName('Alice');
drawer.stopCollaboration();
drawer.showCollaboration(); // dialog
drawer.collaboration?.present(true); // owner: other users follow its view
drawer.collaboration?.requestEdit(); // viewer: asks the owner for the right to draw
```

Users see the cursor of each other user with their name, and shapes while they are drawn or moved (sent every 50 ms at most, final state sent at the end).

During a session, a reminder in the header (also in zen mode: the drawing is shared) shows a live dot, the number of people connected and the requests to draw waiting for the owner: it opens the panel of the session, and its red stop button stops the session (owner) or leaves it once confirmed, as "Stop session" / "Leave session" of the command palette. The panel shows the right of the user (a viewer asks the owner to draw, once until answered), the participants with their rights (switches for the owner), the requests to accept or refuse, "Present my view" for the owner and "Link and settings..." opening the dialog.

Presentation: the owner presents its view (panel, command palette, `collaboration.present(true)`), the other users follow its zoom and moves, the area it shows fitted to their screen (`drawer.getViewArea()`, `drawer.showArea(area)`). A user moving or zooming their view stops following it: "Follow" in the header (or the panel, the command palette, `collaboration.follow()`) follows it again. Users joining meanwhile follow it at once, it stops when the owner leaves.

A user opening a room link enters a name before joining. The user who created the room is its owner (secret kept in browser, so reloading the page joins the room again): in the dialog, the owner shares the link, gives or removes the right to draw of each user, chooses whether new participants can draw (by default they view only until given the right, also when coming back with a new id) and stops the session. Other users only change their name in the dialog. Users without the right are in read only mode (`drawer.setReadOnly`), their changes are ignored by the server.

Links contain the id of the user sharing them (`by`), the page URL of each user too: the owner sees who invited each user, even with a link copied from the address bar.

Socket events: `JOIN` (`{ room, name, userId, ownerKey, invitedBy }`), `JOINED` (`{ userId }`, id given by server to the joining user, e.g. of their logged in account: used to recognize oneself in users), `NAME`, `USERS` (users of the room `{ id, name, owner, canEdit, invitedBy }`, `invitedBy` is the name of the user who shared the link, sent by server), `RIGHTS` (`{ userId, canEdit }`, from owner), `ROOM` (settings of the room `{ newUsersCanEdit }`, sent by server on join and change, by owner to change them), `VIEW` (area `{ x, y, width, height }` shown by the owner presenting it, null when it stops, relayed by server and sent to users joining meanwhile), `REQUEST` (right to draw asked by a viewer, relayed to the owner as `{ userId, name }`; the owner answers `{ userId, accepted }`, a refusal is sent back as `{ accepted: false }`), `REJECTED` (`{ event, reason }` sent by server: `full` room, the session stops, or drawing `too-big`, the user is told their changes are not shared), `POINTER` (position in drawing, null out of drawer, relayed with user `id` and `name`), `LEAVE` (id of user leaving, sent by server) and `CHANGE`: `{ upsert, remove, order, live, full, background }`, JSON of shapes added or updated (konva `toObject`, with their `id`) and ids of removed shapes, so concurrent drawings are merged, `order` ids of shapes from bottom to top when stacking order changed, `live` for previews of shapes being drawn, `background` color of the drawing when changed. The server keeps the drawing of each room and sends it to users joining it, whole and also empty (`full`), with its background once a user sent one: a user joining takes the background of the room (the first one gives theirs).

A user whose connection was lost keeps drawing: once connected again, the drawing of the room is merged with the changes made meanwhile, which are sent then. Shapes removed or changed by other users meanwhile are removed or updated (unless changed by this user), a room which lost its drawing (emptied, server restarted) gets it again. With a server without `full`, the whole drawing is sent again as before.

In this repository, run `yarn serve`, open `http://localhost:3000`, start a session from the menu and open its link in other windows.
