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

[packages/free-drawing/src/components/toolbar/Toolbar.ts:57](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/Toolbar.ts#L57)

## Properties

### $keepToolButton

> **$keepToolButton**: `null` \| `HTMLButtonElement` = `null`

Keep tool after drawing (`keepTool` preference), first button, with selection widget only

#### Source

[packages/free-drawing/src/components/toolbar/Toolbar.ts:55](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/Toolbar.ts#L55)

***

### $toolbarContent

> **$toolbarContent**: `HTMLDivElement`

#### Source

[packages/free-drawing/src/components/toolbar/Toolbar.ts:53](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/Toolbar.ts#L53)

***

### $toolbarRoot

> **$toolbarRoot**: `HTMLElement`

#### Source

[packages/free-drawing/src/components/toolbar/Toolbar.ts:49](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/Toolbar.ts#L49)

***

### drawer

> **drawer**: [`Drawer`](../../../../Drawer/classes/Drawer.md)

#### Source

[packages/free-drawing/src/components/toolbar/Toolbar.ts:48](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/Toolbar.ts#L48)

***

### groups

> **groups**: [`GroupWidget`](../../widgets/GroupWidget/classes/GroupWidget.md)[] = `[]`

#### Source

[packages/free-drawing/src/components/toolbar/Toolbar.ts:52](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/Toolbar.ts#L52)

***

### widgets

> **widgets**: `Map`\<`"pan"` \| `"selection"` \| `"brush"` \| `"eraser"` \| `"undo"` \| `"redo"` \| `"text"` \| `"rect"` \| `"circle"` \| `"ellipse"` \| `"square"` \| `"arrow"` \| `"line"` \| `"star"` \| `"triangle"` \| `"polygon"` \| `"diamond"` \| `"heart"` \| `"cloud"` \| `"highlighter"` \| `"laser"` \| `"frame"`, [`BaseWidget`](../../widgets/BaseWidget/classes/BaseWidget.md)\>

Widgets of toolbar, also those of groups

#### Source

[packages/free-drawing/src/components/toolbar/Toolbar.ts:51](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/Toolbar.ts#L51)

## Methods

### addGroup()

> **addGroup**(`group`): `void`

Add a group of widgets (created by the app or the library), its widgets become widgets of toolbar

#### Parameters

• **group**: [`GroupWidget`](../../widgets/GroupWidget/classes/GroupWidget.md)

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/Toolbar.ts:117](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/Toolbar.ts#L117)

***

### addWidget()

> **addWidget**(`widget`): `void`

#### Parameters

• **widget**: [`BaseWidget`](../../widgets/BaseWidget/classes/BaseWidget.md)

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/Toolbar.ts:107](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/Toolbar.ts#L107)

***

### getButton()

> **getButton**(`widget`): `HTMLButtonElement`

Button of a widget in toolbar: its own, or the button of its group

#### Parameters

• **widget**: [`BaseWidget`](../../widgets/BaseWidget/classes/BaseWidget.md)

#### Returns

`HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/toolbar/Toolbar.ts:135](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/Toolbar.ts#L135)

***

### getWidget()

> **getWidget**\<`T`\>(`name`): `undefined` \| `T`

#### Type parameters

• **T**

#### Parameters

• **name**: `"pan"` \| `"selection"` \| `"brush"` \| `"eraser"` \| `"undo"` \| `"redo"` \| `"text"` \| `"rect"` \| `"circle"` \| `"ellipse"` \| `"square"` \| `"arrow"` \| `"line"` \| `"star"` \| `"triangle"` \| `"polygon"` \| `"diamond"` \| `"heart"` \| `"cloud"` \| `"highlighter"` \| `"laser"` \| `"frame"`

#### Returns

`undefined` \| `T`

#### Source

[packages/free-drawing/src/components/toolbar/Toolbar.ts:203](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/Toolbar.ts#L203)

***

### init()

> **init**(): `void`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/Toolbar.ts:84](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/Toolbar.ts#L84)

***

### setActiveWidget()

> **setActiveWidget**(`widget`): `void`

#### Parameters

• **widget**: [`BaseWidget`](../../widgets/BaseWidget/classes/BaseWidget.md)

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/Toolbar.ts:124](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/Toolbar.ts#L124)

***

### setTabStop()

> **setTabStop**(`$button`): `void`

Only given button of toolbar is reached with Tab (roving tabindex), arrow keys move between them

#### Parameters

• **$button**: `HTMLElement`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/Toolbar.ts:149](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/Toolbar.ts#L149)

***

### update()

> **update**(): `void`

State of groups buttons: highlighted while one of their widgets is active, disabled with them

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/Toolbar.ts:142](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/Toolbar.ts#L142)
