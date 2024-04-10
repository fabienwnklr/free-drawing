**free-drawing** • [API](../../../../../../README.md)

***

[free-drawing](../../../../../../README.md) / [components/toolbar/widgets/Select/Select](../README.md) / SelectWidget

# Class: SelectWidget

## Extends

- [`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md)

## Constructors

### new SelectWidget(drawer)

> **new SelectWidget**(`drawer`): [`SelectWidget`](SelectWidget.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../../../Drawer/classes/Drawer.md)

#### Returns

[`SelectWidget`](SelectWidget.md)

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`constructor`](../../../BaseWidget/classes/BaseWidget.md#constructors)

#### Source

[components/toolbar/widgets/Select/Select.ts:62](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Select/Select.ts#L62)

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

### color

> **color**: [`ColorLike`](../../../../../../@types/drawer/type-aliases/ColorLike.md) = `'rgba(152, 158, 255, 1)'`

#### Source

[components/toolbar/widgets/Select/Select.ts:34](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Select/Select.ts#L34)

***

### defaultAnchors

> **defaultAnchors**: `string`[]

#### Source

[components/toolbar/widgets/Select/Select.ts:24](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Select/Select.ts#L24)

***

### drawer

> **`protected`** **drawer**: [`Drawer`](../../../../../../Drawer/classes/Drawer.md)

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`drawer`](../../../BaseWidget/classes/BaseWidget.md#drawer)

#### Source

[components/toolbar/widgets/Select/Select.ts:62](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Select/Select.ts#L62)

***

### id

> **id**: `"pan"` \| `"selection"` \| `"brush"` \| `"eraser"` \| `"undo"` \| `"redo"` \| `"text"` \| `"rect"` \| `"circle"` \| `"ellipse"` \| `"square"` \| `"arrow"` \| `"line"` \| `"star"` \| `"triangle"` \| `"polygon"`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`id`](../../../BaseWidget/classes/BaseWidget.md#id)

#### Source

[components/toolbar/widgets/BaseWidget.ts:10](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L10)

***

### isSelecting

> **isSelecting**: `boolean` = `false`

#### Source

[components/toolbar/widgets/Select/Select.ts:58](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Select/Select.ts#L58)

***

### overlay

> **overlay**: [`SelectOverlay`](../../../../../tools/Overlay/SelectOverlay/SelectOverlay/classes/SelectOverlay.md)

#### Source

[components/toolbar/widgets/Select/Select.ts:60](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Select/Select.ts#L60)

***

### selectionRectangle

> **selectionRectangle**: `Rect`

#### Source

[components/toolbar/widgets/Select/Select.ts:35](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Select/Select.ts#L35)

***

### shortcut

> **shortcut**: `undefined` \| `string`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`shortcut`](../../../BaseWidget/classes/BaseWidget.md#shortcut)

#### Source

[components/toolbar/widgets/BaseWidget.ts:11](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L11)

***

### snapping

> **snapping**: `boolean` = `false`

#### Source

[components/toolbar/widgets/Select/Select.ts:59](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Select/Select.ts#L59)

***

### transformer

> **transformer**: `Transformer`

#### Source

[components/toolbar/widgets/Select/Select.ts:37](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Select/Select.ts#L37)

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

### initEvents()

> **`protected`** **initEvents**(): `void`

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`initEvents`](../../../BaseWidget/classes/BaseWidget.md#initevents)

#### Source

[components/toolbar/widgets/Select/Select.ts:80](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Select/Select.ts#L80)

***

### onActive()

> **`protected`** **onActive**(): `void`

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`onActive`](../../../BaseWidget/classes/BaseWidget.md#onactive)

#### Source

[components/toolbar/widgets/Select/Select.ts:203](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Select/Select.ts#L203)

***

### onDesactive()

> **`protected`** **onDesactive**(): `void`

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`onDesactive`](../../../BaseWidget/classes/BaseWidget.md#ondesactive)

#### Source

[components/toolbar/widgets/Select/Select.ts:233](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Select/Select.ts#L233)

***

### removeEvents()

> **`protected`** **removeEvents**(): `void`

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`removeEvents`](../../../BaseWidget/classes/BaseWidget.md#removeevents)

#### Source

[components/toolbar/widgets/Select/Select.ts:303](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Select/Select.ts#L303)

***

### selectAll()

> **selectAll**(): `void`

#### Returns

`void`

#### Source

[components/toolbar/widgets/Select/Select.ts:222](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Select/Select.ts#L222)

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

### setBgColor()

> **setBgColor**(`color`): `void`

Change background color

#### Parameters

• **color**: [`ColorLike`](../../../../../../@types/drawer/type-aliases/ColorLike.md)

#### Returns

`void`

#### Source

[components/toolbar/widgets/Select/Select.ts:503](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Select/Select.ts#L503)

***

### setColor()

> **setColor**(`color`): `void`

Set color for draw

#### Parameters

• **color**: [`ColorLike`](../../../../../../@types/drawer/type-aliases/ColorLike.md)

#### Returns

`void`

#### Source

[components/toolbar/widgets/Select/Select.ts:527](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Select/Select.ts#L527)

***

### setOpacity()

> **setOpacity**(`opacity`): `void`

Set opacity of shape 0 to 1

#### Parameters

• **opacity**: `number`

#### Returns

`void`

#### Source

[components/toolbar/widgets/Select/Select.ts:573](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Select/Select.ts#L573)

***

### setStrokeWidth()

> **setStrokeWidth**(`width`): `void`

Set stroke width for draw

#### Parameters

• **width**: `number`

#### Returns

`void`

#### Source

[components/toolbar/widgets/Select/Select.ts:554](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Select/Select.ts#L554)

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

### toggleSnapping()

> **toggleSnapping**(`active`): `void`

#### Parameters

• **active**: `boolean`= `true`

#### Returns

`void`

#### Source

[components/toolbar/widgets/Select/Select.ts:588](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Select/Select.ts#L588)

***

### updateCursor()

> **updateCursor**(): `void`

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`updateCursor`](../../../BaseWidget/classes/BaseWidget.md#updatecursor)

#### Source

[components/toolbar/widgets/Select/Select.ts:600](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/Select/Select.ts#L600)
