# @fabwcie/free-drawing-element

Web component `<free-drawing>` of [free-drawing](https://github.com/fabienwnklr/free-drawing), an infinite canvas drawing board: freehand, shapes, texts, frames, layers, export, live collaboration... One element in any page, or in an app of any framework (Angular, Svelte, Solid, Lit, plain JavaScript...). The drawer is created when the element is added to the page and destroyed when it leaves it.

React and Vue apps can also use their own components: [`@fabwcie/free-drawing-react`](https://free-drawing-docs.netlify.app/get-started/react) and [`@fabwcie/free-drawing-vue`](https://free-drawing-docs.netlify.app/get-started/vue).

## Install

```sh
npm install @fabwcie/free-drawing-element @fabwcie/free-drawing konva
```

`konva` is a peer dependency of the library ([why](https://free-drawing-docs.netlify.app/get-started/#why-is-konva-a-peer-dependency)). Importing the package defines `<free-drawing>`: import it once, before the element is used.

## Use

With a bundler (Vite, webpack, the build of a framework):

```js
import '@fabwcie/free-drawing-element';
import '@fabwcie/free-drawing/style.css';
```

```html
<free-drawing theme="system" language="auto" style="height: 600px"></free-drawing>

<script type="module">
  const board = document.querySelector('free-drawing');

  // options read when the drawer is created
  board.options = { localStorageKey: 'my-board' };
  // drawing changed: keep it anywhere as JSON
  board.addEventListener('drawerchange', (event) => console.log(event.detail.getDrawingFile()));
</script>
```

### Without bundler

A plain HTML page loads the library from a CDN with an [import map](https://developer.mozilla.org/docs/Web/HTML/Element/script/type/importmap) ([esm.sh](https://esm.sh/) resolves Konva and the other modules of the library), then the element:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fabwcie/free-drawing@7/dist/style.css" />
<script type="importmap">
  { "imports": { "@fabwcie/free-drawing": "https://esm.sh/@fabwcie/free-drawing@7" } }
</script>
<script type="module" src="https://cdn.jsdelivr.net/npm/@fabwcie/free-drawing-element@1/dist/index.js"></script>

<free-drawing theme="dark" options='{ "localStorageKey": "my-board" }' style="height: 600px"></free-drawing>
```

The `options` attribute gives the options as JSON, so a page needs no script of its own.

### Angular

Custom elements need `CUSTOM_ELEMENTS_SCHEMA`. Add the style sheet to the `styles` of `angular.json` (`"node_modules/@fabwcie/free-drawing/dist/style.css"`):

```ts
import { Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import type { Drawer, DrawerOptions } from '@fabwcie/free-drawing';
import '@fabwcie/free-drawing-element';

@Component({
  selector: 'app-board',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <free-drawing
      [options]="options"
      [theme]="dark() ? 'dark' : 'light'"
      [readOnly]="readOnly()"
      (drawerchange)="onChange($event)"
      style="height: 600px"
    ></free-drawing>
  `,
})
export class BoardComponent {
  dark = input(false);
  readOnly = input(false);
  options: Partial<DrawerOptions> = { localStorageKey: 'my-board' };

  onChange(event: Event) {
    const drawer = (event as CustomEvent<Drawer>).detail;

    console.log(drawer.getDrawingFile());
  }
}
```

### Svelte

```svelte
<script lang="ts">
  import '@fabwcie/free-drawing-element';
  import '@fabwcie/free-drawing/style.css';
  import type { Drawer, DrawerOptions } from '@fabwcie/free-drawing';

  let { dark = false } = $props();
  const options: Partial<DrawerOptions> = { localStorageKey: 'my-board' };
  const onchange = (event: CustomEvent<Drawer>) => console.log(event.detail.getDrawingFile());
</script>

<free-drawing {options} theme={dark ? 'dark' : 'light'} ondrawerchange={onchange} style="height: 600px"></free-drawing>
```

Svelte sets `options` and `user` as properties (objects), as the element is defined when the package is imported. With Svelte 4, listen with `on:drawerchange`.

## Attributes and properties

| Attribute   | Property   | Type                                     | Description                                                                                                                                                                                               |
| ----------- | ---------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options`   | `options`  | `Partial<DrawerOptions>`                 | [Options of the drawer](https://free-drawing-docs.netlify.app/get-started/#available-options), read when it is created (attribute: JSON, used without property): create another element for other options |
| `read-only` | `readOnly` | `boolean`                                | Drawing can't be modified by the user (`drawer.setReadOnly`); `read-only="false"` or a removed attribute let the user draw again                                                                          |
| `theme`     | `theme`    | `'light' \| 'dark' \| 'system'`          | Theme (`drawer.setTheme`), wins over the theme saved in the browser                                                                                                                                       |
| `language`  | `language` | `'en' \| 'fr' \| 'es' \| 'de' \| 'auto'` | Language of the interface (`drawer.setLanguage`), `'auto'` for the one of the browser                                                                                                                     |
|             | `user`     | `DrawerUser \| null`                     | User of the app: id and name in collaboration sessions (`drawer.setUser`), given again only when it changes                                                                                               |
|             | `drawer`   | `Drawer \| null`                         | Drawer of the element (read only), `null` until it is created and once the element left the page                                                                                                          |

`read-only`, `theme`, `language` and `user` are followed once the drawer is created; when they are not given, the drawer keeps its own settings (its options, menus of its interface, preferences saved in the browser). Properties set by a framework before the element is defined are kept.

## Events

| Event          | `detail` | Description                                                               |
| -------------- | -------- | ------------------------------------------------------------------------- |
| `drawerready`  | `Drawer` | Drawer ready: plugins initialized, drawing of the `storage` option loaded |
| `drawerchange` | `Drawer` | Drawing changed: shapes, background...                                    |

They do not bubble. They are not named `ready` and `change`: the `change` events of the fields of the drawer (dialogs, panels) bubble to the element.

## Size

The element is a block (`display: block`, `[hidden]` still hides it) whose drawer takes its size and follows it: give it a size (`style`, a class, flex or grid item). An element without height gives the drawer the height of the window. The `width` and `height` options give a fixed size instead. The style of the element has no specificity: any style of the app wins.

## Drawer

The `drawer` property gives the drawer once created: every method of the [API](https://free-drawing-docs.netlify.app/get-started/) is available, e.g. `board.drawer?.exportImage('png')`. Listen to other events once it is ready:

```js
import { drawerEvents } from '@fabwcie/free-drawing';

board.addEventListener('drawerready', ({ detail: drawer }) => {
  drawer.on(drawerEvents.selectionChange, (shapes) => console.log(shapes));
});
```

Listeners are removed when the drawer is destroyed: when the element leaves the page. An element moved in the page (removed and added again at once) keeps its drawer.

## Other names

`defineFreeDrawing(name)` defines the element under another name, e.g. to avoid a clash with an element of the app:

```js
import { defineFreeDrawing } from '@fabwcie/free-drawing-element';

defineFreeDrawing('my-board'); // <my-board>
```

`FreeDrawingElement` is the class of the element. In TypeScript, `document.querySelector('free-drawing')` is a `FreeDrawingElement` and the events are typed.

## Server rendering

The library is loaded when the element is added to the page, never on a server: importing the package there defines nothing (Angular SSR, SvelteKit, Astro...), the element is rendered empty and the browser creates its drawer.

## Changelog

[CHANGELOG.md](https://github.com/fabienwnklr/free-drawing/blob/master/packages/element/CHANGELOG.md)
