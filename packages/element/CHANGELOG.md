# Changelog

Changes of `@fabwcie/free-drawing-element`. Each version is published by the release workflow of the library once it is not on npm yet.

## 1.0.0 (2026-10-27)

### Features

- `<free-drawing>` custom element, defined when the package is imported (nothing on a server): drawer created once the element is in the page (library loaded then) and destroyed once it leaves it (kept when it is moved), of the size of the element and following it; `options` property or JSON attribute read on creation; `read-only`, `theme` and `language` attributes (or properties) and `user` property followed; `drawer` property; `drawerready` and `drawerchange` events; `defineFreeDrawing(name)` for other names; properties set before the element is defined kept; style without specificity (block, `[hidden]` respected)
