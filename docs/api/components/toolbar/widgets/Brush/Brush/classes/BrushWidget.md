**free-drawing** • [API](../../../../../../README.md)

***

[free-drawing](../../../../../../README.md) / [components/toolbar/widgets/Brush/Brush](../README.md) / BrushWidget

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

[components/toolbar/widgets/Brush/Brush.ts:17](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Brush/Brush.ts#L17)

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

[components/toolbar/widgets/Brush/Brush.ts:17](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Brush/Brush.ts#L17)

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

[components/toolbar/widgets/Brush/Brush.ts:13](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Brush/Brush.ts#L13)

***

### overlay

> **overlay**: [`BrushOverlay`](../../../../../tools/Overlay/BrushOverlay/BrushOverlay/classes/BrushOverlay.md)

#### Source

[components/toolbar/widgets/Brush/Brush.ts:15](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Brush/Brush.ts#L15)

***

### shortcut

> **shortcut**: `undefined` \| `string`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`shortcut`](../../../BaseWidget/classes/BaseWidget.md#shortcut)

#### Source

[components/toolbar/widgets/BaseWidget.ts:11](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L11)

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

[components/toolbar/widgets/BaseWidget.ts:43](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L43)

***

### getSvgPathFromStroke()

> **getSvgPathFromStroke**(`points`): `string`

#### Parameters

• **points**: `number`[][]

#### Returns

`string`

#### Source

[components/toolbar/widgets/Brush/Brush.ts:118](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Brush/Brush.ts#L118)

***

### initEvents()

> **`protected`** **initEvents**(): `void`

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`initEvents`](../../../BaseWidget/classes/BaseWidget.md#initevents)

#### Source

[components/toolbar/widgets/Brush/Brush.ts:35](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Brush/Brush.ts#L35)

***

### med()

> **med**(`A`, `B`): `number`[]

#### Parameters

• **A**: `number`[]

• **B**: `number`[]

#### Returns

`number`[]

#### Source

[components/toolbar/widgets/Brush/Brush.ts:142](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Brush/Brush.ts#L142)

***

### onActive()

> **`protected`** **onActive**(): `void`

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`onActive`](../../../BaseWidget/classes/BaseWidget.md#onactive)

#### Source

[components/toolbar/widgets/Brush/Brush.ts:24](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Brush/Brush.ts#L24)

***

### onDesactive()

> **`protected`** **onDesactive**(): `void`

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`onDesactive`](../../../BaseWidget/classes/BaseWidget.md#ondesactive)

#### Source

[components/toolbar/widgets/Brush/Brush.ts:30](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Brush/Brush.ts#L30)

***

### removeEvents()

> **`protected`** **removeEvents**(): `void`

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`removeEvents`](../../../BaseWidget/classes/BaseWidget.md#removeevents)

#### Source

[components/toolbar/widgets/Brush/Brush.ts:112](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Brush/Brush.ts#L112)

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

[components/toolbar/widgets/BaseWidget.ts:73](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L73)

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

[components/toolbar/widgets/Brush/Brush.ts:146](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Brush/Brush.ts#L146)
