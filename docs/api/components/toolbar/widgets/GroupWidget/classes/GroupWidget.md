**@fabwcie/free-drawing** • [API](../../../../../README.md)

***

[@fabwcie/free-drawing](../../../../../README.md) / [components/toolbar/widgets/GroupWidget](../README.md) / GroupWidget

# Class: GroupWidget

Group of toolbar widgets: one button (generic icon by default) shows its widgets above it, highlighted while one
of them is active. Its widgets are still widgets of the toolbar (shortcuts, help, command palette, read only),
added with it by `toolbar.addGroup`.

## Constructors

### new GroupWidget(drawer, __namedParameters)

> **new GroupWidget**(`drawer`, `__namedParameters`): [`GroupWidget`](GroupWidget.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../../Drawer/classes/Drawer.md)

• **\_\_namedParameters**: [`GroupWidgetOptions`](../type-aliases/GroupWidgetOptions.md)

#### Returns

[`GroupWidget`](GroupWidget.md)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/GroupWidget.ts:117](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/GroupWidget.ts#L117)

## Properties

### $button

> **`readonly`** **$button**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/GroupWidget.ts:114](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/GroupWidget.ts#L114)

***

### $container

> **`readonly`** **$container**: `HTMLDivElement`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/GroupWidget.ts:113](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/GroupWidget.ts#L113)

***

### $menu

> **`readonly`** **$menu**: `HTMLDivElement`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/GroupWidget.ts:115](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/GroupWidget.ts#L115)

***

### drawer

> **`readonly`** **drawer**: [`Drawer`](../../../../../Drawer/classes/Drawer.md)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/GroupWidget.ts:111](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/GroupWidget.ts#L111)

***

### widgets

> **`readonly`** **widgets**: [`BaseWidget`](../../BaseWidget/classes/BaseWidget.md)[]

#### Source

[packages/free-drawing/src/components/toolbar/widgets/GroupWidget.ts:112](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/GroupWidget.ts#L112)

## Methods

### addTo()

`Internal`

> **addTo**(`parent`): `void`

Adds group button and its widgets to `parent` (toolbar)

#### Parameters

• **parent**: `HTMLElement`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/GroupWidget.ts:153](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/GroupWidget.ts#L153)

***

### hide()

> **hide**(): `void`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/GroupWidget.ts:175](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/GroupWidget.ts#L175)

***

### isShown()

> **isShown**(): `boolean`

#### Returns

`boolean`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/GroupWidget.ts:158](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/GroupWidget.ts#L158)

***

### show()

> **show**(): `void`

Show widgets, focus on active one (else first one): arrow keys move between them

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/GroupWidget.ts:165](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/GroupWidget.ts#L165)

***

### update()

> **update**(): `void`

Button highlighted while a widget of group is active, disabled when all its widgets are (read only)

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/GroupWidget.ts:183](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/GroupWidget.ts#L183)
