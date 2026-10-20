---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: free-drawing
  text: Infinite canvas drawing for any web page
  tagline: A whiteboard in one element. Draw, organize and share ideas with tools, layers, frames, live collaboration and exports, in TypeScript and without framework.
  image:
    src: /logo.svg
    alt: free-drawing logo
  actions:
    - theme: brand
      text: Get started
      link: /get-started/
    - theme: alt
      text: Features
      link: /features
    - theme: alt
      text: Try the demo
      link: https://free-drawing-demo.netlify.app/
      target: _blank

features:
  - icon: ✏️
    title: Drawing tools
    details: Brush, highlighter, rectangles, ellipses, lines, arrows, triangles, diamonds, hearts, clouds, texts, laser pointer and eraser.
    link: /features#drawing-tools
    linkText: See the tools
  - icon: 🎯
    title: Selection and editing
    details: Select by click or rectangle, resize, rotate, flip, snap to shapes and grid, style mixed selections, undo and redo.
    link: /features#selection-and-editing
    linkText: Edit shapes
  - icon: 🗂️
    title: Layers, groups and frames
    details: Name, hide, lock and reorder shapes, group them, gather them in frames, link them with arrows that follow.
    link: /features#layers-groups-and-frames
    linkText: Organize
  - icon: 🤝
    title: Live collaboration
    details: Share a link or a QR code, see the cursors of the others, give or remove the right to draw. Server included.
    link: /features#live-collaboration
    linkText: Draw together
  - icon: 📤
    title: Files and export
    details: Save and open files, share links holding the drawing, export PNG, SVG or PDF, copy to the clipboard.
    link: /features#files-links-and-export
    linkText: Share
  - icon: ⌨️
    title: Keyboard first
    details: A shortcut for each action, context menu, command palette to search any command, help listing every shortcut.
    link: /features#menus-shortcuts-and-command-palette
    linkText: Shortcuts
  - icon: 🌍
    title: Themes and languages
    details: Light and dark themes, English, French, Spanish and German, replaceable texts, labels for screen readers.
    link: /features#themes-languages-and-accessibility
    linkText: Accessibility
  - icon: 🔌
    title: Plugins
    details: Add your own tools, commands, shortcuts and menu items, created with npm create @fabwcie/free-drawing-plugin. They get help, palette, texts, saving, history and collaboration like the built-in ones.
    link: /plugins
    linkText: Extend it
  - icon: 🧩
    title: Made for apps
    details: One element and one line, your own storage, events, preferences and typed API. Konva as only peer dependency.
    link: /features#made-for-apps
    linkText: Integrate
---

<div class="home-showcase">

![A roadmap drawn with free-drawing: frame, cards linked by arrows, shapes, freehand strokes and a highlight](/features/showcase.webp){width=1280 height=800}

</div>

## Quick start

Install the library with [Konva](https://konvajs.org/), its only peer dependency:

::: code-group

```bash [yarn]
yarn add @fabwcie/free-drawing konva
```

```bash [npm]
npm install @fabwcie/free-drawing konva
```

```bash [pnpm]
pnpm add @fabwcie/free-drawing konva
```

:::

Then give it an element of your page:

```js
import { Drawer } from '@fabwcie/free-drawing';
import '@fabwcie/free-drawing/style.css';

const drawer = new Drawer(document.getElementById('drawer'), {
  theme: 'system', // light, dark or the one of the device
  language: 'auto', // language of the browser
});

// drawing changed: keep it anywhere as JSON
drawer.on('drawer.change', () => console.log(drawer.getDrawingFile()));
```

The [guide](/get-started/) describes every option, the [features](/features) page shows what the drawer can do, the [plugins](/plugins) guide shows how to add your own features and the [API](/api/) documents each class and method.

## Open source

free-drawing is released under the [MIT License](https://github.com/fabienwnklr/free-drawing/blob/master/LICENCE). Issues and contributions are welcome on [GitHub](https://github.com/fabienwnklr/free-drawing), see [how to contribute](/get-started/contribute).
