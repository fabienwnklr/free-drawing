# free-drawing

Inspired from [drawer](https://github.com/fabienwnklr/drawer/) is totally rewritting and rethinking for better use to more complexe context.
For simply use, i recommend to you to use [drawer](https://github.com/fabienwnklr/drawer/)

Check demo [here](https://free-drawing.fabienwinkler.fr/)

## Dependencies

- [KonvaJS](https://konvajs.org/index.html)
- [perfect-freehand](https://github.com/steveruizok/perfect-freehand)

## Contribute

See [Contribute guide](https://github.com/fabienwnklr/free-drawing/blob/master/CONTRIBUTING.md)

## Install

```bash
yarn add @fabwcie/free-drawing
```

## Use it

```js
import { Drawer } from '@fabwcie/free-drawing';

const $el = document.getElementById('drawer-container');
const drawer = new Drawer($el, {
  /** optional options */
});
```

## Available options

```js
{
  id: 'drawer-' + Date.now(), // id for drawer
  tool: 'brush', // activate tool on init
  width: window.innerWidth, // width of drawer
  height: window.innerHeight, // height of drawer
  strokeWidth: 5, // width for drawing stroke
  strokeColor: '#000', // color for drawing stroke
  zoom: true, // enable/disable zoom on draw
  zoomWidget: true, // enable/disable zoom ui widget
  scaling: 1.11, // scaling on zoom
  autoSave: true, // for save draw state on localStorage automatically
  localStorageKey: 'free-drawing', // localStorage key used for store data
  opacity: 1, // opacity of draw
};
```
