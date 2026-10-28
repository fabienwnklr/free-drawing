# @fabwcie/free-drawing-extra-tools

Extra tools of [free-drawing](https://github.com/fabienwnklr/free-drawing), an infinite canvas drawing board, as plugins: shapes (heart, cloud, star, hexagon, block arrow, speech bubble, check box) and the highlighter. The library keeps the tools most drawings need; add these ones when your app needs them.

## Install

```sh
npm install @fabwcie/free-drawing-extra-tools @fabwcie/free-drawing konva
```

`@fabwcie/free-drawing` (version 8) and `konva` are peer dependencies: the plugins use the drawer of your app.

## Use

```js
import { Drawer } from '@fabwcie/free-drawing';
import '@fabwcie/free-drawing/style.css';
import { ExtraShapesPlugin, HighlighterPlugin } from '@fabwcie/free-drawing-extra-tools';

const drawer = new Drawer(document.getElementById('drawer'), {
  plugins: [ExtraShapesPlugin, HighlighterPlugin],
});
```

With the components of the library, give them in their options: `options` property of `FreeDrawing` (React, Vue) or of `<free-drawing>`, `{ plugins: [ExtraShapesPlugin, HighlighterPlugin] }`.

The tools take their place in the "More tools" group of the toolbar (default `widgetGroups` option), after the triangle and the diamond of the library. Place them elsewhere with the `widgets` and `widgetGroups` options, as the tools of the library:

```js
new Drawer($el, {
  plugins: [ExtraShapesPlugin, HighlighterPlugin],
  widgets: ['selection', 'pan', 'brush', 'highlighter', 'eraser', 'text', 'square', 'circle', 'heart', 'star'],
});
```

## Plugins

| Plugin              | Tools                                                                   | Name          |
| ------------------- | ----------------------------------------------------------------------- | ------------- |
| `ExtraShapesPlugin` | `heart`, `cloud`, `star`, `hexagon`, `blockArrow`, `bubble`, `checkbox` | `ExtraShapes` |
| `HighlighterPlugin` | `highlighter` (M)                                                       | `Highlighter` |

- Shapes: drawn in the dragged box (Shift: in a square), with the background color, stroke style and opacity of the options, as the rectangle; a text written in them (double click), arrows linked to them. The block arrow points right: rotate or flip it for another direction; the check box is a rounded square with a check mark, for to-do lists.
- Highlighter (M): wide strokes of its own fluorescent colors (yellow by default, green, blue, pink, orange or custom) and widths, multiplied with the drawing under them so texts stay readable.
- Titles of the tools in English, French, Spanish and German (the language of the drawer), replaced by the `translations` option of the drawer (`tools.heart`, `tools.highlighter`, `highlighter.options`...).

## Drawings

The shapes of these tools are shapes of the library: a drawing holding them is opened, shown, selected, styled, exported and shared in live sessions by any drawer, with or without these plugins (only the tools are missing). Drawings of previous versions of the library open as they were.

A drawer without them asked for one of their tools (`widgets: ['heart']`) tells which plugin to add, in the console.

## Changelog

[CHANGELOG.md](https://github.com/fabienwnklr/free-drawing/blob/master/packages/extra-tools/CHANGELOG.md)
