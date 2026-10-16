**@fabwcie/free-drawing** • [API](../../../../../README.md)

***

[@fabwcie/free-drawing](../../../../../README.md) / [components/toolbar/widgets/BaseWidget](../README.md) / BaseWidget

# Class: `abstract` BaseWidget

## Extended by

- [`FreehandWidget`](../../FreehandWidget/classes/FreehandWidget.md)
- [`ShapeWidget`](../../ShapeWidget/classes/ShapeWidget.md)
- [`EraserWidget`](../../Eraser/Eraser/classes/EraserWidget.md)
- [`LaserWidget`](../../Laser/Laser/classes/LaserWidget.md)
- [`PanWidget`](../../Pan/Pan/classes/PanWidget.md)
- [`SelectWidget`](../../Select/Select/classes/SelectWidget.md)
- [`TextWidget`](../../Text/Text/classes/TextWidget.md)

## Constructors

### new BaseWidget(drawer, id, title, $icon, shortcut)

> **new BaseWidget**(`drawer`, `id`, `title`, `$icon`, `shortcut`?): [`BaseWidget`](BaseWidget.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../../Drawer/classes/Drawer.md)

• **id**: `"pan"` \| `"selection"` \| `"brush"` \| `"eraser"` \| `"undo"` \| `"redo"` \| `"text"` \| `"rect"` \| `"circle"` \| `"ellipse"` \| `"square"` \| `"arrow"` \| `"line"` \| `"star"` \| `"triangle"` \| `"polygon"` \| `"diamond"` \| `"heart"` \| `"cloud"` \| `"highlighter"` \| `"laser"` \| `"frame"`

• **title**: `string`

• **$icon**: `string` \| `SVGElement`

• **shortcut?**: `string`

#### Returns

[`BaseWidget`](BaseWidget.md)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:35](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L35)

## Properties

### $button

> **$button**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:21](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L21)

***

### $container

> **`protected`** **`readonly`** **$container**: `HTMLElement`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:18](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L18)

***

### cursor

> **`protected`** **cursor**: `string` = `'default'`

Stage cursor while widget is active

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:33](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L33)

***

### drawer

> **`protected`** **drawer**: [`Drawer`](../../../../../Drawer/classes/Drawer.md)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:36](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L36)

***

### id

> **id**: `"pan"` \| `"selection"` \| `"brush"` \| `"eraser"` \| `"undo"` \| `"redo"` \| `"text"` \| `"rect"` \| `"circle"` \| `"ellipse"` \| `"square"` \| `"arrow"` \| `"line"` \| `"star"` \| `"triangle"` \| `"polygon"` \| `"diamond"` \| `"heart"` \| `"cloud"` \| `"highlighter"` \| `"laser"` \| `"frame"`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:22](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L22)

***

### inAction

> **inAction**: `boolean` = `false`

Pointer action in progress (drawing, erasing, selecting...), see `startAction` / `endAction`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:29](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L29)

***

### options

> **`readonly`** **options**: [`WidgetOptions`](../../../../../@types/toolbar/type-aliases/WidgetOptions.md)

Widget options given with drawer `widgets` option

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:27](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L27)

***

### overlay?

> **`optional`** **overlay**: [`ToolOverlay`](../type-aliases/ToolOverlay.md)

Options of the tool (color, width...), shown while widget is active (see `showOverlayOnActive`)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:25](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L25)

***

### shortcut

> **shortcut**: `undefined` \| `string`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:23](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L23)

***

### showOverlayOnActive

> **`protected`** **showOverlayOnActive**: `boolean` = `true`

Show `overlay` while widget is active (false when overlay depends on something else, e.g. selection)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:31](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L31)

## Accessors

### isDisabled

> **`get`** **isDisabled**(): `boolean`

#### Returns

`boolean`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:103](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L103)

## Methods

### addTo()

`Internal`

> **addTo**(`parent`): `void`

Adds this to `parent`.
Returns the element that was just added to `parent`.

#### Parameters

• **parent**: `HTMLElement`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:69](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L69)

***

### afterDraw()

> **`protected`** **afterDraw**(`shapes`): `void`

Shapes drawn with this tool: selection tool activated with them, unless tool is kept (`keepTool` preference)

#### Parameters

• **shapes**: [`DrawingShape`](../../../../../@types/drawer/type-aliases/DrawingShape.md)[]

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:189](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L189)

***

### clearSelection()

> **clearSelection**(): `void`

Unselect shapes, with selection widget (implemented by it)

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:181](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L181)

***

### endAction()

> **`protected`** **endAction**(): `void`

Pointer action ends (pointer up)

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:165](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L165)

***

### initEvents()

> **`protected`** **initEvents**(): `void`

Add widget events (with `onStage`), called on activation

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:125](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L125)

***

### onActive()

> **`protected`** **onActive**(): `void`

Called on activation, after events, cursor and overlay setup

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:137](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L137)

***

### onConstrainChange()?

> **`protected`** **`optional`** **onConstrainChange**(`constrain`): `void`

Shift pressed or released during a pointer action (square, circle, straight line...), without pointer move

#### Parameters

• **constrain**: `boolean`

Shift pressed

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:148](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L148)

***

### onDesactive()

> **`protected`** **onDesactive**(): `void`

Called on deactivation, after events removal and overlay hidden

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:142](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L142)

***

### onStage()

> **`protected`** **onStage**(`events`, `handler`): `void`

Listen stage events while widget is active.
Events are namespaced with widget id, so they are removed on deactivation without removing other listeners.

#### Parameters

• **events**: `string`

Space separated event names

• **handler**: `KonvaEventListener`\<`Stage`, `any`\>

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:113](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L113)

***

### removeEvents()

> **`protected`** **removeEvents**(): `void`

Remove widget events, called on deactivation

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:130](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L130)

***

### setActive()

> **setActive**(`active`): `void`

#### Parameters

• **active**: `boolean`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:213](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L213)

***

### setDisabled()

> **setDisabled**(`disabled`): `void`

#### Parameters

• **disabled**: `boolean`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:91](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L91)

***

### shareLive()

> **`protected`** **shareLive**(...`shapes`): `void`

Shapes being drawn shown to collaborators while drawing (final state is sent on change)

#### Parameters

• ...**shapes**: [`DrawingShape`](../../../../../@types/drawer/type-aliases/DrawingShape.md)[]

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:174](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L174)

***

### startAction()

> **`protected`** **startAction**(): `void`

Pointer action starts (pointer down): shortcuts are disabled and UI (toolbar, overlays...) ignores pointer

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:157](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L157)

***

### toggleDisable()

> **toggleDisable**(): `void`

Disable / enable widget, a disabled widget can not be activated

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:87](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L87)

***

### updateCursor()

> **updateCursor**(): `void`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:150](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L150)
