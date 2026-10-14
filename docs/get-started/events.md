# Events

Events use [MicroEvent](https://github.com/fabienwnklr/free-drawing/blob/master/src/utils/MicroEvent.ts) (`on`, `off`, `trigger`), they are named `drawer.<subject>.<action>`.

## Drawer events

Example:

```ts
const DRAWER = new Drawer($element, {
  // save to localStorage on every change, default is true
  autoSave: false,
});

DRAWER.on('drawer.change', (drawer) => {
  // save to localstorage
  drawer.save();
});
```

| Event | Arguments | Description |
| --- | --- | --- |
| `drawer.change` | drawer | Drawing changed (shapes, background, undo / redo, changes of collaborators...) |
| `drawer.options.change` | changed options | Drawing options changed (color, width, style, opacity, text style) |
| `drawer.selection.change` | selected shapes | Selection changed |
| `drawer.readonly.change` | read only state | Read only mode changed |
| `drawer.collaboration.change` | | Collaboration started or stopped, users or rights changed |
| `drawer.theme.change` | dark state | Light or dark theme shown |
| `drawer.language.change` | language | Language of interface changed |

Components trigger `drawer.dropdown.hide` (dropdown menu) and `drawer.toast.hide` (`drawer.toast()` result).

Names of previous versions still work, with a warning in console: `change`, `fd.options.change`, `fd.selection.change`, `fd.readonly.change`, `fd.collaboration.change`, `fd.dropdown.hide`, `fd.toast.hide`.

## Use your own events

Example:

```ts
const DRAWER = new Drawer($element);

DRAWER.on('customEvent', () => {
  // simple log
  console.log('My custom event!');
});

DRAWER.trigger('customEvent');

// "My custom event!" appear in console
```
