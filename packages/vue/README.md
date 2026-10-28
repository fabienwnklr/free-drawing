# @fabwcie/free-drawing-vue

Vue component of [free-drawing](https://github.com/fabienwnklr/free-drawing), an infinite canvas drawing board: freehand, shapes, texts, frames, layers, export, live collaboration... The drawer is created when the component is mounted and destroyed when it is unmounted.

## Install

```sh
npm install @fabwcie/free-drawing-vue @fabwcie/free-drawing konva
```

Vue 3.3 or later. `konva` is a peer dependency of the library ([why](https://free-drawing-docs.netlify.app/get-started/#why-is-konva-a-peer-dependency)).

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { FreeDrawing } from '@fabwcie/free-drawing-vue';
import type { Drawer } from '@fabwcie/free-drawing';
import '@fabwcie/free-drawing/style.css';

const props = defineProps<{ dark: boolean }>();
const board = ref<InstanceType<typeof FreeDrawing>>();

function onChange(drawer: Drawer) {
  console.log(drawer.getDrawingFile());
}
</script>

<template>
  <FreeDrawing
    ref="board"
    style="height: 600px"
    :options="{ localStorageKey: 'my-board' }"
    :theme="props.dark ? 'dark' : 'light'"
    @change="onChange"
  />
</template>
```

## Props and events

| Prop        | Type                                     | Description                                                                                                                                                                      |
| ----------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options`   | `Partial<DrawerOptions>`                 | [Options of the drawer](https://free-drawing-docs.netlify.app/get-started/#available-options), read when it is created: give another `key` to create it again with other options |
| `read-only` | `boolean`                                | Drawing can't be modified by the user (`drawer.setReadOnly`)                                                                                                                     |
| `theme`     | `'light' \| 'dark' \| 'system'`          | Theme (`drawer.setTheme`), wins over the theme saved in the browser                                                                                                              |
| `language`  | `'en' \| 'fr' \| 'es' \| 'de' \| 'auto'` | Language of the interface (`drawer.setLanguage`), `'auto'` for the one of the browser                                                                                            |
| `user`      | `DrawerUser \| null`                     | User of the app: id and name in collaboration sessions (`drawer.setUser`)                                                                                                        |

| Event    | Payload  | Description                                                               |
| -------- | -------- | ------------------------------------------------------------------------- |
| `ready`  | `Drawer` | Drawer ready: plugins initialized, drawing of the `storage` option loaded |
| `change` | `Drawer` | Drawing changed: shapes, background...                                    |

`class`, `style` and other attributes go to the `div` of the component. `read-only`, `theme`, `language` and `user` follow their props once the drawer is created; when they are not given, the drawer keeps its own settings (menus of its interface, preferences saved in the browser).

## Size

The drawer takes the size of the element and follows it: give it a size (`style`, `class`, flex or grid item). An element without height gives the drawer the height of the window. The `width` and `height` options give a fixed size instead.

## Drawer

A template ref gives the drawer (`board.value?.drawer`, `null` until it is created): every method of the [API](https://free-drawing-docs.netlify.app/get-started/) is available, e.g. `board.value?.drawer?.exportImage('png')`. Listen to other events on `ready`:

```ts
import { drawerEvents, type Drawer } from '@fabwcie/free-drawing';

function onReady(drawer: Drawer) {
  drawer.on(drawerEvents.selectionChange, (shapes) => console.log(shapes));
}
```

Listeners are removed when the drawer is destroyed.

## Server rendering

The library is loaded when the component is mounted, never on a server: the component renders an empty `div` there (Nuxt...).

## Changelog

[CHANGELOG.md](https://github.com/fabienwnklr/free-drawing/blob/master/packages/vue/CHANGELOG.md)
