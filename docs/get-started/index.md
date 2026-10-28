# <img src="https://raw.githubusercontent.com/fabienwnklr/free-drawing/master/docs/public/logo.svg" width="36" alt="" /> free-drawing

![image](https://github.com/fabienwnklr/free-drawing/assets/49644785/2a87f2dc-ee59-4cec-87a6-872f06e231fa)

Inspired from [drawer](https://github.com/fabienwnklr/drawer/) is totally rewritting and rethinking for better use to more complexe context.
For simply use, i recommend to you to use [drawer](https://github.com/fabienwnklr/drawer/)

📝 Check documentation [here](https://free-drawing-docs.netlify.app/)

<img src="https://raw.githubusercontent.com/fabienwnklr/free-drawing/master/docs/public/logo.svg" width="17" /> Check demo [here](https://free-drawing-demo.netlify.app/)

## Why free-drawing?

- **Any framework, or none**: a class for any page, a component for [React](https://free-drawing-docs.netlify.app/get-started/react) and [Vue](https://free-drawing-docs.netlify.app/get-started/vue), with the same options and API.
- **Truly open source**: [MIT licence](https://github.com/fabienwnklr/free-drawing/blob/master/LICENCE), no licence key, no watermark, no paid features.
- **Rights in live sessions**: participants view the drawing until its owner lets them draw, they ask in one click, and follow the view the owner presents.
- **A real layers panel**: name, hide, lock and reorder every shape, select ranges of them.
- **Share without a server**: a link holds the whole drawing, compressed, and files open anywhere.
- **Your own features**: tools, commands, shortcuts and menu items with a typed [plugin API](https://free-drawing-docs.netlify.app/plugins), a new plugin created by `npm create @fabwcie/free-drawing-plugin`.

## Dependencies

- [KonvaJS](https://konvajs.org/index.html)
- [perfect-freehand](https://github.com/steveruizok/perfect-freehand)

## Contribute

See [Contribute guide](https://github.com/fabienwnklr/free-drawing/blob/master/CONTRIBUTING.md)

## Install

```bash
yarn add @fabwcie/free-drawing konva
```

`konva` (version 10) is a peer dependency, install it with the package: npm (7 or later) and pnpm add it when your app does not have it, Yarn only warns.

### Why is Konva a peer dependency?

The drawer is built on [Konva](https://konvajs.org/): its stage, layers and shapes are Konva nodes, and they are part of its API (`drawer.stage`, `drawer.addShape(new Rect({ ... }))`, plugins drawing with `konva/lib/shapes/...`). Your app gives Konva instead of the library bundling its own copy:

- **One Konva in the page.** Konva keeps its state in one global object: the classes `Node.create` knows (the library registers its `Frame` class there, needed to open drawings, links and changes of collaborators), the shapes being dragged, settings such as `Konva.pixelRatio`. A second copy has its own state: shapes created with one copy are not instances of the classes of the other (the library checks the class of the shapes it is given: `instanceof Group`, `Text`, `Arrow`...), frames are unknown to it, and Konva logs "Several Konva instances detected" in the console. As a peer dependency, your package manager installs one copy shared by your app, the library and its plugins.
- **Your code draws with the same classes.** Shapes given to `drawer.addShape`, listeners of `drawer.stage`, plugins: they import Konva themselves, the copy of the drawer.
- **Downloaded once.** The build of the library leaves Konva out: your bundler adds it once, also when your app already uses Konva (react-konva, vue-konva, stages of its own). The library imports its classes by their path (`konva/lib/shapes/Rect`): only the parts it uses are bundled, unless your app imports the whole of Konva.
- **Your choice of version.** Any Konva 10 from 10.9.0 works (`^10.9.0`): a fix of Konva reaches your app without waiting for a new version of the library.

The other dependencies (`perfect-freehand` for strokes, `socket.io-client` and `uqr` loaded only when a collaboration session starts) are internal: none of their objects reach your code, so they are installed with the library.

## Use it

```js
import { Drawer } from '@fabwcie/free-drawing';
import '@fabwcie/free-drawing/style.css';

const $el = document.getElementById('drawer-container');
const drawer = new Drawer($el, {
  /** optional options */
});
```

## React, Vue and Web Component

The library needs no framework. React and Vue apps can use its `FreeDrawing` component, other apps (Angular, Svelte, plain HTML...) its `<free-drawing>` element: they create the drawer when they are mounted (added to the page) and destroy it when they are unmounted, take the size of their element and follow their settings (`readOnly`, `theme`, `language`, `user`), with the same options and API:

- React: [`@fabwcie/free-drawing-react`](https://free-drawing-docs.netlify.app/get-started/react) (`<FreeDrawing ref={drawer} options={...} onChange={...} />`)
- Vue: [`@fabwcie/free-drawing-vue`](https://free-drawing-docs.netlify.app/get-started/vue) (`<FreeDrawing ref="board" :options="..." @change="..." />`)
- Web Component: [`@fabwcie/free-drawing-element`](https://free-drawing-docs.netlify.app/get-started/element) (`<free-drawing theme="dark" options='{ ... }'></free-drawing>`, `drawerchange` event)

Extra tools (shapes, highlighter) as plugins: [`@fabwcie/free-drawing-extra-tools`](https://free-drawing-docs.netlify.app/get-started/extra-tools).

## Available options

```js
{
  id: 'notes', // id for drawer (unique for each drawer of the page), key of its links to drawings (#notes=...)
  tool: 'brush', // activate tool on init
  width: window.innerWidth, // width of drawer
  height: window.innerHeight, // height of drawer
  strokeWidth: 5, // width for drawing stroke
  strokeStyle: 'solid', // 'solid' | 'dashed' | 'dotted', stroke of lines, arrows, rectangles and ellipses
  strokeColor: '#000', // color for drawing stroke
  fillColor: 'transparent', // background color of rectangles and ellipses, 'transparent' for none
  edges: 'sharp', // corners of rectangles: 'sharp', 'round' (radius following their size) or radius (px), drawer.setEdges(12) for new and selected ones
  arrowType: 'straight', // path of arrows: 'straight' | 'curved' | 'elbow', drawer.setArrowType('elbow') for new and selected ones
  arrowheads: { start: 'none', end: 'triangle' }, // heads of arrow ends: 'none' | 'arrow' | 'triangle' | 'dot' | 'bar', drawer.setArrowheads({ start: 'dot' })
  zoom: true, // enable/disable zoom (wheel, pinch, Shift + 1 / 2 / 0)
  zoomWidget: true, // enable/disable zoom ui widget
  positionWidget: true, // enable/disable position ui widget (x / y of view, button back to origin)
  selectionMenu: true, // enable/disable menu next to selected shapes (duplicate, rotate, bring forward, send backward, lock, delete)
  commandPalette: true, // enable/disable command palette (menu item, Ctrl / Cmd + K): search and run tools and commands
  theme: 'light', // 'light' | 'dark' | 'system' (device one), theme chosen in menu is saved and used instead
  language: 'auto', // 'auto' (browser one, English when not available) | 'en' | 'fr' | 'es' | 'de' (a locale gives its language: 'fr-FR'; another one is 'auto'), language chosen in menu is saved and used instead
  translations: {}, // texts replacing default ones, by language, see Languages below
  layersPanel: true, // enable/disable layers panel (list of shapes) and its button in header
  library: true, // enable/disable library panel (shapes saved to insert them again in any drawing), its button and menu items
  slideshow: true, // enable/disable the slideshow of frames in the interface (menu, context menu, command palette, Alt + Shift + P, button of a selected frame)
  saveButton: true, // button in header saving the drawing while auto save is off (dot: changes not saved yet)
  readOnly: false, // drawing can't be modified by user (only pan, zoom, view options, export), API still modifies it
  scaling: 1.11, // scaling on zoom
  autoSave: true, // drawing saved on each change (localStorage or storage), user preference (see Preferences)
  keepTool: true, // drawing tool kept after drawing a shape, else selection tool activated, user preference (see Preferences)
  shapeRecognition: false, // brush strokes recognized as rectangles, ellipses, triangles, diamonds, lines or arrows, user preference (see Shape recognition)
  gridStyle: 'squares', // style of the grid: 'squares' | 'dots' | 'lines' (ruled paper) | 'isometric', user preference (see Grid)
  wheelAction: 'zoom', // mouse wheel: 'zoom' (Ctrl / Cmd + wheel moves the view) | 'pan' (Ctrl / Cmd + wheel zooms), user preference (see Mouse wheel and Space)
  localStorageKey: 'free-drawing', // localStorage key used for store data, use a different key for each drawer of a page
  storage: null, // drawing saved somewhere else than localStorage (e.g. server of your app), see "Use in an app" below
  user: null, // user of your app ({ id, name }), used in collaboration sessions instead of id and name kept in browser
  plugins: [], // plugins added to the drawer: classes extending Plugin, or [class, options] to give its options, e.g. [[StampsPlugin, { max: 20 }]], see Plugins below
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
  widgets: ['pan', 'selection', 'brush', 'eraser', 'text', 'note', 'line', 'square', 'circle', 'arrow', 'image', 'triangle', 'diamond', 'laser', 'frame'],
  // groups of toolbar widgets, see below (tools of the extra tools take their place in it once added)
  widgetGroups: [{ widgets: ['triangle', 'diamond', 'heart', 'cloud', 'star', 'hexagon', 'blockArrow', 'bubble', 'checkbox', 'highlighter', 'laser', 'frame'], icon: 'more' }],
};
```

## Events

Events are named `<subject>.<action>` (`change` for the drawing):

```js
drawer.on('change', (drawer) => {
  // drawing changed
});
drawer.off('change', callback);
```

| Event | Arguments | Description |
| --- | --- | --- |
| `change` | drawer | Drawing changed (shapes, background, undo / redo, changes of collaborators...) |
| `options.change` | changed options | Drawing options changed (color, width, style, opacity, text style) |
| `selection.change` | selected shapes | Selection changed |
| `readonly.change` | read only state | Read only mode changed |
| `collaboration.change` | | Collaboration started or stopped, users or rights changed |
| `theme.change` | dark state | Light or dark theme shown |
| `language.change` | language | Language of interface changed |
| `preferences.change` | preferences | Theme, language, grid, snapping or another preference changed (one event for several changes) |
| `unsaved.change` | unsaved | Drawing has changes not saved yet (auto save off, save of `storage` in progress, failed save), or is saved again |
| `plugin.change` | plugin | Plugin disabled (`forceDisabled`) or enabled again |
| `slideshow.change` | index of the slide | Slideshow started, showing another slide, or stopped (-1) |
| `replay.change` | index of the shape | Replay started, showing another shape, or stopped (-1) |

Components trigger `dropdown.hide` (dropdown menu) and `toast.hide` (`drawer.toast()` result). Names of previous versions (`drawer.change`, `drawer.selection.change`... of 7.0 to 7.52, `fd.options.change`...) still work, with a warning in console.

In TypeScript, events are typed by `DrawerEventMap`: the name is checked (an unknown one is an error, the editor suggests the others) and the listener gets the arguments of its event:

```ts
drawer.on('selection.change', (shapes) => console.log(shapes.length)); // shapes: DrawingShape[]
drawer.on('drawer.selection.chnage', () => {}); // error: unknown event
drawer.on('readonly.change', (readOnly: string) => {}); // error: readOnly is a boolean
```

The events of plugins and apps triggered on the drawer start with their own prefix (`stamps.count`): they never mix with the ones of the library. A plugin adds its events to `DrawerEventMap` (declaration merging):

```ts
declare module '@fabwcie/free-drawing' {
  interface DrawerEventMap {
    'stamps.count': [count: number];
  }
}

drawer.trigger('stamps.count', 3);
drawer.on('stamps.count', (count) => console.log(count)); // count: number
```

## Preferences

"Preferences..." of settings menu (Ctrl / Cmd + ,, also in the command palette) opens a dialog: theme (light, dark or system), language, zen mode, grid and its style, action of the mouse wheel, snapping to objects, auto save, keep tool active, shape recognition and name in collaboration sessions. A field changed applies at once, to see it behind the dialog (theme, language, zen mode, grid...); "Save" keeps them (and applies the name), "Cancel", Escape or close give back the preferences shown before. They are saved in the browser (`<localStorageKey>-preferences`), also with the `storage` option. An app can save them with the account of its user (see "Use in an app").

```js
drawer.showPreferences();
```

Without auto save (preference or `autoSave` option), changes are saved with the save button of the header (`saveButton` option, a dot shows changes not saved yet) or "Save now" (settings menu, command palette, Ctrl / Cmd + S, also with auto save), the menu shows "Not saved" until then, and leaving the page asks a confirmation. Turning auto save on again saves pending changes. With auto save too, changes are not saved until the save succeeds: leaving the page asks a confirmation during a save of `storage` or after a failed save (browser storage full, server unreachable).

```js
drawer.setAutoSave(false);
drawer.hasUnsavedChanges(); // true after a change, until saved (also during a save of storage, after a failed save)
await drawer.saveNow(); // save, "Drawing saved" message (Ctrl / Cmd + S)
```

"Keep tool active" (pin button at the start of the toolbar, Q, also in the command palette) keeps the drawing tool after drawing a shape. Turned off, the selection tool is activated after drawing (shapes, frames, brush, highlighter), nothing selected, or after a text, the text selected. The button is shown with the selection tool only.

```js
drawer.setKeepTool(false);
```

### Shape recognition

"Recognize shapes" (switch of the brush options, preferences dialog, command palette; `shapeRecognition` option and preference, off by default) turns a brush stroke into the shape it looks like, drawn by the tool of this shape:

| Stroke | Shape |
| --- | --- |
| Closed (its end near its start) | Rectangle, ellipse, triangle pointing up or diamond, in the box of the stroke: the one whose outline is the nearest to the stroke, both ways (a side missing counts) |
| Straight | Line between its ends |
| Straight with a head (short strokes behind one end, at least one aside, drawn after or before the shaft) | Arrow from its tail to its tip, linked to the shapes at its ends as with the arrow tool |

- The shape takes the style of the options (color, width, stroke style, background, corners, arrowheads), as if drawn with its tool; a tool missing from the toolbar (`widgets` option) gives no shape of its kind.
- Undo gives back the stroke as drawn (the stroke and its shape are two steps of history).
- Strokes kept as drawn: other strokes, strokes smaller than 32 px on screen (letters), straight strokes of Shift.

```js
drawer.setShapeRecognition(true);
```

### Snapping to objects

"Snapping to objects" (settings menu, context menu, Alt + S, command palette, preference) snaps moved and resized shapes to the edges and centers of the other shapes (shapes of frames too, the frame of a shape), and to the center of the view, wherever it is moved and zoomed: to center a shape on the screen. Dashed guides across the view show what they snap to (5 px on screen). Not to the edges of the view: the drawing is infinite.

### Grid

"Show grid" (settings menu, context menu, Alt + G, command palette) shows a grid the shapes snap to while they are moved, resized and rotated (snapping to objects and the grid exclude each other). Its style is a preference (preferences dialog, command palette: "Grid: Dots"..., which shows the grid too; `gridStyle` option):

| Style | Grid | Shapes snap to |
| --- | --- | --- |
| `squares` (default) | Squares of dashed lines | Crossings of the lines, rotation by 90° |
| `dots` | Dots at the crossings | Dots, rotation by 90° |
| `lines` | Horizontal lines of ruled paper | Heights of the lines (left and right free), rotation by 90° |
| `isometric` | Triangles of isometric paper: vertical lines and lines at 30° | Corners of the triangles, rotation by 30° |

- The grid belongs to the drawing, not to the screen: whatever the view is moved or zoomed, shapes snap to the lines drawn. Zoomed out, lines stay at least 10 px apart on screen (every other one is drawn).
- It helps to draw: it is not saved in drawing files, nor exported, nor shared in collaboration sessions (each user chooses).

```js
drawer.setGridStyle('isometric');
drawer.showGrid(); // hideGrid(), drawer.grid
```

### Mouse wheel and Space

The mouse wheel zooms around the pointer (`wheelAction: 'zoom'`, default), or moves the view (`'pan'`): a preference (preferences dialog, command palette "Mouse wheel: Zoom" / "Mouse wheel: Move the view").

| | `zoom` (default) | `pan` |
| --- | --- | --- |
| Wheel | Zoom around the pointer | Move the view up and down |
| Ctrl / Cmd + wheel | Move the view up and down | Zoom around the pointer |
| Shift + wheel | Move the view left and right | Move the view left and right |
| Pinch of a trackpad | Zoom | Zoom |

- A notch of a mouse wheel zooms by the `scaling` option (1.11), the small steps of a trackpad less: zooming follows the fingers. Browsers give the Ctrl key to the wheel events of a pinch: a pinch is told apart from Ctrl + wheel by the Ctrl key really pressed. With `zoom: false`, the wheel does not zoom, it still moves the view.
- `'pan'` suits trackpads (two fingers move the view, a pinch zooms), `'zoom'` mice.
- Space held, a drag moves the view whatever the tool (as the pan tool, H): the tool, its options and the selection stay as they were, the view is saved on release. Space is taken with the focus on the drawing, or on a button of the drawer with the pointer on the canvas (a tool just clicked); fields and the other buttons keep it.

```js
drawer.setWheelAction('pan');
drawer.spacePan.active; // Space held
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

Shortcuts are shown with the symbols of Apple keyboards on its devices (⇧⌘Z, ⌥⇧D, ⌘⌫), in menus, command palette, help, tooltips and `aria-keyshortcuts`: Ctrl of shortcuts is Cmd there.

```js
drawer.showCommandPalette();
```

## Use in an app

Options and methods to connect the drawer to the server of your app (drawings saved per user, login, preferences). Their types are exported (`import type { DrawerStorage, DrawingFile, Preferences } from '@fabwcie/free-drawing'`), also the classes of the members of the drawer and of the results of its methods (`DrawerLayout` of `drawer.layout`, `Toast` of `drawer.toast()`, `Frame`...). The web app of this repository ([apps/web](https://github.com/fabienwnklr/free-drawing/tree/master/apps/web)) uses them with its server ([apps/server](https://github.com/fabienwnklr/free-drawing/tree/master/apps/server)).

`storage` option saves the drawing elsewhere than localStorage. Its drawing is loaded on init (`drawer.ready` is resolved then), it replaces the drawing and history starts from it. Then `save` is called on each change (with `autoSave`), one call at a time: changes made during a save are saved once it ends, with the last drawing. Nothing is saved before the drawing is loaded, nor if it can't be (error shown, `ready` rejected), so a stored drawing is never replaced by mistake. Changes stay unsaved (`hasUnsavedChanges`) until a promise of `save` is resolved: a rejected one shows its error message and keeps them unsaved. When nothing is stored (`load` gives `null`), the drawing is kept and saved with auto save.

```js
const drawer = new Drawer($el, {
  storage: {
    load: async () => (await fetch('/api/drawings/1')).json(), // drawing file or null
    save: (file) => fetch('/api/drawings/1', { method: 'PUT', body: JSON.stringify(file) }),
  },
});

await drawer.ready;
await drawer.loadFromStorage(); // again, e.g. after login (drawing kept if nothing is stored; only the last load started is applied)
```

`user` option gives the user of your app: their id is used in collaboration sessions (rights given by owners, links) and their name is shown to other users (the user can change it for the current visit). `setUser` changes it on login or logout.

```js
drawer.setUser({ id: 'user-1', name: 'Ada' });
drawer.setUser(null); // anonymous: id and name kept in browser
```

Preferences are the interface settings of the user (theme, language, grid and its style, action of the mouse wheel, snapping to objects, zen mode, auto save, keep tool active, shape recognition), saved in the browser by the drawer, to save them with their account too:

```js
drawer.setPreferences(await api.getPreferences()); // given ones only
drawer.on('preferences.change', (preferences) => api.savePreferences(preferences));
drawer.getPreferences(); // { theme: 'light', language: 'auto', grid: false, snapping: false, zen: false, autoSave: true, keepTool: true, shapeRecognition: false, gridStyle: 'squares', wheelAction: 'zoom' }
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

Apps mounting and unmounting drawers (views, components of a framework) remove them with `destroy()`: plugins destroyed, collaboration session left, listeners of the page (window, document, media queries, resize observers) removed, element emptied. Changes not saved yet are not saved: call `save()` first. `drawer.signal` is aborted then: listeners added with it go with the drawer.

```js
window.addEventListener('resize', fitView, { signal: drawer.signal }); // removed with the drawer

await drawer.save();
await drawer.destroy();
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

Text (T): a click adds a text, or edits the text (or name of a frame) clicked. Enter or a press elsewhere validates it (Shift + Enter adds a line, Escape cancels, an empty text is removed), then the tool is kept (`keepTool`, pin of the toolbar) or the selection tool comes back with the text selected. A double click edits any text, whatever the tool.

Note (N): a click adds a sticky note there (a square of a light color, yellow by default, its color chosen in the panel of the tool) and writes in it at once, a click on a note writes in it; validated, the tool is kept (`keepTool`) or the selection tool comes back with the note selected. A note is a rectangle (named `drawer-rect drawer-note`) drawn with a shadow (also in exports): its text is centered in it, the note grows with it (never shorter), it is resized, colored (background), moved and linked by arrows as rectangles. `drawer.getWidget('note').addNote({ x, y })` adds one centered on a point.

If `tool` option (or the tool saved in localStorage) is not in `widgets`, the first widget is activated.

### Groups of widgets

`widgetGroups` option puts widgets of the toolbar in groups: one button, at the place of the first widget of the group, shows its widgets above it, 4 per line (arrow keys move between them, Up and Down to the line above or below, Escape closes them). It is highlighted while one of its widgets is active, shortcuts of its widgets still work.

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

- Triangle and diamond (D): drawn in the dragged box (Shift: in a square), background color and stroke style as rectangles.
- Laser pointer (K): trail following pointer while pressed, fading after a second, never saved. Users of a collaboration session see it with the color of the user's cursor. Usable in read only.
- Frame (F): area with a name above it ("Frame 1"...: double click or layers panel renames it). Shapes entirely in a new frame belong to it, so do shapes drawn, moved or duplicated in it (their center), shapes moved out of it are back in the drawing. While shapes are dragged or resized, they are drawn whole above the drawing (not cut) and the frames they would enter (solid, tinted) or leave (dashed) are highlighted, briefly after a move with arrow keys. Its shapes are moved with it and cut at its edges, selected alone (click), or with it (its name or border). Resizing it does not scale its shapes, frames are not rotated, flipped, grouped nor styled. Exports cut its shapes, without its name. Frames are the slides of the [slideshow](https://free-drawing-docs.netlify.app/get-started/#slideshow): "Present from this frame" of a selected frame (selection menu, options panel, context menu) or Alt + Shift + P presents them one after the other.

### Extra tools

The heart, cloud, star, hexagon, block arrow, speech bubble and check box shapes and the highlighter (M) are plugins of [`@fabwcie/free-drawing-extra-tools`](https://free-drawing-docs.netlify.app/get-started/extra-tools) (tools of the library until its version 7): added to the `plugins` option, they take their place in "More tools". Drawings holding their shapes open, are drawn, selected, styled, exported and shared by any drawer, with or without them.

```js
import { ExtraShapesPlugin, HighlighterPlugin } from '@fabwcie/free-drawing-extra-tools';

new Drawer($el, { plugins: [ExtraShapesPlugin, HighlighterPlugin] });
```

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
- Tools are placed at their place in the `widgets` and `widgetGroups` options (e.g. `widgets: ['selection', 'stamp', 'brush']`), else at the end of the toolbar. Their title is the text of `tools.<id>`, their shortcut is shown in help and command palette. `ShapeWidget` is the base of tools drawing in the dragged box: `drawShape(start, end)` gives the shape of such a tool as drawn by a drag (not added: `drawer.addShape`). A second finger on a touch screen cancels the pointer action of a tool (`cancelAction()`): `onCancel()` removes what it was drawing (done by `ShapeWidget`).
- Commands are available unless their `isAvailable()` returns false. Commands with `readOnly: true` do not modify the drawing: also available in read only and while their plugin is disabled. Shortcuts of plugins run before the ones of the library: avoid the ones listed in help. Written `Ctrl+Shift+M` (Ctrl is also Cmd), they are shown ⇧⌘M on Apple devices: `formatShortcut(shortcut, drawer.i18n.t)` and `ariaShortcut(shortcut)` do the same for the interface of a plugin.
- `isEnabled` is false in read only, or while the plugin is disabled by `forceDisabled(reason)` (until `clearForceDisabled(reason)` for every reason): its tools and commands modifying the drawing are disabled (its active tool gives way to the selection tool), `plugin.change` is triggered. Once the drawer is destroyed, `listenTo` adds nothing (an `init` still running) and the next plugins are not initialized.
- Texts: `this.t(key, params)`, in the language of the drawer; the `translations` option can replace them.
- Options: the app gives them with the class of the plugin, `plugins: [[Stamps, { max: 20 }]]` (a plugin required by another one too: given this way, it is created once, before it), the plugin reads them with its defaults: `options = this.getOptions({ max: 0 })` gives `{ max: 20 }`. The `pluginOptions` option of previous versions (options by plugin name, `pluginOptions: { Stamps: { max: 20 } }`) still works, with a warning: options given with the class replace its ones.
- Drawer API useful to plugins: `addShape` (a shape with the id of another one of the drawing, e.g. a copy, gets a new id), `stage.fire('change')`, `placeInFrames`, `getPointerPosition()` (pointer in drawing coordinates), `getSelectedShapes()`, `getWidget<SelectWidget>('selection')?.select(shapes)`, `layout.add(region, element)`, `toast(message)`.
- Shapes: draw with the shapes of the library (`Line`, `Arrow`, `Rect`, `Ellipse`, `Text`, `Path` and groups of them), marked with a name or attributes. Files, links and collaboration accept only these classes.
- Exported for plugins: `Plugin`, `BaseWidget`, `ShapeWidget`, `PathShapeWidget` (shapes drawn by a path in their box: `pathShapeData`, `scalePath`), `FreehandWidget` (freehand strokes), `ColorPicker` and `createOverlaySection` (options panels), `drawerEvents`, `shapeName`, `createButton`, `setLabel`, `setPressed`, `formatShortcut`, `ariaShortcut`, and types (`PluginClass`, `PluginEntry`, `PluginCommand`, `PluginTranslations`, `SelectWidget`, `WidgetClass`, classes of the members of the drawer...).

## Touch screens

One finger draws with the active tool. Two fingers on the drawing zoom it by pinching (unless the `zoom` option is false) and move the view, whatever the tool, also in read only: the second finger cancels what the first one was doing (shape, stroke or stamp being drawn removed, erasing, selecting and laser stopped, a dragged shape stays where it is), nothing is drawn until every finger is lifted. Fingers on the drawing never scroll nor zoom the page.

## Selection

With the selection tool:

- a click selects the shape drawn under pointer (a text on a shape is selected alone). Inside of rectangles and ellipses without background is empty: shapes under it are clicked, else the smallest one around pointer is selected;
- Shift + click adds or removes a shape, Alt + click selects the shape behind the selected one (again: next one behind, then back to top);
- a selection rectangle selects the shapes it touches (Shift adds them): lines and strokes where they are drawn, rotated shapes as drawn. Drawn inside a big shape or a frame, it selects the shapes it touches there, not the big shape;
- a pressed shape is selected and dragged alone, the selection is dragged from any place of its box.

The options panel of a selection shows the options of every kind of selected shape: stroke and its style, background, corners, text font, size, style and alignment... Each option changes the selected shapes it applies to (e.g. the background of rectangles and ellipses, the font of texts). A selection of texts only shows the text panel. Frames have no style: a selected frame shows its opacity (of the whole frame: border, title and shapes), its stacking order and the actions. The actions of the panel duplicate (Ctrl+D), delete (Delete) or link the selection.

Align and distribute: with 2 selected shapes or more, the options panel (and the command palette) aligns them on a side or the center of their whole box (left, center, right, top, middle, bottom), stacks them one after the other (a row or a column, 16 units between them, the first one stays) and, with 3 shapes or more, distributes them (same spaces between them, the first and last ones stay). Rotated shapes count by their bounding box, shapes moved into or out of a frame enter or leave it.

```js
drawer.alignShapes('left'); // selected shapes by default: 'left', 'center', 'right', 'top', 'middle', 'bottom'
drawer.distributeShapes('horizontal'); // or 'vertical', 3 shapes at least
drawer.stackShapes('vertical', shapes); // or 'horizontal'
```

Links: the link action (panel, context menu, command palette) shows the link of the selection above it, a web page or an email address (`https://` added without protocol, other protocols refused). Enter applies it, Escape cancels, its buttons open or remove it. A shape with a link shows it above itself when selected, and a link icon at its top right corner (at the end of the title of a frame): a click opens the link in a new tab, its address is shown on hover. "Open link" of the context menu and of the command palette opens it too, also in read only, as Enter on a shape reached with the keyboard in read only. Links are saved with shapes, shared with collaborators and kept around shapes in svg exports.

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

### Keyboard navigation

The shapes are reached with the keyboard, the focus on the drawing itself (not on a button of the drawer): a screen reader reads each shape reached.

| Key | Action |
| --- | --- |
| Enter | Select the first shape (nothing selected), the first shape of the selected group or frame, else edit the text of the selected shape (as a double click) |
| Tab / Shift + Tab | Select the next / previous shape among the shapes of the same drawing, frame or group, in reading order (rows from top to bottom, left to right), around at the end |
| Shift + Enter | Select the group or frame of the selected shape |
| Escape | Clear the selection: Tab goes to the interface of the drawer again |

- Without selection, Tab keeps its role: it goes from the drawing to the buttons of the drawer.
- The selection tool is activated; the shape is shown in the view when it is not in it (zoom kept, else zoomed out). Texts of shapes and labels of arrows are reached with their shape.
- Its description is read by screen readers: name given to it (title of a frame), type, text, number of shapes inside (group, frame), shapes linked by an arrow, link, locked, frame or group holding it and its number among its shapes, for example "Rectangle, text: Start, 1 of 3" or "Arrow, from Start, to Goal, 2 of 3". The keys are described with the name of the drawer (`aria-describedby`), in the language of the drawer.
- In read only, nothing is selected: the shape reached is outlined, shown and described.

```js
drawer.navigation.next(); // next shape (-1: previous one), first one without selection
drawer.navigation.enter(); // first shape of the selected group or frame
drawer.navigation.exit(); // its group or frame
drawer.navigation.describe(shape); // description read by screen readers
```

## Context menu

A right click on a shape selects it (with the selection tool) and shows actions on the selection, with their shortcuts:

| Action | Shortcut |
| --- | --- |
| Duplicate | Ctrl / Cmd + D |
| Copy style, paste it on the selection | Ctrl / Cmd + Alt + C, Ctrl / Cmd + Alt + V |
| Lock or unlock selection | Ctrl / Cmd + Shift + L |
| Delete | Delete |
| Bring to front, forward, send backward, to back | Ctrl / Cmd + (Shift +) Up / Down |
| Rotate 90° right, left (around center of selection) | Shift + R, Shift + L |
| Flip horizontal, vertical (texts are still readable) | Shift + H, Shift + V |
| Fit width to text (texts of selection) | Shift + W |
| Copy as PNG, as SVG (selection, else whole drawing) | Shift + Alt + C, Shift + Alt + S |
| Select all | Ctrl / Cmd + A |
| Zoom to selection (filling the view, 200 % at most) | Shift + 2 |

Elsewhere, it shows actions on the drawing: paste, copy as PNG or SVG, select all, zoom to fit (whole drawing in the view, not beyond 100 %: Shift + 1), snapping to objects, grid. Shift + 0 zooms back to 100 % (as the zoom level button), keeping the center of the view. The context menu key (or Shift + F10) opens it with the keyboard.

```js
drawer.rotateShapes(90); // selected shapes by default, degrees clockwise (-90: left)
drawer.flipShapes('horizontal'); // selected shapes by default
await drawer.copyImage('svg'); // svg image and svg code (text), 'png' by default
```

The style of the selection (color, background, stroke width and style, corners, path and heads of arrows, text style, opacity: each part from the first shape it applies to) is copied with Ctrl / Cmd + Alt + C (context menu, command palette) and pasted on other selected shapes with Ctrl / Cmd + Alt + V, each part on the shapes it applies to, in one step of history; it becomes the style of new shapes too. Color fields have an eyedropper in browsers with the EyeDropper API (Chrome, Edge): a color picked anywhere on the screen, the color of the drawing in dark mode (shown inverted).

```js
const style = drawer.copyStyle(); // selected shapes by default, null without shape
drawer.pasteStyle(); // copied style (drawer.copiedStyle) on selected shapes, or a given one
drawer.pasteStyle({ strokeColor: '#e03131', strokeWidth: 8 });
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

## Search

Ctrl / Cmd + F (also in the context menu and the command palette, in read only too) shows a search bar at the top of the drawer: texts containing the search (case and accents ignored: free texts, texts of shapes and notes, labels of arrows, titles of frames; visible ones) are highlighted, in reading order, the current one outlined. Enter (or the down button) shows the next one, Shift + Enter (or the up button) the previous one: the view moves to it when it is out of view (zoomed out only when it does not fit). Texts are searched again when the drawing changes; Escape closes the bar.

```js
drawer.search.show('meeting'); // bar shown, text searched (the previous one by default)
drawer.search.next(); // previous() too
drawer.search.results; // texts found, current one: drawer.search.results[drawer.search.index]
drawer.search.hide();
```

## Slideshow

Frames are slides: "Present frames" (Alt + Shift + P, also in the menu, the context menu and the command palette, in read only too) presents them one after the other, from the selected frame, else from the first one. A selected frame shows "Present from this frame" in its selection menu, its options panel (actions) and the context menu. The `slideshow: false` option removes these commands from the interface (Alt + Shift + P left to the browser): `drawer.slideshow.start()` still presents the frames, from a button of your app for example.

- Order: reading order of the frames, rows from top to bottom (a frame starting above the middle of the first one of a row belongs to this row, they need not be aligned), left to right in a row. Move a frame to change its place; hidden frames are left out.
- Each slide fills the view (zoomed in or out), around it is masked with the background color: the shapes of the frame alone, without its name. The interface of the drawer is hidden but a bar at the bottom (previous, number and name of the slide, next, stop), on the whole screen when the browser allows it.
- Keys: Right, Down, Page Down or Space for the next slide, Left, Up, Page Up or Backspace for the previous one, Home / End for the first / last one, Escape stops (also leaving the whole screen). The pointer is the laser: its trail shows what you talk about. Other shortcuts do nothing, nothing is edited.
- The drawing may change meanwhile (other users of a session): slides are found again, the slide shown is shown again when its frame moves.
- Once stopped, the view, the tool and the size of the drawer come back.

In a live collaboration session, the owner presenting its slides presents them to the other users: they follow each slide, alone in their view (around it masked), with the interface of their drawer. Moving or zooming their view stops following it, "Follow" follows it again. The presentation stops with the slideshow (when the slideshow started it).

```js
drawer.slideshow.start(); // from the selected frame, else the first one; false without frame
drawer.slideshow.start(frame, { fullscreen: false }); // from a frame, in the drawer
drawer.slideshow.next(); // previous(), goTo(index)
drawer.slideshow.slides; // frames in reading order, shown one: drawer.slideshow.current
drawer.slideshow.stop();
drawer.on('slideshow.change', (index) => console.log(index)); // -1 once stopped
```

## Replay

"Replay the drawing" (Alt + Shift + R, also in the menu, the context menu and the command palette, in read only too) shows how the drawing was made: its shapes appear again one after the other, in the order they were created.

- Order: the time a shape was created is in its id (ids of the library). Shapes of other ids (files of other apps) come after the shape below them; a group comes at the time of its first shape, the shapes of a frame in it at their own time.
- Appearance: outlines drawn, then their fill, brush and highlighter strokes traced, texts typed, other shapes (images, notes, groups) faded in.
- The interface is hidden but a bar at the bottom: start again, play / pause, number of the shape, speed (1×, 2×, 4×), stop. Keys: Space plays or pauses, Left / Right show the previous / next shape, Home starts again, End shows the whole drawing, Escape stops. The view can be moved and zoomed meanwhile.
- The drawing is not changed: copies of its shapes are shown above it, hidden on screen only; nothing is saved, added to history nor sent to the users of a session. Once stopped, the drawing, the view and the tool come back.
- It shows the shapes as they are now (their last place, color, text): not their moves, changes nor the shapes removed.

```js
drawer.replay.start(); // false for an empty drawing
drawer.replay.pause(); // play(), toggle(), setSpeed(2), goTo(index), stop()
drawer.on('replay.change', (index) => console.log(index)); // -1 once stopped
```

## Library

The library button of header (Alt+B) shows the library: shapes saved to be inserted again in any drawing. Its add button (also in the context menu and the command palette) saves the selection as an item (with the texts of its shapes, groups and frames with their shapes, files of its images), named by the text of its shape, the name of its shape or its number of shapes. An item is shown by its preview: a click inserts it in the middle of the view, a drag inserts it where it is dropped; inserted shapes get new ids, their arrows stay linked to the shapes of the item (not to others), they are selected, one step of history. The library is kept in the browser (`<localStorageKey>-library`: shared by the drawings of the drawer, of the web app for example), exported to and imported from `.freedrawinglib` files (items already there left out; only drawing shapes are read, as in drawing files). It is shown at the place of the layers panel: one of them at a time. In read only, items are added, not inserted.

```js
const item = drawer.library.add(); // selected shapes by default, or given ones, and a name
drawer.library.insert(item.id, { x: 0, y: 0 }); // centered on a point (middle of the view by default)
drawer.library.rename(item.id, 'Card');
drawer.library.remove(item.id);
drawer.library.items; // oldest first
drawer.library.toFile(); // content of a .freedrawinglib file, see also exportFile() and importFile()
drawer.library.setItems(items); // library of an app (account, server)
drawer.on('library.change', (items) => {});
```

Drawing shapes are konva shapes or groups (`DrawingShape` type): `getDrawingShapes()` and `getSelectedShapes()` may return groups, their shapes are their children.

## Texts of shapes

A double click on a rectangle, an ellipse or a shape of "More tools" (triangle, star, speech bubble...) (with the selection tool, also in its empty inside), or a click of the text tool on it, writes in it: its text is centered in it, as wide as its inside (inner rectangle of ellipses), and follows it when it is moved, resized (its letters keep their size) or turned. On an arrow, the text is a label on its middle, with a halo of the background color cutting the line. A shape and its text are selected, styled (color, font, size...), copied and removed together; a text whose shape is removed alone stays as a free text.

The text of a shape is a text of the drawing with a `containerId` attribute, the id of its shape: placed in it on each change.

## Arrows

The panel of the arrow tool (and of selected arrows) chooses their path and the head of each end:

- path: straight, curved or elbow;
- head of the start and of the end: none, arrow (open), triangle, dot or bar.

A curved arrow bends on the side the pointer went while drawing it, as far as it went (on its left for a straight gesture). An elbow arrow is made of horizontal and vertical lines: it leaves the sides of the shapes it links (straight out of them first, room for its heads), goes around them, never through them, and turns in the middle of the space between them; a free end leaves along the longest distance between the ends.

A selected curved or elbow arrow (alone, with the selection tool) has a handle in its middle: dragged, it bends the curve on either side (straight near the line), or moves the middle segment of the elbow arrow (back to its automatic place near it; a place in a shape is not taken). The arrow keeps it when its shapes move; an elbow arrow whose middle segment turns the other way (shapes moved round each other) gets its automatic path again.

`arrowType` and `arrowheads` options give them to new arrows, `drawer.setArrowType('elbow')` and `drawer.setArrowheads({ start: 'dot' })` change them for new and selected arrows (path drawn again between their ends). They are saved as `arrowType` (none for straight arrows), `startHead`, `endHead`, `bend` (distance of the middle of a curve from the straight line, in lengths of the arrow, positive on its left) and `elbowMid` (distance of the middle segment from the middle between the ends) attributes of arrows: arrows of previous versions keep their triangle at the end. Exports draw them as shown.

## Linked arrows

An arrow drawn from a shape to another one (end near them, 12 px on screen whatever the zoom) is linked to them: its ends follow them when they move, are resized or rotated. Rectangles, ellipses and the shapes of "More tools" (triangles, stars, speech bubbles...) are linked near their outline as drawn (not the corners of their box), their ends stay on it (the side of a triangle, the dip of a heart), inside only with a background: the empty inside of a big shape is a free place, a small one is linked from its middle. In a frame, ends are linked to its shapes, to the frame only near its border. With the arrow tool, shapes under pointer show the middle of their sides (on the outline of the shapes of "More tools"): an end released near one is fixed to this side (e.g. bottom of a shape to left side of another one), else it stays on the outline aiming at the other end. An elbow arrow leaves the sides of its shapes facing each other across the space between them (or the sides it is fixed to) and is drawn again around them when they move. Ctrl (Cmd) draws an arrow without links. Arrows moved without their shapes (or with removed shapes) are unlinked, copies of arrows and shapes are linked together. Links are `startBinding` / `endBinding` (ids of shapes) and `startAnchor` / `endAnchor` (`top`, `right`, `bottom`, `left`) attributes of arrows.

## Stacking order

"Layers" buttons of selection options (or Ctrl+Up / Ctrl+Down, with Shift to front / back) move selected shapes in front of or behind other shapes:

```js
drawer.reorderShapes('forward'); // 'forward' | 'backward' | 'front' | 'back', selected shapes by default
drawer.reorderShapes('back', [shape]);
```

`forward` / `backward` move shapes above / below the next shape they overlap, `front` / `back` above / below all shapes. Moved shapes keep their relative order.

## Images

"Insert image" (image tool of the toolbar, settings menu, context menu, command palette) adds an image file chosen by the user, Ctrl / Cmd + V pastes a copied image (screenshot, image of a page, file) at the pointer. PNG, JPEG, WebP, GIF and SVG files are reduced to 2048 px on their longest side and encoded as WebP (PNG or JPEG in browsers without WebP encoder), so drawings stay small. An image is shown whole in the view (60 % of it at most, never enlarged), keeps its proportions when resized (Shift frees them), and has the options of opacity, stacking order and actions. In dark mode, images keep their colors.

The file of an image is in the files of the drawing (`drawer.files`: data URLs by id, `fileId` attribute of the image), not in the image itself: it is saved with the drawing (`<localStorageKey>-files` in the browser, `files` of drawing files, links and of the `storage` option) and sent once to the users of a collaboration session. Links holding images are long: share a file or a session for big ones. The image tool runs this action and never becomes the active tool; it has no shortcut by default (`widgets: { image: { shortcut: 'i' } }` gives one).

```js
const image = await drawer.addImage(file, { x: 100, y: 100 }); // image file (Blob) or { data, width, height }, null when not an image
await drawer.insertImage(); // file chosen by the user, in the center of the view
drawer.addFiles({ [id]: dataUrl }); // files of images (PNG, JPEG, WebP or GIF data URLs, invalid ones ignored)
```

## Files and links

The settings menu opens and saves drawings as `.freedrawing` files (JSON: background color and shapes), and copies a link to the drawing:

```js
await drawer.saveAs('my-drawing'); // save dialog when the browser has one (Chromium), else download (Ctrl / Cmd + Shift + S)
await drawer.open(); // file chosen by user replaces drawing (.freedrawing, png / svg image keeping its drawing, .excalidraw, .tldr), undo restores it (Ctrl+O), shown in the view
const file = drawer.getDrawingFile(); // file content, `drawer.loadDrawing(file)` loads it
const link = await drawer.getLink(); // current page url with compressed drawing: #drawing=<data> (#<id>=<data> with the id option)
await drawer.copyLink();
drawer.zoomToFit(); // view on the whole drawing (or `zoomToFit(shapes)`): centered, zoomed out when big, not beyond 100 % (Shift + 1)
drawer.zoomToSelection(); // view on the selected shapes, filling it up to 200 % (Shift + 2)
```

No server is needed for links: the drawing is in the url hash. The first drawer of the page without `id` option opens a `#drawing=` link (a drawer with an `id`, a `#<id>=` link): its drawing replaces the saved one (undo restores it), is shown in the view, and the hash is removed from the url.

Files and links can come from anyone: only drawing shapes are created (lines, arrows, rectangles, ellipses, texts, paths, groups and frames of them), other nodes and frames without their parts are ignored. Attributes of the drawing shapes must have their type (number, text, true / false, list of numbers), other attributes read by Konva (patterns, functions...) are ignored, attributes of data (e.g. of plugins) are kept. All shapes are created before the drawing is replaced: a file that can't be loaded leaves it as it is. Shapes received from other users of a collaboration session are checked the same way.

### Drawings of Excalidraw and tldraw

"Open..." (Ctrl / Cmd + O) also opens the drawings of [Excalidraw](https://excalidraw.com) (`.excalidraw`) and [tldraw](https://www.tldraw.com) (`.tldr`), `drawer.loadDrawing(text)` their content: they become drawings of the library, to change and save as `.freedrawing` files. Their shapes become the shapes of its tools:

| Excalidraw | tldraw | Shape |
| --- | --- | --- |
| Rectangle, ellipse, diamond | Rectangle, ellipse, triangle, diamond, hexagon (also pentagon, octagon), star, cloud, heart, check box, arrows (block arrows turned) | Same shape, its text in it |
| Arrow (straight, curved, elbow), its label | Arrow (straight, curved, elbow), its label | Arrow linked to the shapes of its ends, its heads |
| Line | Line (straight, curved) | Line |
| Freehand drawing | Drawing, highlight | Brush stroke, highlighter |
| Text | Text, note | Text, sticky note |
| Frame, group | Frame, group | Frame (its shapes in it), group |
| Image (its file) | Image (file of the drawing) | Image |

- Kept: colors, stroke widths and styles (solid, dashed, dotted), background (solid; hatches of Excalidraw too), opacity, rotation, round corners, locked shapes, links, background color of Excalidraw.
- Not kept: the hand-drawn look (shapes of the library are clean), fonts (the font of the texts of the library), embedded pages, bookmarks and videos, images of other sites, pages of tldraw after the first one.
- As any file, their content is checked: only drawing shapes with valid attributes are created.

## Export

"Export image" of settings menu (Ctrl+Shift+E) opens a dialog with a preview: png, svg or pdf image, `.freedrawing` file or png copied to clipboard. Selected shapes are exported when there is a selection (whole drawing can be chosen in dialog), with or without background, in dark mode or not.

```js
drawer.showExport(); // export dialog
const blob = await drawer.exportImage('png', { selected: true, background: true, dark: false, scale: 2 }); // 'png' | 'svg' | 'pdf'
const editable = await drawer.exportImage('svg', { withDrawing: true }); // drawing kept in the image
```

Svg is vector (shapes, texts), pdf contains a png quality image of the drawing (jpeg, always with a background). The scale of png and pdf images is lowered for a very big drawing, so the image fits the canvas limits of browsers (32767 px of side, 268 Mpx, 16.7 Mpx on iPhone and iPad).

### Editable images

An exported image is usually only pixels (png) or lines (svg): opened again, its shapes can't be changed, so the `.freedrawing` file has to be kept next to it. With "Keep the drawing in PNG and SVG images" of the export dialog (`withDrawing` option), the image also holds an editable copy of its drawing: one file is both the image and its source.

1. Export the drawing (or the selection) as png or svg with the option: the image looks and is shown as any other one (mail, documents, chats, wikis, pull requests).
2. Later, "Open" of the menu (Ctrl+O) accepts this image as a `.freedrawing` file: its shapes come back as drawn (texts, notes, linked arrows, frames, images...), ready to be changed and exported again. As any opened file, it replaces the drawing (Ctrl+Z gives it back) and is shown in the view.

What is kept:

- the shapes of the image: the selection when only the selection is exported, else the visible drawing, with the files of their images (a photo in the drawing makes the image bigger: it is kept twice, as pixels and as its file);
- the background color of the drawing, not the export options (dark mode, scale, image without background): the drawing opened again is the drawing as drawn.

Limits:

- png and svg only, not pdf; images copied to the clipboard do not keep it (browsers encode them again);
- an image changed by another program or service (cropped, resized, compressed, sent through some chats) often loses it: opened, it is refused as an "image without a drawing";
- the drawing of the image can be read by anyone who has the image, as a `.freedrawing` file (names of shapes, links, texts hidden behind others...): share such images as the drawing itself;
- pasting such an image in a drawing adds the image, not its shapes.

For developers: the drawing file (JSON) is compressed as in links (`z` + deflate-raw in base64url, `j` + base64url without `CompressionStream`), in a `tEXt` chunk of keyword `free-drawing` before the end of png images, in a `<metadata id="free-drawing">` element at the start of svg images.

```js
const image = await drawer.exportImage('png', { withDrawing: true, selected: false });
// another drawer, another app: open() reads .freedrawing files and images keeping their drawing
await drawer.open();
```

## Collaboration

`collaboration` option adds "Live collaboration" to settings menu: a dialog to choose a name, start a session in a new room, share its link (or QR code to scan) and stop the session. Opening a room link (`#room=<id>&by=<user id>&key=<key>`) joins the room. Sessions are [encrypted end to end](https://free-drawing-docs.netlify.app/get-started/#end-to-end-encryption): the server never reads the drawing. Every drawing change (any tool, eraser, moves, styles, background color, undo / redo...) is sent to the other users of the room through a [socket.io](https://socket.io/) server (see [apps/server](https://github.com/fabienwnklr/free-drawing/tree/master/apps/server)), `socket.io-client` and the QR code generator are loaded only then. Undo and redo change only the shapes changed by the user: changes of the other users are kept.

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

Presentation: the owner presents its view (panel, command palette, `collaboration.present(true)`), the other users follow its zoom and moves, the area it shows fitted to their screen (`drawer.getViewArea()`, `drawer.showArea(area)`). A user moving or zooming their view stops following it: "Follow" in the header (or the panel, the command palette, `collaboration.follow()`) follows it again. Users joining meanwhile follow it at once, it stops when the owner leaves. During a [slideshow](https://free-drawing-docs.netlify.app/get-started/#slideshow), the owner presents its slides: `VIEW` carries the box of the frame shown with `slide: true`, the other users see it alone.

A user opening a room link enters a name before joining. The user who created the room is its owner (secret kept in browser, so reloading the page joins the room again): in the dialog, the owner shares the link, gives or removes the right to draw of each user, chooses whether new participants can draw (by default they view only until given the right, also when coming back with a new id) and stops the session. Other users only change their name in the dialog. Users without the right are in read only mode (`drawer.setReadOnly`), their changes are refused by the server (sent again once they may draw).

Links contain the id of the user sharing them (`by`), the page URL of each user too: the owner sees who invited each user, even with a link copied from the address bar.

Socket events: `JOIN` (`{ room, name, userId, userKey, ownerKey, invitedBy, keyCheck }`, `userKey` secret of the browser: its id is given to this browser only, `keyCheck` for an encrypted room), `JOINED` (`{ userId }`, id given by server to the joining user, e.g. of their logged in account: used to recognize oneself in users), `NAME`, `USERS` (users of the room `{ id, name, owner, canEdit, invitedBy }`, `invitedBy` is the name of the user who shared the link, sent by server), `RIGHTS` (`{ userId, canEdit }`, from owner), `ROOM` (settings of the room `{ newUsersCanEdit, encrypted }`, sent by server on join and change, by owner to change them), `VIEW` (area `{ x, y, width, height, slide }` shown by the owner presenting it, `slide` for a frame of its slideshow, null when it stops, relayed by server and sent to each user joining, null without presentation), `REQUEST` (right to draw asked by a viewer, relayed to the owner as `{ userId, name }`; the owner answers `{ userId, accepted }`, a refusal is sent back as `{ accepted: false }`), `REJECTED` (`{ event, reason }` sent by server: `full` room, the session stops, drawing `too-big`, the user is told their changes are not shared, `right` for a change of a user without right to draw, or `key` of an encrypted room missing or wrong, the session stops; a refused change gives the ids of its shapes `{ upsert, remove }`: sent again with a next change), a change bigger than `maxMessageSize` of the protocol (10 MB: the server would close the connection) is sent in several messages, a shape or an image file too big alone is not sent (until changed) and told the same way, `POINTER` (position in drawing, null out of drawer, relayed with user `id` and `name`), `LEAVE` (id of user leaving, sent by server) and `CHANGE`: `{ upsert, remove, order, live, full, kept, background, files }`, JSON of shapes added or updated (konva `toObject`, with their `id`) and ids of removed shapes, so concurrent drawings are merged, `order` ids of shapes from bottom to top when stacking order changed, `live` for previews of shapes being drawn, `background` color of the drawing when changed, `files` image files the room does not have yet. The server keeps the drawing of each room and sends it to users joining it, whole and also empty (`full`, `kept` once users sent it: an empty one was emptied by them), with its background once a user sent one: a user joining takes the background of the room (the first one gives theirs), and sends nothing before it: its drawing is merged with the one of the room (shapes the room knew in a previous visit of this browser, kept in localStorage, removed when removed by others; other shapes of the room take their state there; shapes only in this drawing are added to the room), a room without drawing (`kept` missing) gets the whole drawing. The server may forget image files no shape uses: they are sent again when used again.

A user whose connection was lost keeps drawing: once connected again, the drawing of the room is merged with the changes made meanwhile, which are sent then. Shapes removed or changed by other users meanwhile are removed or updated (unless changed by this user), a room which lost its drawing (last user gone, server restarted) gets it again, a room emptied by its users stays empty. A request to draw is asked again, cursors of users gone meanwhile are removed. With a server without `full`, the whole drawing is sent again as before.

In this repository, run `yarn serve`, open `http://localhost:3000`, start a session from the menu and open its link in other windows.

### End-to-end encryption

Sessions are encrypted end to end: the server relays the drawing and keeps it for users joining later, without being able to read it. Only the people who have the link see it.

How it works:

1. Starting a session creates a random key in the browser (AES-GCM, 128 bits). It is put in the link of the session, after the `#`: `#room=<id>&by=<user id>&key=<key>`. Browsers never send this part of a URL to servers, so the key never reaches the server.
2. Before they leave the browser, shapes (with their texts, colors, links...), image files, the background color, pointers (and laser trails) and the view presented by the owner are encrypted with this key. Other users decrypt them with the key of their link. A message changed on its way, or encrypted with another key, can't be decrypted: it is ignored.
3. The server keeps the drawing of the room shape by shape and checks sizes and limits, without reading it. To refuse a link whose key is missing or wrong, it only knows a proof of the key (its SHA-256 hash), from which the key can't be found: such a link is told "key of the session missing or wrong in the link", instead of showing an empty drawing.

The dialog of the session tells whether it is encrypted ("End-to-end encrypted", with a lock).

What the server still sees: names of users and their rights, ids of rooms, shapes and files, the number and size of shapes and files, the stacking order and when changes are made, not their content.

Good to know:

- Anyone with the link sees the drawing: share it as you would share the drawing. The address of the page of each user holds the key too (reloading the page joins the session again). Rights still decide who can draw: participants view only until the owner lets them draw.
- Copy the whole link (Copy button, QR code): a link cut by an app (characters of the key missing) is refused.
- Encryption needs Web Crypto, only available on secure pages (https, or localhost): on an http page, starting or joining an encrypted session fails with "end-to-end encryption needs a secure page (HTTPS)".
- Sessions started by previous versions and links without `key` are in clear, and still work. A server of previous versions can't keep an encrypted room: the session stops and tells it ("the server does not support end-to-end encryption").
- `collaboration: { encrypt: false }` creates rooms in clear, as previous versions (a server that has to read drawings).

```js
const drawer = new Drawer($el, { collaboration: { url: 'https://draw.example.com' } }); // encrypted rooms
const link = await drawer.startCollaboration(); // https://app.example/#room=...&by=...&key=...
drawer.collaboration?.cipher?.key; // key of the room (cipher null for a room in clear)
await other.startCollaboration(room, 'Bob', invitedBy, key); // joins an encrypted room with the key of its link
new Drawer($el, { collaboration: { encrypt: false } }); // rooms in clear
```

For servers following the protocol: `JOIN` of an encrypted room carries `keyCheck` (SHA-256 of the key, base64url): the first one creates the room as encrypted, then only the same proof joins it (else `REJECTED` `{ event: 'JOIN', reason: 'key' }`); `ROOM` tells `encrypted: true` (without it, the library stops an encrypted session). In an encrypted room, `CHANGE` has `upsert: [{ id, data, files }]` (id of the shape in clear, its konva JSON encrypted, ids of the image files it uses), `background` and `files` encrypted (files under ids of the room: SHA-256 of the key and the id of the file, which is the hash of the image), `remove` and `order` in clear; `POINTER` and `VIEW` are `{ data }` (`POINTER` relayed as `{ id, name, data }`). Encrypted data is base64url of a random initialization vector of 12 bytes followed by the AES-GCM ciphertext (`RoomCipher`): keep it and relay it as it is.
