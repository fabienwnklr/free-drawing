# Changelog

Changes of `@fabwcie/free-drawing-element`. Each version is published by the release workflow of the library once it is not on npm yet.

## 1.1.2 (2026-10-30)

### Bug Fixes

- The drawer follows the size of its element, no longer the one of the window when the element had the size of the window (or was hidden) when it was mounted: resized then, the drawer was bigger than its element (library 8.3.0 or later: `followWindow` option)
- The package is resolved by tools using the `require` condition of `exports` too (Jest): `default` condition added

## 1.1.1 (2026-10-29)

### Bug Fixes

- A `theme` or a `language` given in `options` no longer replaces at each mount the one the user chose (saved in the browser): only the attributes and properties of the component are given to the drawer over it

## 1.1.0 (2026-10-28)

### Features

- `drawererror` event: drawer not created (library not loaded, invalid options), also logged in the console (it was an unhandled rejection)

### Bug Fixes

- Only the settings changed are given again to the drawer: a language chosen in its menu is kept when the theme changes, a viewer of a collaboration session no longer gets the tools back (library 8.0.6 keeps the read only of the app through sessions)
- In the shadow root of a component (Lit...), the style of the element is added to it (block of its size)

## 1.0.1 (2026-10-28)

### Bug Fixes

- Library 8 accepted (peer dependency `^7.29.0 || ^8.0.0`)

## 1.0.0 (2026-10-27)

### Features

- `<free-drawing>` custom element, defined when the package is imported (nothing on a server): drawer created once the element is in the page (library loaded then) and destroyed once it leaves it (kept when it is moved), of the size of the element and following it; `options` property or JSON attribute read on creation; `read-only`, `theme` and `language` attributes (or properties) and `user` property followed; `drawer` property; `drawerready` and `drawerchange` events; `defineFreeDrawing(name)` for other names; properties set before the element is defined kept; style without specificity (block, `[hidden]` respected)
