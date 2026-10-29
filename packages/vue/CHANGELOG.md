# Changelog

Changes of `@fabwcie/free-drawing-vue`. Each version is published by the release workflow of the library once it is not on npm yet.

## 1.1.1 (2026-10-29)

### Bug Fixes

- A `theme` or a `language` given in `options` no longer replaces at each mount the one the user chose (saved in the browser): only the props of the component are given to the drawer over it

## 1.1.0 (2026-10-28)

### Features

- `error` event: drawer not created (library not loaded, invalid options), also logged in the console (it was an unhandled rejection)

### Bug Fixes

- Only the settings changed are given again to the drawer: a language chosen in its menu is kept when the theme changes, a viewer of a collaboration session no longer gets the tools back (library 8.0.6 keeps the read only of the app through sessions)

## 1.0.2 (2026-10-28)

### Bug Fixes

- Library 8 accepted (peer dependency `^7.29.0 || ^8.0.0`)

## 1.0.1 (2026-10-27)

### Bug Fixes

- `readOnly`, `theme`, `language` and `user` given in `options` are kept when their props are not given (they were dropped: a theme of the options was ignored)

## 1.0.0 (2026-10-24)

### Features

- `FreeDrawing` component: drawer created once mounted (library loaded then, never on a server) and destroyed once unmounted, of the size of its element and following it, template ref giving the drawer, `options` read on creation, `read-only`, `theme`, `language` and `user` props followed, `ready` and `change` events
