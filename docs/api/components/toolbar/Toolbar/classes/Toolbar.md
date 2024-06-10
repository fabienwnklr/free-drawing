**@fabwcie/free-drawing** • [API](../../../../README.md)

***

[@fabwcie/free-drawing](../../../../README.md) / [components/toolbar/Toolbar](../README.md) / Toolbar

# Class: Toolbar

## Constructors

### new Toolbar(drawer)

> **new Toolbar**(`drawer`): [`Toolbar`](Toolbar.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../Drawer/classes/Drawer.md)

#### Returns

[`Toolbar`](Toolbar.md)

#### Source

[components/toolbar/Toolbar.ts:21](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/Toolbar.ts#L21)

## Properties

### $toolbarContent

> **$toolbarContent**: `HTMLDivElement`

#### Source

[components/toolbar/Toolbar.ts:19](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/Toolbar.ts#L19)

***

### $toolbarRoot

> **$toolbarRoot**: `HTMLElement`

#### Source

[components/toolbar/Toolbar.ts:17](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/Toolbar.ts#L17)

***

### drawer

> **drawer**: [`Drawer`](../../../../Drawer/classes/Drawer.md)

#### Source

[components/toolbar/Toolbar.ts:16](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/Toolbar.ts#L16)

***

### widgets

> **widgets**: `Map`\<`"pan"` \| `"selection"` \| `"brush"` \| `"eraser"` \| `"undo"` \| `"redo"` \| `"text"` \| `"rect"` \| `"circle"` \| `"ellipse"` \| `"square"` \| `"arrow"` \| `"line"` \| `"star"` \| `"triangle"` \| `"polygon"`, [`BaseWidget`](../../widgets/BaseWidget/classes/BaseWidget.md)\>

#### Source

[components/toolbar/Toolbar.ts:18](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/Toolbar.ts#L18)

## Methods

### addWidget()

> **addWidget**(`widget`): `void`

#### Parameters

• **widget**: [`BaseWidget`](../../widgets/BaseWidget/classes/BaseWidget.md)

#### Returns

`void`

#### Source

[components/toolbar/Toolbar.ts:47](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/Toolbar.ts#L47)

***

### getWidget()

> **getWidget**\<`T`\>(`name`): `undefined` \| `T`

#### Type parameters

• **T**

#### Parameters

• **name**: `"pan"` \| `"selection"` \| `"brush"` \| `"eraser"` \| `"undo"` \| `"redo"` \| `"text"` \| `"rect"` \| `"circle"` \| `"ellipse"` \| `"square"` \| `"arrow"` \| `"line"` \| `"star"` \| `"triangle"` \| `"polygon"`

#### Returns

`undefined` \| `T`

#### Source

[components/toolbar/Toolbar.ts:57](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/Toolbar.ts#L57)

***

### init()

> **init**(): `void`

#### Returns

`void`

#### Source

[components/toolbar/Toolbar.ts:35](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/Toolbar.ts#L35)

***

### setActiveWidget()

> **setActiveWidget**(`widget`): `void`

#### Parameters

• **widget**: [`BaseWidget`](../../widgets/BaseWidget/classes/BaseWidget.md)

#### Returns

`void`

#### Source

[components/toolbar/Toolbar.ts:52](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/Toolbar.ts#L52)
