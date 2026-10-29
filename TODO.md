# TODO

Audit of 2026-10-29 (library 8.1.0): items ordered by priority in each section.

## Security (collaboration, server)

- [x] request bodies of `/api/auth/*` have no size limit: a few anonymous requests of several GB exhaust the memory of the server (better-call reads the whole body; `app.ts`, limit before `toNodeHandler`)
- [x] `/delete-user` out of the strict rate limit of Better Auth (100 per 10 s): with a stolen cookie, the password guessed and the account deleted with its drawings (`auth.ts` `rateLimit.customRules`)
- [x] anonymous user taking an account id before the account joins the room (ids public: `USERS`, `by` of links), or the socket id given to ids refused by `isId`: rights given to the victim shared (server `collaboration.ts`, ids of accounts apart, fallback ids bound to `userKey`)
- [x] room creation blocked for everyone: 10,000 rooms kept 30 days, 50 per client and hour, clients by /64 (a /56 has 256): evict empty rooms used by one client, cap rooms kept per client (server `limits`)
- [x] limits of accounts passed by parallel requests: `usage()` read before any write (`api.ts` POST / PUT drawings, one transaction)

## Bugs

### Collaboration

- [x] changes marked synced when emitted: after a connection lost unseen (ping timeout), shapes drawn meanwhile are removed and changes reverted by `_merge` on reconnection (acks of `CHANGE`, `Collaboration._send` / `_merge`)
- [x] removal never sent when a received `order` rebuilds `#synced` before it (encrypted rooms: `send` queued behind decryptions; removals of `_unsync`): the shape stays for everyone and comes back (`Collaboration._apply`)
- [x] end of a pointer action with received changes pending fires `change` before the tool finishes: erased shapes recorded at 20 % opacity (undo gives them back faded), zero size shape of a click kept by others, arrow recorded before linked and frame before filled (two undos) (`Drawer._onActionEnd`, `BaseWidget.endAction` called first by tools)
- [x] live previews kept for everyone: removal of a viewer refused (right removed while drawing: `cancelAction` → `discardLive`), discard skipped while disconnected then the preview of the room merged back (server: live ids of each socket removed on discard, loss of right, leave)
- [x] change refused as too big after `releaseFiles` already deleted files of the room: images of remaining shapes empty for everyone (server: release once accepted)
- [x] same user in two tabs: one row in members, count 2 (`CollaborationMembers` rows by `data-member`)

### Core, files, persistence

- [x] reserved names in files, links, other users: a shape named `selection` saved in localStorage is found by `findOne('.selection')` before the layer, the drawer is never created again; a frame part name breaks `getFrameContent` after the drawing was emptied (`Drawer` constructor: layers among the children of the stage, frame parts among its children, `parseAttrs` drops reserved names)
- [x] undo / redo of a change in a frame or group puts back the whole frame or group: shapes added in it by other users (or another tab) removed, duplicates when one left it (`History`: top nodes, `ignoreChanges` does not update recorded entries)
- [x] drawing of another tab shown during a pointer action or a text edit: the stroke or the typed text written to destroyed nodes, lost (`Drawer._showSaved`: wait for the end of the action / edit)
- [x] save loop of `storage` goes on after `loadFromStorage` started: the previous drawing saved into the new target of the app (`Drawer._saveToStorage`: stop when `#storageLoads` changed)
- [x] `addShape` of a copy (group with a shape and its text, arrows): new ids, `containerId` and bindings still point at the originals: text placed in the original shape (`Drawer.addShape`, remap as `duplicateShapes`)
- [x] saves of previous versions keep duplicate or too long ids (only empty ones filled): undo removes the wrong shape, collaboration servers refuse them forever (`_loadSavedStage` without `fixIds`)
- [x] shape of a group or frame copied alone (Ctrl + D, library, export with drawing): offsets applied twice, copy moved (`getStateInDrawing`: offsets reset with the decomposed transform)
- [x] `addImage` once decoded: added in read only, cancels a stroke started meanwhile, saves the text being edited hidden (`Drawer.addImage`)

### Tools and interaction

- [x] horizontal flip of a shape with a text: text upside down (`decompose` gives rotation -180), mirrored in a flipped group (`placeBoundText`)
- [x] existing text emptied and validated: removed without `change` (not saved, not in history, not shared until the next change) (`TextWidget` `removeTextarea`)
- [x] text of a shape placed in frames apart from its shape: typing in a shape over a frame, frame drawn or resized around the text only (`fitFrame`), align / distribute / stack: text hidden under its shape or clipped in another frame (keep each text in the parent of its shape, above it)
- [x] slideshow or replay stopped after read only started: pan deactivated, no tool; laser given back when read only ends (`Slideshow.stop`, `Replay.stop`: `_leaveDisabledTool`)
- [x] layers panel: hiding a shape leaves its text visible (shown again by `placeBoundText`, no history), locking it leaves its text selectable and editable (hide and lock the text with its shape)

### Interface, accessibility

- [x] collaboration dialog: Start and Stop hide themselves with the focus: focus falls to the page in an `aria-modal` dialog (`CollaborationModal.update`)
- [x] library panel: focus given to a disabled button (last item removed with nothing selected, read only started), lost to the page (`LibraryPanel.update`)
- [x] layers panel: focus kept on a disabled row action when read only starts, lost to the page (`LayersPanel.update`)
- [x] options panels of tools do not scroll: sections out of the panel and under the footer in a drawer shorter than about 640 px (`overlay.scss`: `overflow-y: auto` on `.drawer-overlay-container`)
- [x] `docs/plugins.md` lists N as a free shortcut: taken by the note tool (the generator reserves it)

### Web app, components

- [ ] components: `theme`, `language`, `readOnly` of `options` applied as settings on mount: the language and theme chosen by the user and saved in the browser replaced at each mount (`mountDrawer`: settings of props / attributes only, not of the merged options)
- [ ] web app: a slow load ending after the user opened another drawing sets `drawing` back: autosave writes the shown drawing into the other one (`App` storage `load`: drawing id checked after the request)
- [ ] web app: a failed start (403 creating the drawing of a room, network error, storage full) rejects `#started` forever: no drawing loads nor saves until reload (`App._restoreSession`)
- [ ] web app: a `#drawing=` link replaces the last drawing and is saved over it (room links get their own drawing) (`App._restoreSession`)
- [ ] web app: session ended elsewhere (password changed, expired): saves fail with an English toast, no way to sign in again, "Sign out" drops the unsaved changes of the account (`App` save, `logout`)
- [ ] web app: account preferences replaced by the ones of the browser when changed before they are loaded (start, login) (`App` `preferences.change`)
- [ ] web app: errors of the server untranslated (429 of rate limits, 401, 404, `PASSWORD_TOO_LONG`) (`texts.ts` `_known`)

## Improvements

- [ ] web app: two tabs or devices on the same drawing overwrite each other: version of the drawing sent with `PUT` (409 when changed), `storage` events for the drawing of the browser
- [ ] collaboration: two users changing one shape within a round trip keep different versions (relayed to others only, last write wins): order of the server echoed or acknowledged for shapes changed here
- [ ] forced colors (Windows high contrast): swatches all alike, selected swatch and active tool not shown (`forced-color-adjust`, outlines of `.active` under `@media (forced-colors: active)`)
- [ ] `@font-face 'Ubuntu'` global: a page whose fonts reach `Ubuntu` gets its regular face only (bold and italic synthesized): private family name
