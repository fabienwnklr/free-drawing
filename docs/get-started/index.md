# free-drawing

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
  readOnly: false, // drawing can't be modified by user (only pan, zoom, view options, export), API still modifies it
  scaling: 1.11, // scaling on zoom
  autoSave: true, // drawing saved on each change (localStorage or storage), user preference (see Preferences)
  keepTool: true, // drawing tool kept after drawing a shape, else selection tool activated, user preference (see Preferences)
  localStorageKey: 'free-drawing', // localStorage key used for store data, use a different key for each drawer of a page
  storage: null, // drawing saved somewhere else than localStorage (e.g. server of your app), see "Use in an app" below
  user: null, // user of your app ({ id, name }), used in collaboration sessions instead of id and name kept in browser
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
| `drawer.unsaved.change` | unsaved | Drawing has changes not saved yet (auto save off), or is saved again |

Components trigger `drawer.dropdown.hide` (dropdown menu) and `drawer.toast.hide` (`drawer.toast()` result). Names of previous versions (`change`, `fd.options.change`...) still work, with a warning in console.

## Preferences

"Preferences..." of settings menu (Ctrl / Cmd + ,, also in the command palette) opens a dialog: theme (light, dark or system), language, zen mode, grid, snapping to objects, auto save, keep tool active and name in collaboration sessions. Changes are applied together with "Save" ("Cancel", Escape or close keep current preferences) and saved in the browser (`<localStorageKey>-preferences`), also with the `storage` option. An app can save them with the account of its user (see "Use in an app").

```js
drawer.showPreferences();
```

Without auto save (preference or `autoSave` option), changes are saved with "Save now" (settings menu, command palette), the menu shows "Not saved" until then, and leaving the page asks a confirmation. Turning auto save on again saves pending changes.

```js
drawer.setAutoSave(false);
drawer.hasUnsavedChanges(); // true after a change, until saved
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

`storage` option saves the drawing elsewhere than localStorage. Its drawing is loaded on init (`drawer.ready` is resolved then), it replaces the drawing and history starts from it. Then `save` is called on each change (with `autoSave`), one call at a time: changes made during a save are saved once it ends, with the last drawing. Nothing is saved before the drawing is loaded, nor if it can't be (error shown, `ready` rejected), so a stored drawing is never replaced by mistake.

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

`layout` adds elements of your app to the interface of the drawer (types `LayoutRegion`, `LayoutItemOptions`): `header` (top left, after settings menu, layers button and position), `footerStart` (bottom left, after zoom and undo / redo), `footer` (bottom, after toolbar and help), `floating` (over the drawing, placed by your styles). Elements can be hidden in zen mode, or placed after another element. `drawer.$drawerContainer` is the container of the drawer (`layout.$container`).

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
- Frame (F): area with a name above it ("Frame 1"...: double click or layers panel renames it). Shapes entirely in a new frame belong to it, so do shapes drawn, moved or duplicated in it (their center), shapes moved out of it are back in the drawing. Its shapes are moved with it and cut at its edges, selected alone (click), or with it (its name or border). Resizing it does not scale its shapes, frames are not rotated, flipped, grouped nor styled. Exports cut its shapes, without its name.

## Selection

With the selection tool:

- a click selects the shape drawn under pointer (a text on a shape is selected alone). Inside of rectangles and ellipses without background is empty: shapes under it are clicked, else the smallest one around pointer is selected;
- Shift + click adds or removes a shape, Alt + click selects the shape behind the selected one (again: next one behind, then back to top);
- a selection rectangle selects the shapes it touches (Shift adds them): lines and strokes where they are drawn, rotated shapes as drawn. Drawn inside a big shape or a frame, it selects the shapes it touches there, not the big shape;
- a pressed shape is selected and dragged alone, the selection is dragged from any place of its box.

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

An arrow drawn from a shape to another one (end near or inside them) is linked to them: its ends follow them when they move, are resized or rotated. With the arrow tool, shapes under pointer show the middle of their sides: an end released near one is fixed to this side (e.g. bottom of a shape to left side of another one), else it stays on the outline aiming at the other end. Ctrl (Cmd) draws an arrow without links. Arrows moved without their shapes (or with removed shapes) are unlinked, copies of arrows and shapes are linked together. Links are `startBinding` / `endBinding` (ids of shapes) and `startAnchor` / `endAnchor` (`top`, `right`, `bottom`, `left`) attributes of arrows.

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

## Export

"Export image" of settings menu (Ctrl+Shift+E) opens a dialog with a preview: png, svg or pdf image, `.freedrawing` file or png copied to clipboard. Selected shapes are exported when there is a selection (whole drawing can be chosen in dialog), with or without background, in dark mode or not.

```js
drawer.showExport(); // export dialog
const blob = await drawer.exportImage('png', { selected: true, background: true, dark: false, scale: 2 }); // 'png' | 'svg' | 'pdf'
```

Svg is vector (shapes, texts), pdf contains a png quality image of the drawing (jpeg, always with a background).

## Collaboration

`collaboration` option adds "Live collaboration" to settings menu: a dialog to choose a name, start a session in a new room, share its link (or QR code to scan) and stop the session. Opening a room link (`#room=<id>&by=<user id>`) joins the room. Every drawing change (any tool, eraser, moves, styles, undo / redo...) is sent to the other users of the room through a [socket.io](https://socket.io/) server (see [apps/server](https://github.com/fabienwnklr/free-drawing/tree/master/apps/server)), `socket.io-client` and the QR code generator are loaded only then.

```js
const link = await drawer.startCollaboration(); // new room (or given room id), name of user saved for next sessions
drawer.setUserName('Alice');
drawer.stopCollaboration();
drawer.showCollaboration(); // dialog
```

Users see the cursor of each other user with their name, and shapes while they are drawn or moved (sent every 50 ms at most, final state sent at the end).

A user opening a room link enters a name before joining. The user who created the room is its owner (secret kept in browser, so reloading the page joins the room again): in the dialog, the owner shares the link, gives or removes the right to draw of each user and stops the session. Other users only change their name in the dialog. Users without the right are in read only mode (`drawer.setReadOnly`), their changes are ignored by the server.

Links contain the id of the user sharing them (`by`), the page URL of each user too: the owner sees who invited each user, even with a link copied from the address bar.

Socket events: `JOIN` (`{ room, name, userId, ownerKey, invitedBy }`), `JOINED` (`{ userId }`, id given by server to the joining user, e.g. of their logged in account: used to recognize oneself in users), `NAME`, `USERS` (users of the room `{ id, name, owner, canEdit, invitedBy }`, `invitedBy` is the name of the user who shared the link, sent by server), `RIGHTS` (`{ userId, canEdit }`, from owner), `POINTER` (position in drawing, null out of drawer, relayed with user `id` and `name`), `LEAVE` (id of user leaving, sent by server) and `CHANGE`: `{ upsert, remove, order, live }`, JSON of shapes added or updated (konva `toObject`, with their `id`) and ids of removed shapes, so concurrent drawings are merged, `order` ids of shapes from bottom to top when stacking order changed, `live` for previews of shapes being drawn. The server keeps the drawing of each room and sends it to users joining it.

In this repository, run `yarn serve`, open `http://localhost:3000`, start a session from the menu and open its link in other windows.
