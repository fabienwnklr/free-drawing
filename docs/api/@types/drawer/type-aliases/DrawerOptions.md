**@fabwcie/free-drawing** • [API](../../../README.md)

***

[@fabwcie/free-drawing](../../../README.md) / [@types/drawer](../README.md) / DrawerOptions

# Type alias: DrawerOptions

> **DrawerOptions**: `object`

## Type declaration

### autoSave

> **autoSave**: `boolean`

### collaboration

> **collaboration**: `boolean` \| `string` \| [`CollaborationOptions`](CollaborationOptions.md)

Real time collaboration with socket.io server: false (default), true (same origin), server url or options

### commandPalette

> **commandPalette**: `boolean`

Command palette in menu and with Ctrl / Cmd + K: search and run tools and commands (default true)

### edges

> **edges**: [`Edges`](Edges.md)

Corners of rectangles: 'sharp' (default), 'round' (radius following rectangle size) or radius (px)

### fillColor

> **fillColor**: [`ColorLike`](ColorLike.md)

Background color of new rectangles and ellipses, `'transparent'` for none (default)

### height

> **height**: `number`

### id

> **id**: `string`

### keepTool

> **keepTool**: `boolean`

Drawing tool kept after drawing a shape, else selection tool activated with the drawn shape (user preference)

### language

> **language**: [`Language`](../../../i18n/I18n/type-aliases/Language.md) \| `"auto"`

Language of interface: 'auto' (browser one, default), 'en', 'fr', 'es' or 'de', the one chosen in menu is saved

### layersPanel

> **layersPanel**: `boolean`

Layers panel listing shapes (select, rename, reorder, lock, hide, delete), button in header (default true)

### localStorageKey

> **localStorageKey**: `string`

### opacity

> **opacity**: `number`

### positionWidget

> **positionWidget**: `boolean`

Show view position (x / y) with a button back to origin, not to get lost when moving (default true)

### readOnly

> **readOnly**: `boolean`

Drawing can't be modified by user (only pan, zoom, view options, export), API methods still modify it (default false)

### scaling

> **scaling**: `number`

### selectionMenu

> **selectionMenu**: `boolean`

Show a menu next to selected shapes: duplicate, rotate, bring forward, send backward, lock, delete (default true)

### storage

> **storage**: [`DrawerStorage`](DrawerStorage.md) \| `null`

Storage of drawing instead of localStorage (e.g. server of the app), see `DrawerStorage`

### strokeColor

> **strokeColor**: [`ColorLike`](ColorLike.md)

### ~~strokeDash?~~

> **`optional`** **strokeDash**: `number`[]

#### Deprecated

use `strokeStyle` (a dash array gives 'dashed')

### strokeStyle

> **strokeStyle**: [`StrokeStyle`](StrokeStyle.md)

Stroke style of lines, arrows, rectangles and ellipses (default 'solid'), dashes and dots follow stroke width

### strokeWidth

> **strokeWidth**: `number`

### textStyle

> **textStyle**: [`TextStyle`](TextStyle.md)

### theme

> **theme**: [`Theme`](Theme.md)

Theme: 'light' (default), 'dark' or 'system' (device one), the one chosen in menu is saved and used instead

### tool

> **tool**: [`AvailableTools`](../../toolbar/type-aliases/AvailableTools.md)

### translations

> **translations**: [`CustomTranslations`](../../../i18n/I18n/type-aliases/CustomTranslations.md)

Texts replacing default ones, by language (e.g. `{ fr: { 'menu.open': 'Ouvrir un dessin' } }`)

### user

> **user**: [`DrawerUser`](DrawerUser.md) \| `null`

User of the app (e.g. logged in): id and name used in collaboration sessions instead of ones kept in browser

### widgetGroups

> **widgetGroups**: [`WidgetGroupOptions`](../../toolbar/type-aliases/WidgetGroupOptions.md)[]

Groups of toolbar widgets, e.g. `[{ widgets: ['line', 'square', 'circle', 'arrow'], title: 'Shapes' }]`

### widgets

> **widgets**: [`WidgetsOptions`](../../toolbar/type-aliases/WidgetsOptions.md)

Widgets of toolbar: list (e.g. `['brush', 'eraser']`) or object with widget options (e.g. `{ brush: {} }`)

### width

> **width**: `number`

### zoom

> **zoom**: `boolean`

### zoomWidget

> **zoomWidget**: `boolean`

## Source

[packages/free-drawing/src/@types/drawer.ts:12](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/@types/drawer.ts#L12)
