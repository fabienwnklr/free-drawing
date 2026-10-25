# Changelog

Changes of `@fabwcie/create-free-drawing-plugin` (`npm create @fabwcie/free-drawing-plugin`). Each version is published by the release workflow of the library once it is not on npm yet.

## 1.1.1 (2026-10-25)

### Bug Fixes

- MIT licence of Fabien Winkler: `package.json` declared Apache-2.0 while the `LICENCE` file held the MIT licence of another project

## 1.1.0 (2026-10-24)

### Features

- packages tested with Vitest 5 (`vite` 8 added to their dev dependencies, required by Vitest) and jsdom 29, the versions the library is tested with: Node 22.12 or later to run their tests

## 1.0.1 (2026-10-23)

### Bug Fixes

- template: the stamp being placed is removed when a second finger pinches on a touch screen (`onCancel`, library 7.24.0), it stayed in the drawing without being saved

## 1.0.0 (2026-10-20)

### Features

- questions creating the package of a plugin: name (classes, ids and text keys derived from it), package, folder, new plugin or complete template, tool (click or drawn shape, id, shortcut), command (shortcut, context menu), options of the app, button of the header, style sheet, languages of the texts, tests
- shortcuts of the library refused, free ones suggested from the name of the plugin
- package ready to test (Vitest, drawer in jsdom), build (`dist/`: ES modules, types, style sheet) and publish, the library and Konva as peer dependencies
- options `--name`, `--template`, `--yes`, `--force`, folder on the command line
