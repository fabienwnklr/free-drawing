# TODO

- [x] add group of widgets with some usefull tools like triangle, losange, square, laser, frame, surligner, etc
- [x] can enable/disable auto save
- [x] add save button to preference, and updtade eveything visually (including name)
- [x] add button to keep same tool or after every use switch on selection tool automatically
- [x] for text object add feature to crop width to his content
- [x] check why release tag doesn't appear on github
- [x] when i use ctrl+a shortcut, everything in appbar is select, when drawer is focused limit to himself
- [ ] after draw and if 'keepActiveTool' active, last draw automatically selected, don't, just change tool to select
- [ ] selection tool dosn't work if i don't select every objet

## Security (collaboration, server)

- [ ] anonymous socket can take the identity of the room owner or any user: `userId` sent by client is trusted, owner then removes rights of everyone, viewers rejoin with a new id to draw (server `collaboration.ts`)
- [ ] empty room can be taken over: room and `ownerKey` deleted when last user leaves, next JOIN with any key becomes owner (server `collaboration.ts`)
- [ ] received CHANGE creates any Konva class (`Node.create`, no allow list as `parseDrawingFile`): a `Stage` upsert empties a page element of every user, kept by server for later users (`Collaboration.ts`)
- [ ] no limit on room data: shape count, size and rate of CHANGE / POINTER / NAME, anonymous sockets allowed, server memory can be exhausted; check a whole CHANGE before applying it and relay only checked fields (server `collaboration.ts`)
- [ ] account deleted without password while session is fresh (Better Auth `/delete-user`, password only required by UI): reject it without password in a hook (server `auth.ts`)
- [ ] rate limit of sign in relies on a forgeable `x-forwarded-for`, or one bucket for everyone without it: set `advanced.ipAddress` (server `auth.ts`)
- [ ] check Origin of socket.io handshakes (cookies sent by other origins of the same site), require `BASE_URL` in production (Secure cookies), limit drawings per account (server `app.ts`, `config.ts`, `api.ts`)

## Bugs

- [ ] switching drawing, login or logout during a collaboration session replaces the drawing of the room for everyone with the opened one (web `App.ts`: stop or leave session first)
- [ ] reconnection sends a stale copy of the drawing that overwrites newer changes of others, deleted shapes come back (`Collaboration.ts` connect)
- [ ] undo / redo during collaboration restore whole snapshots: changes of other users are reverted for everyone (`History.ts`)
- [ ] save state says saved when nothing was saved: `save()` clears unsaved before saving (storage not loaded, storage or quota error), no leave warning during a save or after a failed one, `#saveFailed` only reset with storage (`Drawer.ts`)
- [ ] view changes (pan, grid, snapping, preferences with theme only) fire `change`: drawing marked unsaved, or same drawing sent again to storage (`Pan.ts`, `Settings.ts`, `Drawer.setPreferences`)
- [ ] a crafted file or link (frame without content, path `data` not a string) throws after current shapes were destroyed: empty or partial drawing saved at next change; build all nodes before replacing, check attribute types (`drawingFile.ts`, `Drawer.loadDrawing`)
- [ ] reloading a page with a room link creates a new empty drawing each time for a logged in user (web `App.ts`)
- [ ] pointer released out of the canvas (or `touchcancel`): tool stays in action, UI ignores pointer, stroke follows the pointer; next brush stroke contains the previous one (`#allPoints` not reset) (`BaseWidget`, `FreehandWidget`, `ShapeWidget`)
- [ ] eraser stroke starting on a shape erases nothing (`Eraser.ts`: press must be on stage)
- [ ] right and middle click run click actions: eraser erases the shape, text tool creates a text (`Eraser.ts`, `Text.ts`)
- [ ] paste in a field of the drawer (command palette, preferences or collaboration name, radius field) adds a text shape to the drawing instead (`HotKey.ts` paste listener)
- [ ] arrow keys in selection menu, context menu or a layers panel row also move the selected shapes (`arrowNavigation` in `dom.ts` lets other arrows propagate)
- [ ] shortcuts with some keyboards: Alt + S / Z / G / L read `e.key` (macOS Option gives other characters), Shift + W is on Z key of AZERTY (`e.code`), Ctrl shortcuts ignored with Caps Lock (`HotKey.ts`)
- [ ] "Save now" item of settings menu always shown: `display: flex` of `menu-item` overrides `hidden` (`dropdown.scss`)
- [ ] group created or ungrouped in a frame can't be dragged until tool change (`Drawer.groupShapes` / `ungroupShapes`)
- [ ] arrow drawn in a frame links to the frame instead of shapes of the frame (`findBindingTarget` in `binding.ts`)
- [ ] text editing: Enter validating an IME composition (Chinese, Japanese, Korean) closes the editor (`Text.ts`: check `isComposing`)
- [ ] text editing on touch devices: a tap on canvas does not close the editor (window `click` suppressed) (`Text.ts`)
- [ ] frame tool leaves the shape options panel shown after drawing (`Frame.ts`, `BaseWidget` overlay with `showOverlayOnActive` false)
- [ ] shape drawn then released at its start (simple click) stays at collaborators: its live preview was sent, no removal (`ShapeWidget.ts`)
- [ ] snapping of several selected shapes snaps each one on its own: gaps between them change (`Select.ts` snap)
- [ ] a second finger starts another shape or stroke, first one left half drawn (no pointer id tracking)
- [ ] click outside the settings menu or a dialog gives focus back to the drawer even when clicking a field of the page or another drawer (`Dropdown.ts`, `Modal.ts`)
- [ ] Tab leaves dialogs: hidden buttons counted in focus trap (collaboration dialog, export dialog with nothing to export) (`Modal._getFocusables`)
- [ ] owner loses focus when toggling the right to draw of a user (users list rebuilt, live region reads it again) (`CollaborationModal.ts`)
- [ ] error and warning toasts unreadable in dark mode (contrast 2.3:1 and 1.7:1) (`toast.scss`)
- [ ] small screens: settings menu, context menu and options panels overflow the drawer, items out of reach (no max height / scroll)
- [ ] font select of text options: an arrow key gives focus back to the drawer, fonts can't be browsed with keyboard (`TextOverlay.ts`)
- [ ] `drawer.off` called in a handler skips the next handler of the same event (`MicroEvent.trigger` loops on the live array)
- [ ] background color not in history (undo after opening a file keeps its background) nor sent to collaborators
- [ ] drawer of window size does not follow height changes of the window, nor any change with a page scrollbar (`DrawerLayout.ts`)
- [ ] drawings over 1 MB can't join a collaboration session (socket.io `maxHttpBufferSize` 1 MB, API accepts 5 MB): reconnection loop
- [ ] focus of drawer on creation scrolls the host page to it (`Drawer.focus` without `preventScroll`)

## Improvements

- [ ] `drawer.destroy()`: remove document, window, `matchMedia` and ResizeObserver listeners, for apps mounting and unmounting drawers
- [ ] one `change` per drag: N selected shapes fire N + 1 changes (save, history, collaboration, layers panel each time)
- [ ] history memory: 100 full JSON snapshots, cumulative ones built on reload; store shapes once or diffs (`History.ts`)
- [ ] touch: track one pointer, pinch zoom and two finger pan, window `pointerup` / `pointercancel` or pointer capture
- [ ] text tool follows `keepTool` and selects the validated text like other tools (`Text.ts`)
- [ ] Ctrl / Cmd + S saves (`saveNow`) with `storage` or auto save off, download with another shortcut; Ctrl / Cmd + Shift + Z redo (macOS standard)
- [ ] macOS shortcut names (⌘, ⌥) in menus, command palette, help, tooltips and `aria-keyshortcuts`
- [ ] linked arrows: link near outlines, not anywhere in bounding box; binding margin and click threshold independent of zoom (`binding.ts`, `ShapeWidget.ts`)
- [ ] snapping stops: shapes of frames and own frame of the dragged shape, not view edges and center (`Select.ts`)
- [ ] eraser: hit test along the segment between pointer positions (fast strokes skip thin lines) (`Eraser.ts`)
- [ ] names of new frames repeat after a frame is deleted (`count + 1` in `Frame.ts`)
- [ ] links of drawings depend on the `drawer-<n>` id: a link copied from a remounted drawer does not open (`Drawer._loadFromLink`)
- [ ] export: limit `pixelRatio` to canvas size limits of browsers (big drawing at scale 2 gives no image)
- [ ] loading a file or link: fit view to its content (may be out of view)
- [ ] toasts: one live region kept in the page (inserted `role=status` not always announced, not read outside an `aria-modal` dialog) (`Toast.ts`)
- [ ] error details in English inside translated toasts ("clipboard unavailable", "not a drawing file", "server unreachable", "nothing to export")
- [ ] translations: es `collab.start` reads as "sign in", de `edges.sharp` should be "Eckig"
- [ ] GitHub menu item: `window.open(url, 'blank')` opens a window named blank without `noopener`, use a link with `target="_blank" rel="noopener"` (`Settings.ts`)
- [ ] preferences switches: `aria-keyshortcuts` of shortcuts not working in the dialog, `<kbd>` in the accessible name (`PreferencesModal.ts`)
- [ ] theming: `color-scheme: light` on light theme (dark host pages), custom color swatch converted in dark mode, help grid scrolls under 380 px wide
- [ ] collaboration dialog opened from an invitation link: focus the name field
- [ ] tests of the collaboration server: impersonation, rights, empty rooms, ownership

## Tooling

- [ ] Prettier: `format` script glob not quoted (`src/**/*.ts` not recursive), 22 files not formatted; add a format check to lint, pre-push and CI
- [ ] CI only runs tests: add typecheck, lint and build; update `actions/checkout@v3` and `actions/setup-node@v3` (`vitest.yaml`)
- [ ] old toolchain: vite 4, vitest 0.34, eslint 8 (end of life), husky 8 (`husky install` deprecated)
- [ ] export types used by the public API (TypeDoc warnings): `AvailableTools` (option `tool`), `BrushWidgetOptions`, `ImageFormat`, `TranslationParams`, `ShapeState` (`DrawingFile`), `DrawerLayout`, `Frame`...
- [ ] deploy the static demo like the docs (Netlify from this repository, `yarn build:static`) instead of `deploy:static` pushing to free-drawing-demo (demo not updated since 2024)
- [ ] npm package stuck at 2.0.1: publish the current version (`yarn release`)
