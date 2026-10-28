# TODO

Audit of 2026-10-28 (library 8.0.0): items ordered by priority in each section.

## Security (collaboration, server)

- [x] one malformed message crashes the server: `null` payload of JOIN / RIGHTS / ROOM / REQUEST (destructured parameter), name `{ toString: 1 }` (`String(name)` throws); socket.io runs listeners in `process.nextTick` and nothing handles `uncaughtException`, so every room is lost (server `collaboration.ts`: check objects and `typeof name === 'string'`)
- [x] limits of rooms bypassed by an id repeated in `remove` (`Array(2e6).fill(id)`): size and shape count go negative, then nothing is refused and memory is exhausted (server `collaboration.ts` CHANGE: deduplicate `remove` in `checkChange`)
- [x] a viewer gets the right to draw by joining with the id of an anonymous editor (ids public in `USERS` and in `by=` of links): bind anonymous ids to a secret of the browser, as `ownerKey` (server `collaboration.ts` JOIN)
- [x] `ownerKey` built from `Math.random` (`createId() + createId()`), whose outputs are in the room id and every shape id sent: secrets from `crypto.getRandomValues` (`Drawer.startCollaboration`, `utils/functions.ts`)
- [x] rooms created without global or per address limit (10 per connection, unlimited connections), kept 30 days and all loaded in memory on start; a room remembering 1000 users refuses every new one for good (server `collaboration.ts`)

## Bugs

### Collaboration

- [x] a page reloaded in a room (stored copy reopened) sends its stale drawing on first join: newer changes of others reverted, deleted shapes back, users diverge (`Collaboration.ts` connect: wait for `full` and merge)
- [x] text typed during an edit lost when another user changes the text, its shape or its frame meanwhile: pending changes applied by `flush()` after the typed text, which then equals `#synced` (`Text.ts` end of edit, `Drawer` change handler); a new text cancelled with Escape leaves them pending until the next change
- [x] live change of another user in a frame replaces the whole frame: text being typed in it lost, drag of its shapes stopped, selected shape of the frame replaced by the frame (`Collaboration._apply` replaces groups, frames included)
- [x] reconnecting to a room emptied by others (Clear canvas) sends the whole drawing again: deleted shapes come back for everyone (`Collaboration._merge`: `full` does not tell a dropped room from an emptied one)
- [x] drawing of a dropped room (server restart, last user disconnected) sent again without its image files (`#sentFiles` not cleared by `_merge`): blank images for later users
- [x] a drawing over `maxMessageSize` (10 MB, 7.5 MB encrypted) is never shared and blocks every later change of its user: the whole unsynced drawing retried in one message (`Collaboration._send` / `_fits`: split changes, files apart)
- [x] changes refused by the server (`too-big`, right removed while drawing) are marked synced: never sent again, users diverge (`Collaboration.ts`; server ignores CHANGE of viewers without answer)
- [x] image files of a room never released while it has users, and stored again under a new random id at each resend in encrypted rooms: the room reaches 20 MB and refuses every new shape (server `collaboration.ts`, `encryptChange`)
- [x] changes received after the `full` of a reconnection during a pointer action or a text edit reverted by the merge (`Collaboration.flush`: pending changes applied before `_merge`)
- [x] request to draw lost when the connection drops: the viewer stays on "Request sent" and can't ask again (`Collaboration.requestEdit`, server `leaveRoom`)
- [x] cursors and lasers of users who left during a disconnection stay on screen, a presentation stopped meanwhile is still followed (`Collaboration.ts`: reset on reconnection; server sends no `VIEW` null on join)
- [x] owner keys kept for the 20 rooms created last, not used last: a room used daily loses its owner after 20 other rooms; an owner logged in is not recognized from another browser (`Drawer._setOwnerKey`, server JOIN)
- [x] double click on "Start" starts two sessions, the first socket is never stopped (`Drawer.startCollaboration`: guard while starting)

### Core, files, persistence

- [x] `destroy()` during a save of `storage` saves an empty drawing over the stored one (save loop runs again after `stage.destroy()`); async work ending after destroy (link decoding, `loadFromStorage`, `addImage`) saves or starts a collaboration on the destroyed drawer (`Drawer.ts`)
- [x] unsupported language makes every `t()` throw, the drawer is not created: `language: 'en-US'`, `<free-drawing language="fr-FR">`, account preference `'it'` accepted by the server, saved `"constructor"` passing `value in languages` (`I18n.t`, `Drawer.setLanguage`, `_readPreferences`)
- [x] duplicate shape ids accepted (files, links, `addShape(node.clone())`): undo destroys the wrong shape, changes of collaboration lost; ids over 200 characters or a background over 100 make the server drop the whole CHANGE (`addShape`, `parseDrawingFile`)
- [x] concurrent `loadFromStorage`: an outdated slower load wins and is auto saved into the drawing the app now targets (`Drawer.loadFromStorage`: counter of loads)
- [x] png / pdf export and copy right after loading or adding images draw them blank: elements not decoded yet (`exportImage`: wait for `decode()` as for fonts)
- [x] selection saved or exported with `withDrawing`: shapes of frames and shapes of groups selected alone written in coordinates of their parent (`getDrawingFile(shapes)`: transform to the layer as `Library.add`)
- [x] `forceDisabled` of a plugin disables its tool button but the active tool keeps drawing; the end of read only activates it again (`Plugin.forceDisabled`, `Drawer.setReadOnly`)
- [x] svg images of Excalidraw and tldraw files imported as empty `Image` shapes (`parseFiles` keeps png / jpeg / webp / gif only): rasterize them (`foreignDrawing.ts`)
- [x] async `init` of a plugin keeps running after `drawer.destroy()`: listeners added then are never removed (`PluginCollection._init`)
- [x] undo / redo in a session can drop the redo stack: `updateBoundTexts` runs after `History._apply` recorded the drawing

### Tools and interaction

- [x] flip and rotate never place shapes in frames: a shape of a frame mirrored out of it stays in it, cut away; a shape mirrored onto a frame is not in it (`Drawer.flipShapes` / `rotateShapes`: `placeInFrames`)
- [x] a locked frame takes shapes drawn, dropped or pasted on it, which become locked (`findFrameAt` ignores `isListening`)
- [x] text written in a shape of a group is added at the top of the drawing: left behind when the group is deleted, erased, duplicated, hidden or locked (`TextWidget._createBoundText`)
- [x] align / distribute / stack count texts of shapes and arrow labels as shapes: gaps of stack, distribute run with 2 shapes, buttons enabled for one shape with its text (`Drawer._arrangeShapes`, `BaseOverlay.show`)
- [x] tool deactivated during a pointer action (right removed, `setReadOnly`) keeps the half drawn shape and its live preview for others (`endAction` instead of `cancelAction`); a text edit stays open in read only (`BaseWidget.setActive(false)`)
- [x] Ctrl / Cmd + drag on a shape of a group not selected yet drags the whole group (`SelectWidget` mousedown: Konva starts the drag of the group first)
- [x] grid snapping of drags in coordinates of the parent: shapes of frames off the grid by the position of the frame, frames and groups never snapped (`Drawer._initSnapGridEvents`)
- [x] text editor does not follow the view zoomed or moved during an edit (wheel, pinch) (`TextWidget`)
- [x] tool changed while Space is held: releasing Space restores the old draggable state of the stage, pan tool can't move, selection tool moves the view (`SpacePan.stop`)
- [x] arrow keys and Shift + H / V on a shape of a rotated, flipped or scaled group use the axes of the group (`HotKey` `shape.move`, `flipShapes`)

### Interface, accessibility, translations

- [x] arrow keys on buttons out of `arrowNavigation` lists (swatches of the options panel, settings menu, buttons of layers rows, zoom, undo...) move the selected shapes (`HotKey`: arrows only from the container)
- [x] layers panel: Alt + Up / Down reorders shapes in read only (`LayersPanel` keydown, `moveShape`)
- [x] slideshow previous / next buttons disabled while focused: focus on the body, keys of the slideshow and Escape lost (`Slideshow.ts`: `aria-disabled`)
- [x] buttons hidden or disabled by their own action drop the focus to the page: lock / group of the selection menu, undo / redo at the end of history, group of the layers panel, Follow, search (`disableElement`: focus back to the drawer)
- [x] layers or library panel hidden by Alt + L, Alt + B or zen mode with the focus in it: focus lost (`LayersPanel.toggle`, `LibraryPanel`)
- [x] Escape ending an IME composition closes the dialog (`Modal` document keydown: `isComposing`)
- [x] read only without the `pan` widget: toolbar unreachable with Tab, the disabled active tool keeps the tab stop (`Toolbar` `setTabStop`)
- [x] help lists Alt + L and the shortcuts of layers rows without the layers panel (`Help.ts`)
- [x] collaboration panel: rows of requests keep the old language after `setLanguage` (`CollaborationPanel.ts`)
- [x] key names partly English in fr / es / de (Ctrl, Shift, Escape, Enter, Home: Strg, Maj, Échap, Entrée...) (`formatShortcut`); `navigation.description` says "Maj + Tab" while help says "Shift+Tab"
- [x] mixed forms of address: de `slideshow.noFrames` (du), es `library.empty` / `library.hint` (usted)
- [x] "no results" of the search bar and the empty command palette not announced (`SearchBar`, `CommandPalette`)
- [x] links of shapes can't be opened with the keyboard in read only, no "Open link" item (`shapeLinks.ts`, `LinkEditor`)

### Web app, components, generator

- [x] components apply every setting again when one changes: a viewer of a session gets tools back when the theme changes, language chosen in the menu reverted; `drawer.options.readOnly` keeps the value of creation (`mountDrawer.ts` `applySettings`)
- [x] login / logout switch the store before the drawing: saves in between go to the API with the id of a browser drawing (404, change lost); a failed `listDrawings` leaves this state (web `App.login`)
- [x] app height `100vh`: toolbar under the bars of mobile browsers (web `style.css`: `100dvh`)
- [x] storage of the browser full shown as the English message of the browser: error wrapped again, its name lost (web `App.ts` save)
- [x] mount of components: a failed import or an error of `new Drawer` gives an unhandled rejection, no error event (`mountDrawer.ts`)
- [x] `<free-drawing>` in a shadow root (Lit) gets no style (`addStyle` on the document only)
- [x] generator: "Next" steps `bun test` / `bun build` run the tools of Bun (`create-plugin` `cli.js`: `bun run`)

## Improvements

- [ ] Escape cancels the pointer action (shape, stroke, eraser, selection rectangle) (`HotKey` returns during actions; `cancelAction` exists)
- [ ] drag with the middle button moves the view whatever the tool (draws now) (`ShapeWidget`, `FreehandWidget`, `Laser`, `Select`)
- [ ] dragging a big selection: handlers of the whole drawing (bindings, texts of shapes, snapping, frames, live send) run once per selected node at each move, O(N²) (`Drawer._initEvents`, `SelectWidget` snap)
- [ ] each change serializes the whole drawing 3 to 4 times (history, collaboration, save), frames and groups as a whole: one map of states per change (`Drawer`, `History`, `Collaboration`)
- [ ] two tabs overwrite each other's drawing and library in localStorage: follow `storage` events (`Drawer.save`, `library.ts`)
- [ ] `drawer.files` and decoded images never pruned: memory grows with each drawing opened or received
- [ ] search goes through results by exact y then x: `inReadingOrder` as navigation and slides (`utils/search.ts`)
- [ ] "Clear stored data" removes the drawing key only (files, library, preferences kept), no toast, drawing saved again at the next change, shown with `storage` (`Drawer.clearStoredData`)
- [ ] save state of the app bar announced ("Saving…", "Saved") at each change: announce errors and unsaved changes only (web `App.ts`)

## Docs and tooling

- [ ] CI: run `check:generated` of the generator after the build (a change of the plugin API breaks generated plugins unseen)
- [ ] Netlify: demo not deployed for changes of `packages/extra-tools`, docs not rebuilt for READMEs of the components and extra tools (`ignore` of `netlify.toml`)
- [ ] element README "Without bundler" loads the library 7 (`@7` of jsdelivr / esm.sh)
- [ ] extra tools README: its `widgets` example keeps the tools in "More tools" (needs `widgetGroups`)
- [ ] CONTRIBUTING says npm (Yarn 1 workspaces), lists `yarn sync-labels` and `.github/labels.json` (missing); root README without `packages/extra-tools`
- [ ] generator: a stale `template/` (ignored, left by `prepack`) used before `packages/plugin-template` by local tests (`template.js`)
- [ ] npm description and keywords of the library ("Infinite canvas", `typescript`): whiteboard, canvas, drawing, konva
