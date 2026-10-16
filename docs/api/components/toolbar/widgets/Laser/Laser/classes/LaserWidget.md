**@fabwcie/free-drawing** • [API](../../../../../../README.md)

***

[@fabwcie/free-drawing](../../../../../../README.md) / [components/toolbar/widgets/Laser/Laser](../README.md) / LaserWidget

# Class: LaserWidget

Laser pointer: trail following pointer while pressed, not saved in drawing, shown to other users of a collaboration
session. Usable in read only (drawing not changed).

## Extends

- [`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md)

## Constructors

### new LaserWidget(drawer)

> **new LaserWidget**(`drawer`): [`LaserWidget`](LaserWidget.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../../../Drawer/classes/Drawer.md)

#### Returns

[`LaserWidget`](LaserWidget.md)

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`constructor`](../../../BaseWidget/classes/BaseWidget.md#constructors)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Laser/Laser.ts:28](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Laser/Laser.ts#L28)

## Properties

### $button

> **$button**: `HTMLButtonElement`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`$button`](../../../BaseWidget/classes/BaseWidget.md#$button)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:21](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L21)

***

### $container

> **`protected`** **`readonly`** **$container**: `HTMLElement`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`$container`](../../../BaseWidget/classes/BaseWidget.md#$container)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:18](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L18)

***

### cursor

> **`protected`** **cursor**: `string` = `crosshairCursor`

Stage cursor while widget is active

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`cursor`](../../../BaseWidget/classes/BaseWidget.md#cursor)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Laser/Laser.ts:25](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Laser/Laser.ts#L25)

***

### drawer

> **`protected`** **drawer**: [`Drawer`](../../../../../../Drawer/classes/Drawer.md)

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`drawer`](../../../BaseWidget/classes/BaseWidget.md#drawer)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:36](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L36)

***

### id

> **id**: `"pan"` \| `"selection"` \| `"brush"` \| `"eraser"` \| `"undo"` \| `"redo"` \| `"text"` \| `"rect"` \| `"circle"` \| `"ellipse"` \| `"square"` \| `"arrow"` \| `"line"` \| `"star"` \| `"triangle"` \| `"polygon"` \| `"diamond"` \| `"heart"` \| `"cloud"` \| `"highlighter"` \| `"laser"` \| `"frame"`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`id`](../../../BaseWidget/classes/BaseWidget.md#id)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:22](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L22)

***

### inAction

> **inAction**: `boolean` = `false`

Pointer action in progress (drawing, erasing, selecting...), see `startAction` / `endAction`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`inAction`](../../../BaseWidget/classes/BaseWidget.md#inaction)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:29](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L29)

***

### options

> **`readonly`** **options**: [`WidgetOptions`](../../../../../../@types/toolbar/type-aliases/WidgetOptions.md)

Widget options given with drawer `widgets` option

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`options`](../../../BaseWidget/classes/BaseWidget.md#options)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:27](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L27)

***

### overlay?

> **`optional`** **overlay**: [`ToolOverlay`](../../../BaseWidget/type-aliases/ToolOverlay.md)

Options of the tool (color, width...), shown while widget is active (see `showOverlayOnActive`)

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`overlay`](../../../BaseWidget/classes/BaseWidget.md#overlay)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:25](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L25)

***

### shortcut

> **shortcut**: `undefined` \| `string`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`shortcut`](../../../BaseWidget/classes/BaseWidget.md#shortcut)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:23](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L23)

***

### showOverlayOnActive

> **`protected`** **showOverlayOnActive**: `boolean` = `true`

Show `overlay` while widget is active (false when overlay depends on something else, e.g. selection)

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`showOverlayOnActive`](../../../BaseWidget/classes/BaseWidget.md#showoverlayonactive)

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

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`addTo`](../../../BaseWidget/classes/BaseWidget.md#addto)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:69](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L69)

***

### afterDraw()

> **`protected`** **afterDraw**(`shapes`): `void`

Shapes drawn with this tool: selection tool activated with them, unless tool is kept (`keepTool` preference)

#### Parameters

• **shapes**: [`DrawingShape`](../../../../../../@types/drawer/type-aliases/DrawingShape.md)[]

#### Returns

`void`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`afterDraw`](../../../BaseWidget/classes/BaseWidget.md#afterdraw)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:189](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L189)

***

### clearSelection()

> **clearSelection**(): `void`

Unselect shapes, with selection widget (implemented by it)

#### Returns

`void`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`clearSelection`](../../../BaseWidget/classes/BaseWidget.md#clearselection)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:181](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L181)

***

### endAction()

> **`protected`** **endAction**(): `void`

Pointer action ends (pointer up)

#### Returns

`void`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`endAction`](../../../BaseWidget/classes/BaseWidget.md#endaction)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:165](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L165)

***

### initEvents()

> **`protected`** **initEvents**(): `void`

Add widget events (with `onStage`), called on activation

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`initEvents`](../../../BaseWidget/classes/BaseWidget.md#initevents)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Laser/Laser.ts:32](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Laser/Laser.ts#L32)

***

### onActive()

> **`protected`** **onActive**(): `void`

Called on activation, after events, cursor and overlay setup

#### Returns

`void`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`onActive`](../../../BaseWidget/classes/BaseWidget.md#onactive)

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

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`onConstrainChange`](../../../BaseWidget/classes/BaseWidget.md#onconstrainchange)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:148](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L148)

***

### onDesactive()

> **`protected`** **onDesactive**(): `void`

Called on deactivation, after events removal and overlay hidden

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`onDesactive`](../../../BaseWidget/classes/BaseWidget.md#ondesactive)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Laser/Laser.ts:63](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Laser/Laser.ts#L63)

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

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`onStage`](../../../BaseWidget/classes/BaseWidget.md#onstage)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:113](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L113)

***

### removeEvents()

> **`protected`** **removeEvents**(): `void`

Remove widget events, called on deactivation

#### Returns

`void`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`removeEvents`](../../../BaseWidget/classes/BaseWidget.md#removeevents)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:130](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L130)

***

### setActive()

> **setActive**(`active`): `void`

#### Parameters

• **active**: `boolean`

#### Returns

`void`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`setActive`](../../../BaseWidget/classes/BaseWidget.md#setactive)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:213](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L213)

***

### setDisabled()

> **setDisabled**(`disabled`): `void`

#### Parameters

• **disabled**: `boolean`

#### Returns

`void`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`setDisabled`](../../../BaseWidget/classes/BaseWidget.md#setdisabled)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:91](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L91)

***

### shareLive()

> **`protected`** **shareLive**(...`shapes`): `void`

Shapes being drawn shown to collaborators while drawing (final state is sent on change)

#### Parameters

• ...**shapes**: [`DrawingShape`](../../../../../../@types/drawer/type-aliases/DrawingShape.md)[]

#### Returns

`void`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`shareLive`](../../../BaseWidget/classes/BaseWidget.md#sharelive)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:174](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L174)

***

### startAction()

> **`protected`** **startAction**(): `void`

Pointer action starts (pointer down): shortcuts are disabled and UI (toolbar, overlays...) ignores pointer

#### Returns

`void`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`startAction`](../../../BaseWidget/classes/BaseWidget.md#startaction)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:157](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L157)

***

### toggleDisable()

> **toggleDisable**(): `void`

Disable / enable widget, a disabled widget can not be activated

#### Returns

`void`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`toggleDisable`](../../../BaseWidget/classes/BaseWidget.md#toggledisable)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:87](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L87)

***

### updateCursor()

> **updateCursor**(): `void`

#### Returns

`void`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`updateCursor`](../../../BaseWidget/classes/BaseWidget.md#updatecursor)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:150](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L150)
