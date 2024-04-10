**free-drawing** • [Readme](../../../../../../README.md) \| [API](../../../../../../modules.md)

***

[free-drawing](../../../../../../README.md) / [components/toolbar/widgets/Text/Text](../README.md) / TextWidget

# Class: TextWidget

## Extends

- [`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md)

## Constructors

### new TextWidget(drawer)

> **new TextWidget**(`drawer`): [`TextWidget`](TextWidget.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../../../Drawer/classes/Drawer.md)

#### Returns

[`TextWidget`](TextWidget.md)

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`constructor`](../../../BaseWidget/classes/BaseWidget.md#constructors)

#### Source

[components/toolbar/widgets/Text/Text.ts:12](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Text/Text.ts#L12)

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

### isEditing

> **isEditing**: `boolean` = `false`

#### Source

[components/toolbar/widgets/Text/Text.ts:10](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Text/Text.ts#L10)

***

### shortcut

> **shortcut**: `undefined` \| `string`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`shortcut`](../../../BaseWidget/classes/BaseWidget.md#shortcut)

#### Source

[components/toolbar/widgets/BaseWidget.ts:11](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L11)

## Methods

### addTextNode()

> **addTextNode**(`text`): `Text`

Add text node to layer

#### Parameters

• **text**: `string`= `''`

Text content

#### Returns

`Text`

#### Source

[components/toolbar/widgets/Text/Text.ts:29](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Text/Text.ts#L29)

***

### addTextNodeEvents()

> **addTextNodeEvents**(`textNode`): `void`

#### Parameters

• **textNode**: `Text`

#### Returns

`void`

#### Source

[components/toolbar/widgets/Text/Text.ts:60](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Text/Text.ts#L60)

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

### editTextNode()

> **editTextNode**(`textNode`): `void`

#### Parameters

• **textNode**: `Text`

#### Returns

`void`

#### Source

[components/toolbar/widgets/Text/Text.ts:73](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Text/Text.ts#L73)

***

### initEvents()

> **`protected`** **initEvents**(): `void`

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`initEvents`](../../../BaseWidget/classes/BaseWidget.md#initevents)

#### Source

[components/toolbar/widgets/Text/Text.ts:66](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Text/Text.ts#L66)

***

### onActive()

> **`protected`** **onActive**(): `void`

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`onActive`](../../../BaseWidget/classes/BaseWidget.md#onactive)

#### Source

[components/toolbar/widgets/Text/Text.ts:16](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Text/Text.ts#L16)

***

### onDesactive()

> **`protected`** **onDesactive**(): `void`

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`onDesactive`](../../../BaseWidget/classes/BaseWidget.md#ondesactive)

#### Source

[components/toolbar/widgets/Text/Text.ts:20](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Text/Text.ts#L20)

***

### removeEvents()

> **`protected`** **removeEvents**(): `void`

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`removeEvents`](../../../BaseWidget/classes/BaseWidget.md#removeevents)

#### Source

[components/toolbar/widgets/Text/Text.ts:186](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Text/Text.ts#L186)

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

[components/toolbar/widgets/Text/Text.ts:189](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Text/Text.ts#L189)
