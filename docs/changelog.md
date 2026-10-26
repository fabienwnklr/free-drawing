# Changelog

All notable changes to this project will be documented in this file. Each commit updates this file and the package version ([semver](https://semver.org/)).

## [7.34.0](https://github.com/fabienwnklr/free-drawing/compare/v7.33.0...v7.34.0) (2026-10-26)


### Features

* **arrows:** curved and elbow arrows: path chosen in the panel of the arrow tool or of selected arrows (`arrowType` option, `drawer.setArrowType`); a curve bends on the side the pointer went while drawing it; elbow arrows are horizontal and vertical lines leaving the sides of the shapes they link facing each other, around the shapes (never through them), drawn again when these move
* **arrows:** handle of a selected curved or elbow arrow: it bends the curve on either side (`bend` attribute) or moves the middle segment of the elbow arrow (`elbowMid` attribute), kept when the shapes move
* **arrows:** head of each end of arrows: none, arrow, triangle, dot or bar (`arrowheads` option, `drawer.setArrowheads`, `startHead` / `endHead` attributes), also in svg exports; arrows of previous versions keep their triangle at the end

## [7.33.0](https://github.com/fabienwnklr/free-drawing/compare/v7.32.0...v7.33.0) (2026-10-26)


### Features

* **texts:** texts of shapes: a double click on a rectangle, an ellipse or a path shape (selection tool, also in its empty inside) or a click of the text tool on it writes in it; the text is centered in the shape, as wide as its inside, and follows it when it is moved, resized (letters not scaled) or turned; selected, styled, copied and removed with it (`containerId` attribute: id of its shape)
* **texts:** labels of arrows: written with a double click on an arrow, on its middle, with a halo of the background color cutting the line (also in svg exports); arrows link to the shape of a text, not to the text


### Bug Fixes

* **texts:** a text whose edit ended at once (Enter typed right after it opened) left a listener of presses out of the field: the next click of the text tool wrote nothing

## [7.32.0](https://github.com/fabienwnklr/free-drawing/compare/v7.31.0...v7.32.0) (2026-10-26)


### Features

* **images:** images in drawings: "Insert image" (image tool of the toolbar, after the arrow: an action, never the active tool; settings menu, context menu at the right click, command palette) and paste of a copied image (Ctrl / Cmd + V) at the pointer; files reduced to 2048 px and encoded as WebP (else PNG or JPEG), shown whole in the view, proportions kept when resized, opacity, order and actions as options, colors kept in dark mode, svg export; `drawer.addImage(file, position)`, `insertImage()`, `addFiles(files)`, `drawer.files`, types `DrawingFiles` and `DrawingImage`
* **images:** files of images kept apart from the shapes, by id (`fileId`): in the browser (`<localStorageKey>-files`), in drawing files, links and the `storage` option (`files` of `DrawingFile`, only PNG, JPEG, WebP or GIF data URLs read), sent once to the users of a collaboration session (`files` of `DrawingChange`, the server keeps them with the drawing of the room); a moved image does not send its file again

## [7.31.0](https://github.com/fabienwnklr/free-drawing/compare/v7.30.0...v7.31.0) (2026-10-25)


### Features

* **selection:** align selected shapes on a side or the center of their box (left, center, right, top, middle, bottom), stack them in a row or a column, distribute them with even spaces (3 shapes or more), from the options panel (sections "Align" and "Distribute", 2 shapes or more) and the command palette; `drawer.alignShapes(alignment)`, `distributeShapes(direction)`, `stackShapes(direction)`, types `ShapeAlignment` and `Direction`

## [7.30.0](https://github.com/fabienwnklr/free-drawing/compare/v7.29.2...v7.30.0) (2026-10-25)


### Features

* **zoom:** zoom to fit the whole drawing (Shift + 1, not beyond 100 %), to the selection (Shift + 2, filling the view up to 200 %) and back to 100 % (Shift + 0), from the context menu, the command palette and help too (keys found by their place: digits typed with Shift on AZERTY); `drawer.zoomToSelection()`
* **zoom:** the zoom level button goes back to 100 % keeping the center of the view (it also moved the view back to the origin: "Back to origin" of the position does it)

## [7.29.2](https://github.com/fabienwnklr/free-drawing/compare/v7.29.1...v7.29.2) (2026-10-25)


### Bug Fixes

* **arrows:** arrows linked to triangles, diamonds, hearts and clouds end on their outline as drawn, and the sides they are fixed to are on it: they stopped on the box around these shapes (an arrow aiming at a triangle ended in the empty corner of its box), also when rotated. An end is linked near their outline, no longer in the empty corners of their box

## [7.29.1](https://github.com/fabienwnklr/free-drawing/compare/v7.29.0...v7.29.1) (2026-10-25)


### Bug Fixes

* **licence:** MIT licence of Fabien Winkler: `package.json` declared Apache-2.0 while the `LICENCE` file held the MIT licence of another project

## [7.29.0](https://github.com/fabienwnklr/free-drawing/compare/v7.28.5...v7.29.0) (2026-10-24)


### Features

* **types:** classes of the public API exported as types: members of the drawer (`DrawerLayout` of `drawer.layout`, `Toolbar`, `I18n`, `UndoRedo`, `Collaboration`, its dialogs and panels...), results of its methods (`Toast`), shapes (`Frame`), and the types they use (`Command`, `ModalOptions`, `DrawingChange`...): `index.d.ts` declared them without exporting them, apps could not name them

## [7.28.5](https://github.com/fabienwnklr/free-drawing/compare/v7.28.4...v7.28.5) (2026-10-23)


### Bug Fixes

* **theme:** light theme in a dark page: native fields and scrollbars of the drawer light (`color-scheme: light`), they took the dark scheme of the page
* **theme:** custom color of the options panel shown as the drawing shows it in dark mode, like the colors of the palette
* **help:** shortcuts on one column in a narrow drawer, they overflowed the dialog under about 380 px wide

## [7.28.4](https://github.com/fabienwnklr/free-drawing/compare/v7.28.3...v7.28.4) (2026-10-23)


### Bug Fixes

* **a11y:** switches of the preferences dialog are named by their label only (the shortcut shown next to them was in their name) and no longer announce a shortcut that does nothing in the dialog (`aria-keyshortcuts`)
* **a11y:** the collaboration dialog opened by an invitation link focuses the name to give before joining (it focused its first button)

## [7.28.3](https://github.com/fabienwnklr/free-drawing/compare/v7.28.2...v7.28.3) (2026-10-23)


### Bug Fixes

* **i18n:** Spanish "Empezar la sesión" to start a collaboration session ("Iniciar sesión" reads as signing in), German "Eckig" for sharp corners ("Spitz" is pointed)
* **settings:** "Github" opens a new tab without access to the page of the drawer (`noopener`), it opened a window named "blank", reused by the next clicks

## [7.28.2](https://github.com/fabienwnklr/free-drawing/compare/v7.28.1...v7.28.2) (2026-10-23)


### Bug Fixes

* **i18n:** details of errors in toasts in the language of the drawer, they were in English ("clipboard unavailable", "not a drawing file", "server unreachable", "nothing to export", invalid JSON or damaged link data, full storage and permissions of the browser): errors of the library carry a text key, messages of servers and apps are kept

## [7.28.1](https://github.com/fabienwnklr/free-drawing/compare/v7.28.0...v7.28.1) (2026-10-23)


### Bug Fixes

* **a11y:** messages of toasts are read by screen readers from live regions kept in the page (polite, urgent for problems): a toast added with its `status` or `alert` role was not always announced; while a dialog is shown, from a region of the dialog (nothing out of an `aria-modal` dialog was read)

## [7.28.0](https://github.com/fabienwnklr/free-drawing/compare/v7.27.5...v7.28.0) (2026-10-23)


### Features

* **view:** a file or a link opened is shown in the view, centered, zoomed out when it is bigger than the view (never zoomed in beyond 100 %): its shapes could be far from the view, the drawing looked empty
* **api:** `drawer.zoomToFit(shapes?)` shows the whole drawing (or shapes) the same way

## [7.27.5](https://github.com/fabienwnklr/free-drawing/compare/v7.27.4...v7.27.5) (2026-10-23)


### Bug Fixes

* **export:** png and pdf of a very big drawing: the scale is lowered so the image fits the canvas limits of browsers (32767 px of side, 268 Mpx of area, 16.7 Mpx on iPhone and iPad), there was no image (Firefox: a drawing 15000 px wide at scale 3); the pdf page keeps the size of the drawing

## [7.27.4](https://github.com/fabienwnklr/free-drawing/compare/v7.27.3...v7.27.4) (2026-10-23)


### Bug Fixes

* **links:** links to drawings of a drawer without `id` option are `#drawing=...`, opened by the first drawer without id of the page: the key was `drawer-<n>`, numbered by the drawers created before, so a link copied from a drawer mounted again by an app did not open (links of previous versions still open); with the `id` option, `#<id>=...` as before. A link is opened by one drawer of the page only

## [7.27.3](https://github.com/fabienwnklr/free-drawing/compare/v7.27.2...v7.27.3) (2026-10-23)


### Bug Fixes

* **frames:** a new frame is numbered after the highest number of the names of frames: after a deleted frame, the next one took the name of an existing one ("Frame 3" twice)

## [7.27.2](https://github.com/fabienwnklr/free-drawing/compare/v7.27.1...v7.27.2) (2026-10-23)


### Bug Fixes

* **snapping:** moved and resized shapes snap to the shapes of frames and to the frame of a shape moved in it (they were ignored), not to the sides and center of the view (shapes jumped to the edge of the screen on an infinite drawing), nor to hidden shapes

## [7.27.1](https://github.com/fabienwnklr/free-drawing/compare/v7.27.0...v7.27.1) (2026-10-23)


### Bug Fixes

* **arrows:** ends linked near the outline of rectangles and ellipses as drawn, not anywhere in their box: an arrow pointing at the empty inside of a big shape without background (a container) is no longer pulled to its outline, corners of the box of an ellipse or of a rotated rectangle are free; inside linked with a background, small shapes from their middle
* **arrows:** distance of links (12 px) and of the sides of shapes on screen whatever the zoom: it was 3 px at 25 %, 48 px at 400 %
* **shapes:** a press moved less than 3 px on screen is a click whatever the zoom (nothing drawn): at 400 %, drags of 7 px drew nothing, at 25 % a move of 1 px drew a shape

## [7.27.0](https://github.com/fabienwnklr/free-drawing/compare/v7.26.0...v7.27.0) (2026-10-23)


### Features

* **shortcuts:** shown with the symbols of Apple keyboards on its devices (⇧⌘Z, ⌥⇧D, ⌘⌫, ⌘+Click), in the order of macOS menus, in menus, context menu, command palette, help (one key of macOS for Ctrl + Delete and Ctrl + Backspace), tooltips and `aria-keyshortcuts` (Meta), also the shortcuts of plugins; arrows shown as arrows (Ctrl+↑), names of keys translated in every menu. Shortcuts in the tooltips of undo, redo and save buttons
* **zoom:** Cmd + wheel zooms like Ctrl + wheel on macOS
* **plugins:** `formatShortcut(shortcut, t)` and `ariaShortcut(shortcut)` exported, to show shortcuts like the library

## [7.26.0](https://github.com/fabienwnklr/free-drawing/compare/v7.25.0...v7.26.0) (2026-10-23)


### Features

* **shortcuts:** Ctrl / Cmd + S saves the drawing (`saveNow`: storage of the app, auto save off, "Drawing saved" message), Ctrl / Cmd + Shift + S saves it as a `.freedrawing` file (was Ctrl / Cmd + S); Ctrl / Cmd + Shift + Z redoes (macOS), like Ctrl / Cmd + Y. Shown in the settings menu, command palette, help, `aria-keyshortcuts` of the save and redo buttons

## [7.25.0](https://github.com/fabienwnklr/free-drawing/compare/v7.24.0...v7.25.0) (2026-10-23)


### Features

* **text:** the text tool follows `keepTool` like the other tools: kept after a text (the press validating a text adds no other one, also on touch screens), else the selection tool comes back with the text selected (frame of a renamed title). A click of the tool on a text or a name of frame edits it instead of adding a text over it; its options panel is hidden while a text is edited

## [7.24.0](https://github.com/fabienwnklr/free-drawing/compare/v7.23.1...v7.24.0) (2026-10-23)


### Features

* **touch:** two fingers on the drawing zoom it by pinching (`zoom` option) and move the view, with any tool and in read only. The second finger cancels the action of the first one (shape or stroke being drawn removed, also for collaborators, faded shapes of the eraser kept, selection rectangle, laser and drags stopped), nothing is drawn until every finger is lifted; fingers on the drawing no longer scroll nor zoom the page
* **plugins:** `BaseWidget.cancelAction()` cancels the pointer action of a tool, `onCancel()` removes what it was drawing (done by `ShapeWidget`)

## [7.23.1](https://github.com/fabienwnklr/free-drawing/compare/v7.23.0...v7.23.1) (2026-10-23)


### Bug Fixes

* **selection:** one change per drag: N selected shapes moved together fired N + 1 changes (drawing saved, `drawer.change` events, changes sent to collaborators and layers panel rebuilt each time)

## [7.23.0](https://github.com/fabienwnklr/free-drawing/compare/v7.22.6...v7.23.0) (2026-10-23)


### Features

* **drawer:** `destroy()` removes a drawer for apps mounting and unmounting it: plugins destroyed, tool deactivated, collaboration session left, listeners of the page (window, document, media queries, resize observers) removed, stage destroyed, element emptied; `drawer.signal` is aborted then, for listeners of apps and plugins to go with the drawer

## [7.22.6](https://github.com/fabienwnklr/free-drawing/compare/v7.22.5...v7.22.6) (2026-10-23)


### Bug Fixes

* **focus:** a drawer created below the fold no longer scrolls the page to it; created or changing its tool by code (e.g. right to draw given or removed by the owner of a collaboration session), it no longer takes the focus of a field of the page or of a dialog

## [7.22.5](https://github.com/fabienwnklr/free-drawing/compare/v7.22.4...v7.22.5) (2026-10-23)


### Bug Fixes

* **collaboration:** a change bigger than a message of the server (10 MB, e.g. a big file opened) is no longer sent: the server closed the connection and the session reconnected and sent it again without end; the drawing is told too big for the session, its shapes are sent once it fits

## [7.22.4](https://github.com/fabienwnklr/free-drawing/compare/v7.22.3...v7.22.4) (2026-10-23)


### Bug Fixes

* **layout:** the hidden context menu no longer makes the page scroll: taller than a short drawer (or window), it kept its place below it, and a drawer of window size lost the width of the scrollbar; a drawer of window size clips what goes out of it

## [7.22.3](https://github.com/fabienwnklr/free-drawing/compare/v7.22.2...v7.22.3) (2026-10-23)


### Bug Fixes

* **history:** background color in undo / redo: undo after opening a file or changing the background puts the previous background back
* **collaboration:** background color shared with the other users of the session: changes sent, users joining take the background of the room (the first one gives theirs), kept after a reconnection; viewers can no longer change it (choices of the settings menu disabled in read only)

## [7.22.2](https://github.com/fabienwnklr/free-drawing/compare/v7.22.1...v7.22.2) (2026-10-22)


### Bug Fixes

* **events:** a listener removing itself (`drawer.off`) while its event is triggered no longer makes the next listener skipped; listeners added meanwhile are called from the next trigger, listeners removed before their turn are not called

## [7.22.1](https://github.com/fabienwnklr/free-drawing/compare/v7.22.0...v7.22.1) (2026-10-22)


### Bug Fixes

* **text:** fonts of the text options browsed with the arrow keys: each arrow gave focus back to the drawer; it goes back to the drawer only after a choice with the pointer

## [7.22.0](https://github.com/fabienwnklr/free-drawing/compare/v7.21.1...v7.22.0) (2026-10-22)


### Features

* **collaboration:** the owner presents its view (panel of the session, command palette, `collaboration.present`): the other users follow its zoom and moves, the area it shows fitted to their screen (`drawer.getViewArea`, `drawer.showArea`), until they move theirs; "Follow" in the header follows it again, users joining meanwhile follow it at once
* **collaboration:** participants view only until the owner lets them draw (default of rooms created by the server of this version): a viewer asks to draw in one click (`collaboration.requestEdit`), the owner is told (toast, number on the reminder of the header) and accepts or refuses from the panel of the session (`answerRequest`)
* **collaboration:** the reminder of the header opens a panel of the session: right of the user, requests to answer, participants with their rights (switches for the owner), presentation, link and settings in the dialog; types `AccessRequest`, `CollaborationMember` and `ViewArea` exported

## [7.21.1](https://github.com/fabienwnklr/free-drawing/compare/v7.21.0...v7.21.1) (2026-10-22)


### Bug Fixes

* **export:** png, pdf and copy as image wait for the fonts of their texts, the preview of the export dialog is drawn again once they are loaded: exported right after opening a drawing (slow network), texts were drawn with a serif fallback font, and the preview kept it

## [7.21.0](https://github.com/fabienwnklr/free-drawing/compare/v7.20.7...v7.21.0) (2026-10-22)


### Features

* **layout:** compact interface when the footer does not fit on one line (phone, tablet, narrow drawer): toolbar on its own line, scrolled in it, below zoom, undo / redo and help, header on several lines, options panel of the tool below the header instead of covering its widgets; `is-compact` class of the container, `layout.updateCompact()` (also run when an element is added to the footer)


### Bug Fixes

* **toolbar:** on narrow screens, the toolbar no longer goes out of view, pushed by zoom and undo / redo; the menu of a group of tools closes when the toolbar is scrolled

## [7.20.7](https://github.com/fabienwnklr/free-drawing/compare/v7.20.6...v7.20.7) (2026-10-21)


### Bug Fixes

* **ui:** settings menu and context menu taller than the drawer (small screens, short windows) scroll in it: their last items were out of the drawer, out of reach

## [7.20.6](https://github.com/fabienwnklr/free-drawing/compare/v7.20.5...v7.20.6) (2026-10-21)


### Bug Fixes

* **theme:** error and warning toasts readable in dark mode: dark text on the light red of errors and on the orange of warnings (contrast 2.3:1 and 1.7:1 before, over 7:1 now)

## [7.20.5](https://github.com/fabienwnklr/free-drawing/compare/v7.20.4...v7.20.5) (2026-10-21)


### Bug Fixes

* **collaboration:** the owner toggling the right to draw of a user keeps the focus on its switch, the list of users is no longer rebuilt on each change: rows of users not changed are kept, so screen readers read only users joining or changed

## [7.20.4](https://github.com/fabienwnklr/free-drawing/compare/v7.20.3...v7.20.4) (2026-10-21)


### Bug Fixes

* **a11y:** Tab and Shift + Tab stay in dialogs: hidden buttons and options (collaboration dialog without session, export with nothing selected) and the other radios of a group (export scale, theme) were counted as stops of the focus trap, Tab left the dialog

## [7.20.3](https://github.com/fabienwnklr/free-drawing/compare/v7.20.2...v7.20.3) (2026-10-21)


### Bug Fixes

* **a11y:** a click out of a dialog or the settings menu on a field of the page or another drawer keeps the focus there: closing them gave it back to the drawer, keys typed went to the drawer

## [7.20.2](https://github.com/fabienwnklr/free-drawing/compare/v7.20.1...v7.20.2) (2026-10-21)


### Bug Fixes

* **collaboration:** joining a room from a link closes the dialog once the name is given (it showed this name again), a toast tells the room is joined and the reminder of the header shows the session

## [7.20.1](https://github.com/fabienwnklr/free-drawing/compare/v7.20.0...v7.20.1) (2026-10-21)


### Bug Fixes

* **tools:** a second finger put on the screen during a drawing (shape, stroke, eraser, selection...) is ignored: it started another one and left the first half drawn; the drawing ends when its own finger is lifted, where it is lifted (not where another finger is)

## [7.20.0](https://github.com/fabienwnklr/free-drawing/compare/v7.19.14...v7.20.0) (2026-10-21)


### Features

* **collaboration:** reminder of a live session in the header, also in zen mode: live dot and number of people connected (opens the collaboration dialog), red stop button stopping the session (owner) or leaving it (other users, who had no way to leave it) once confirmed, so a click by mistake keeps it; "Stop session" / "Leave session" in the command palette

## [7.19.14](https://github.com/fabienwnklr/free-drawing/compare/v7.19.13...v7.19.14) (2026-10-21)


### Bug Fixes

* **selection:** several selected shapes moved together keep their gaps while snapping: they snap to other shapes by the box of the selection, and to the grid by the shape dragged by the pointer (each one snapped on its own before)

## [7.19.13](https://github.com/fabienwnklr/free-drawing/compare/v7.19.12...v7.19.13) (2026-10-21)


### Bug Fixes

* **collaboration:** a shape tool pressed then released at its start (nothing drawn) removes its preview for the other users of the session and from the drawing of the room: it stayed with them, and was sent to users joining later

## [7.19.12](https://github.com/fabienwnklr/free-drawing/compare/v7.19.11...v7.19.12) (2026-10-21)


### Bug Fixes

* **text:** on touch devices, a tap out of the edited text (on the canvas) validates it: the editor stayed open, a tap gives no click there

## [7.19.11](https://github.com/fabienwnklr/free-drawing/compare/v7.19.10...v7.19.11) (2026-10-21)


### Bug Fixes

* **text:** Enter or Escape ending a composition of an input method (Chinese, Japanese, Korean...) no longer validates or closes the field: text editor, name in the layers panel, link, name in preferences and collaboration, search of the command palette (also in Safari); Enter of the numeric keypad validates a text

## [7.19.10](https://github.com/fabienwnklr/free-drawing/compare/v7.19.9...v7.19.10) (2026-10-21)


### Bug Fixes

* **tools:** a mouse event fired on the window (not on an element) during a pointer action ends it there instead of throwing an error

## [7.19.9](https://github.com/fabienwnklr/free-drawing/compare/v7.19.8...v7.19.9) (2026-10-21)


### Bug Fixes

* **arrows:** an arrow drawn in a frame links its ends to the shapes of the frame, or to nothing in an empty place: it was linked to the frame, its end put on the border of the frame; a frame is linked only near its border (arrows between frames)

## [7.19.8](https://github.com/fabienwnklr/free-drawing/compare/v7.19.7...v7.19.8) (2026-10-21)


### Bug Fixes

* **groups:** a group created in a frame, and the shapes of a group ungrouped in a frame, can be dragged at once (they could not until the tool was changed)

## [7.19.7](https://github.com/fabienwnklr/free-drawing/compare/v7.19.6...v7.19.7) (2026-10-21)


### Bug Fixes

* **keyboard:** shortcuts work whatever the keyboard: Ctrl / Cmd shortcuts with Caps Lock on, Alt + S / Z / G / L with Option of macOS (it types other characters: the letter of the key is read on the keyboard layout), letters of AZERTY and other Latin layouts as typed (Shift + W fits texts on the W key, not on Z), keyboards of another alphabet by the place of the letter on a QWERTY keyboard; AltGr (Ctrl + Alt) typing a character no longer runs a shortcut
* **plugins:** letters of commands of plugins are read the same way: `Alt+Z` on the key typing Z (it was the place of Z on a QWERTY keyboard)
* **keyboard:** Alt shortcuts are not run in fields of the drawer, where Option of macOS types characters

## [7.19.6](https://github.com/fabienwnklr/free-drawing/compare/v7.19.5...v7.19.6) (2026-10-21)


### Bug Fixes

* **keyboard:** arrow keys of the other direction in a menu or a toolbar (left / right in the context menu or a row of the layers panel, up / down in the toolbar, its groups or the selection menu) no longer move the selected shapes

## [7.19.5](https://github.com/fabienwnklr/free-drawing/compare/v7.19.4...v7.19.5) (2026-10-21)


### Bug Fixes

* **clipboard:** pasting in a field of the drawer (search of the command palette, name in preferences or collaboration, link, radius) pastes in the field: it added a text to the drawing instead
* **clipboard:** Ctrl / Cmd + V on the drawing adds the text in Chromium too (it fires the paste on the page out of fields), only in the drawer having the focus

## [7.19.4](https://github.com/fabienwnklr/free-drawing/compare/v7.19.3...v7.19.4) (2026-10-21)


### Bug Fixes

* **tools:** a pointer released out of the canvas (bar of an app, page) ends the action of the tool where it is released: the shape, stroke, eraser, selection rectangle or pan follows the pointer out of the canvas and ends there. The tool stayed in action: interface ignoring the pointer, shortcuts disabled, stroke following the pointer back on the canvas
* **tools:** a mouse button released while the window was left, or a cancelled touch, ends the action too; a brush stroke ended without pointer up (tool changed) is no longer contained in the next one

## [7.19.3](https://github.com/fabienwnklr/free-drawing/compare/v7.19.2...v7.19.3) (2026-10-21)


### Bug Fixes

* **files:** a crafted file or link no longer empties the drawing: all its shapes are created before the drawing is replaced, so a file that can't be loaded leaves it as it is (it was destroyed first, then saved empty or partial at the next change)
* **files:** attributes of shapes of files, links and collaboration changes are checked: values of the wrong type (path `data`, `name`, `dash`, `points`...) and other attributes read by Konva (patterns, functions, `zIndex`...) are ignored, so a shape can't throw while created or drawn (a drawing saved with it broke rendering on each load); frames without their box, title or content are ignored; attributes of data (e.g. of plugins) are kept

## [7.19.2](https://github.com/fabienwnklr/free-drawing/compare/v7.19.1...v7.19.2) (2026-10-20)


### Bug Fixes

* **save:** changes are saved only once a save succeeds: a failed save (browser storage full, `storage` of an app rejecting it), a save of `storage` in progress or before its drawing is loaded keep them unsaved (`hasUnsavedChanges`, `drawer.unsaved.change`, save button and menu), "Drawing saved" is not shown then, and leaving the page asks a confirmation, also with auto save
* **save:** a save failure after a successful save of browser storage is shown again, and "Save now" tells it saved again
* **storage:** when nothing is stored (`load` gives `null`), changes made to the drawing kept are saved with auto save

## [7.19.1](https://github.com/fabienwnklr/free-drawing/compare/v7.19.0...v7.19.1) (2026-10-20)


### Bug Fixes

* **history:** undo and redo during a collaboration session change only the shapes changed by this user: changes of the other users are kept, for everyone. The history records the shapes added, changed or removed by each change instead of a copy of the whole drawing (also lighter, a drawing opened no longer builds 100 growing copies), the drawing of a joined room is not a change to undo, shapes put back by undo or redo return to their place in the stacking order, and changes of shapes removed since by other users are skipped
* **types:** `HistoryEntry` and `HistoryChange`, entries of `drawer.undoRedo.entries`

### Deprecations

* `undoRedo.appHistory` and `undoRedo.appHistoryStep` (use `undoRedo.entries` and `undoRedo.step`): still readable, `appHistory` gives the changes as JSON instead of whole drawings

## [7.19.0](https://github.com/fabienwnklr/free-drawing/compare/v7.18.0...v7.19.0) (2026-10-20)


### Features

* **plugins:** options of plugins given by the app with the `pluginOptions` option (by plugin name), read by `Plugin.getOptions(defaults)`
* **plugins:** `drawer.getPointerPosition()` gives the pointer in drawing coordinates (center of the view when it is out of the canvas), the `SelectWidget` type is exported to select shapes from code
* **docs:** plugins guide (why plugins, steps, tools, commands, texts, options, shapes, events, packaging, testing) and a complete plugin template in the repository (`packages/plugin-template`)


### Bug Fixes

* **plugins:** commands of plugins marked `readOnly` (not modifying the drawing) stay available while their plugin is disabled by `forceDisabled`, as in read only

## [7.18.0](https://github.com/fabienwnklr/free-drawing/compare/v7.17.1...v7.18.0) (2026-10-20)


### Features

* **plugins:** other developers add features with plugins, classes extending `Plugin` given to the `plugins` option: a unique `pluginName`, plugins they `requires` (classes added when missing, or names), steps (constructor before the toolbar, `init` once the drawer is created, possibly asynchronous and waited by `drawer.ready`, `afterInit`, `destroy`), `addWidget` (tool placed by the `widgets` and `widgetGroups` options, else at the end of the toolbar), `addTranslations` and `t`, `addCommand` (command palette, shortcut shown in help, context menu of the selection or of the drawing, not in read only unless `readOnly`), `listenTo` (drawer events, konva nodes, DOM elements, removed by `destroy`), `forceDisabled` / `clearForceDisabled` (`drawer.plugin.change` event); `drawer.plugins` (`get`, `has`, `destroy`); `Plugin`, `BaseWidget`, `ShapeWidget`, `drawerEvents`, `shapeName`, `createButton`, `setLabel`, `setPressed` and the types of plugins are exported; the `translations` option can replace texts of plugins


### Bug Fixes

* **context menu:** the unlock item shows its shortcut (Ctrl+Shift+L), not the one of delete

## [7.17.1](https://github.com/fabienwnklr/free-drawing/compare/v7.17.0...v7.17.1) (2026-10-20)


### Bug Fixes

* **text:** the field editing a text is placed on the text wherever the drawer is in the page: it was moved down by the space above the drawer (bar of an app), e.g. into the frame when renaming it
* **frames:** a frame title being renamed stays on one line above the frame: the field widens while typing instead of wrapping into the frame, Shift + Enter adds no line break and pasted ones become spaces

## [7.17.0](https://github.com/fabienwnklr/free-drawing/compare/v7.16.0...v7.17.0) (2026-10-20)


### Features

* **frames:** a selected frame shows the options panel with its opacity (of the whole frame: border, title and shapes), its stacking order and the actions
* **selection:** actions section in the options panel of a selection: duplicate, delete and link
* **links:** a web page or an email address can be attached to shapes (also groups and frames): edited above the selection (link action of the panel, context menu, command palette; Enter applies, Escape cancels, open and remove buttons), shown above a selected shape having one, link icon at the top right of shapes with a link (end of the title of frames) opening it on click, address shown on hover; saved with shapes, shared with collaborators, around shapes in svg exports; other protocols are refused, also in files, drawing links and changes of collaborators; `setShapeLink`, `getShapeLink` and `openShapeLink` methods


### Bug Fixes

* **frames:** the options panel of shape tools no longer shows up after drawing a frame, nor stays over the selection panel once the tool is changed
* **selection:** the menu next to the selection is no longer placed under the options panel

## [7.16.0](https://github.com/fabienwnklr/free-drawing/compare/v7.15.0...v7.16.0) (2026-10-20)


### Features

* **frames:** frames a shape is moved into or out of are highlighted while it is dragged or resized (entered: solid and tinted, left: dashed), the highlight fades out once dropped, also after a move with arrow keys; `placeInFrames` returns the frames entered and left (`FrameChanges` type, exported)


### Bug Fixes

* **frames:** a shape of a frame dragged or resized out of it is drawn whole above the drawing instead of being cut at the edges of its frame (only its selection box was visible out of it)

## [7.15.0](https://github.com/fabienwnklr/free-drawing/compare/v7.14.3...v7.15.0) (2026-10-20)


### Features

* **types:** `AvailableTools`, `BrushWidgetOptions`, `ImageFormat`, `ShapeState` and `TranslationParams` are exported with the other types of the library (options of `tool`, of the brush, export formats, shapes of drawing files, parameters of texts)

## [7.14.3](https://github.com/fabienwnklr/free-drawing/compare/v7.14.2...v7.14.3) (2026-10-20)


### Bug Fixes

* **collaboration:** a user connected again after losing the connection no longer sends a stale copy of the drawing: shapes removed by other users meanwhile no longer come back and their changes are kept; the drawing of the room is merged with the changes made meanwhile, which are sent (also the ones made while disconnected)

## [7.14.2](https://github.com/fabienwnklr/free-drawing/compare/v7.14.1...v7.14.2) (2026-10-18)


### Bug Fixes

* **collaboration:** a user is told when the server refuses their changes (drawing too big for the session: changes not shared) or their joining (session full: session stopped), with the `REJECTED` event

## [7.14.1](https://github.com/fabienwnklr/free-drawing/compare/v7.14.0...v7.14.1) (2026-10-18)


### Bug Fixes

* **collaboration:** shapes received from other users are checked as shapes of files: only drawing shapes are created, so a stage or a layer sent by a user of the session can no longer empty an element of the page of every user; an invalid shape is ignored without stopping the rest of the change

## [7.14.0](https://github.com/fabienwnklr/free-drawing/compare/v7.13.0...v7.14.0) (2026-10-18)


### Features

* **eraser:** shapes to erase are faded until the pointer is released, instead of red outlines, whatever their kind (strokes, filled shapes, texts, groups); thin shapes crossed quickly are found along the whole pointer path

### Bug Fixes

* **eraser:** a stroke starting on a shape erases it and the shapes it crosses next
* **eraser, text:** right and middle clicks no longer erase a shape or add a text

## [7.13.0](https://github.com/fabienwnklr/free-drawing/compare/v7.12.0...v7.13.0) (2026-10-16)


### Features

* **collaboration:** the owner of a session chooses in the dialog whether new participants can draw; when off, users joining for the first time (also with a new id) view only until the owner gives them the right

### Bug Fixes

* **collaboration:** an anonymous user can no longer take the place of the owner of a session or of a logged in user by sending their id: the owner is the user giving the secret of the room

## [7.12.0](https://github.com/fabienwnklr/free-drawing/compare/v7.11.0...v7.12.0) (2026-10-16)


### Features

* **selection:** the options panel of a mixed selection (e.g. text, rectangle and brush stroke) shows the options of every kind of selected shape, text options included, each one applied to the shapes it fits; fields show the values of the shapes they apply to

## [7.11.0](https://github.com/fabienwnklr/free-drawing/compare/v7.10.0...v7.11.0) (2026-10-16)


### Features

* **save:** save button in the header while auto save is off (`saveButton` option), a dot shows changes not saved yet; "Save now" has its own icon (floppy disk), the download one stays for "Save as file"


### Bug Fixes

* **settings:** "Save now" of the settings menu is hidden while auto save is on

## [7.10.0](https://github.com/fabienwnklr/free-drawing/compare/v7.9.4...v7.10.0) (2026-10-16)


### Features

* **selection:** the selection rectangle selects the shapes it touches, not only the ones entirely in it: lines and strokes where they are drawn, rotated shapes as drawn, groups by their shapes; drawn inside a big shape or a frame, it selects the shapes it touches there, not the big shape

## [7.9.4](https://github.com/fabienwnklr/free-drawing/compare/v7.9.3...v7.9.4) (2026-10-16)


### Bug Fixes

* **toolbar:** with "Keep tool active" turned off, the selection tool is activated after drawing without selecting the drawn shape

## [7.9.3](https://github.com/fabienwnklr/free-drawing/compare/v7.9.2...v7.9.3) (2026-10-16)


### Bug Fixes

* **help:** "Documentation" link opens the documentation site (its address no longer existed)

## [7.9.2](https://github.com/fabienwnklr/free-drawing/compare/v7.9.1...v7.9.2) (2026-10-16)


### Bug Fixes

* **text:** "Paste" of the context menu puts the text where the menu was opened (it went to the top left corner of the view), Ctrl / Cmd + V with the pointer out of the drawing puts it at the center of the view, no more Konva warning "Pointer position is missing"

## [7.9.1](https://github.com/fabienwnklr/free-drawing/compare/v7.9.0...v7.9.1) (2026-10-16)


### Bug Fixes

* **shortcuts:** Ctrl / Cmd + A no longer selects the text of the page: a click on the drawing focuses the drawer when focus was elsewhere in the page (e.g. bar of an app), and a slider or checkbox of the drawer gives the shortcut to the drawer (text fields keep it)

## [7.9.0](https://github.com/fabienwnklr/free-drawing/compare/v7.8.0...v7.9.0) (2026-10-16)


### Features

* **text:** "Fit width to text" (selection menu, context menu, command palette, Shift+W, `fitTextWidth`): width of selected texts (also texts of groups) fitted to their longest line, lines no longer wrapped, text kept in place whatever its alignment

## [7.8.0](https://github.com/fabienwnklr/free-drawing/compare/v7.7.0...v7.8.0) (2026-10-16)


### Features

* **toolbar:** "Keep tool active" (pin button at the start of the toolbar, Q, preferences dialog, command palette, `setKeepTool`, `keepTool` option and preference): turned off, the selection tool is activated with the shape just drawn (shapes, frames, brush, highlighter)

## [7.7.0](https://github.com/fabienwnklr/free-drawing/compare/v7.6.0...v7.7.0) (2026-10-15)


### Features

* **preferences:** dialog applies its changes together with "Save" (theme, language, zen mode, grid, snapping, auto save and name, Enter in name field), "Cancel", Escape or close keep current preferences

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
