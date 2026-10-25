# TODO

- [x] add group of widgets with some usefull tools like triangle, losange, square, laser, frame, surligner, etc
- [x] can enable/disable auto save
- [x] add save button to preference, and updtade eveything visually (including name)
- [x] add button to keep same tool or after every use switch on selection tool automatically
- [x] for text object add feature to crop width to his content
- [x] check why release tag doesn't appear on github
- [x] when i use ctrl+a shortcut, everything in appbar is select, when drawer is focused limit to himself
- [x] after draw and if 'keepActiveTool' active, last draw automatically selected, don't, just change tool to select
- [x] selection tool dosn't work if i don't select every objet
- [x] create logo for drawer
- [x] if i disable auto save, how save? add button
- [x] use jsdoc with @param etc.
- [x] if i select multiple object, for example text, square, hand draw, i want every available tool on panel
- [x] scan files and fix error/warning
- [x] the eraser effect on object isn't really great for any case, find something else

## Security (collaboration, server)

- [x] anonymous socket can take the identity of the room owner or any user: `userId` sent by client is trusted, owner then removes rights of everyone, viewers rejoin with a new id to draw (server `collaboration.ts`)
- [x] empty room can be taken over: room and `ownerKey` deleted when last user leaves, next JOIN with any key becomes owner (server `collaboration.ts`)
- [x] received CHANGE creates any Konva class (`Node.create`, no allow list as `parseDrawingFile`): a `Stage` upsert empties a page element of every user, kept by server for later users (`Collaboration.ts`)
- [x] no limit on room data: shape count, size and rate of CHANGE / POINTER / NAME, anonymous sockets allowed, server memory can be exhausted; check a whole CHANGE before applying it and relay only checked fields (server `collaboration.ts`)
- [x] account deleted without password while session is fresh (Better Auth `/delete-user`, password only required by UI): reject it without password in a hook (server `auth.ts`)
- [x] rate limit of sign in relies on a forgeable `x-forwarded-for`, or one bucket for everyone without it: set `advanced.ipAddress` (server `auth.ts`)
- [x] check Origin of socket.io handshakes (cookies sent by other origins of the same site), require `BASE_URL` in production (Secure cookies), limit drawings per account (server `app.ts`, `config.ts`, `api.ts`)

## Bugs

- [x] switching drawing, login or logout during a collaboration session replaces the drawing of the room for everyone with the opened one (web `App.ts`: stop or leave session first)
- [x] reconnection sends a stale copy of the drawing that overwrites newer changes of others, deleted shapes come back (`Collaboration.ts` connect)
- [x] undo / redo during collaboration restore whole snapshots: changes of other users are reverted for everyone (`History.ts`)
- [x] save state says saved when nothing was saved: `save()` clears unsaved before saving (storage not loaded, storage or quota error), no leave warning during a save or after a failed one, `#saveFailed` only reset with storage (`Drawer.ts`)
- [x] view changes (pan, grid, snapping, preferences with theme only) fire `change`: drawing marked unsaved, or same drawing sent again to storage (`Pan.ts`, `Settings.ts`, `Drawer.setPreferences`) — not wanted: view changes keep firing `change`
- [x] a crafted file or link (frame without content, path `data` not a string) throws after current shapes were destroyed: empty or partial drawing saved at next change; build all nodes before replacing, check attribute types (`drawingFile.ts`, `Drawer.loadDrawing`)
- [x] reloading a page with a room link creates a new empty drawing each time for a logged in user (web `App.ts`)
- [x] pointer released out of the canvas (or `touchcancel`): tool stays in action, UI ignores pointer, stroke follows the pointer; next brush stroke contains the previous one (`#allPoints` not reset) (`BaseWidget`, `FreehandWidget`, `ShapeWidget`)
- [x] eraser stroke starting on a shape erases nothing (`Eraser.ts`: press must be on stage)
- [x] right and middle click run click actions: eraser erases the shape, text tool creates a text (`Eraser.ts`, `Text.ts`)
- [x] paste in a field of the drawer (command palette, preferences or collaboration name, radius field) adds a text shape to the drawing instead (`HotKey.ts` paste listener)
- [x] arrow keys in selection menu, context menu or a layers panel row also move the selected shapes (`arrowNavigation` in `dom.ts` lets other arrows propagate)
- [x] shortcuts with some keyboards: Alt + S / Z / G / L read `e.key` (macOS Option gives other characters), Shift + W is on Z key of AZERTY (`e.code`), Ctrl shortcuts ignored with Caps Lock (`HotKey.ts`)
- [x] "Save now" item of settings menu always shown: `display: flex` of `menu-item` overrides `hidden` (`dropdown.scss`)
- [x] group created or ungrouped in a frame can't be dragged until tool change (`Drawer.groupShapes` / `ungroupShapes`)
- [x] arrow drawn in a frame links to the frame instead of shapes of the frame (`findBindingTarget` in `binding.ts`)
- [x] text editing: Enter validating an IME composition (Chinese, Japanese, Korean) closes the editor (`Text.ts`: check `isComposing`)
- [x] text editing on touch devices: a tap on canvas does not close the editor (window `click` suppressed) (`Text.ts`)
- [x] frame tool leaves the shape options panel shown after drawing (`Frame.ts`, `BaseWidget` overlay with `showOverlayOnActive` false)
- [x] shape drawn then released at its start (simple click) stays at collaborators: its live preview was sent, no removal (`ShapeWidget.ts`)
- [x] snapping of several selected shapes snaps each one on its own: gaps between them change (`Select.ts` snap)
- [x] a second finger starts another shape or stroke, first one left half drawn (no pointer id tracking)
- [x] click outside the settings menu or a dialog gives focus back to the drawer even when clicking a field of the page or another drawer (`Dropdown.ts`, `Modal.ts`)
- [x] Tab leaves dialogs: hidden buttons counted in focus trap (collaboration dialog, export dialog with nothing to export) (`Modal._getFocusables`)
- [x] owner loses focus when toggling the right to draw of a user (users list rebuilt, live region reads it again) (`CollaborationModal.ts`)
- [x] error and warning toasts unreadable in dark mode (contrast 2.3:1 and 1.7:1) (`toast.scss`)
- [x] small screens: settings menu, context menu and options panels overflow the drawer, items out of reach (no max height / scroll)
- [x] phone (390 px wide): app bar overflows (name on two lines, "My drawings" cut), options panel of the tool covers the header widgets, toolbar pushed out of view by zoom and undo / redo (web `style.css`, `DrawerLayout` footer)
- [x] export: italic texts drawn with a serif font in png / pdf (preview of the export dialog), Ubuntu italic on canvas (`export.ts` `renderCanvas`, fonts of `TextWidget`)
- [x] font select of text options: an arrow key gives focus back to the drawer, fonts can't be browsed with keyboard (`TextOverlay.ts`)
- [x] `drawer.off` called in a handler skips the next handler of the same event (`MicroEvent.trigger` loops on the live array)
- [x] background color not in history (undo after opening a file keeps its background) nor sent to collaborators
- [x] drawer of window size does not follow height changes of the window, nor any change with a page scrollbar (`DrawerLayout.ts`)
- [x] drawings over 1 MB can't join a collaboration session (socket.io `maxHttpBufferSize` 1 MB, API accepts 5 MB): reconnection loop
- [x] focus of drawer on creation scrolls the host page to it (`Drawer.focus` without `preventScroll`)
- [x] right to draw given or removed by the owner takes the focus of the user (tool changed: `BaseWidget.setActive` focuses the drawer), even typing in a field of the page or a dialog

## Improvements

- [x] `drawer.destroy()`: remove document, window, `matchMedia` and ResizeObserver listeners, for apps mounting and unmounting drawers
- [x] one `change` per drag: N selected shapes fire N + 1 changes (save, history, collaboration, layers panel each time)
- [x] history memory: 100 full JSON snapshots, cumulative ones built on reload; store shapes once or diffs (`History.ts`)
- [x] touch: track one pointer, pinch zoom and two finger pan, window `pointerup` / `pointercancel` or pointer capture
- [x] text tool follows `keepTool` and selects the validated text like other tools (`Text.ts`)
- [x] Ctrl / Cmd + S saves (`saveNow`) with `storage` or auto save off, download with another shortcut; Ctrl / Cmd + Shift + Z redo (macOS standard)
- [x] macOS shortcut names (⌘, ⌥) in menus, command palette, help, tooltips and `aria-keyshortcuts`
- [x] linked arrows: link near outlines, not anywhere in bounding box; binding margin and click threshold independent of zoom (`binding.ts`, `ShapeWidget.ts`)
- [x] snapping stops: shapes of frames and own frame of the dragged shape, not view edges and center (`Select.ts`)
- [x] eraser: hit test along the segment between pointer positions (fast strokes skip thin lines) (`Eraser.ts`): done by `_findAlong` (every 4 px), outlines of 3 units found at 10 % zoom in Chromium
- [x] names of new frames repeat after a frame is deleted (`count + 1` in `Frame.ts`)
- [x] links of drawings depend on the `drawer-<n>` id: a link copied from a remounted drawer does not open (`Drawer._loadFromLink`)
- [x] export: limit `pixelRatio` to canvas size limits of browsers (big drawing at scale 2 gives no image)
- [x] loading a file or link: fit view to its content (may be out of view)
- [x] toasts: one live region kept in the page (inserted `role=status` not always announced, not read outside an `aria-modal` dialog) (`Toast.ts`)
- [x] error details in English inside translated toasts ("clipboard unavailable", "not a drawing file", "server unreachable", "nothing to export")
- [x] translations: es `collab.start` reads as "sign in", de `edges.sharp` should be "Eckig"
- [x] GitHub menu item: `window.open(url, 'blank')` opens a window named blank without `noopener`, use a link with `target="_blank" rel="noopener"` (`Settings.ts`): button kept (public `$githubButton` type), `window.open(url, '_blank', 'noopener,noreferrer')` as links of shapes
- [x] preferences switches: `aria-keyshortcuts` of shortcuts not working in the dialog, `<kbd>` in the accessible name (`PreferencesModal.ts`)
- [x] theming: `color-scheme: light` on light theme (dark host pages), custom color swatch converted in dark mode, help grid scrolls under 380 px wide
- [x] collaboration dialog opened from an invitation link: focus the name field
- [x] tests of the collaboration server: impersonation, rights, empty rooms, ownership

## Tooling

- [x] Prettier: `format` script glob not quoted (`src/**/*.ts` not recursive), 22 files not formatted; add a format check to lint, pre-push and CI (done: `yarn lint` checks format, so pre-push too; CI with the item below)
- [x] CI only runs tests: add typecheck, lint and build; update `actions/checkout@v3` and `actions/setup-node@v3` (`vitest.yaml`)
- [x] old toolchain: vite 4, vitest 0.34, eslint 8 (end of life), husky 8 (`husky install` deprecated), `@playwright/test` 1.39 (can no longer launch Edge 155 for browser checks)
- [x] export classes used by the public API: `DrawerLayout` (`drawer.layout`), `Frame`... (types are exported from `src/@types`)
- [x] deploy the static demo like the docs (Netlify from this repository, `yarn build:static`) instead of `deploy:static` pushing to free-drawing-demo (demo not updated since 2024)
- [x] npm package stuck at 2.0.1: publish the current version (`yarn release`) (7.29.0 published by the release workflow; releases of 7.21.2 to 7.28.5 created by its `all` run)

# Other

- [ ] Generate 3 differents logo for drawer and propose to me one to chose
- [x] Create package to use drawer with react/vuejs (`@fabwcie/free-drawing-react`, `@fabwcie/free-drawing-vue`: `FreeDrawing` components, first versions to publish by hand)
- [x] dans la docs mettre en valeur que c'est pour du vanilla comme du react/vue (hero, card and quick start in tabs of the homepage, React and Vue pages of the guide, features, READMEs)
- [ ] quels features pertinente on a pas qu'on pourrait intégré en s'inspirant de tldraw/escalidraw, et quels features eux n'ont pas qu'on pourrait pertinemment intégrer?
- [ ] le lien via une fleche n'ai pas assez précis, si j'ai un triagle ça s'attache au cadre qui entoure l'objet pas vraiment a la surface du dessin par exemple




