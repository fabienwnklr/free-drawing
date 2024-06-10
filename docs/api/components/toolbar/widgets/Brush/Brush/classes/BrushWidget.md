**@fabwcie/free-drawing** • [API](../../../../../../README.md)

***

[@fabwcie/free-drawing](../../../../../../README.md) / [components/toolbar/widgets/Brush/Brush](../README.md) / BrushWidget

# Class: BrushWidget

## Extends

- [`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md)

## Constructors

### new BrushWidget(drawer)

> **new BrushWidget**(`drawer`): [`BrushWidget`](BrushWidget.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../../../Drawer/classes/Drawer.md)

#### Returns

[`BrushWidget`](BrushWidget.md)

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`constructor`](../../../BaseWidget/classes/BaseWidget.md#constructors)

#### Source

[components/toolbar/widgets/Brush/Brush.ts:22](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Brush/Brush.ts#L22)

## Properties

### $button

> **$button**: `HTMLButtonElement`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`$button`](../../../BaseWidget/classes/BaseWidget.md#$button)

#### Source

[components/toolbar/widgets/BaseWidget.ts:9](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L9)

***

### $container

> **`protected`** **`readonly`** **$container**: `HTMLElement`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`$container`](../../../BaseWidget/classes/BaseWidget.md#$container)

#### Source

[components/toolbar/widgets/BaseWidget.ts:6](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L6)

***

### drawer

> **`protected`** **drawer**: [`Drawer`](../../../../../../Drawer/classes/Drawer.md)

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`drawer`](../../../BaseWidget/classes/BaseWidget.md#drawer)

#### Source

[components/toolbar/widgets/Brush/Brush.ts:22](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Brush/Brush.ts#L22)

***

### id

> **id**: `"pan"` \| `"selection"` \| `"brush"` \| `"eraser"` \| `"undo"` \| `"redo"` \| `"text"` \| `"rect"` \| `"circle"` \| `"ellipse"` \| `"square"` \| `"arrow"` \| `"line"` \| `"star"` \| `"triangle"` \| `"polygon"`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`id`](../../../BaseWidget/classes/BaseWidget.md#id)

#### Source

[components/toolbar/widgets/BaseWidget.ts:10](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L10)

***

### isPaint

> **isPaint**: `boolean` = `false`

#### Source

[components/toolbar/widgets/Brush/Brush.ts:18](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Brush/Brush.ts#L18)

***

### overlay

> **overlay**: [`BrushOverlay`](../../../../../tools/Overlay/BrushOverlay/BrushOverlay/classes/BrushOverlay.md)

#### Source

[components/toolbar/widgets/Brush/Brush.ts:20](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Brush/Brush.ts#L20)

***

### shortcut

> **shortcut**: `undefined` \| `string`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`shortcut`](../../../BaseWidget/classes/BaseWidget.md#shortcut)

#### Source

[components/toolbar/widgets/BaseWidget.ts:11](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L11)

## Methods

### \_socketDraw()

> **\_socketDraw**(`data`): `void`

Get the drawing data from the socket and basically
draw on our canvas whatever the other person draws

#### Parameters

• **data**: `string`

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`_socketDraw`](../../../BaseWidget/classes/BaseWidget.md#_socketdraw)

#### Source

[components/toolbar/widgets/Brush/Brush.ts:129](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Brush/Brush.ts#L129)

***

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

[components/toolbar/widgets/BaseWidget.ts:43](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L43)

***

### getSvgPathFromStroke()

> **getSvgPathFromStroke**(`points`): `string`

#### Parameters

• **points**: `number`[][]

#### Returns

`string`

#### Source

[components/toolbar/widgets/Brush/Brush.ts:136](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Brush/Brush.ts#L136)

***

### initEvents()

> **`protected`** **initEvents**(): `void`

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`initEvents`](../../../BaseWidget/classes/BaseWidget.md#initevents)

#### Source

[components/toolbar/widgets/Brush/Brush.ts:41](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Brush/Brush.ts#L41)

***

### med()

> **med**(`A`, `B`): `number`[]

#### Parameters

• **A**: `number`[]

• **B**: `number`[]

#### Returns

`number`[]

#### Source

[components/toolbar/widgets/Brush/Brush.ts:160](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Brush/Brush.ts#L160)

***

### onActive()

> **`protected`** **onActive**(): `void`

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`onActive`](../../../BaseWidget/classes/BaseWidget.md#onactive)

#### Source

[components/toolbar/widgets/Brush/Brush.ts:30](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Brush/Brush.ts#L30)

***

### onDesactive()

> **`protected`** **onDesactive**(): `void`

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`onDesactive`](../../../BaseWidget/classes/BaseWidget.md#ondesactive)

#### Source

[components/toolbar/widgets/Brush/Brush.ts:36](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Brush/Brush.ts#L36)

***

### removeEvents()

> **`protected`** **removeEvents**(): `void`

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`removeEvents`](../../../BaseWidget/classes/BaseWidget.md#removeevents)

#### Source

[components/toolbar/widgets/Brush/Brush.ts:118](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Brush/Brush.ts#L118)

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

[components/toolbar/widgets/BaseWidget.ts:81](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L81)

***

### toggleDisable()

> **toggleDisable**(): `void`

#### Returns

`void`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`toggleDisable`](../../../BaseWidget/classes/BaseWidget.md#toggledisable)

#### Source

[components/toolbar/widgets/BaseWidget.ts:56](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L56)

***

### updateCursor()

> **updateCursor**(): `void`

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`updateCursor`](../../../BaseWidget/classes/BaseWidget.md#updatecursor)

#### Source

[components/toolbar/widgets/Brush/Brush.ts:164](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Brush/Brush.ts#L164)
