**free-drawing** • [API](../../../../../README.md)

***

[free-drawing](../../../../../README.md) / [components/toolbar/widgets/BaseWidget](../README.md) / BaseWidget

# Class: `abstract` BaseWidget

## Extended by

- [`BrushWidget`](../../Brush/Brush/classes/BrushWidget.md)
- [`EraserWidget`](../../Eraser/Eraser/classes/EraserWidget.md)
- [`PanWidget`](../../Pan/Pan/classes/PanWidget.md)
- [`SelectWidget`](../../Select/Select/classes/SelectWidget.md)
- [`TextWidget`](../../Text/Text/classes/TextWidget.md)

## Constructors

### new BaseWidget(drawer, id, title, $icon, shortcut)

> **new BaseWidget**(`drawer`, `id`, `title`, `$icon`, `shortcut`?): [`BaseWidget`](BaseWidget.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../../Drawer/classes/Drawer.md)

• **id**: `"pan"` \| `"selection"` \| `"brush"` \| `"eraser"` \| `"undo"` \| `"redo"` \| `"text"` \| `"rect"` \| `"circle"` \| `"ellipse"` \| `"square"` \| `"arrow"` \| `"line"` \| `"star"` \| `"triangle"` \| `"polygon"`

• **title**: `string`

• **$icon**: `string` \| `SVGElement`

• **shortcut?**: `string`

#### Returns

[`BaseWidget`](BaseWidget.md)

#### Source

[components/toolbar/widgets/BaseWidget.ts:13](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L13)

## Properties

### $button

> **$button**: `HTMLButtonElement`

#### Source

[components/toolbar/widgets/BaseWidget.ts:9](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L9)

***

### $container

> **`protected`** **`readonly`** **$container**: `HTMLElement`

#### Source

[components/toolbar/widgets/BaseWidget.ts:6](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L6)

***

### drawer

> **`protected`** **drawer**: [`Drawer`](../../../../../Drawer/classes/Drawer.md)

#### Source

[components/toolbar/widgets/BaseWidget.ts:14](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L14)

***

### id

> **id**: `"pan"` \| `"selection"` \| `"brush"` \| `"eraser"` \| `"undo"` \| `"redo"` \| `"text"` \| `"rect"` \| `"circle"` \| `"ellipse"` \| `"square"` \| `"arrow"` \| `"line"` \| `"star"` \| `"triangle"` \| `"polygon"`

#### Source

[components/toolbar/widgets/BaseWidget.ts:10](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L10)

***

### shortcut

> **shortcut**: `undefined` \| `string`

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

#### Source

[components/toolbar/widgets/BaseWidget.ts:43](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L43)

***

### initEvents()

> **`protected`** **`abstract`** **initEvents**(): `void`

#### Returns

`void`

#### Source

[components/toolbar/widgets/BaseWidget.ts:63](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L63)

***

### onActive()

> **`protected`** **`abstract`** **onActive**(): `void`

#### Returns

`void`

#### Source

[components/toolbar/widgets/BaseWidget.ts:61](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L61)

***

### onDesactive()

> **`protected`** **`abstract`** **onDesactive**(): `void`

#### Returns

`void`

#### Source

[components/toolbar/widgets/BaseWidget.ts:62](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L62)

***

### removeEvents()

> **`protected`** **`abstract`** **removeEvents**(): `void`

#### Returns

`void`

#### Source

[components/toolbar/widgets/BaseWidget.ts:64](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L64)

***

### setActive()

> **setActive**(`active`): `void`

#### Parameters

• **active**: `boolean`

#### Returns

`void`

#### Source

[components/toolbar/widgets/BaseWidget.ts:73](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L73)

***

### toggleDisable()

> **toggleDisable**(): `void`

#### Returns

`void`

#### Source

[components/toolbar/widgets/BaseWidget.ts:56](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L56)

***

### updateCursor()

> **`abstract`** **updateCursor**(): `void`

#### Returns

`void`

#### Source

[components/toolbar/widgets/BaseWidget.ts:65](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/BaseWidget.ts#L65)
