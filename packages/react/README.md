# @fabwcie/free-drawing-react

React component of [free-drawing](https://github.com/fabienwnklr/free-drawing), an infinite canvas drawing board: freehand, shapes, texts, frames, layers, export, live collaboration... The drawer is created when the component is mounted and destroyed when it is unmounted.

## Install

```sh
npm install @fabwcie/free-drawing-react @fabwcie/free-drawing konva
```

React 18 or later. `konva` is a peer dependency of the library.

## Use

```tsx
import { useRef } from 'react';
import { FreeDrawing } from '@fabwcie/free-drawing-react';
import type { Drawer } from '@fabwcie/free-drawing';
import '@fabwcie/free-drawing/style.css';

export function Board({ dark }: { dark: boolean }) {
  const drawer = useRef<Drawer>(null);

  return (
    <FreeDrawing
      ref={drawer}
      style={{ height: 600 }}
      options={{ localStorageKey: 'my-board' }}
      theme={dark ? 'dark' : 'light'}
      onChange={(drawer) => console.log(drawer.getDrawingFile())}
    />
  );
}
```

## Props

| Prop       | Type                                     | Description                                                                                                                                                                      |
| ---------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options`  | `Partial<DrawerOptions>`                 | [Options of the drawer](https://free-drawing-docs.netlify.app/get-started/#available-options), read when it is created: give another `key` to create it again with other options |
| `readOnly` | `boolean`                                | Drawing can't be modified by the user (`drawer.setReadOnly`)                                                                                                                     |
| `theme`    | `'light' \| 'dark' \| 'system'`          | Theme (`drawer.setTheme`), wins over the theme saved in the browser                                                                                                              |
| `language` | `'en' \| 'fr' \| 'es' \| 'de' \| 'auto'` | Language of the interface (`drawer.setLanguage`), `'auto'` for the one of the browser                                                                                            |
| `user`     | `DrawerUser \| null`                     | User of the app: id and name in collaboration sessions (`drawer.setUser`)                                                                                                        |
| `onReady`  | `(drawer: Drawer) => void`               | Drawer ready: plugins initialized, drawing of the `storage` option loaded                                                                                                        |
| `onChange` | `(drawer: Drawer) => void`               | Drawing changed: shapes, background...                                                                                                                                           |

Other props (`className`, `style`, `id`, `aria-*`...) go to the `div` of the component. `readOnly`, `theme`, `language` and `user` follow their props once the drawer is created; when they are not given, the drawer keeps its own settings (menus of its interface, preferences saved in the browser).

## Size

The drawer takes the size of the element and follows it: give it a size (`style`, `className`, flex or grid item). An element without height gives the drawer the height of the window. The `width` and `height` options give a fixed size instead.

## Drawer

The ref gives the drawer (`Drawer`, `null` until it is created): every method of the [API](https://free-drawing-docs.netlify.app/get-started/) is available, e.g. `drawer.current?.exportImage('png')`. Listen to other events in `onReady`:

```tsx
import { drawerEvents, type Drawer } from '@fabwcie/free-drawing';

const onReady = (drawer: Drawer) => {
  drawer.on(drawerEvents.selectionChange, (shapes) => console.log(shapes));
};
```

Listeners are removed when the drawer is destroyed.

## Server rendering

The library is loaded when the component is mounted, never on a server: the component renders an empty `div` there (Next.js, Remix...). It is a client component (`'use client'`).

## Changelog

[CHANGELOG.md](https://github.com/fabienwnklr/free-drawing/blob/master/packages/react/CHANGELOG.md)
