# Changelog

Changes of `@fabwcie/create-free-drawing-plugin` (`npm create @fabwcie/free-drawing-plugin`). Each version is published by the release workflow of the library once it is not on npm yet.

## 1.0.0 (2026-10-20)

### Features

- questions creating the package of a plugin: name (classes, ids and text keys derived from it), package, folder, new plugin or complete template, tool (click or drawn shape, id, shortcut), command (shortcut, context menu), options of the app, button of the header, style sheet, languages of the texts, tests
- shortcuts of the library refused, free ones suggested from the name of the plugin
- package ready to test (Vitest, drawer in jsdom), build (`dist/`: ES modules, types, style sheet) and publish, the library and Konva as peer dependencies
- options `--name`, `--template`, `--yes`, `--force`, folder on the command line
