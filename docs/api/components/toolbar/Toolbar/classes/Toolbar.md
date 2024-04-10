**free-drawing** • [Readme](../../../../README.md) \| [API](../../../../modules.md)

***

[free-drawing](../../../../README.md) / [components/toolbar/Toolbar](../README.md) / Toolbar

# Class: Toolbar

## Constructors

### new Toolbar(drawer)

> **new Toolbar**(`drawer`): [`Toolbar`](Toolbar.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../Drawer/classes/Drawer.md)

#### Returns

[`Toolbar`](Toolbar.md)

#### Source

[components/toolbar/Toolbar.ts:17](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/Toolbar.ts#L17)

## Properties

### $toolbarContent

> **$toolbarContent**: `HTMLDivElement`

#### Source

[components/toolbar/Toolbar.ts:15](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/Toolbar.ts#L15)

***

### $toolbarRoot

> **$toolbarRoot**: `HTMLElement`

#### Source

[components/toolbar/Toolbar.ts:13](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/Toolbar.ts#L13)

***

### drawer

> **drawer**: [`Drawer`](../../../../Drawer/classes/Drawer.md)

#### Source

[components/toolbar/Toolbar.ts:12](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/Toolbar.ts#L12)

***

### widgets

> **widgets**: `Map`\<`"pan"` \| `"selection"` \| `"brush"` \| `"eraser"` \| `"undo"` \| `"redo"` \| `"text"` \| `"rect"` \| `"circle"` \| `"ellipse"` \| `"square"` \| `"arrow"` \| `"line"` \| `"star"` \| `"triangle"` \| `"polygon"`, [`BaseWidget`](../../widgets/BaseWidget/classes/BaseWidget.md)\>

#### Source

[components/toolbar/Toolbar.ts:14](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/Toolbar.ts#L14)

## Methods

### addWidget()

> **addWidget**(`widget`): `void`

#### Parameters

• **widget**: [`BaseWidget`](../../widgets/BaseWidget/classes/BaseWidget.md)

#### Returns

`void`

#### Source

[components/toolbar/Toolbar.ts:39](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/Toolbar.ts#L39)

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

[components/toolbar/Toolbar.ts:49](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/Toolbar.ts#L49)

***

### init()

> **init**(): `void`

#### Returns

`void`

#### Source

[components/toolbar/Toolbar.ts:31](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/Toolbar.ts#L31)

***

### setActiveWidget()

> **setActiveWidget**(`widget`): `void`

#### Parameters

• **widget**: [`BaseWidget`](../../widgets/BaseWidget/classes/BaseWidget.md)

#### Returns

`void`

#### Source

[components/toolbar/Toolbar.ts:44](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/Toolbar.ts#L44)
