# CLAUDE.md

Guide for working on this repository: `@fabwcie/free-drawing`, an infinite canvas drawing library (TypeScript + [Konva](https://konvajs.org/)). Usage: `new Drawer($el, options)` + `import '@fabwcie/free-drawing/style.css'`. User documentation: [README.md](README.md), changelog: [CHANGELOG.md](CHANGELOG.md).

## Commands

| Command | Purpose |
| --- | --- |
| `yarn dev` | Demo (`index.html`) with vite (no collaboration server) |
| `yarn serve` | Express + vite middleware + socket.io server on `http://localhost:3000`, demo with live collaboration (meta `collaboration-server` injected in page) |
| `yarn test` / `npx vitest run tests/x.test.ts` | Unit tests (vitest, jsdom, jest-canvas-mock) |
| `npx tsc --noEmit -p .` | Type check `src` (root tsconfig only includes `src`) |
| `npx tsc -p tests` | Type check tests (`tests/tsconfig.json`, needed for the `@/` alias in the IDE) |
| `yarn lint` | ESLint on `src` and `tests` (no type checking) |
| `yarn build` | Library build in `dist/`: `drawer.js` (es), `drawer.umd.cjs`, `index.d.ts`, `style.css` |
| `yarn build:static` | Demo site in `static/` |
| `yarn docs` | VitePress docs (`docs/`) |

Git hooks (husky): `commit-msg` runs commitlint (conventional commits), `pre-push` runs `lint` and `test`. CI runs `npm run test` on push / PR to `master`.

## Architecture

- **`Drawer`** ([src/Drawer.ts](src/Drawer.ts)) is the entry point and public API, extends `MicroEvent` (`on` / `off` / `trigger`). It builds a Konva `Stage` with 4 layers, in this order:
  - `bgLayer` (`background`, not listening): background `Rect` named `drawer-background`;
  - `gridLayer` (`grid`, not listening): one `Shape` with a `sceneFunc` drawing the visible grid;
  - `drawLayer` (named `' draw'`, with a leading space: select it with `.draw`): the drawing shapes;
  - `selectionLayer`: transformer, selection rectangle, snapping guides (transient, cleared on load).
- Constructor order matters: options → saved stage or new stage → context menu, settings, zoom, undo / redo → `Toolbar` (widgets) → `Help` (reads toolbar widgets) → active tool → events → optional collaboration.
- **UI components** are plain DOM classes appended to `drawer.$drawerContainer`: `ContextMenu`, `Settings` (dropdown), `Zoom`, `Position`, `UndoRedo`, `Help` (modal), `Toast`, `Modal` / `ConfirmModal`, overlays. Color choices use [ColorPicker](src/components/ColorPicker/ColorPicker.ts) (palette, custom color input, optional transparent), colors are compared with `normalizeColor` ([utils/color](src/utils/color.ts)). Background color (`fillColor`) only applies to `fillShapes` (rectangle, ellipse), transparent is no fill (`toFill`). Top left ones go in `$headerContainer` (settings menu, position), bottom ones in `$footerContainer`. `Drawer._update()` runs after each view move or zoom (background, position).

### Widgets (toolbar tools)

- [BaseWidget](src/components/toolbar/widgets/BaseWidget.ts) is the common base of all widgets: behavior shared by several widgets belongs there (or in an intermediate base such as `ShapeWidget`), not duplicated in each widget. It handles button, shortcut, options (`title`, `shortcut` from `options.widgets`) and lifecycle: `setActive(true)` deactivates the previous widget, then calls `initEvents()` → `updateCursor()` (stage cursor from the `cursor` property) → shows `overlay` (unless `showOverlayOnActive` is false, e.g. selection) → `onActive()`; deactivation calls `removeEvents()` → hides `overlay` → `onDesactive()`.
- Pointer actions (drawing, erasing, selecting, panning) call `startAction()` on pointer down and `endAction()` on pointer up: `inAction` is read by `Drawer._duringAction()` (shortcuts disabled) and UI ignores pointer meanwhile. `clearSelection()` unselects shapes from any widget.
- Register stage events with `this.onStage('mousedown touchstart', handler)`: they are namespaced with the widget id and removed on deactivation. Do not call `stage.on` / `stage.off` directly in widgets.
- [ShapeWidget](src/components/toolbar/widgets/ShapeWidget.ts): drag-to-draw base (`line`, `square` → Rect, `circle` → Ellipse, `arrow`). Implement `createShape(start)` and `updateShape(shape, start, end, constrain)`; shift constrains (square, circle, 45°). One `ShapeOverlay` shared by shape tools.
- [Toolbar](src/components/toolbar/Toolbar.ts) creates widgets from `options.widgets` (list or object of widget options) with the `widgetClasses` map. Adding a widget: class + folder in `src/components/toolbar/widgets/` + `WidgetName` type + `widgetNames` ([constants](src/constants.ts)) + `widgetClasses`. `tests/basic.test.ts` compares widget folders count with toolbar widgets.
- [SelectWidget](src/components/toolbar/widgets/Select/Select.ts) owns the Konva `Transformer` (others use `getWidget<SelectWidget>('selection')?.transformer`, the widget may be disabled), the selection overlay (`showOverlay`, `hideOverlay`, `clearSelection`), setters applying styles to selected shapes (`_updateSelected`), snapping, text anchors (side anchors resize text width, corners scale).
- [TextWidget](src/components/toolbar/widgets/Text/Text.ts): text nodes, textarea editing (`editTextNode`), double click listened on `drawLayer` (any text is editable), font preload.

### Shapes, options, events

- Add drawing shapes only with `drawer.addShape(shape)` (draggable only with selection tool). Shapes are identified by names from `shapeName` ([constants](src/constants.ts)), e.g. `shape.hasName(shapeName.text)`.
- Options: `DrawerOptions` ([src/@types/drawer.ts](src/@types/drawer.ts)), defaults in `defaultOptions` ([src/constants.ts](src/constants.ts)). Setters (`setStrokeColor`, `setStrokeWidth`, `setStrokeStyle`, `setOpacity`, `setTextStyle`) update options, apply to the selection, then trigger `fd.options.change` with the changed keys. Overlays ([BaseOverlay](src/components/tools/Overlay/BaseOverlay.ts) and subclasses) listen to it to update their fields: overlay buttons only call setters.
- Stroke styles are names (`strokeStyle`: solid, dashed, dotted): the dash is computed from stroke width with `getDash` ([utils/stroke](src/utils/stroke.ts)) and recomputed when width changes, the style of a shape is read from its dash (`getStrokeStyle`).
- After any drawing modification, call `drawer.stage.fire('change')`: it saves to localStorage (`autoSave`), adds a history state and triggers drawer `change` event. Shape drags are listened on `drawLayer` (`dragend.change`).
- Konva listeners on layers are namespaced (`.grid`, `.snap`, `.change`, `.edit`) so they can be removed separately.
- Files and links ([utils/drawingFile](src/utils/drawingFile.ts)): `.freedrawing` JSON (`DrawingFile`: background, shapes states), validated by `parseDrawingFile` (only drawing shape classes, files and links come from anyone), links put compressed drawing in hash `#<drawer id>=` (loaded by `_loadFromLink`).
- Export ([utils/export](src/utils/export.ts), [ExportModal](src/components/ExportModal/ExportModal.ts)): png and pdf are rendered by clones of shapes in an offscreen konva stage (`renderCanvas`), svg is written per shape class (`renderSvg`, konva has no svg export), pdf embeds a jpeg (`createPdf`), dark mode transforms colors (`toDarkColor`) so every format is the same.
- [History](src/components/tools/UndoRedo/History.ts): states are JSON strings of drawing shapes (Konva `toObject`, without `draggable`), identical states are skipped, `historyLimit` (100) states are kept, restore uses `Node.create` + `addShape`.
- Persistence: full stage JSON in localStorage (`options.localStorageKey`, tool in `<key>-tool`). `_loadSavedStage` ignores invalid data; on load the grid layer is rebuilt and the selection layer cleared. Keep loading compatible with saves of previous versions.
- [HotKey](src/utils/HotKey.ts): keydown on `$drawerContainer`; tool shortcuts come from widgets; `mod = ctrlKey || metaKey`; nothing runs while `drawer._duringAction()`.
- Collaboration (`collaboration` option gives the server, sessions started from the menu dialog [CollaborationModal](src/components/CollaborationModal/CollaborationModal.ts), `startCollaboration` or a `#room=<id>` link): `socket.io-client` and `uqr` (QR code) are loaded with a dynamic import and externalized by the build. Clients `JOIN` a room (server keeps each room drawing, sends `USERS`). Pointers (`POINTER`) and shapes being drawn (`sendLive`, from `BaseWidget.shareLive` and drags / transforms, `CHANGE` with `live`) are sent every 50 ms at most as volatile messages, live changes are applied at once without history; cursors of other users are groups of the selection layer. Rooms have an owner (secret `ownerKey` given by the creator, kept in localStorage) who gives or removes the right to draw (`RIGHTS`, `USERS` with `canEdit`); without it, the drawer is read only (`setReadOnly`: UI entry points modifying drawing are disabled, API methods still work). [Collaboration](src/components/Collaboration/Collaboration.ts) sends, on each drawer `change`, the shapes changed since last sync (`CHANGE` event: `{ upsert, remove }`, shapes identified by their `id`, given by `addShape`) and merges received ones; received during a pointer action, they are applied when it ends (`_onActionEnd`). The server ([server/index.mjs](server/index.mjs)) relays changes and keeps the drawing for clients connecting later. Undo / redo fire `change` too.

## Conventions

- TypeScript strict, `@/` alias for `src/`. Prettier: single quotes, 120 columns, 2 spaces. Short English comments.
- Konva is a peer dependency imported by subpath (`konva/lib/...`); the build externalizes `konva`, `perfect-freehand` and `socket.io-client`.
- Accessibility: create buttons with `createButton` (`type="button"`), name icon buttons with `setLabel` and update toggle buttons with `setPressed` (`active` class + `aria-pressed`, or `aria-checked` for menu items), from [utils/dom](src/utils/dom.ts). Lists of buttons use `arrowNavigation` (toolbar, context menu). `HotKey` listens keydown on `$drawerContainer`: keys handled by a component (menu, dialog) must not propagate to it. New icons need `aria-hidden="true" focusable="false"`.
- Styles: one SCSS file per component, every rule scoped under `.drawer-container` (nothing applies to the host page). Use tokens of [_variables.scss](src/scss/_variables.scss) (colors, radius, shadows, spaces, font sizes) and mixins of [_mixins.scss](src/scss/_mixins.scss) (`focus-ring`, `surface`, `menu-item`, `swatch`, `picker`, `button-group`) with `@use`, not hard-coded values. Panels receiving pointer use `pointer-events: var(--drawer-pointer-events)` (ignored during pointer actions).
- Icons are SVG files imported with `?raw`. In library mode vite inlines assets in `style.css` (the Ubuntu font is woff2 for that reason).
- Tests: use [tests/helpers.ts](tests/helpers.ts) (`createDrawer` with an isolated localStorage key and no autosave, `keydown`, `fireMouse`, `drag`). jsdom has no hit canvas (mock `stage.getIntersection`), no layout and no `document.fonts`: check rendering, pointer and font behavior in a real browser.
- Working copy files use CRLF (`core.autocrlf=true`).

## Versioning and commits

- Each commit changing the library for its users adds its entry at the top of `CHANGELOG.md` (`## [X.Y.Z](compare link) (date)` then `### Features` / `### Bug Fixes`...), copies it to `docs/changelog.md` (`yarn doc:changelog`) and bumps `version` in `package.json` (major for breaking changes, minor for features, patch otherwise). Each version gets an annotated tag `vX.Y.Z`.
- Documentation and development changes (docs, CLAUDE.md, tests, tooling, refactoring without visible change) have no changelog entry and no version bump.
- `yarn release` builds, pushes with tags and publishes the current version (no bump).
- Claude: never commit or push. Prepare the code, changelog entry, docs copy and version bump, then propose a short conventional commit message without co-author trailer. Tag versions (`git tag -a vX.Y.Z <commit> -m "vX.Y.Z"`) once the maintainer has committed them.

## Pitfalls

- Fonts load when first used: measure or draw texts after `document.fonts.load` (see `TextWidget._loadFonts`). The editing textarea compensates the baseline difference between canvas and CSS (`_baselineOffset`).
- Konva `Transformer` ends a transform on window `mouseup` (capture phase), before the stage `mouseup`: `isTransforming()` is already false there (see `#pressOnTransformer` in `SelectWidget`).
- Grid: one stroke per line. A single path with hundreds of dashed lines is very slow in Chromium.
- `deepMerge` does not merge arrays: `widgets` option is replaced, not merged. Never mutate `defaultOptions` (setters replace nested objects such as `textStyle`).
- `GroupWidget` is not used yet (see [TODO.md](TODO.md)).
