# TODO

Audit of 2026-10-29 (library 8.2.0): items ordered by priority in each section.

## Security

- [x] server in development mode unless `NODE_ENV=production` (`start` sets none): public secret of development (sessions forged), listening on every interface, vite `/@fs/` serving any file of the repository to the network, the database included (sessions, hashes of passwords) (`config.ts`: development only with `NODE_ENV=development`; `index.ts`: localhost by default, `HOST`; `app.ts`: `server.fs.deny` of data)
- [x] svg export injection: `fill` of an arrow written as it is by `arrowheadSvg` (any string accepted by `parseAttrs`: files, links, collaboration, library, `strokeColor` of Excalidraw) puts a script in the exported svg (`utils/arrow.ts` through `attrs()`, colors checked by `attrChecks`)
- [x] email of an account changed without its password (`/change-email` applied at once, no reset of passwords): a session left open or a stolen cookie takes the account (`auth.ts` hook as `passwordToDelete`, field of `ProfileDialog`)
- [x] bodies of the API (20 MB) read before the session is checked, no rate limit on `/api`: slow anonymous uploads hold the memory of the server (`api.ts`: session first, small limit out of drawings)
- [x] links and embedded drawings decompressed without limit: a link of a few MB inflating to GB crashes the tab (`utils/drawingFile.ts`: stream read by chunks up to a size)

## Bugs

### Collaboration

- [x] regression of 8.2: a frame or group changed here (shape of a frame dragged, stroke ending in it) skips the whole change of others, then is sent: shapes they drew in it removed for everyone (`_applyReceived` by top node: children merged three way, as `mergeState`)
- [x] room emptied, then refilled by a stale copy (computer asleep joining first): users joining later take its old shapes, shapes created since are removed (`_merge` of a room not `kept`: generation of the drawing of the room)
- [x] live previews and discards sent while joining again mark the room `kept`: users joining meanwhile lose every shape the room knew (`sendLive` / `discardLive` waiting for the merge, server: `kept` by final changes only)
- [x] change refused (`REJECTED` right, too big) once the parts of others were left out for it: version of this user kept, sent over theirs once allowed; a refused shape is "not sent" and ignores others until then (`_unsync`, `_withoutUnconfirmed`: parts left out applied on refusal)
- [x] change received during a drag or a transform: drag recorded in two history entries (undo stops halfway), shape sent in the middle of the drag (`receive`, history during konva drags)
- [x] change dropped by the rate limit of the server: neither acknowledged nor refused, lost for the room, its shapes ignore others for 60 s (server `socket.use`: refused)

### Persistence and data

- [x] save while Space is held stores the stage draggable and its layers not listening: once reloaded, nothing selected nor erased, the view moves while drawing (`SpacePan`, `_loadSavedStage`: state of the stage and layers reset)
- [x] changes made during `loadFromStorage` (drawing changed elsewhere loaded again by the web app, slow download) dropped without warning; a save asked during the save loop of the previous drawing never runs (`Drawer.loadFromStorage`, `_saveToStorage`)
- [x] pasted text wrapped (regression of 8.2): `_createText` measures its lines before `setupFonts`, with a fallback font (`TextWidget._createText`)
- [x] svg export invalid with control characters (U+000B, line breaks of Word or PowerPoint): file unreadable, its drawing lost, previews of the library broken (`escapeXml`)
- [x] `_readSvgFiles` fires `change` during a stroke or a text edit (shapes being erased recorded faded) (`_afterAction`, as `addImage`)
- [x] links replace `history.state` with null: state of the router of the host app lost (React Router, Next.js) (`Drawer.ts` `replaceState`)

### Tools and interface

- [x] pinch with the text or note tool creates texts and notes (konva `tap` of each finger); an edit opened twice leaves a field and an empty hidden text (`onStage`: `tap` / `dbltap` ignored during gestures; `editTextNode` ends the edit open)
- [x] snapping toggled fires `change`, also unchanged: the preferences dialog marks the drawing unsaved, saves `storage`, adds history entries during a drag (`SelectWidget.toggleSnapping`)
- [x] snapping turned off during a drag: guides left, stops and box of that drag used by the next drags (`_removeSnapEvents`)
- [x] settings menu and collaboration panel not closed by a tap or a stroke on the canvas (no `click` once tools prevent the default of `touchstart`) (`Dropdown`, `CollaborationPanel`: capture `pointerdown`, as `GroupWidget`)
- [x] reorder of the layers panel moves a shape without its text: text hidden under a note or a filled shape (`LayersPanel.moveShape`, Alt + Up / Down)
- [x] keys of the library panel, settings menu and context menu reach `HotKey`: Delete removes the selection, letters change the tool (`LibraryPanel`, `Dropdown`, `ContextMenu`: propagation stopped)
- [x] Space on a button of the drawer focused by keyboard, pointer on the canvas: pans instead of pressing it (`SpacePan`)
- [x] text field: Ctrl / Cmd + S opens "Save page" (the web app saves the text hidden), no accessible name, Tab leaves the edit open with shortcuts disabled (`HotKey`, `TextWidget.editTextNode`)
- [x] active tool activated again (S, its button) clears the selection (`BaseWidget.setActive`)
- [x] `destroy` does not stop the replay: its animation frames run until it ends

### Web app, server

- [x] drawing opened or created after a failed save (storage full, drawings too big, 413, drawing deleted elsewhere: 404 at each save): unsaved changes dropped (`openDrawing`, `newDrawing`, `login`: kept in a copy; 404 as 409)
- [x] another account signed in from another tab: this tab saves, creates and lists in it while showing the first one, preferences of the other account overwritten (401 only: user checked on `visibilitychange`, id of the user sent)
- [x] session cookie never extended by `/api/me`: users signed out 7 days after signing in (`getSession` with `returnHeaders`, `set-cookie` forwarded)
- [x] errors of "My drawings", of the account dialog and of the drawings of the browser untranslated (`message` instead of `texts.error`, `Error('drawing not found')`); `sessionEnded` set by saves only, never cleared by a later success

### Packages, docs

- [x] library not importable on a server: `window.innerWidth` read by `defaultOptions` when loaded (examples of the READMEs of the components and extra tools crash in SSR) (`constants.ts`, test importing it in Node)
- [x] drawer of a component following the window instead of its host (host of the size of the window or hidden when mounted, then resized: drawer bigger than its host) (`DrawerLayout._followWindow`, `mountDrawer`)
- [x] types of the public API not exported: `Replay`, `SpacePan`, `GridStyle`, `WheelAction`, `FreehandSettings`, `ReplayStep` (`index.ts`, check of `index.d.ts`)
- [x] quick starts of the docs and README of the web component give `theme="system" language="auto"` as props / attributes: choice of the user replaced at each load (in `options`)
- [x] components, extra tools and generated plugins export the `import` condition only: Jest (`require`) can't resolve them (`default`)
- [x] generator accepts names reserved by files (`Background`, `Grid`, `Draw`, `Selection`): shape names dropped by `parseName` (`checkName`)
- [x] docs: `library.change` missing from the events table, M listed as a tool of the library in plugins.md, `typedoc.json` excluding a missing `src/vite.env.d.ts`

## Improvements

- [x] big drawings (1000 notes: one change 131 ms, select all 306 ms, duplicate 3.5 s; `updateBoundTexts` / `updateBindings` on each move of a drag): maps of ids per operation, links of moved shapes only during drags (`boundText`, `withBoundTexts`, `addShape`, `unbindMoved`)
- [x] first change of a session not protected (server acknowledging known once one acknowledgement came): told by the server in `ROOM` or `JOINED`
- [x] release: `npm-packages` needs `release` only: a component published while the library publish failed (`release.yml`)
