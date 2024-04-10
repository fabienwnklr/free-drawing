# Constants

## defaultOptions

**default value for [DrawerOptions](../api/@types/drawer/type-aliases/DrawerOptions.html)**

```js
export const defaultOptions = {
  id: 'drawer-' + Date.now(),
  tool: 'brush',
  width: window.innerWidth,
  height: window.innerHeight,
  strokeWidth: 5,
  strokeColor: '#000',
  zoom: true,
  zoomWidget: true,
  scaling: 1.11,
  autoSave: true,
  localStorageKey: 'free-drawing',
  opacity: 1,
};
```

## shapeName

```js
export const shapeName = {
  line: 'drawer-line',
  text: 'drawer-text',
  selection: 'drawer-selection',
  guideLine: 'drawer-guide-line',
  gridLine: 'drawer-grid-line',
  background: 'drawer-background',
};
```

Used for filter shape by name, example:

```ts
// Destroy guideline
drawer.selectionLayer.find('.' + shapeName.guideLine).forEach((l) => l.destroy());
```
