# Changelog

Changes of `@fabwcie/free-drawing-extra-tools`. Each version is published by the release workflow of the library once it is not on npm yet.

## 1.0.1 (2026-10-30)

### Bug Fixes

- The package is resolved by tools using the `require` condition of `exports` too (Jest): `default` condition added
- Apps rendered on a server (Next.js, Nuxt...) can import it with the library 8.3.0 or later (earlier versions read the window when loaded)

## 1.0.0 (2026-10-28)

### Features

- `ExtraShapesPlugin`: heart, cloud, star, hexagon, block arrow, speech bubble and check box tools, and `HighlighterPlugin`: highlighter tool (M) with its own colors and widths; tools of the library until its version 7, in the "More tools" group of the toolbar by default; titles in English, French, Spanish and German
