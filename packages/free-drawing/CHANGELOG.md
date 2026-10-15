# Changelog

All notable changes to this project will be documented in this file. Each commit updates this file and the package version ([semver](https://semver.org/)).

## [7.6.0](https://github.com/fabienwnklr/free-drawing/compare/v7.5.0...v7.6.0) (2026-10-15)


### Features

* **preferences:** auto save can be turned off (preferences dialog, command palette, `setAutoSave`, `autoSave` preference): changes are then saved with "Save now" (settings menu, command palette, `saveNow`), the menu shows "Not saved" until then and leaving the page asks a confirmation; `hasUnsavedChanges` method and `drawer.unsaved.change` event

## [7.5.0](https://github.com/fabienwnklr/free-drawing/compare/v7.4.0...v7.5.0) (2026-10-15)


### Features

* **toolbar:** "More tools" group in default toolbar: triangle, diamond (D), heart, cloud, highlighter (M), laser pointer (K), frame (F)
* triangle, diamond, heart and cloud drawn in dragged box, with background color and stroke style
* highlighter: wide strokes of its own fluorescent colors and widths, texts under them stay readable
* laser pointer: fading trail, never saved, shown to users of a collaboration session, usable in read only
* frames: named areas whose shapes are moved with them and cut at their edges; shapes drawn or moved in a frame belong to it, resizing a frame does not scale its shapes, exports cut its shapes

### Bug Fixes

* duplicated shape of a group selected alone at its place

## [7.4.0](https://github.com/fabienwnklr/free-drawing/compare/v7.3.0...v7.4.0) (2026-10-15)


### Features

* **layout:** `drawer.layout` (`DrawerLayout`) manages the container and the regions of the interface: `layout.add(region, $element, { hideInZen, after })` adds elements of an app to `header`, `footerStart`, `footer` or `floating`, `LayoutRegion` and `LayoutItemOptions` types exported

### Deprecations

* `$headerContainer`, `$footerContainer`, `$footerLeftElement` (use `layout.add` or `layout.$header`, `layout.$footer`, `layout.$footerStart`) and `UIPointerEvents` (use `layout.setPointerEvents`), still working

## [7.3.0](https://github.com/fabienwnklr/free-drawing/compare/v7.2.0...v7.3.0) (2026-10-15)


### Features

* **toolbar:** groups of widgets (`widgetGroups` option): one button showing its widgets above it, highlighted while one of them is active, icon by name (`shapes`, `more`, `grid`, `plus`, a widget) or svg code, title; groups created by code with `GroupWidget` and `toolbar.addGroup`

## [7.2.0](https://github.com/fabienwnklr/free-drawing/compare/v7.1.0...v7.2.0) (2026-10-15)


### Features

* rotate selection by 90° to the right or left around its center: Shift + R / Shift + L, buttons of selection menu, context menu, command palette, `rotateShapes` method (linked arrows follow)

## [7.1.0](https://github.com/fabienwnklr/free-drawing/compare/v7.0.0...v7.1.0) (2026-10-15)


### Features

* **selection menu:** lock button (Ctrl+Shift+L), locked shapes stay selected with the unlock button

## [7.0.0](https://github.com/fabienwnklr/free-drawing/compare/v6.14.0...v7.0.0) (2026-10-15)


### ⚠ BREAKING CHANGES

* **deps:** konva 10 is required (peer dependency `^10.9.0`): ES modules only, `require('konva').default` in CommonJS, see [konva changelog](https://github.com/konvajs/konva/blob/master/CHANGELOG.md). Konva 10 types `getAttr` / `setAttr` per class: on a `DrawingShape` (shape or group), read attributes from a `Node` (`const node: Node = shape`) or `shape.attrs`
* texts are placed in their lines like HTML texts (konva 10): texts of existing drawings move down a little (about 6% of their font size)

### Features

* konva 10.9: rotation follows the pointer around the center of selection, faster transformer with many selected shapes, finer hit detection of thin lines, hit detection in Brave
* text editor, svg export of texts (underline, line-through) and rotation by 15° with Shift follow konva 10

## [6.14.0](https://github.com/fabienwnklr/free-drawing/compare/v6.13.1...v6.14.0) (2026-10-15)


### Features

* **lock:** locked shapes can be selected to unlock them: a click (after unlocked shapes under pointer), a right click or their row in layers panel selects them alone, with a dashed box and without anchors; they are not moved, transformed, styled nor deleted from canvas. Unlock button in selection menu, unlock item in context menu and command palette, Ctrl + Shift + L locks or unlocks the selection

## [6.13.1](https://github.com/fabienwnklr/free-drawing/compare/v6.13.0...v6.13.1) (2026-10-15)


### Bug Fixes

* **selection menu:** no longer covers the rotation and resize anchors, also on rotated or flipped shapes: placed below the selection, else above, right or left of it

## [6.13.0](https://github.com/fabienwnklr/free-drawing/compare/v6.12.0...v6.13.0) (2026-10-15)


### Features

* **context menu:** right click on a shape selects it and shows actions on selection with their shortcuts: duplicate, lock, delete, bring to front / forward, send backward / to back, flip horizontal / vertical, copy as PNG / SVG, select all; elsewhere actions on drawing: paste, copy as PNG / SVG, select all, snapping, grid
* flip shapes around the center of the selection, texts still readable: Shift + H / Shift + V, `flipShapes` method, also in command palette
* copy selection (or whole drawing) as PNG image or SVG (image and code): Shift + Alt + C / Shift + Alt + S, `copyImage` method, also in command palette
* lock selection with Ctrl / Cmd + Shift + L
* Shift + a letter does not activate a tool anymore (Shift + H flips)

### Bug Fixes

* **context menu:** shown at pointer and kept inside the drawer, also when the drawer is not at the top of the page

## [6.12.0](https://github.com/fabienwnklr/free-drawing/compare/v6.11.0...v6.12.0) (2026-10-15)


### Features

* **layers:** several rows selected: Ctrl / Cmd + click or Ctrl + Space adds or removes a row, Shift + click or Shift + arrows selects the rows from the last one selected (shapes of a same group, hidden and locked ones skipped), shortcuts shown under the list and in help

## [6.11.0](https://github.com/fabienwnklr/free-drawing/compare/v6.10.0...v6.11.0) (2026-10-15)


### Features

* switches instead of checkboxes in preferences, export and collaboration dialogs: on / off state announced by screen readers, keyboard (Space) and pointer as before, native checkboxes in high contrast mode

## [6.10.0](https://github.com/fabienwnklr/free-drawing/compare/v6.9.0...v6.10.0) (2026-10-15)


### Features

* "Preferences..." item of settings menu, Ctrl / Cmd + , and command palette: dialog with theme (light, dark or system), language, zen mode, grid, snapping to objects and name in collaboration sessions, applied at once, `showPreferences` method
* preferences saved in browser (`<localStorageKey>-preferences`): grid, snapping and zen mode restored on next visit too (also with `storage` option), theme and language chosen with previous versions kept
* zen mode is a preference (`zen` of `getPreferences`, `setPreferences` and `drawer.preferences.change` event)

## [6.9.0](https://github.com/fabienwnklr/free-drawing/compare/v6.8.1...v6.9.0) (2026-10-14)


### Features

* types exported for apps: `DrawerOptions`, `DrawerStorage`, `DrawerUser`, `Preferences`, `CollaborationOptions`, `DrawingFile`, `Theme`, `Language`, `CustomTranslations`, `TranslationKey` and types of drawing options (`ColorLike`, `StrokeStyle`, `Edges`, `TextStyle`...)

## [6.8.1](https://github.com/fabienwnklr/free-drawing/compare/v6.8.0...v6.8.1) (2026-10-14)


### Bug Fixes

* **collaboration:** user id given by the server when joining a room (`JOINED` event, e.g. id of logged in account) used to recognize oneself: owner of the room, right to draw, "(you)" in users, links

## [6.8.0](https://github.com/fabienwnklr/free-drawing/compare/v6.7.0...v6.8.0) (2026-10-14)


### Features

* `storage` option: drawing loaded from and saved to the storage of an app (e.g. its server) instead of localStorage, `ready` promise and `loadFromStorage` method, one save at a time with the last drawing, nothing saved before stored drawing is loaded (nor if it can't be)
* `user` option and `setUser` method: id and name of the user of an app in collaboration sessions
* preferences: `getPreferences` and `setPreferences` methods (theme, language, grid, snapping to objects), `drawer.preferences.change` event (one event for several changes)
* `collaboration` option can be `{ url, auth }`: data read by server on connection (e.g. token of logged in user), or function giving it

### Bug Fixes

* **dialogs:** keys of page (Escape, Tab) and clicks not taken anymore by a dialog whose drawer was removed from page while it was shown
* **toast:** message shown as text (HTML of error messages not interpreted)
* **collaboration:** name given in dialog kept for the visit when localStorage is unavailable

## [6.7.0](https://github.com/fabienwnklr/free-drawing/compare/v6.6.0...v6.7.0) (2026-10-14)


### Features

* command palette: "Command palette" item of settings menu and Ctrl / Cmd + K, search field and list of tools and commands available now (edition, selection, view, file, language) with their shortcut and state, filtered while typing (case and accents ignored), run with Enter or click, `commandPalette` option and `showCommandPalette` method

## [6.6.0](https://github.com/fabienwnklr/free-drawing/compare/v6.5.0...v6.6.0) (2026-10-14)


### Features

* interface in English, French, Spanish and German: "Language" choice in settings menu (saved, every text translated at once), browser language by default (English when not available), `language` option ('auto', 'en', 'fr', 'es' or 'de'), `setLanguage` and `t` methods, `language` property, `drawer.language.change` event
* `translations` option: texts of interface replaced by language (e.g. `{ fr: { 'menu.open': 'Ouvrir un dessin' } }`)
* zoom percentage written in language of interface

## [6.5.0](https://github.com/fabienwnklr/free-drawing/compare/v6.4.1...v6.5.0) (2026-10-14)


### Features

* dark mode: "Dark mode" item of settings menu (Alt+Shift+D), choice saved, `theme` option ('light', 'dark' or 'system', device theme followed), `setTheme`, `toggleDarkMode` and `isDarkMode` methods, `drawer.theme.change` event
* in dark mode, drawing shown with inverted colors (as dark export), colors of shapes kept, color swatches and text being edited shown the same way, export in dark mode by default

## [6.4.1](https://github.com/fabienwnklr/free-drawing/compare/v6.4.0...v6.4.1) (2026-10-14)


### Bug Fixes

* **selection:** snapping to objects while resizing: resized sides and corners aligned on edges and centers of other shapes (guides shown), grid snapping kept when not snapped to a shape
* **selection:** shapes moved or resized together are not snapping guides of each other

## [6.4.0](https://github.com/fabienwnklr/free-drawing/compare/v6.3.0...v6.4.0) (2026-10-14)


### Features

* arrows linked to shapes: an arrow drawn from a shape to another one follows them when they move, are resized or rotated, ends fixed to the side whose middle is chosen (shown with arrow tool, e.g. bottom of a shape to side of another one) or on outline aiming at the other end, Ctrl / Cmd draws without links, arrows moved alone unlinked, copies linked together

## [6.3.0](https://github.com/fabienwnklr/free-drawing/compare/v6.2.0...v6.3.0) (2026-10-14)


### Features

* round corners of rectangles: "Edges" buttons (sharp / round) and radius field of rectangle tool and selection options, also for rectangles of groups, `edges` option and `setEdges` method: radius following rectangle size (a quarter of its smallest side, 32 at most, empty field) or chosen one

## [6.2.0](https://github.com/fabienwnklr/free-drawing/compare/v6.1.0...v6.2.0) (2026-10-14)


### Features

* Shift pressed or released while drawing applies at once (square, circle, 45° line or arrow), without moving pointer
* brush draws a straight stroke from its start with Shift
* selected shapes resized freely by corners, proportions kept with Shift (texts always keep them): before, corners always kept proportions
* Shift while rotating rotates by 15°, while moving moves horizontally or vertically

## [6.1.0](https://github.com/fabienwnklr/free-drawing/compare/v6.0.0...v6.1.0) (2026-10-14)


### Features

* events named `drawer.<subject>.<action>`: `drawer.change`, `drawer.options.change`, `drawer.selection.change`, `drawer.readonly.change` and `drawer.collaboration.change` (drawer), `drawer.dropdown.hide` and `drawer.toast.hide` (components)

### Deprecations

* events `change`, `fd.options.change`, `fd.selection.change`, `fd.readonly.change`, `fd.collaboration.change`, `fd.dropdown.hide` and `fd.toast.hide`: still listened and triggered, with a warning in console, use `drawer.*` names

## [6.0.0](https://github.com/fabienwnklr/free-drawing/compare/v5.7.0...v6.0.0) (2026-10-14)


### ⚠ BREAKING CHANGES

* drawing shapes may be groups (konva `Group`, `DrawingShape` type): `getDrawingShapes`, `getSelectedShapes`, `duplicateShapes` and `ungroupShapes` return shapes or groups, shape methods (`fill`, `stroke`...) need a check

### Features

* groups of shapes (Ctrl+G, Ctrl+Shift+G, selection menu, layers panel), moved, transformed, ordered, renamed, hidden, locked, duplicated and deleted together, groups of groups, `groupShapes`, `ungroupShapes` and `canGroupShapes` methods
* click selects group of a shape, Ctrl+click selects the shape alone
* layers panel: shapes of groups under their expanded group (arrow button, Right / Left arrows), reordered in their group
* groups saved, in history, files, links, exports and live collaboration

### Bug Fixes

* eraser click on a shape saves the change (history, autosave, collaboration)

## [5.7.0](https://github.com/fabienwnklr/free-drawing/compare/v5.6.0...v5.7.0) (2026-10-14)


### Features

* layers panel (button in header, Alt+L): list of shapes, top one first, to select, rename, reorder (drag handle, Alt + arrows), hide, lock and delete them (`layersPanel` option)
* shapes names, hidden and locked states, saved with shapes: `setShapeLabel`, `getShapeLabel`, `setShapesHidden` and `setShapesLocked` methods, hidden and locked shapes are not selectable

## [5.6.0](https://github.com/fabienwnklr/free-drawing/compare/v5.5.0...v5.6.0) (2026-10-14)


### Features

* **selection:** Shift + click adds or removes a shape, Alt + click selects the shape behind the selected one, Shift adds shapes of selection rectangle
* **selection:** selection dragged from any place of its box (inside of shapes without background, around lines)

### Bug Fixes

* **selection:** click selects only the shape drawn under pointer, not every shape around it: a text (or a small shape) on a shape is selected alone, a pressed shape is selected and dragged alone
* **selection:** selection rectangle selects shapes entirely in it, a rectangle drawn in a big shape selects the small shapes on it
* inside of rectangles and ellipses without background does not hide shapes under it (click, eraser): an empty inside selects the smallest shape around pointer, the eraser erases their outline
* lines saved while selected keep a wide hit region (easier to click)

## [5.5.0](https://github.com/fabienwnklr/free-drawing/compare/v5.4.0...v5.5.0) (2026-10-14)


### Features

* menu next to selected shapes: duplicate, bring forward, send backward and delete (`selectionMenu` option)
* duplicate selection with Ctrl+D, `duplicateShapes` and `deleteShapes` methods

## [5.4.0](https://github.com/fabienwnklr/free-drawing/compare/v5.3.0...v5.4.0) (2026-10-14)


### Features

* stacking order of selected shapes: bring forward / send backward (past the next overlapping shape), bring to front / send to back, with "Layers" buttons of selection options, Ctrl+Up / Ctrl+Down (with Shift to front / back) and `reorderShapes` method
* **collaboration:** stacking order shared with other users and kept for users joining later

## [5.3.0](https://github.com/fabienwnklr/free-drawing/compare/v5.2.0...v5.3.0) (2026-10-14)


### Features

* **collaboration:** users who joined a session only see their name in the dialog (no link, QR code, users nor stop button), kept for the owner
* **collaboration:** owner sees who invited each user: links and page URL contain the id of the user sharing them (`#room=<id>&by=<user id>`)

## [5.2.0](https://github.com/fabienwnklr/free-drawing/compare/v5.1.0...v5.2.0) (2026-10-14)


### Features

* **collaboration:** name asked to users opening a room link before joining, owner of the room (its creator) joins it again without dialog
* **collaboration:** owner gives or removes the right to draw of each user in the dialog, users without the right are in read only mode and their changes are ignored by server
* read only mode: drawing can't be modified by user (tools except pan, shortcuts and menu items modifying drawing, text edition), `readOnly` option and `setReadOnly` method

## [5.1.0](https://github.com/fabienwnklr/free-drawing/compare/v5.0.0...v5.1.0) (2026-10-14)


### Features

* **collaboration:** cursor of each other user with their name, same size whatever zoom, hidden out of drawer
* **collaboration:** shapes are shown to other users while they are drawn, moved or transformed (every 50 ms at most), not only at the end

## [5.0.0](https://github.com/fabienwnklr/free-drawing/compare/v4.2.0...v5.0.0) (2026-10-14)


### ⚠ BREAKING CHANGES

* **collaboration:** `collaboration` option no longer connects every client at init: it adds "Live collaboration" to settings menu, sessions are started there (or with `startCollaboration`) in a room, or by opening a room link
* **collaboration:** clients join a room (`JOIN` event with room and name) before sending `CHANGE` events, a custom socket.io server must handle rooms (see server/index.mjs)


### Features

* **collaboration:** live collaboration dialog: user name, start a session in a new room, room link with copy button and QR code to scan, connected users, stop session, message when server can't be reached
* **collaboration:** room link (`#room=<id>`) joins the room, reloading page joins it again, `startCollaboration`, `stopCollaboration`, `getCollaborationLink`, `setUserName` and `showCollaboration` methods
* **collaboration:** server keeps the drawing of each room, users of a room only get its changes

## [4.2.0](https://github.com/fabienwnklr/free-drawing/compare/v4.1.0...v4.2.0) (2026-10-14)


### Features

* **export:** export dialog from settings menu (Ctrl+Shift+E) with preview: png, svg (vector), pdf and `.freedrawing` file, image copied to clipboard
* **export:** selected shapes or whole drawing (chosen in dialog), with or without background, dark mode, png and pdf scale, `exportImage` and `showExport` methods

## [4.1.0](https://github.com/fabienwnklr/free-drawing/compare/v4.0.1...v4.1.0) (2026-10-14)


### Features

* **files:** open and save as `.freedrawing` files (JSON of background and shapes) from settings menu, Ctrl+O and Ctrl+S, browser save dialog when available, `saveAs`, `open`, `getDrawingFile` and `loadDrawing` methods
* **files:** copy link to drawing, drawing is compressed in link hash (no server), page opened with it loads the drawing, `getLink` and `copyLink` methods

## [4.0.1](https://github.com/fabienwnklr/free-drawing/compare/v4.0.0...v4.0.1) (2026-10-14)


### Bug Fixes

* **keyboard:** Ctrl / Cmd + A selects shapes only, not page text (position widget...), interface panels texts are not selectable

## [4.0.0](https://github.com/fabienwnklr/free-drawing/compare/v3.8.0...v4.0.0) (2026-10-14)


### ⚠ BREAKING CHANGES

* **collaboration:** drawing changes are sent with `CHANGE` event (`{ upsert, remove }`: JSON of shapes added or updated, ids of removed shapes) instead of `DRAW` (brush strokes only), a custom socket.io server must relay `CHANGE` (see server/index.mjs), `_socketDraw` of widgets is removed


### Features

* **collaboration:** every drawing change is shared (all tools, eraser, moves, styles, undo / redo, clear canvas), concurrent drawings are merged shape by shape, changes received while drawing are applied at the end of the stroke, server sends the drawing to clients connecting later
* drawing shapes have a unique `id`


### Bug Fixes

* **history:** undo and redo are saved (`autoSave`) and trigger drawer `change` event

## [3.8.0](https://github.com/fabienwnklr/free-drawing/compare/v3.7.0...v3.8.0) (2026-10-14)


### Features

* **shapes:** stroke styles solid, dashed and dotted (round dots), dashes and dots follow stroke width, `strokeStyle` option and `setStrokeStyle('dashed')`


### Bug Fixes

* **shapes:** dashes of thick lines and arrows no longer look solid, same dash ends for lines, arrows, rectangles and ellipses


### Deprecations

* `strokeDash` option and dash array of `setStrokeStyle`: still accepted, a dash array gives `'dashed'` style (`fd.options.change` event sends `strokeStyle` instead of `strokeDash`)

## [3.7.0](https://github.com/fabienwnklr/free-drawing/compare/v3.6.0...v3.7.0) (2026-10-14)


### Features

* **colors:** custom color input (browser color picker) in every color choice: stroke, text and background colors
* **colors:** transparent background color, `setBgColor('transparent')`
* **shapes:** background color of rectangles and ellipses (transparent by default), in shape tools and selection options, `fillColor` option and `setFillColor` method

## [3.6.0](https://github.com/fabienwnklr/free-drawing/compare/v3.5.1...v3.6.0) (2026-10-14)


### Features

* **position:** position widget at top left, shows x / y of view center (0, 0 at origin, not changed by zoom on view center) while moving, with a button back to origin keeping zoom, `positionWidget` option (default `true`), hidden in zen mode

## [3.5.1](https://github.com/fabienwnklr/free-drawing/compare/v3.5.0...v3.5.1) (2026-10-14)


### Bug Fixes

* **text:** changing text style keeps width given to text box (scaled with font size) instead of fitting it to content, line breaks are kept

## [3.5.0](https://github.com/fabienwnklr/free-drawing/compare/v3.4.0...v3.5.0) (2026-10-14)


### Features

* **ui:** consistent style: same colors, radius, shadows, spacing and font sizes for panels, menus, dialogs and toasts, drawer font in menus and buttons, visible icon of active tool, opacity slider in primary color, confirmation actions on the right


### Bug Fixes

* **toast:** toasts are stacked instead of overlapping and shown in drawer (were fixed to the page when drawer is not full page), with readable colors
* **ui:** help button no longer cut in a small drawer
* **ui:** pointer up over tool options ends the pointer action (tool stayed in action, shortcuts disabled)
* **a11y:** contrast of tool shortcut letters, 24px color buttons, same keyboard focus outline for every control
* **css:** drawer styles no longer apply to the page (`.backdrop`, toast animations)

## [3.4.0](https://github.com/fabienwnklr/free-drawing/compare/v3.3.2...v3.4.0) (2026-10-14)


### Features

* **eraser:** trail behind pointer while erasing, thinner towards its tail and fading out

## [3.3.2](https://github.com/fabienwnklr/free-drawing/compare/v3.3.1...v3.3.2) (2026-10-14)


### Bug Fixes

* **eraser:** shapes to erase are shown as a thin red outline until pointer up (struck out for texts), visible whatever their color and opacity, and come back unchanged if erasing stops before pointer up
* **widgets:** changing tool during a pointer action ends it (shortcuts and interface usable again)

## [3.3.1](https://github.com/fabienwnklr/free-drawing/compare/v3.3.0...v3.3.1) (2026-10-13)


### Bug Fixes

* **a11y:** settings menu items expose their shortcut, the confirmation dialog they open (clear canvas, clear stored data) and the new tab opened by Github
* drawer buttons no longer submit a form of the page when drawer is inside a form (`type="button"`)

## [3.3.0](https://github.com/fabienwnklr/free-drawing/compare/v3.2.1...v3.3.0) (2026-10-13)


### Features

* **a11y:** keyboard navigation: one tab stop in toolbar with arrow keys, Home and End between tools, context menu with arrow keys (also opened with Shift+F10 or context menu key), Escape closes settings menu and context menu
* **a11y:** help and confirmation dialogs: focus moves into dialog, stays in it with Tab, goes back to the opening element on close, drawer shortcuts are disabled while open
* **a11y:** accessible names of icon buttons (tools, colors, widths, styles, zoom, undo / redo, help, menu), pressed, checked and expanded states, labelled groups of tool options, announced toasts
* **a11y:** visible keyboard focus: frame around drawer when focused with keyboard, button outline only for keyboard focus (no more after a click)


### Bug Fixes

* **keyboard:** arrow keys in opacity slider no longer move selected shapes
* **confirm:** cancel and confirm are focusable buttons, cancel is focused when shown
* **a11y:** drawer is in the page tab order (`tabindex` 0 instead of 1)

## [3.2.1](https://github.com/fabienwnklr/free-drawing/compare/v3.2.0...v3.2.1) (2026-10-13)


### Bug Fixes

* **selection:** select all hides overlay of active tool (shapes, text...), and does nothing without shapes


### Deprecations

* widgets `isPaint`, `isErasing`, `isSelecting` and `isGrabbing` are replaced by `inAction` (read only)

## [3.2.0](https://github.com/fabienwnklr/free-drawing/compare/v3.1.0...v3.2.0) (2026-10-13)


### Features

* **options:** `widgets` option, list (`['brush', 'eraser']`) or object of widgets options (`{ brush: {} }`), toolbar keeps the given order
* **widgets:** `title` and `shortcut` options for every widget, `thinning`, `smoothing` and `streamline` options for brush
* **help:** shortcuts list shows available widgets with their shortcuts

## [3.1.0](https://github.com/fabienwnklr/free-drawing/compare/v3.0.3...v3.1.0) (2026-10-13)


### Features

* **text:** side handles resize the text box (line breaks) without changing text size, corners still scale text


### Bug Fixes

* **selection:** shapes stay selected after a resize or rotation released outside of them
* **text:** select all on texts no longer shows top / bottom handles which stretched text

## [3.0.3](https://github.com/fabienwnklr/free-drawing/compare/v3.0.2...v3.0.3) (2026-10-13)


### Bug Fixes

* **text:** editing area exactly on text (was shifted down), accents and italic no longer cut
* **text:** text font loaded before measuring texts, first text no longer wraps while editing

## [3.0.2](https://github.com/fabienwnklr/free-drawing/compare/v3.0.1...v3.0.2) (2026-10-13)


### Bug Fixes

* **pan:** hand cursor visible on white canvas

## [3.0.1](https://github.com/fabienwnklr/free-drawing/compare/v3.0.0...v3.0.1) (2026-10-13)


### Build System

* `yarn release` publishes the current version, version and changelog are updated by each commit

## [3.0.0](https://github.com/fabienwnklr/free-drawing/compare/v2.1.2...v3.0.0) (2026-10-13)


### ⚠ BREAKING CHANGES

* `konva` is a peer dependency, install it with the package: `yarn add @fabwcie/free-drawing konva` ([9d075c1](https://github.com/fabienwnklr/free-drawing/commits/9d075c12707b5efa6b26802a9f8e5f78431a1d4c))
* styles must be imported: `import '@fabwcie/free-drawing/style.css'` ([9d075c1](https://github.com/fabienwnklr/free-drawing/commits/9d075c12707b5efa6b26802a9f8e5f78431a1d4c))
* iife and cjs builds are removed, use es (`import`) or umd (`require`) build ([9d075c1](https://github.com/fabienwnklr/free-drawing/commits/9d075c12707b5efa6b26802a9f8e5f78431a1d4c))
* collaboration is disabled by default, enable it with `collaboration` option; `drawer.socket` is `null` without it ([9d075c1](https://github.com/fabienwnklr/free-drawing/commits/9d075c12707b5efa6b26802a9f8e5f78431a1d4c))
* `triggerChange` parameter of setters, `TextWidget.addTextNodeEvents()` and `BrushWidget.getSvgPathFromStroke()` are removed ([55426b5](https://github.com/fabienwnklr/free-drawing/commits/55426b5705b1c30d962fea57dd804bba4b6bf5a4))
* `undoRedo.appHistory` stores JSON strings and keeps the last 100 states ([d6c2604](https://github.com/fabienwnklr/free-drawing/commits/d6c26042cab71a0fc9c46093291df1d2d5b4d6d2))
* `resetDrawer()` clears drawing without confirmation and restores drawing options given on init ([c055cf5](https://github.com/fabienwnklr/free-drawing/commits/c055cf590e08338c2f8ccee5badaac783c5983de))
* canvas background color no longer fills selected shapes ([c055cf5](https://github.com/fabienwnklr/free-drawing/commits/c055cf590e08338c2f8ccee5badaac783c5983de))


### Features

* **text:** text overlay with font family, size, bold, italic, underline, strikethrough and align, `Drawer.setTextStyle()` and `textStyle` option ([d91f9c8](https://github.com/fabienwnklr/free-drawing/commits/d91f9c8c2e5a26e28abfc96414a82c4ade2108c0))
* **shapes:** rectangle, ellipse and arrow tools, shift draws square, circle or 45° lines ([c055cf5](https://github.com/fabienwnklr/free-drawing/commits/c055cf590e08338c2f8ccee5badaac783c5983de))
* `Drawer.setZoomLevel()` limited from 10% to 3000% ([866c33a](https://github.com/fabienwnklr/free-drawing/commits/866c33a9098763ec4f817c120a2980f7d47a2165))
* `Drawer.addShape()` and `fd.options.change` event, all overlays stay in sync with options ([55426b5](https://github.com/fabienwnklr/free-drawing/commits/55426b5705b1c30d962fea57dd804bba4b6bf5a4))
* tool shortcuts `L`, `R`, `C`, `A` and caps lock support ([55426b5](https://github.com/fabienwnklr/free-drawing/commits/55426b5705b1c30d962fea57dd804bba4b6bf5a4))
* paste text with Ctrl / Cmd + V, Cmd shortcuts on Mac ([c055cf5](https://github.com/fabienwnklr/free-drawing/commits/c055cf590e08338c2f8ccee5badaac783c5983de))
* lighter package and data: external dependencies, woff2 font, smaller saved data and history ([9d075c1](https://github.com/fabienwnklr/free-drawing/commits/9d075c12707b5efa6b26802a9f8e5f78431a1d4c), [d6c2604](https://github.com/fabienwnklr/free-drawing/commits/d6c26042cab71a0fc9c46093291df1d2d5b4d6d2), [c055cf5](https://github.com/fabienwnklr/free-drawing/commits/c055cf590e08338c2f8ccee5badaac783c5983de))


### Bug Fixes

* restore history from saved state ([e7e0175](https://github.com/fabienwnklr/free-drawing/commits/e7e017584fbdfe0dfabfed21937e18e4885fe348))
* context menu position shows scrollbar ([1f84e44](https://github.com/fabienwnklr/free-drawing/commits/1f84e4492829649a66a92ea3df6da23837886243))
* brush and line strokes altered by a mouseup started outside canvas, empty text kept on Escape, Alt+Z toggling snapping, keys blocked when shapes are selected, eraser and ctrl+wheel zoom ([4a7b13f](https://github.com/fabienwnklr/free-drawing/commits/4a7b13f92066959eebc0cd076748356559426f9a))
* duplicated history entries, click selection after pan, text colored by background color, zoom buttons limits, duplicated transformer on reload ([866c33a](https://github.com/fabienwnklr/free-drawing/commits/866c33a9098763ec4f817c120a2980f7d47a2165))
* moved text not saved, restored texts not editable, shapes draggable with other tools after reload ([55426b5](https://github.com/fabienwnklr/free-drawing/commits/55426b5705b1c30d962fea57dd804bba4b6bf5a4))
* published types and package entries ([9d075c1](https://github.com/fabienwnklr/free-drawing/commits/9d075c12707b5efa6b26802a9f8e5f78431a1d4c))
* grid hidden outside saved view after pan, corrupted or full localStorage ([d6c2604](https://github.com/fabienwnklr/free-drawing/commits/d6c26042cab71a0fc9c46093291df1d2d5b4d6d2))
* undo / redo buttons state, toasts kept in page, arrow keys move not saved, several drawers on a page ([c055cf5](https://github.com/fabienwnklr/free-drawing/commits/c055cf590e08338c2f8ccee5badaac783c5983de))

## [2.1.2](https://github.com/fabienwnklr/free-drawing/compare/v2.1.1...v2.1.2) (2025-01-04)


### Bug Fixes

* **brush:** prevent overlay click fire twice ([b2e4815](https://github.com/fabienwnklr/free-drawing/commits/b2e4815c905c84220d4d174a21e330d2c23f4dc2))

## [2.1.1](https://github.com/fabienwnklr/free-drawing/compare/v2.1.0...v2.1.1) (2025-01-03)

## [2.1.0](https://github.com/fabienwnklr/free-drawing/compare/v2.0.1...v2.1.0) (2024-06-10)


### Features

* **line:** drawing line ([bcf2ada](https://github.com/fabienwnklr/free-drawing/commits/bcf2ada6431d7599dea6669f6db613372899a04c))
* **line:** start creating line ([02e429b](https://github.com/fabienwnklr/free-drawing/commits/02e429be27afb75025150d41b7e18bf174f3d1b8))
* **line:** update cursor ([6b293f6](https://github.com/fabienwnklr/free-drawing/commits/6b293f6b251e0d757e23b8b0efe29b05399874b5))
* **shape:** add custom stroke style ([3e97e05](https://github.com/fabienwnklr/free-drawing/commits/3e97e05f97398c0022a24cec07272cbf2ad38dc6))
* **socket:** start setup socket.io ([524c9e1](https://github.com/fabienwnklr/free-drawing/commits/524c9e1d018db67ce8273c395677c9f7c7c381cd))
* **widgets:** add widgets ([14bca91](https://github.com/fabienwnklr/free-drawing/commits/14bca91cea3de075d0353b7b1aef465dbf3f1f1f))


### Bug Fixes

* centralise data attributes ([7a33480](https://github.com/fabienwnklr/free-drawing/commits/7a33480b474a136011995d1c5432b4d6cdaf5d55))
* **line:** id/title ([b5dfbc7](https://github.com/fabienwnklr/free-drawing/commits/b5dfbc7a4dd46b9e3ef9178b5dedebb2d4f0d4c9))
* optionnal `_sockerDraw` on abstract class `BaseWidget` ([f26aabf](https://github.com/fabienwnklr/free-drawing/commits/f26aabfe1ed728301dc24816f58a2bacc3d754e9))
* resize when is full on window resizing ([fb5511c](https://github.com/fabienwnklr/free-drawing/commits/fb5511c89aeae01c28a46298b522052e6021f9f9))
* same line draw multiple time ([6bf0dc0](https://github.com/fabienwnklr/free-drawing/commits/6bf0dc061a5d556271fc3cb0df80b33b8ab80c9a))
* types error ([1415e22](https://github.com/fabienwnklr/free-drawing/commits/1415e22c0d6ee2d930a85fb43ba663ce8b244157))

## [2.0.1](https://github.com/fabienwnklr/free-drawing/compare/v2.0.0...v2.0.1) (2024-04-18)


### Features

* add microevent to dropdown ([7310925](https://github.com/fabienwnklr/free-drawing/commits/731092578c4ec64ec5a0fd6df41fa80ec2a23b8f))
* **toast:** add `MicroEvent` and icon ([1384cc4](https://github.com/fabienwnklr/free-drawing/commits/1384cc488a8220e1dabff65023cee4f1ca051dfe))


### Bug Fixes

* **dropdown:** trigger hide if is shown only ([8a66747](https://github.com/fabienwnklr/free-drawing/commits/8a667479dab69d9158f738d0f3cc994912ac0f85))

## [2.0.0](https://github.com/fabienwnklr/free-drawing/compare/v1.0.1-alpha.1...v2.0.0) (2024-04-11)


### ⚠ BREAKING CHANGES

* rename `resetDraw` to `resetDrawer` ([e8d9e04](https://github.com/fabienwnklr/free-drawing/commits/e8d9e04a46225b902f938b96158f1777de3a473f))


### Bug Fixes

* width for text node editing ([550bdc1](https://github.com/fabienwnklr/free-drawing/commits/550bdc1db1a900f05e1d892f02b96337cf9c5fcd))

## [1.0.0](https://github.com/fabienwnklr/free-drawing/compare/v0.0.0...v1.0.0) (2024-04-11)


### ⚠ BREAKING CHANGES

* rename `clearConfirmModal` and `clearStoredConfirmModal`

### Features

* create class for layout management ([2837ef6](https://github.com/fabienwnklr/free-drawing/commits/2837ef66a43b5f458bbf0238d22c4928a7470cd3))


### Bug Fixes

* rename `clearConfirmModal` and `clearStoredConfirmModal` ([eafe34c](https://github.com/fabienwnklr/free-drawing/commits/eafe34c2a637dc506e93d061dcb79b09c5490720))

## 0.0.0 (2024-04-10)


### ⚠ BREAKING CHANGES

* change default options `autoSave` to true
* move `activeWidget` from toolbar to drawer
* default size full screen
* add `autoSave` option

* change default options `autoSave` to true ([662f7f2](https://github.com/fabienwnklr/free-drawing/commits/662f7f2b2862ce2a32b88be147b23a6e097b5bfb))
* move `activeWidget` from toolbar to drawer ([a1496d6](https://github.com/fabienwnklr/free-drawing/commits/a1496d608407f046f274deaa39f461740de96726))


### Features

* add `autoSave` option ([e4d2c00](https://github.com/fabienwnklr/free-drawing/commits/e4d2c00fd1d623559e0d4ca50c7313c511368166))
* add `Clear stored data` button ([09615e8](https://github.com/fabienwnklr/free-drawing/commits/09615e8bfd091c8496360eba6c5ce66e3dd0fac9))
* add `localStorageKey` option ([7c0aa4a](https://github.com/fabienwnklr/free-drawing/commits/7c0aa4a940f73a2cff1867f55653caec07cd514d))
* add `resetDraw` method ([1823090](https://github.com/fabienwnklr/free-drawing/commits/182309090b6c25db8c6b2380237d064495faa575))
* add `strokeWidth` and `strokeColor` options ([2ed957d](https://github.com/fabienwnklr/free-drawing/commits/2ed957d9abe57b5ed87b036b0afe9d7a7fedf52e))
* add `strokeWidth` and `strokeColor` options ([4eafc81](https://github.com/fabienwnklr/free-drawing/commits/4eafc810081dde3f063b15801ff383b6b4ce341c))
* add `Text` widget ([4e7865d](https://github.com/fabienwnklr/free-drawing/commits/4e7865df2c91f72c153869b89c8cd2adf6777203))
* add bgcolor button and optimise stling ([0e2cfca](https://github.com/fabienwnklr/free-drawing/commits/0e2cfcaccec7c218fd9b750de5ddab05d996bffb))
* add context menu ([9afd7b3](https://github.com/fabienwnklr/free-drawing/commits/9afd7b355cb9bf6eb960e42375588ad758d1f8f5))
* add context menu ([d80c6bb](https://github.com/fabienwnklr/free-drawing/commits/d80c6bb808240852761c7dbfb042cd4314a1c72d))
* add ctrl + a shortcut + unselect ([16b4f46](https://github.com/fabienwnklr/free-drawing/commits/16b4f46b070864881fd96461ba75b9a1d2f0c5d5))
* add dropdown / confirm modal ([a9a1ac7](https://github.com/fabienwnklr/free-drawing/commits/a9a1ac71b30a6345c75991ec5710313a0280ba1e))
* add help button with modal ([917feb0](https://github.com/fabienwnklr/free-drawing/commits/917feb0941e14ee1b69c8879c516969b4b20df85))
* add hotkey info into toolbar buttons ([6cab993](https://github.com/fabienwnklr/free-drawing/commits/6cab99349b7013b93c320869c7ee57d62899484e))
* add key event move shape ([b2ea58d](https://github.com/fabienwnklr/free-drawing/commits/b2ea58df13ff0a1fea541a8ecf9232d15773ca39))
* add method `getDrawingShapes` for get all shapes draw from user ([78affae](https://github.com/fabienwnklr/free-drawing/commits/78affaec97663c4125557eac610bdf472edeb5f1))
* add microevent plugin ([1ecb32b](https://github.com/fabienwnklr/free-drawing/commits/1ecb32b9574286ac33b9d2a93d37e74e3a9fc57d))
* add opacity to overlay ([ad2bd43](https://github.com/fabienwnklr/free-drawing/commits/ad2bd43e7953a7fafa03134942c6fc29b5c8000c))
* add options ([007b32d](https://github.com/fabienwnklr/free-drawing/commits/007b32d33daddf3afaf96e76fdc9531c094ecde6))
* add overlay class ([a385f53](https://github.com/fabienwnklr/free-drawing/commits/a385f53f3d9ab7d3399e1208375e4ecaa3ffb919))
* add rotation snap ([a1cafae](https://github.com/fabienwnklr/free-drawing/commits/a1cafaed6bf905337e1e4c9f8b144f1a2e61edf9))
* add save/load from json ([862ac38](https://github.com/fabienwnklr/free-drawing/commits/862ac38e0b85c439934808b76d67d4dab233ec42))
* add select overlay and update fieds ([d5a6eff](https://github.com/fabienwnklr/free-drawing/commits/d5a6effd4987c90b8f5eeb2e513f950e6f289da5))
* add setColor method ([7e90d15](https://github.com/fabienwnklr/free-drawing/commits/7e90d155242ababd75de982ff14afea2614dc1de))
* add setting btn ([9eb4470](https://github.com/fabienwnklr/free-drawing/commits/9eb447086ec7f6b9217b0609b42b8b2e3b09a5a8))
* add shortcut for brush toolbar button ([9da4a87](https://github.com/fabienwnklr/free-drawing/commits/9da4a873eddfa5a91991de6d7b43292c712f8a17))
* add shortcut keyboard events ([a960ac2](https://github.com/fabienwnklr/free-drawing/commits/a960ac211599309913007aa7dfb36de6feb16a76))
* add snapping shape ([3e661cd](https://github.com/fabienwnklr/free-drawing/commits/3e661cdcd9ca22111092fef38b2a9edb632f7e07))
* add test hotkey ([96019c6](https://github.com/fabienwnklr/free-drawing/commits/96019c649b629edb3a4a2940fde1574a0794a730))
* add text hotkey ([3454b61](https://github.com/fabienwnklr/free-drawing/commits/3454b615141a28aab2878bfa6b1908e33ae0185c))
* add undo / redo tool ([0e19950](https://github.com/fabienwnklr/free-drawing/commits/0e19950ec6450e537a0f222af5abd293a9fb6511))
* add undo redo widgets ([491077a](https://github.com/fabienwnklr/free-drawing/commits/491077aab9d28471efd50dff5bce3551040f1505))
* add wheel zoom event ([9fb3a6e](https://github.com/fabienwnklr/free-drawing/commits/9fb3a6e6ad69eaf3bd52934a0c99eaae640e9f7e))
* add zen mode ([fd4652f](https://github.com/fabienwnklr/free-drawing/commits/fd4652f6738831eecbf4169f3f3bdbced17e6745))
* add zoom tool ([2104626](https://github.com/fabienwnklr/free-drawing/commits/21046267ac6be9a2c555094569f508e9988ed6d7))
* change cursor on hover shape in selection mode ([ff48e8d](https://github.com/fabienwnklr/free-drawing/commits/ff48e8d4687b6ab42ac341e97ec038a45160040d))
* **context-menu:** add snapping button ([1de0223](https://github.com/fabienwnklr/free-drawing/commits/1de0223355f076f391a2a9f77e83d5f9670d0409))
* hit detection for line to her rect zone ([1ef9368](https://github.com/fabienwnklr/free-drawing/commits/1ef936883467e17a7a7a9b6334696ad5d7a94cc2))
* implement perfect-freehand ([53c2d23](https://github.com/fabienwnklr/free-drawing/commits/53c2d23eec3e47f6bc5a2f47da729a7557cf76f2))
* manage undo/redo buttons state ([a750d04](https://github.com/fabienwnklr/free-drawing/commits/a750d0410b7c4acdc0c93c6eecd72ee144cfee59))
* **modal:** add `closeOnEsc` option ([f4fb1b2](https://github.com/fabienwnklr/free-drawing/commits/f4fb1b29ea0e22d8b0d4a2bb871f709eeba40155))
* **modal:** add hotkey clear canvas ([583a7b5](https://github.com/fabienwnklr/free-drawing/commits/583a7b5e30c1f57e793a731b1d237c55083b69b7))
* paste from context menu ([78bbefd](https://github.com/fabienwnklr/free-drawing/commits/78bbefd612fed145385337e08231c48070ea8d13))
* snapping on resiz (depend on grid) ([1d9ad37](https://github.com/fabienwnklr/free-drawing/commits/1d9ad375ac488a26ce4039822c1c2812338d33c8))
* start drag snap on grid ([af6ae8f](https://github.com/fabienwnklr/free-drawing/commits/af6ae8fdeb270b3295ca5d859d510a61c2ac4bd5))
* start implementing overlay brush ([3c435fc](https://github.com/fabienwnklr/free-drawing/commits/3c435fc5e50e1c53ec7be458409da74de4254da7))
* start implementing overlay brush ([9cd9064](https://github.com/fabienwnklr/free-drawing/commits/9cd9064aa49938386edd656e53e6b8f4375b7442))
* toast ([4a0120a](https://github.com/fabienwnklr/free-drawing/commits/4a0120a7eaa0757c4de7fef1b812a60663b3ef1a))
* use `ModalConfirm` for clear stored data ([b5e5744](https://github.com/fabienwnklr/free-drawing/commits/b5e574475360bf63788b1b11ebf94dcb4b139dce))


### Bug Fixes

* add default id ([41e4803](https://github.com/fabienwnklr/free-drawing/commits/41e4803953fb17bd82d591b78076dd645afd2425))
* anchor on selection ([ad9902a](https://github.com/fabienwnklr/free-drawing/commits/ad9902a21ada36fcb6012bb53858ce4500ff659d))
* available anchor for text shape ([d9966b2](https://github.com/fabienwnklr/free-drawing/commits/d9966b2aed5ff7d2e85e26b096449b531225f777))
* calcul text width ([be8d22e](https://github.com/fabienwnklr/free-drawing/commits/be8d22e1627524f2a65dc8398c91c27cb612a251))
* clear all draw ([fb2e08d](https://github.com/fabienwnklr/free-drawing/commits/fb2e08d691bdde26cd8748aa34b07d55ac53398b))
* clear canvas draw line ([7fcb672](https://github.com/fabienwnklr/free-drawing/commits/7fcb6724e10077a89d64474393ec49672226d23a))
* clear grid events ([0e7cc64](https://github.com/fabienwnklr/free-drawing/commits/0e7cc64d02fce9d656f37d37c3163c65ec926781))
* considere textnode for undo/redo ([0fb9543](https://github.com/fabienwnklr/free-drawing/commits/0fb9543c536ebf3db722b7e6b949e7ac42cb9a1f))
* default size full screen ([87bb542](https://github.com/fabienwnklr/free-drawing/commits/87bb542c44d34757e6a9f0d679913a2ba33512b8))
* dropdown button clickable ([bd8a38b](https://github.com/fabienwnklr/free-drawing/commits/bd8a38b8e88166aece35f36ce9df5796bf5c2cd2))
* eraser mode inly on hover shape ([bf2b232](https://github.com/fabienwnklr/free-drawing/commits/bf2b232cdd31368ab21deff8d6e2e96a9e137345))
* eraser take all drawing shape ([364a6bb](https://github.com/fabienwnklr/free-drawing/commits/364a6bbaddfbe02996e8120ed297b70e6ab46d7b))
* focus drawer on select all (ctrl+a) ([a491332](https://github.com/fabienwnklr/free-drawing/commits/a491332910985c82d6070c69e89309c9ed546bf8))
* fontSize / textarea take scaling for calcul ([acc9167](https://github.com/fabienwnklr/free-drawing/commits/acc916777877e0a161b1666ba584a89119d34e35))
* hide grid ([10b9890](https://github.com/fabienwnklr/free-drawing/commits/10b98904dc28b06d8fef2454ea2dd3f6608084de))
* hide grid save ([f56b51c](https://github.com/fabienwnklr/free-drawing/commits/f56b51c107a48e563762aedd48da03422e6d46d9))
* hide undo/redo for zen mode ([f4638f2](https://github.com/fabienwnklr/free-drawing/commits/f4638f2271e388a1a00af0e085f90068c118e810))
* hit detection on changing tool ([86c7a44](https://github.com/fabienwnklr/free-drawing/commits/86c7a446edcf3581152e09645faf02f5849c1c5f))
* hotkey ctrl+a doesn't work ([f200495](https://github.com/fabienwnklr/free-drawing/commits/f20049506510659e8758d1e41b5c4fb4e1947199))
* infinite grid and remove snap lines ([14031b5](https://github.com/fabienwnklr/free-drawing/commits/14031b5c42cf67a9a1dafe19f32d16eb74c65e6c))
* init default tool ([a3d9f03](https://github.com/fabienwnklr/free-drawing/commits/a3d9f030ec12f561dddb4c3960be8bbe29778fd3))
* keepRatio for text shape ([c076a3f](https://github.com/fabienwnklr/free-drawing/commits/c076a3f2927475de8c78be85bb9e0eab1af2171a))
* limit min/max scale ([790039f](https://github.com/fabienwnklr/free-drawing/commits/790039f03721eb995820aeeb693ffbc7516731c7))
* line ([f770e44](https://github.com/fabienwnklr/free-drawing/commits/f770e446a143c0a1d15b8e12959d7c56d8c584d3))
* **modal:** useless call to hide ([71255d3](https://github.com/fabienwnklr/free-drawing/commits/71255d344d60a96e93ae09a97609037211c9fad5))
* order layer for selection layer on top ([c32025f](https://github.com/fabienwnklr/free-drawing/commits/c32025f542543429c2ee866e5cede3d9a34b6d6b))
* paste set draggable when selection mode active ([382a6b5](https://github.com/fabienwnklr/free-drawing/commits/382a6b552dbfb937595801b06e5143daa5ed7a5d))
* paste text and restore text state ([22be243](https://github.com/fabienwnklr/free-drawing/commits/22be24375a9d9506852c4161cb9b79d11e4e35d6))
* pointer position on erasing ([7a3ee93](https://github.com/fabienwnklr/free-drawing/commits/7a3ee93317f6d43c6443d41cc78a4a9453a9644a))
* pointer-events during draw/erase/selection or paning ([3ace168](https://github.com/fabienwnklr/free-drawing/commits/3ace16846b8c1939f961768179ad0d577ae76e4c))
* prevent right click for select ([3fd1ddd](https://github.com/fabienwnklr/free-drawing/commits/3fd1ddd2230b53ae2c950b491169fa695ad3a2ec))
* remove line hovering only ([716bc2f](https://github.com/fabienwnklr/free-drawing/commits/716bc2fc165074587c4f65e4d0ac8f63817bc2b9))
* remove shape on hovering with eraser ([e7fa1f8](https://github.com/fabienwnklr/free-drawing/commits/e7fa1f8724575d5f348670ac902b730159d90eb1))
* remove zindex (layer order fix this) ([5cd77af](https://github.com/fabienwnklr/free-drawing/commits/5cd77afa85e4d39947e303c8c53e5ce28bdef786))
* replacing error (infinite loop oops) ([bab3c78](https://github.com/fabienwnklr/free-drawing/commits/bab3c783e19009c911024b0196c0d2cae471c727))
* restore saved content ([9ce6738](https://github.com/fabienwnklr/free-drawing/commits/9ce67385934066338d62ed3d714528b4852d50cf))
* select zone not visible ([eba59ac](https://github.com/fabienwnklr/free-drawing/commits/eba59ac2d52f7e262bd9ae3ba43c819622ed950d))
* selected drawing shape ([bc3ace3](https://github.com/fabienwnklr/free-drawing/commits/bc3ace31e2ff2b2b018f20ebeb70ea41f16f828e))
* set draggable only for selection tool ([0e20de8](https://github.com/fabienwnklr/free-drawing/commits/0e20de89c3baea69e5e7cb5585a506384f342248))
* set focus to drawer for event key ([020d74e](https://github.com/fabienwnklr/free-drawing/commits/020d74e83b4df2dd89c2e6532ed44a3856e50d8a))
* set size from sotrage ([5fe3a08](https://github.com/fabienwnklr/free-drawing/commits/5fe3a085a8612006d09c1080b64408aeefcaf5ec))
* show / hide overlay ([2da855b](https://github.com/fabienwnklr/free-drawing/commits/2da855ba8536f5bf114af51b6bdff70230e86654))
* show/hide overlay on delete node ([5f4036f](https://github.com/fabienwnklr/free-drawing/commits/5f4036fa04639d8465606d27f986cf4cf8aa45c3))
* text sizing / edit depend on scaling ([01c3e6c](https://github.com/fabienwnklr/free-drawing/commits/01c3e6cbfac94baf0e9c46cddaa0ff01fadafa70))
* transform during draw/erase or other ([7aafeb9](https://github.com/fabienwnklr/free-drawing/commits/7aafeb9e40e67c86c0227242d4494ad91c741bb5))
* trigger change on toggle snap ([3eb66b9](https://github.com/fabienwnklr/free-drawing/commits/3eb66b9122f74a8060f83670c30ad1b27ced6c56))
* trigger change on update selected shape ([c384787](https://github.com/fabienwnklr/free-drawing/commits/c3847873e5367fa0ebbe5a0c5f069d60c48fd660))
* update `_duringAction` for considere text editing ([88b8664](https://github.com/fabienwnklr/free-drawing/commits/88b8664a4372f4dbb9b8e6a1eaeda6c606260697))
* update bg position ([ec4b421](https://github.com/fabienwnklr/free-drawing/commits/ec4b421478b3c8304ad114b49069ea7b783672a6))
* update bg position and grid lines ([daaba3e](https://github.com/fabienwnklr/free-drawing/commits/daaba3e72b6ee4a99b7a1b0752a2b652d3146f9e))
* update cursor on zoom ([a9ba5e2](https://github.com/fabienwnklr/free-drawing/commits/a9ba5e239a852f8b769c71eb9405fd672f1899b8))
* update cursor on zoom (brush) ([fd99105](https://github.com/fabienwnklr/free-drawing/commits/fd99105d0d82d53b27307442a92796439c2182af))
* update grid on zoom ([c0c5cd4](https://github.com/fabienwnklr/free-drawing/commits/c0c5cd41d3a422f13dad971104132fedab9a9915))
* update hitFunc on unselected node ([1295f85](https://github.com/fabienwnklr/free-drawing/commits/1295f85668399cb37db9bb4bc0575e7b04e5b3aa))
