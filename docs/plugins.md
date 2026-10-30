---
title: Plugins
description: Add your own tools, commands, shortcuts and menu items to free-drawing with plugins that behave like the built-in features
---

# Plugins

A plugin is a class that adds your features to the drawer: tools of the toolbar, commands, shortcuts, items of the context menu, elements of the interface. They behave exactly like the features of the library, in every app using the drawer, without changing its code.

```js
import { Drawer } from '@fabwcie/free-drawing';
import { StampsPlugin } from './stamps';

const drawer = new Drawer(document.getElementById('drawer'), { plugins: [StampsPlugin] });
```

## Why plugins

- **Your features, not a fork.** The tools of your domain (stamps of a teacher, symbols of a diagram, notes of a retrospective, marks of a plan...) live in your code. The library keeps its updates, your plugin keeps working.
- **First class from the first line.** A tool added by a plugin gets what the tools of the library have: a button with its title and shortcut, a line in help, a command in the palette, its texts in the language of the drawer, read only, undo and redo, saving, live collaboration, files, links and exports. You write the feature, not the plumbing.
- **Composable.** A plugin can require other plugins, use them, be configured by each app, and be shared as an npm package.
- **Safe.** Plugins are created and initialized in order, an asynchronous initialization is waited, an error stays in its plugin, its listeners are removed when it is destroyed.
- **Small.** One base class, a few methods, typed with TypeScript.

What you write, and what the drawer does for you:

| You write                                                   | The drawer gives                                                                                                                                                                  |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `this.addWidget('stamp', StampWidget)`                      | Button of the toolbar (icon, title, shortcut letter), placed by the `widgets` option, activated by its shortcut, listed in help and in the command palette, disabled in read only |
| `this.addCommand({ ... })`                                  | Command of the palette (searched, translated), keyboard shortcut, line in help, item of the context menu, shown only when available                                               |
| `this.addTranslations({ en, fr })`                          | Texts in the language of the drawer, updated when it changes, replaceable by the app                                                                                              |
| `drawer.addShape(shape)` then `drawer.stage.fire('change')` | Saving (localStorage or your storage), history, live collaboration, layers panel, selection and its options panel, files, links, exports                                          |
| `this.listenTo(target, event, handler)`                     | Listeners removed when the plugin is destroyed                                                                                                                                    |
| `this.getOptions(defaults)`                                 | Options given by each app with the class of the plugin (`plugins: [[StampsPlugin, { max: 20 }]]`)                                                                                 |

## Create a plugin

One command creates the package of a plugin, ready to test, build and publish:

::: code-group

```bash [npm]
npm create @fabwcie/free-drawing-plugin@latest
```

```bash [yarn]
yarn create @fabwcie/free-drawing-plugin
```

```bash [pnpm]
pnpm create @fabwcie/free-drawing-plugin
```

:::

It asks for the name of the plugin, and derives the other names from it: `StickyNotesPlugin` class and `pluginName: 'StickyNotes'`, `stickyNotes` tool and `stickyNotes.*` text keys, `free-drawing-plugin-sticky-notes` package. Then it asks what the plugin has, with a default for each answer:

- start from a new plugin, or from the [complete template](#template);
- a tool: a click adds a shape (`BaseWidget`), or a shape drawn by dragging (`ShapeWidget`), with its shortcut;
- a command: command palette, shortcut, context menu;
- options given by the app, a button in the header, a style sheet;
- texts in English and in French, Spanish or German, tests with Vitest.

Shortcuts of the library are refused, free ones are suggested from the name. The package has its TypeScript sources, its tests, its README, and builds `dist/` (ES modules, types, style sheet). `--name "Sticky notes" --yes` creates it without questions, `--template` from the template.

## Quick start

A plugin adding a command, with its shortcut, its item in the context menu and its texts:

```js
import { Plugin } from '@fabwcie/free-drawing';
import { Rect } from 'konva/lib/shapes/Rect';

export class StickyNotesPlugin extends Plugin {
  static pluginName = 'StickyNotes';

  constructor(drawer) {
    super(drawer);
    this.addTranslations({
      en: { 'notes.add': 'Add a sticky note' },
      fr: { 'notes.add': 'Ajouter une note' },
    });
  }

  init() {
    this.addCommand({
      id: 'sticky note add',
      label: 'notes.add',
      shortcut: 'Alt+N',
      contextMenu: 'drawing',
      run: () => {
        const { x, y } = this.drawer.getPointerPosition();

        this.drawer.addShape(new Rect({ name: 'drawer-rect note', x, y, width: 160, height: 120, fill: '#ffec99' }));
        this.drawer.stage.fire('change');
      },
    });
  }
}
```

The command is in the command palette (Ctrl + K), Alt + N runs it, a right click on the drawing shows it, help lists its shortcut. The note is saved, undone with Ctrl + Z, sent to the other users of a collaboration session and exported like any rectangle.

## Anatomy of a plugin

### Static members

| Member              | Use                                                                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `static pluginName` | Unique name of the plugin, required (class names are changed by minification). Used by `drawer.plugins.get('Name')` and `requires`                 |
| `static requires`   | Plugins required, created and initialized before this one: classes (added when the app does not give them) or names (the app must give them)        |

### Steps

| Step                  | When                                | What to do there                                                                                                                    |
| --------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `constructor(drawer)` | With the drawer, before its toolbar | `addWidget`, `addTranslations`. The interface (toolbar, menus, help) does not exist yet                                             |
| `init()`              | Drawer created                      | `addCommand`, `listenTo`, elements of the interface. May return a promise: the next plugins wait for it, and so does `drawer.ready` |
| `afterInit()`         | Every plugin initialized            | Use other plugins (`drawer.plugins.get`)                                                                                            |
| `destroy()`           | `drawer.plugins.destroy()`          | Remove what the plugin added (elements, timers), then call `super.destroy()`: its listeners are removed                             |

Required plugins come first at each step. A missing plugin, two plugins of the same name or plugins requiring each other throw an error when the drawer is created, with the names involved. An error thrown by `init` is logged in the console, the other plugins are still initialized.

### Members of a plugin

| Member                                                 | Use                                                                               |
| ------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `drawer`                                               | The drawer: its methods, its options, its stage (Konva)                           |
| `name`                                                 | `pluginName` of the plugin                                                        |
| `getOptions(defaults)`                                 | Options of the plugin: defaults replaced by the ones of the app                   |
| `addTranslations(texts)`                               | Texts of the plugin by language                                                   |
| `t(key, params)`                                       | Text in the language of the drawer, `{name}` placeholders replaced                |
| `addWidget(id, WidgetClass)`                           | Tool of the toolbar                                                               |
| `addCommand(command)`                                  | Command: palette, shortcut, help, context menu                                    |
| `listenTo(target, event, handler)`                     | Listener of the drawer, of a Konva node or of a DOM element, removed by `destroy` |
| `isEnabled`                                            | False in read only, or while disabled by `forceDisabled`                          |
| `forceDisabled(reason)` / `clearForceDisabled(reason)` | Disable the plugin for a reason, enabled again once every reason is cleared       |

## Tools

A tool is a class extending `BaseWidget` (or `ShapeWidget` for a shape drawn in the dragged box), given to `addWidget` in the constructor of the plugin.

```js
import { BaseWidget } from '@fabwcie/free-drawing';

class StampWidget extends BaseWidget {
  cursor = 'copy'; // cursor of the canvas while the tool is active

  constructor(drawer) {
    // id (also the text key `tools.<id>` of its title), title without translation, svg icon, shortcut letter
    super(drawer, 'stamp', 'Stamp', stampIcon, 'p');
  }

  initEvents() {
    // events of the stage while the tool is active, removed when another tool is chosen
    this.onStage('click tap', () => this.drawer.plugins.get('Stamps').stamp(this.drawer.getPointerPosition()));
  }
}
```

| Member of `BaseWidget`                              | Use                                                                                                                                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initEvents()` with `this.onStage(events, handler)` | Events of the stage while the tool is active (never `stage.on` directly: `onStage` removes them on deactivation)                                                                   |
| `cursor`                                            | Cursor of the canvas while the tool is active                                                                                                                                      |
| `startAction()` / `endAction()`                     | Around a pointer action (pointer down to up): shortcuts disabled, the interface lets the pointer through, moves and release out of the canvas come to the stage events of the tool |
| `shareLive(...shapes)`                              | Shapes being drawn shown live to the other users of a collaboration session                                                                                                        |
| `afterDraw()`                                       | Shape drawn: the selection tool comes back, unless the user keeps the tool (pin of the toolbar)                                                                                    |
| `onActive()` / `onDesactive()`                      | Tool chosen, another tool chosen                                                                                                                                                   |
| `onConstrainChange(constrain)`                      | Shift pressed or released during a pointer action, pointer not moved                                                                                                               |
| `onCancel()`                                        | Pointer action cancelled by `cancelAction()` (a second finger on a touch screen pinches): remove what the action was drawing, then the action ends                                 |
| `clearSelection()`                                  | Nothing selected                                                                                                                                                                   |

`ShapeWidget` draws in the dragged box: it creates the shape on press, updates it while the pointer moves (shared live), removes it after a simple click, places it in frames, saves the change and gives back the selection tool. The tool implements `createShape(start)` and `updateShape(shape, start, end, constrain)`, may implement `onDrawEnd(shape)`, and gets the options panel of shape tools (stroke, background with `hasFill`, width, opacity) with `shapeStyle`.

Tools are placed at their place in the `widgets` and `widgetGroups` options of the app, else at the end of the toolbar:

```js
new Drawer($el, { plugins: [StampsPlugin], widgets: ['selection', 'stamp', 'brush', 'eraser'] });
```

::: tip Shortcut letters
The tools of the library use A, B, C, D, E, F, H, K, L, N, Q (keep the tool), R, S and T, the highlighter of the [extra tools](/get-started/extra-tools) M: choose another letter. The `widgets` option of the app can change the title and the shortcut of any tool, also of plugins.
:::

## Commands

```js
this.addCommand({
  id: 'stamps select all', // English words, searched in the command palette with the label
  label: 'stamps.selectAll', // key of its text (or a text)
  icon: selectIcon, // svg markup shown in the palette
  shortcut: 'Alt+P', // keys running it, shown in palette, context menu and help
  contextMenu: 'selection', // item of the context menu of selected shapes, or 'drawing' (nothing selected)
  readOnly: false, // true: does not modify the drawing, also available in read only and while the plugin is disabled
  isAvailable: () => stamps.length > 0, // shown and run only when true
  run: () => selectStamps(),
});
```

Shortcuts are written `Ctrl+Shift+M`, `Alt+P`, `Delete`: Ctrl is also Cmd on Mac, letters with Alt and digits are read by their place on the keyboard (Alt and Shift change characters). They are shown with the symbols of Apple keyboards on its devices (⇧⌘M, ⌥P, ⌫); `formatShortcut(shortcut, drawer.i18n.t)` and `ariaShortcut(shortcut)` show the shortcuts of your own interface the same way. Shortcuts of plugins run before the ones of the library: avoid the ones listed in help. Add commands in `init`: the context menu and help get the commands of plugins once every plugin is initialized.

## Texts

```js
this.addTranslations({
  en: { 'tools.stamp': 'Stamp', 'stamps.counted': '{count} stamps' },
  fr: { 'tools.stamp': 'Tampon', 'stamps.counted': '{count} tampons' },
});

this.t('stamps.counted', { count: 3 }); // '3 stamps', in the language of the drawer
```

Prefix the keys with your plugin, `tools.<id>` gives the title of a tool. Missing languages use English. The app can replace any text of a plugin with the `translations` option, as the texts of the library: `translations: { fr: { 'tools.stamp': 'Cachet' } }`.

## Options

The app gives the options of a plugin with its class, in a pair `[class, options]` of the `plugins` option; the plugin reads them with its defaults:

```js
class StampsPlugin extends Plugin {
  static pluginName = 'Stamps';
  options = this.getOptions({ max: 0, size: 48 });
}

new Drawer($el, { plugins: [[StampsPlugin, { max: 20 }]] });
// options: { max: 20, size: 48 }
```

- `getOptions` merges one level deep: an option given replaces the default one, an object or a list too (not merged).
- The options are known in the constructor of the plugin (a field initialized with `getOptions`, as above, works).
- A plugin required by another one is added without options: give it in the `plugins` option with its options, it is still created once, before the plugins requiring it (`[StampCounterPlugin, [StampsPlugin, { max: 20 }]]`).
- In TypeScript, a pair written in the option is typed as `PluginEntry`; a list built apart is typed `PluginEntry[]` (or written `as const`).
- The `pluginOptions` option of previous versions (options by plugin name: `pluginOptions: { Stamps: { max: 20 } }`) still works, with a warning in the console; options given with the class replace its ones.

## Shapes and data

Plugins draw with the shapes of the library: `Line`, `Arrow`, `Rect`, `Ellipse`, `Text`, `Path` and groups of them (`Group`) from Konva. Files, links and the collaboration server only accept these classes: this way any drawing stays readable by every app. Mark the shapes of your plugin with a name of their own, next to a name of the library which keeps its behavior:

```js
const stamp = new Group({ name: `${shapeName.group} stamp`, x, y });

stamp.add(new Ellipse({ name: shapeName.ellipse, radiusX: 24, radiusY: 24, fill: '#b2f2bb' }));
stamp.add(new Text({ name: shapeName.text, text: '✓' })); // edited by double click, as any text
drawer.addShape(stamp); // ids, hit regions, moved with the selection tool
drawer.placeInFrames([stamp]); // in the frame under it
drawer.stage.fire('change'); // saved, history, collaboration, events
```

Attributes of shapes are saved with them (`shape.setAttr('rating', 4)`), and found again with `drawer.drawLayer.find('.stamp')`. `drawer.getPointerPosition()` gives the pointer in drawing coordinates, `drawer.getSelectedShapes()` the selection, `drawer.getWidget<SelectWidget>('selection')?.select(shapes)` selects shapes.

## Events and listeners

`listenTo` listens until the plugin is destroyed:

```js
// events of the drawer (change, selection.change, readonly.change, language.change...)
this.listenTo(this.drawer, drawerEvents.change, () => this.update());
// events of Konva nodes: stage, layers, shapes
this.listenTo(this.drawer.drawLayer, 'dblclick dbltap', (e) => this.onDoubleClick(e));
// events of DOM elements
this.listenTo(this.$button, 'click', () => this.showCount());
```

The [events](/get-started/#events) of the drawer are listed in the guide. `plugin.change` tells when a plugin is disabled or enabled again.

A plugin can trigger its own events on the drawer, with its own prefix. In TypeScript, it adds them to the events of the drawer, so that the apps get their names and arguments checked:

```ts
declare module '@fabwcie/free-drawing' {
  interface DrawerEventMap {
    'stamps.count': [count: number];
  }
}

this.drawer.trigger('stamps.count', this.count);
```

## Enabled state

`isEnabled` is false in read only, or while the plugin is disabled by `forceDisabled(reason)`: its tools and its commands modifying the drawing are disabled (commands with `readOnly` stay available), `plugin.change` is triggered. Several reasons can disable it, it is enabled again once `clearForceDisabled(reason)` cleared every one of them. Check `isEnabled` before modifying the drawing from your own events.

```js
if (stamps.length >= max) this.forceDisabled('limit');
else this.clearForceDisabled('limit');
```

## Using other plugins

```js
class StampCounterPlugin extends Plugin {
  static pluginName = 'StampCounter';
  static requires = [StampsPlugin]; // created first, added when the app does not give it ('Stamps': the app gives it)

  afterInit() {
    this.stamps = this.drawer.plugins.get(StampsPlugin); // every plugin initialized
  }
}
```

`drawer.plugins.get(Class or name)` gives a plugin of the drawer, `drawer.plugins.has(...)` tells whether it has one, `for (const plugin of drawer.plugins)` goes through them, required ones first.

## Elements of the interface

`drawer.layout.add(region, element, { hideInZen })` adds an element to a region: `header` (top left), `footerStart`, `footer`, `floating` (panels, dialogs). `createButton`, `setLabel` and `setPressed` create buttons named for screen readers. Scope styles under `.drawer-container` and use the colors of the theme of the drawer (`--drawer-*` custom properties, light and dark):

```css
.drawer-container .drawer-button.stamp-counter {
  width: auto;
  color: var(--drawer-text-muted);
}
```

## Packaging and publishing

A plugin is a package depending on the library and Konva as peer dependencies: the app gives them, the drawer and the plugin use the same Konva ([why](/get-started/#why-is-konva-a-peer-dependency): one copy of Konva in the page, its classes shared).

```json
{
  "name": "free-drawing-plugin-stamps",
  "type": "module",
  "exports": { ".": "./dist/index.js", "./style.css": "./dist/style.css" },
  "peerDependencies": {
    "@fabwcie/free-drawing": "^7.19.0",
    "konva": "^10.9.0"
  }
}
```

Import Konva classes by their path (`konva/lib/shapes/Rect`), as the library does. Name the package `free-drawing-plugin-<name>` to make it easy to find.

## Testing

Test plugins with [Vitest](https://vitest.dev/) and jsdom: create a drawer in the document, fire events on its stage and its container. jsdom has no canvas: the [setup file](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/vitest.setup.ts) of the library tests gives one.

```js
const drawer = new Drawer(document.getElementById('drawer'), { plugins: [StampsPlugin], autoSave: false });

await drawer.ready; // asynchronous init of plugins
drawer.$drawerContainer.dispatchEvent(new KeyboardEvent('keydown', { key: 'π', code: 'KeyP', altKey: true }));
expect(drawer.plugins.get(StampsPlugin).getStamps()).toHaveLength(1);
```

## Template

The [plugin template](https://github.com/fabienwnklr/free-drawing/tree/master/packages/plugin-template) of the repository is a complete plugin to copy (or to start from with `npm create @fabwcie/free-drawing-plugin@latest -- --template`), commented and tested with the library on each of its changes:

| File                                   | Shows                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/StampsPlugin.ts`                  | Static members, options, every step, commands with every field, listeners, enabled state, shapes |
| `src/widgets/StampWidget.ts`           | Tool based on `BaseWidget`: pointer action (cancelled too), live sharing, Shift, activation      |
| `src/widgets/ZoneWidget.ts`            | Tool based on `ShapeWidget`: shape drawn in the dragged box                                      |
| `src/StampCounterPlugin.ts`            | Plugin requiring another one, element of the header, `destroy`                                   |
| `src/translations.ts`, `src/style.css` | Texts in four languages, scoped styles                                                           |
| `tests/stamps.test.ts`                 | Tests of tools, commands, menus, options                                                         |

## Good practices

- Prefix the ids of tools and commands, the keys of texts and the names of shapes with your plugin.
- Fire `change` on the stage after any change of the drawing, check `isEnabled` before it.
- Register stage events of tools with `onStage`, other listeners with `listenTo`.
- Keep the drawing readable without your plugin: shapes of the library, names of the library next to yours.
- Use the public members of the drawer: members starting with `_` may change.

## Reference

[Plugin](/api/plugins/Plugin#abstract-plugin), [PluginCollection](/api/plugins/PluginCollection#plugincollection), [BaseWidget](/api/components/toolbar/widgets/BaseWidget#abstract-basewidget) and [ShapeWidget](/api/components/toolbar/widgets/ShapeWidget#abstract-shapewidget) in the API.
