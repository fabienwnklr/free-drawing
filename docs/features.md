---
title: Features
description: Drawing tools, selection, layers, frames, live collaboration, files and exports of free-drawing
---

# Features

free-drawing gives any web page an infinite canvas to draw, organize and share ideas. Everything below works out of the box with `new Drawer($el)`, and each part can be configured, translated or turned off: see the [options](/get-started/#available-options).

![A roadmap drawn with free-drawing: frame, cards linked by arrows, shapes, freehand strokes and a highlight](/features/showcase.webp){.screenshot width=1280 height=800}

## Drawing tools

![Toolbar with the "More tools" group open and the options of the brush](/features/tools.webp){.screenshot width=1280 height=800}

- **Freehand**: a brush with smooth strokes following the speed of the pointer ([perfect-freehand](https://github.com/steveruizok/perfect-freehand)), and a highlighter whose fluorescent colors are multiplied with the drawing below, so texts stay readable.
- **Shapes**: rectangles with sharp or round corners, ellipses, lines, arrows (straight, curved or elbow, a head of your choice at each end: arrow, triangle, dot, bar or none), triangles, diamonds, hearts, clouds, stars, hexagons, block arrows, speech bubbles and check boxes, drawn in the dragged box. Shift draws squares, circles and lines at 45°.
- **Images**: insert (image tool of the toolbar) or paste images (screenshots, photos, SVG), resized with their proportions, kept small in files and links, shared in live sessions, with their colors in dark mode.
- **Texts**: font, size, bold, italic, underline, alignment, and a width fitted to their content. Write in a shape with a double click: the text stays centered in it when it is moved, resized or turned; on an arrow, it is a label.
- **Sticky notes** (N): a click adds a note of a light color and writes in it, the note grows with its text.
- **Styles**: stroke color and width, solid, dashed or dotted strokes, background color, corners, opacity, from the panel of the tool or of the selection.
- **Laser pointer** to show something without drawing it, also seen by the other users of a session.
- **Eraser**: click a shape or drag through several ones, they fade until the pointer is released.
- **Shortcuts**: B brush, E eraser, T text, N note, L line, R rectangle, C ellipse, A arrow, D diamond, M highlighter, K laser, F frame, H pan, S select. The pin of the toolbar keeps the tool after a drawing, else the selection comes back.

The toolbar, its groups and the shortcuts are set with the [`widgets` and `widgetGroups` options](/get-started/#widgets).

## Selection and editing

![Three cards selected: options panel, selection menu and handles](/features/selection.webp){.screenshot width=1180 height=480}

- **Select** a shape with a click, add one with Shift + click, reach the shapes behind with Alt + click, or drag a rectangle selecting every shape it touches.
- **Move, resize and rotate**: Shift keeps proportions, rotates by steps of 15° and moves along an axis. Shapes snap to other shapes and to the grid.
- **Options of mixed selections**: the panel shows the options of every kind of selected shape, and applies each one to the shapes it fits, with actions to duplicate, delete or link the selection.
- **Selection menu** next to the shapes: duplicate, group, rotate, stacking order, lock and delete.
- **Links**: attach a web page or an email address to a shape, edited above it, opened from its link icon.
- **Align and distribute** the selection on a side or a center, with even spaces, or stacked in a row or a column.
- **Edit faster**: duplicate (Ctrl + D), group (Ctrl + G), flip (Shift + H / V), rotate by 90° (Shift + R / L), move with the arrow keys, undo and redo up to 100 steps (Ctrl + Z, Ctrl + Y or Ctrl + Shift + Z).

More in [Selection](/get-started/#selection).

## Layers, groups and frames

![Layers panel listing the shapes, with the ones of a frame](/features/layers.webp){.screenshot width=900 height=690}

- **Layers panel** (Alt + L): every shape with its name, top first. Rename, hide, lock, drag to reorder, select ranges with Shift.
- **Groups** move and style their shapes together, which can still be reached alone with Ctrl + click.
- **Frames**: named areas holding the shapes drawn or moved into them, cut at their border, exported without their title. A frame a shape is moved into or out of is highlighted, the moved shape is drawn whole. A selected frame has its opacity, stacking order and actions.
- **Linked arrows** follow the shapes they link when these are moved or resized, fixed to a side or to the outline; elbow arrows leave the sides facing each other with horizontal and vertical lines and go around the shapes. The handle of a selected curved or elbow arrow bends the curve on either side or moves the middle segment.
- **Stacking order**: forward and backward past the next overlapping shape, or to the front and back.

More in [Layers](/get-started/#layers), [Arrows](/get-started/#arrows), [Linked arrows](/get-started/#linked-arrows) and [Stacking order](/get-started/#stacking-order).

## Menus, shortcuts and command palette

![Context menu of a shape: each action with its shortcut](/features/context-menu.webp){.screenshot width=720 height=690}

- **Context menu**: a right click shows the actions of the selection or of the drawing, each with its shortcut.
- **Command palette** (Ctrl / Cmd + K): search any tool or command by its name, in the current language.
- **View**: zoom to fit the whole drawing (Shift + 1), to the selection (Shift + 2) or back to 100 % (Shift + 0), from the context menu and the command palette too.
- **Help** lists every shortcut, **preferences** (Ctrl + ,) keep the theme, language, grid, snapping, zen mode and auto save.
- **Clipboard**: paste a text (Ctrl + V), copy the selection as a PNG or SVG image.

![Command palette listing the tools and commands](/features/command-palette.webp){.screenshot width=680 height=580}

## Live collaboration

![Cursor and laser of another user on the drawing](/features/collaboration.webp){.screenshot width=1000 height=450}

- **Sessions**: start one from the menu and share its link or QR code, everyone draws on the same drawing in real time.
- **Presence**: cursors of the other users with their names, shapes they are drawing, their laser.
- **Rights**: participants view only until the owner lets them draw, they ask it in one click, the owner accepts or refuses from the panel of the session.
- **Presentation**: the owner presents its view, everyone follows its zoom and moves, until they move theirs, then follows it again in one click.
- **Never forgotten**: during a session, a live reminder in the header (also in zen mode) shows the people connected, opens the session and stops or leaves it in one click.
- **Reliable**: changes made while the connection is lost are merged with the ones of the others when it comes back.
- **Server included**: the repository has a Node server (socket.io, accounts, SQLite), or use your own following the [protocol](/get-started/#collaboration).

![Dialog of the owner: link, participants with their rights and QR code](/features/collaboration-dialog.webp){.screenshot width=480 height=630}

## Files, links and export

![Export dialog with its preview](/features/export.webp){.screenshot width=680 height=470}

- **Files**: save and open `.freedrawing` files (Ctrl + Shift + S, Ctrl + O). Only drawing shapes are read: files can come from anyone.
- **Links** hold the whole drawing, compressed, so no server is needed to share it.
- **Export** the drawing or the selection as PNG (1×, 2× or 3×), SVG or PDF, with or without background, in dark mode or not, or copy it to the clipboard.

More in [Files and links](/get-started/#files-and-links) and [Export](/get-started/#export).

## Themes, languages and accessibility

![The drawer in dark mode](/features/dark.webp){.screenshot width=1280 height=800}

- **Themes**: light, dark or the one of the device. The dark mode keeps the colors of the shapes recognizable.
- **Languages**: English, French, Spanish and German, chosen from the browser, and any text can be replaced with the `translations` option.
- **Keyboard and screen readers**: every action has a shortcut, menus and panels are reached with Tab and arrow keys, buttons have names and states.
- **Focus**: the zen mode hides the interface, a grid can be shown with snapping.

More in [Dark mode](/get-started/#dark-mode) and [Languages](/get-started/#languages).

## Made for apps

- **Any page, React or Vue**: `new Drawer($el, options)` and its `style.css` in plain JavaScript, or the `FreeDrawing` component of [React](/get-started/react) and [Vue](/get-started/vue) (drawer created and destroyed with it, of its size, settings following its props, never loaded on a server), TypeScript types included, [Konva](https://konvajs.org/) as only peer dependency.
- **Your storage**: the `storage` option loads and saves drawings in your app or server, the drawing is also a JSON file to keep anywhere.
- **Events** follow the drawing, the selection, the preferences and the collaboration, preferences can follow user accounts.
- **Control**: read only mode, user of the collaboration, every widget optional.
- **Plugins**: add your tools, commands, shortcuts and items of the context menu with a `Plugin` class, which can require other plugins and be configured by each app. `npm create @fabwcie/free-drawing-plugin` creates one from a few questions, see the [plugins guide](/plugins).

The [demo](https://free-drawing-demo.netlify.app/) is the web app of the repository: drawings kept in the browser, and with its server, accounts, drawings saved on the server and live collaboration. More in [Use in an app](/get-started/#use-in-an-app) and the [API](/api/).
