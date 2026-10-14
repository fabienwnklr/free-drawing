# free-drawing

![image](https://github.com/fabienwnklr/free-drawing/assets/49644785/2a87f2dc-ee59-4cec-87a6-872f06e231fa)

Inspired from [drawer](https://github.com/fabienwnklr/drawer/) is totally rewritting and rethinking for better use to more complexe context.
For simply use, i recommend to you to use [drawer](https://github.com/fabienwnklr/drawer/)

📝 Check documentation [here](https://free-drawing-docs.netlify.app/)

<img src="./docs/public/logo.svg" width="17" /> Check demo [here](https://free-drawing-demo.netlify.app/)

## Dependencies

- [KonvaJS](https://konvajs.org/index.html)
- [perfect-freehand](https://github.com/steveruizok/perfect-freehand)

## Contribute

See [Contribute guide](https://github.com/fabienwnklr/free-drawing/blob/master/CONTRIBUTING.md)

## Install

```bash
yarn add @fabwcie/free-drawing konva
```

`konva` is a peer dependency, install it with the package.

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
  selectionMenu: true, // enable/disable menu next to selected shapes (duplicate, bring forward, send backward, delete)
  theme: 'light', // 'light' | 'dark' | 'system' (device one), theme chosen in menu is saved and used instead
  layersPanel: true, // enable/disable layers panel (list of shapes) and its button in header
  readOnly: false, // drawing can't be modified by user (only pan, zoom, view options, export), API still modifies it
  scaling: 1.11, // scaling on zoom
  autoSave: true, // for save draw state on localStorage automatically
  localStorageKey: 'free-drawing', // localStorage key used for store data, use a different key for each drawer of a page
  opacity: 1, // opacity of draw
  textStyle: {
    // style of new text
    fontFamily: 'Ubuntu',
    fontSize: 16,
    fontStyle: 'normal', // 'normal' | 'bold' | 'italic' | 'italic bold'
    textDecoration: '', // '' | 'underline' | 'line-through' | 'underline line-through'
    align: 'left', // 'left' | 'center' | 'right'
  },
  collaboration: false, // live collaboration menu: false, true (socket.io server on same origin) or server url
  widgets: ['pan', 'selection', 'brush', 'eraser', 'text', 'line', 'square', 'circle', 'arrow'], // toolbar widgets, see below
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

Components trigger `drawer.dropdown.hide` (dropdown menu) and `drawer.toast.hide` (`drawer.toast()` result). Names of previous versions (`change`, `fd.options.change`...) still work, with a warning in console.

## Dark mode

"Dark mode" of settings menu (Alt+Shift+D) switches between light and dark themes, the choice is saved. In dark mode, the drawing is shown with inverted colors (as exported in dark mode), colors of shapes are kept: color swatches show them as drawn.

```js
drawer.setTheme('dark'); // 'light' | 'dark' | 'system'
drawer.toggleDarkMode();
drawer.isDarkMode();
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

## Selection

With the selection tool:

- a click selects the shape drawn under pointer (a text on a shape is selected alone). Inside of rectangles and ellipses without background is empty: shapes under it are clicked, else the smallest one around pointer is selected;
- Shift + click adds or removes a shape, Alt + click selects the shape behind the selected one (again: next one behind, then back to top);
- a selection rectangle selects shapes entirely in it (Shift adds them): drawn in a big shape, it selects the small shapes on it;
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

A menu next to selected shapes duplicates them (Ctrl+D), brings them forward, sends them backward or deletes them (`selectionMenu` option). It is under the selection, above it near the bottom of the drawer, and hidden while shapes are moved.

```js
const copies = drawer.duplicateShapes(); // selected shapes by default, copies are selected
drawer.deleteShapes([shape]);
```

## Layers

The layers button of header (Alt+L) shows the list of shapes, top one first. A row selects its shape (Shift adds it), a double click (or F2) renames it, its handle (or Alt + Up / Down) moves it in stacking order, its buttons hide, lock or delete it. Hidden shapes are not drawn nor exported, locked shapes can't be selected, moved nor erased on canvas. Names, hidden and locked states are saved with shapes.

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

`collaboration` option adds "Live collaboration" to settings menu: a dialog to choose a name, start a session in a new room, share its link (or QR code to scan) and stop the session. Opening a room link (`#room=<id>&by=<user id>`) joins the room. Every drawing change (any tool, eraser, moves, styles, undo / redo...) is sent to the other users of the room through a [socket.io](https://socket.io/) server (see [server/index.mjs](./server/index.mjs)), `socket.io-client` and the QR code generator are loaded only then.

```js
const link = await drawer.startCollaboration(); // new room (or given room id), name of user saved for next sessions
drawer.setUserName('Alice');
drawer.stopCollaboration();
drawer.showCollaboration(); // dialog
```

Users see the cursor of each other user with their name, and shapes while they are drawn or moved (sent every 50 ms at most, final state sent at the end).

A user opening a room link enters a name before joining. The user who created the room is its owner (secret kept in browser, so reloading the page joins the room again): in the dialog, the owner shares the link, gives or removes the right to draw of each user and stops the session. Other users only change their name in the dialog. Users without the right are in read only mode (`drawer.setReadOnly`), their changes are ignored by the server.

Links contain the id of the user sharing them (`by`), the page URL of each user too: the owner sees who invited each user, even with a link copied from the address bar.

Socket events: `JOIN` (`{ room, name, userId, ownerKey, invitedBy }`), `NAME`, `USERS` (users of the room `{ id, name, owner, canEdit, invitedBy }`, `invitedBy` is the name of the user who shared the link, sent by server), `RIGHTS` (`{ userId, canEdit }`, from owner), `POINTER` (position in drawing, null out of drawer, relayed with user `id` and `name`), `LEAVE` (id of user leaving, sent by server) and `CHANGE`: `{ upsert, remove, order, live }`, JSON of shapes added or updated (konva `toObject`, with their `id`) and ids of removed shapes, so concurrent drawings are merged, `order` ids of shapes from bottom to top when stacking order changed, `live` for previews of shapes being drawn. The server keeps the drawing of each room and sends it to users joining it.

In this repository, run `yarn serve`, open `http://localhost:3000`, start a session from the menu and open its link in other windows.
