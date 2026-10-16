**@fabwcie/free-drawing** • [API](../../../README.md)

***

[@fabwcie/free-drawing](../../../README.md) / [@types/drawer](../README.md) / Preferences

# Type alias: Preferences

> **Preferences**: `object`

Interface settings of user, saved in browser (`<localStorageKey>-preferences`),
see `getPreferences` / `setPreferences` and `drawer.preferences.change` event

## Type declaration

### autoSave

> **autoSave**: `boolean`

Drawing saved on each change, else with `saveNow` (menu, command palette)

### grid

> **grid**: `boolean`

Grid shown (grid and snapping to objects exclude each other)

### keepTool

> **keepTool**: `boolean`

Drawing tool kept after drawing a shape, else selection tool activated with the drawn shape

### language

> **language**: [`Language`](../../../i18n/I18n/type-aliases/Language.md) \| `"auto"`

Language chosen, 'auto' for browser one

### snapping

> **snapping**: `boolean`

Snapping to objects

### theme

> **theme**: [`Theme`](Theme.md)

### zen

> **zen**: `boolean`

Zen mode: interface hidden except toolbar and menu

## Source

[packages/free-drawing/src/@types/drawer.ts:97](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/@types/drawer.ts#L97)
