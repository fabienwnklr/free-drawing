# @fabwcie/create-free-drawing-plugin

Create a plugin of [free-drawing](https://github.com/fabienwnklr/free-drawing): a few questions, then a package ready to test, build and publish.

```bash
npm create @fabwcie/free-drawing-plugin@latest
# or
yarn create @fabwcie/free-drawing-plugin
pnpm create @fabwcie/free-drawing-plugin
```

## Questions

| Question                    | Default                                                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name of the plugin          | required, e.g. `Sticky notes`                                                                                                                     |
| Name of the package         | `free-drawing-plugin-sticky-notes`                                                                                                                |
| Folder                      | name of the package                                                                                                                               |
| Start from                  | a new plugin built from the answers, or the complete template (stamps: two tools, commands, options, a second plugin, styles and tests, to adapt) |
| Tool in the toolbar         | a click adds a shape (`BaseWidget`), a shape drawn by dragging (`ShapeWidget`), or none                                                           |
| Id and shortcut of the tool | `stickyNotes`, first free letter of the name                                                                                                      |
| Command                     | command palette, shortcut (first free `Alt` + letter of the name), context menu of the drawing                                                    |
| Options given by the app    | `plugins: [[StickyNotesPlugin, { color, size }]]`                                                                                                 |
| Button in the header        | number of shapes of the plugin                                                                                                                    |
| Style sheet                 | `style.css`, imported by the app                                                                                                                  |
| Languages of the texts      | English, and French, Spanish, German                                                                                                              |
| Tests                       | Vitest, drawer in jsdom                                                                                                                           |

Names are derived from the name of the plugin: `StickyNotesPlugin` class and `pluginName: 'StickyNotes'` (PascalCase), `stickyNotes` tool and `stickyNotes.*` text keys (camelCase), `sticky-notes` shapes and package (kebab-case). Shortcuts of the library are refused, `none` gives no shortcut.

## Options

```bash
npm create @fabwcie/free-drawing-plugin@latest my-plugin -- --name "Sticky notes" --yes
```

| Option          | Use                                 |
| --------------- | ----------------------------------- |
| `[folder]`      | folder of the package               |
| `--name <name>` | name of the plugin                  |
| `--template`    | start from the complete template    |
| `-y`, `--yes`   | default answers (needs `--name`)    |
| `--force`       | write in a folder that is not empty |
| `-h`, `--help`  | help                                |

## The package

TypeScript sources in `src/`, built in `dist/` (ES modules, types, `style.css`) with `npm run build`, tested with `npm test`. The library and Konva are peer dependencies, given by the app. The [plugins guide](https://free-drawing-docs.netlify.app/plugins) explains each part of a plugin.
