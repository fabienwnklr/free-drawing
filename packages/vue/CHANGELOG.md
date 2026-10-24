# Changelog

Changes of `@fabwcie/free-drawing-vue`. Each version is published by the release workflow of the library once it is not on npm yet.

## 1.0.0 (2026-10-24)

### Features

- `FreeDrawing` component: drawer created once mounted (library loaded then, never on a server) and destroyed once unmounted, of the size of its element and following it, template ref giving the drawer, `options` read on creation, `read-only`, `theme`, `language` and `user` props followed, `ready` and `change` events
