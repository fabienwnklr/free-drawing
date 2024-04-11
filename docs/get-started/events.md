# Events

For manage event, we use `MicroEvent` plugin, check code [here](https://github.com/fabienwnklr/free-drawing/blob/master/src/utils/MicroEvent.ts)

## Use internal event

Example:

```ts
const DRAWER = new Drawer($element, {
   // save to localStorage on every change, default is true
  autoSave: false,
});

DRAWER.on('change', (drawer) => {
  // save to localstorage
  drawer.save();
});
```

| Event  | Event.detail | Description                       |
| ------ | ------------ | --------------------------------- |
| change | drawer       | Invoked on every change in drawer |

## Use our own events

Example:

```ts
const DRAWER = new Drawer($element);

DRAWER.on('customEvent', (drawer) => {
  // simple log
  console.log("My custom event!");
});

DRAWER.trigger('customEvent');

// "My custom event!" appear in console

```
