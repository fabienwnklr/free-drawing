**@fabwcie/free-drawing** • [API](../../../../../../README.md)

***

[@fabwcie/free-drawing](../../../../../../README.md) / [components/toolbar/widgets/Line/Line](../README.md) / LineWidget

# Class: LineWidget

## Extends

- [`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md)

## Constructors

### new LineWidget(drawer)

> **new LineWidget**(`drawer`): [`LineWidget`](LineWidget.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../../../Drawer/classes/Drawer.md)

#### Returns

[`LineWidget`](LineWidget.md)

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`constructor`](../../../BaseWidget/classes/BaseWidget.md#constructors)

#### Source

[components/toolbar/widgets/Line/Line.ts:12](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Line/Line.ts#L12)

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

[components/toolbar/widgets/BaseWidget.ts:14](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L14)

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

[components/toolbar/widgets/Line/Line.ts:10](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Line/Line.ts#L10)

***

### shortcut

> **shortcut**: `undefined` \| `string`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`shortcut`](../../../BaseWidget/classes/BaseWidget.md#shortcut)

#### Source

[components/toolbar/widgets/BaseWidget.ts:11](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L11)

## Methods

### \_socketDraw()?

> **`optional`** **\_socketDraw**(`data`): `void`

Get the drawing data from the socket and basically
draw on our canvas whatever the other person draws

#### Parameters

• **data**: `string`

#### Returns

`void`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`_socketDraw`](../../../BaseWidget/classes/BaseWidget.md#_socketdraw)

#### Source

[components/toolbar/widgets/BaseWidget.ts:73](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L73)

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

### initEvents()

> **`protected`** **initEvents**(): `void`

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`initEvents`](../../../BaseWidget/classes/BaseWidget.md#initevents)

#### Source

[components/toolbar/widgets/Line/Line.ts:27](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Line/Line.ts#L27)

***

### onActive()

> **`protected`** **onActive**(): `void`

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`onActive`](../../../BaseWidget/classes/BaseWidget.md#onactive)

#### Source

[components/toolbar/widgets/Line/Line.ts:17](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Line/Line.ts#L17)

***

### onDesactive()

> **`protected`** **onDesactive**(): `void`

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`onDesactive`](../../../BaseWidget/classes/BaseWidget.md#ondesactive)

#### Source

[components/toolbar/widgets/Line/Line.ts:23](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Line/Line.ts#L23)

***

### removeEvents()

> **`protected`** **removeEvents**(): `void`

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`removeEvents`](../../../BaseWidget/classes/BaseWidget.md#removeevents)

#### Source

[components/toolbar/widgets/Line/Line.ts:93](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Line/Line.ts#L93)

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

[components/toolbar/widgets/Line/Line.ts:99](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Line/Line.ts#L99)
