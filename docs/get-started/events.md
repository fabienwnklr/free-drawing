# Events

Use internal event

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
