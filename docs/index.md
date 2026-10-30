---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: free-drawing
  text: Infinite canvas drawing for vanilla JS, React, Vue and web components
  tagline: A whiteboard in one element or one component. Draw, organize and share ideas with tools, layers, frames, live collaboration and exports.
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
    details: Brush, rectangles, ellipses, lines, arrows, triangles, diamonds, texts, notes, images, laser pointer and eraser; hearts, clouds, stars and a highlighter as extra tools.
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
    title: Vanilla, React, Vue or any framework
    details: One element and one line in any page, the FreeDrawing component of React and Vue, or the free-drawing web component for Angular, Svelte and plain HTML. Your own storage, events, preferences and typed API, Konva as only peer dependency.
    link: /features#made-for-apps
    linkText: Integrate
---

<div class="home-showcase">

![A roadmap drawn with free-drawing: frame, cards linked by arrows, shapes, freehand strokes and a highlight](/features/showcase.webp){width=1280 height=800}

</div>

## Why free-drawing?

- **Any framework, or none**: a class for any page, a component for [React](/get-started/react) and [Vue](/get-started/vue), a [`<free-drawing>` element](/get-started/element) for Angular, Svelte or plain HTML, with the same options and API.
- **Truly open source**: [MIT licence](https://github.com/fabienwnklr/free-drawing/blob/master/LICENCE), no licence key, no watermark, no paid features. Use it in any app, commercial ones included.
- **Rights in live sessions**: participants view the drawing until its owner lets them draw, they ask in one click, and follow the view the owner presents. See [live collaboration](/features#live-collaboration).
- **A real layers panel**: name, hide, lock and reorder every shape, select ranges of them. See [layers](/features#layers-groups-and-frames).
- **Share without a server**: a link holds the whole drawing, compressed, and files open anywhere. See [files and links](/features#files-links-and-export).
- **Your own features**: tools, commands, shortcuts and menu items with a typed [plugin API](/plugins), a new plugin created by `npm create @fabwcie/free-drawing-plugin`.
- **Your server, or the one included**: Node server with accounts, saved drawings and live collaboration, or your own following the [protocol](/get-started/#collaboration).

## Quick start

The library works in any page, without framework. React and Vue apps can use its component, other apps (Angular, Svelte, plain HTML...) its `<free-drawing>` element: they create the drawer when they are mounted and destroy it when they are unmounted. Install it with [Konva](https://konvajs.org/), its only peer dependency (also with yarn or pnpm):

::: code-group

```bash [Vanilla]
npm install @fabwcie/free-drawing konva
```

```bash [React]
npm install @fabwcie/free-drawing-react @fabwcie/free-drawing konva
```

```bash [Vue]
npm install @fabwcie/free-drawing-vue @fabwcie/free-drawing konva
```

```bash [Web Component]
npm install @fabwcie/free-drawing-element @fabwcie/free-drawing konva
```

:::

Then give it an element of your page, render its component, or add its element:

::: code-group

```js [Vanilla]
import { Drawer } from '@fabwcie/free-drawing';
import '@fabwcie/free-drawing/style.css';

const drawer = new Drawer(document.getElementById('drawer'), {
  // light, dark or the one of the device, language of the browser: the ones chosen by the user in its menu kept
  theme: 'system',
  language: 'auto',
});

// drawing changed: keep it anywhere as JSON
drawer.on('change', () => console.log(drawer.getDrawingFile()));
```

```tsx [React]
import { FreeDrawing } from '@fabwcie/free-drawing-react';
import '@fabwcie/free-drawing/style.css';

export function Board() {
  return (
    <FreeDrawing
      style={{ height: 600 }}
      // light, dark or the one of the device, language of the browser: the ones chosen by the user in its menu kept
      options={{ theme: 'system', language: 'auto' }}
      // drawing changed: keep it anywhere as JSON
      onChange={(drawer) => console.log(drawer.getDrawingFile())}
    />
  );
}
```

```vue [Vue]
<script setup lang="ts">
import { FreeDrawing } from '@fabwcie/free-drawing-vue';
import type { Drawer } from '@fabwcie/free-drawing';
import '@fabwcie/free-drawing/style.css';

// drawing changed: keep it anywhere as JSON
const onChange = (drawer: Drawer) => console.log(drawer.getDrawingFile());
</script>

<template>
  <!-- the theme and language chosen by the user in its menu kept -->
  <FreeDrawing style="height: 600px" :options="{ theme: 'system', language: 'auto' }" @change="onChange" />
</template>
```

```html [Web Component]
<script type="module">
  import '@fabwcie/free-drawing-element';
  import '@fabwcie/free-drawing/style.css';

  const board = document.querySelector('free-drawing');

  // drawing changed: keep it anywhere as JSON
  board.addEventListener('drawerchange', (event) => console.log(event.detail.getDrawingFile()));
</script>

<!-- the theme and language chosen by the user in its menu kept -->
<free-drawing options='{ "theme": "system", "language": "auto" }' style="height: 600px"></free-drawing>
```

:::

The [guide](/get-started/) describes every option, the [React](/get-started/react), [Vue](/get-started/vue) and [Web Component](/get-started/element) pages the props of the components and the attributes of the element, the [features](/features) page shows what the drawer can do, the [plugins](/plugins) guide shows how to add your own features and the [API](/api/) documents each class and method.

## Open source

free-drawing is released under the [MIT License](https://github.com/fabienwnklr/free-drawing/blob/master/LICENCE). Issues and contributions are welcome on [GitHub](https://github.com/fabienwnklr/free-drawing), see [how to contribute](/get-started/contribute).
