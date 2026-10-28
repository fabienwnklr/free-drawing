# Plugin template

A complete [free-drawing](https://github.com/fabienwnklr/free-drawing) plugin to copy: every part of a plugin, commented, and tested with the library on each change of the repository. The guide [Plugins](https://free-drawing-docs.netlify.app/plugins) explains each of them. `npm create @fabwcie/free-drawing-plugin@latest -- --template` creates a package from it, renamed for your plugin.

It adds stamps (circles with a symbol) to the drawer:

- a **Stamp** tool (P): a press adds a stamp under the pointer, the stamp follows it until it is released, Shift keeps it on an axis;
- a **Zone** tool (Z): dashed rounded rectangles drawn in the dragged box;
- commands in the command palette, the context menu and help: stamp in the middle (Alt+P), select all stamps, remove selected stamps, count stamps (also in read only);
- options of the app: symbols, colors, size, and a limit of stamps disabling the plugin once reached;
- a second plugin, **StampCounter**, requiring the first one: a button of the header shows the number of stamps.

```js
import { Drawer } from '@fabwcie/free-drawing';
import '@fabwcie/free-drawing/style.css';
import { StampCounterPlugin, StampsPlugin } from '@free-drawing/plugin-template';

const drawer = new Drawer(document.getElementById('drawer'), {
  // the stamps plugin is required by the counter: added with it, given here with its options
  plugins: [StampCounterPlugin, [StampsPlugin, { max: 20, symbols: ['✓', '✗'] }]],
  // tools of plugins can be placed like the other ones (else at the end of the toolbar)
  widgets: ['selection', 'stamp', 'zone', 'brush', 'eraser', 'text'],
});
```

## Files

| File                                                                                                                                      | Shows                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [src/StampsPlugin.ts](https://github.com/fabienwnklr/free-drawing/blob/master/packages/plugin-template/src/StampsPlugin.ts)               | `pluginName`, `requires`, `getOptions`, constructor (`addTranslations`, `addWidget`), asynchronous `init` (`addCommand` with every field, `listenTo` drawer events and konva nodes), `afterInit`, `destroy`, `isEnabled`, `forceDisabled` / `clearForceDisabled`, `t`, shapes of the library saved with `drawer.stage.fire('change')` |
| [src/widgets/StampWidget.ts](https://github.com/fabienwnklr/free-drawing/blob/master/packages/plugin-template/src/widgets/StampWidget.ts) | Tool based on `BaseWidget`: `cursor`, `onStage`, `startAction` / `endAction`, `shareLive`, `afterDraw`, `onActive`, `onDesactive`, `onCancel`, `onConstrainChange`                                                                                                                                                                    |
| [src/widgets/ZoneWidget.ts](https://github.com/fabienwnklr/free-drawing/blob/master/packages/plugin-template/src/widgets/ZoneWidget.ts)   | Tool based on `ShapeWidget`: `createShape`, `updateShape`, `onDrawEnd`, `shapeStyle`, `hasFill`                                                                                                                                                                                                                                       |
| [src/StampCounterPlugin.ts](https://github.com/fabienwnklr/free-drawing/blob/master/packages/plugin-template/src/StampCounterPlugin.ts)   | `requires` with a class, `afterInit` using another plugin, element of the header (`drawer.layout.add`, `createButton`, `setLabel`), `listenTo` a DOM element, `plugin.change`, `destroy` removing its element                                                                                                                         |
| [src/translations.ts](https://github.com/fabienwnklr/free-drawing/blob/master/packages/plugin-template/src/translations.ts)               | Texts in English, French, Spanish and German, titles of tools (`tools.<id>`)                                                                                                                                                                                                                                                          |
| [src/style.css](https://github.com/fabienwnklr/free-drawing/blob/master/packages/plugin-template/src/style.css)                           | Styles scoped under `.drawer-container`, colors of the drawer theme                                                                                                                                                                                                                                                                   |
| [tests/stamps.test.ts](https://github.com/fabienwnklr/free-drawing/blob/master/packages/plugin-template/tests/stamps.test.ts)             | Tests of a plugin: drawer in jsdom, pointer events on the stage, shortcuts, menus, options                                                                                                                                                                                                                                            |

## Your plugin from this template

1. Copy this folder, rename the package (e.g. `free-drawing-plugin-<name>`), the classes, `pluginName`, the ids of tools and the keys of texts.
2. Out of this repository, remove the `paths` of `tsconfig.json` and the `alias` of `vite.config.ts`: the installed library is used.
3. Install the library and the test tools: `yarn add -D @fabwcie/free-drawing konva vite vitest jsdom jest-canvas-mock typescript`. Keep the library and Konva as `peerDependencies`: the app gives them, one Konva for the drawer and the plugin.
4. Copy the [setup file](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/vitest.setup.ts) of the library tests (canvas of jsdom) and give its path to `setupFiles`.

In this repository: `yarn workspace @free-drawing/plugin-template test` (also run by `yarn test`), `typecheck`, `lint`.
