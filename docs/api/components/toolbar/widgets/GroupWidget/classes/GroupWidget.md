**@fabwcie/free-drawing** • [API](../../../../../README.md)

***

[@fabwcie/free-drawing](../../../../../README.md) / [components/toolbar/widgets/GroupWidget](../README.md) / GroupWidget

# Class: GroupWidget

## Extends

- [`Dropdown`](../../../../Dropdown/Dropdown/classes/Dropdown.md)

## Constructors

### new GroupWidget(drawer, toolbar, widgets)

> **new GroupWidget**(`drawer`, `toolbar`, `widgets`): [`GroupWidget`](GroupWidget.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../../Drawer/classes/Drawer.md)

• **toolbar**: [`Toolbar`](../../../Toolbar/classes/Toolbar.md)

• **widgets**: [`BaseWidget`](../../BaseWidget/classes/BaseWidget.md)[]

#### Returns

[`GroupWidget`](GroupWidget.md)

#### Overrides

[`Dropdown`](../../../../Dropdown/Dropdown/classes/Dropdown.md).[`constructor`](../../../../Dropdown/Dropdown/classes/Dropdown.md#constructors)

#### Source

[components/toolbar/widgets/GroupWidget.ts:8](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/GroupWidget.ts#L8)

## Properties

### $button

> **$button**: `HTMLButtonElement`

#### Inherited from

[`Dropdown`](../../../../Dropdown/Dropdown/classes/Dropdown.md).[`$button`](../../../../Dropdown/Dropdown/classes/Dropdown.md#$button)

#### Source

[components/Dropdown/Dropdown.ts:6](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Dropdown/Dropdown.ts#L6)

***

### $dropdownContainer

> **$dropdownContainer**: `HTMLDivElement`

#### Inherited from

[`Dropdown`](../../../../Dropdown/Dropdown/classes/Dropdown.md).[`$dropdownContainer`](../../../../Dropdown/Dropdown/classes/Dropdown.md#$dropdowncontainer)

#### Source

[components/Dropdown/Dropdown.ts:5](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Dropdown/Dropdown.ts#L5)

***

### $dropdownItem

> **$dropdownItem**: `HTMLLIElement`

#### Inherited from

[`Dropdown`](../../../../Dropdown/Dropdown/classes/Dropdown.md).[`$dropdownItem`](../../../../Dropdown/Dropdown/classes/Dropdown.md#$dropdownitem)

#### Source

[components/Dropdown/Dropdown.ts:9](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Dropdown/Dropdown.ts#L9)

***

### $dropdownList

> **$dropdownList**: `HTMLUListElement`

#### Inherited from

[`Dropdown`](../../../../Dropdown/Dropdown/classes/Dropdown.md).[`$dropdownList`](../../../../Dropdown/Dropdown/classes/Dropdown.md#$dropdownlist)

#### Source

[components/Dropdown/Dropdown.ts:8](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Dropdown/Dropdown.ts#L8)

***

### $menu

> **$menu**: `HTMLDivElement`

#### Inherited from

[`Dropdown`](../../../../Dropdown/Dropdown/classes/Dropdown.md).[`$menu`](../../../../Dropdown/Dropdown/classes/Dropdown.md#$menu)

#### Source

[components/Dropdown/Dropdown.ts:7](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Dropdown/Dropdown.ts#L7)

***

### \_events

> **\_events**: `object` = `{}`

#### Index signature

 \[`key`: `string`\]: `TCallback`[]

#### Inherited from

[`Dropdown`](../../../../Dropdown/Dropdown/classes/Dropdown.md).[`_events`](../../../../Dropdown/Dropdown/classes/Dropdown.md#_events)

#### Source

[utils/MicroEvent.ts:14](https://github.com/fabienwnklr/free-drawing/blob/master/src/utils/MicroEvent.ts#L14)

***

### drawer

> **drawer**: [`Drawer`](../../../../../Drawer/classes/Drawer.md)

#### Source

[components/toolbar/widgets/GroupWidget.ts:7](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/toolbar/widgets/GroupWidget.ts#L7)

## Methods

### hide()

> **hide**(): `void`

#### Returns

`void`

#### Inherited from

[`Dropdown`](../../../../Dropdown/Dropdown/classes/Dropdown.md).[`hide`](../../../../Dropdown/Dropdown/classes/Dropdown.md#hide)

#### Source

[components/Dropdown/Dropdown.ts:45](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Dropdown/Dropdown.ts#L45)

***

### isShown()

> **isShown**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`Dropdown`](../../../../Dropdown/Dropdown/classes/Dropdown.md).[`isShown`](../../../../Dropdown/Dropdown/classes/Dropdown.md#isshown)

#### Source

[components/Dropdown/Dropdown.ts:51](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Dropdown/Dropdown.ts#L51)

***

### off()

> **off**(`events`, `fct`): `void`

#### Parameters

• **events**: `string`

• **fct**: `TCallback`

#### Returns

`void`

#### Inherited from

[`Dropdown`](../../../../Dropdown/Dropdown/classes/Dropdown.md).[`off`](../../../../Dropdown/Dropdown/classes/Dropdown.md#off)

#### Source

[utils/MicroEvent.ts:28](https://github.com/fabienwnklr/free-drawing/blob/master/src/utils/MicroEvent.ts#L28)

***

### on()

> **on**(`events`, `fct`): `void`

#### Parameters

• **events**: `string`

• **fct**: `TCallback`

#### Returns

`void`

#### Inherited from

[`Dropdown`](../../../../Dropdown/Dropdown/classes/Dropdown.md).[`on`](../../../../Dropdown/Dropdown/classes/Dropdown.md#on)

#### Source

[utils/MicroEvent.ts:20](https://github.com/fabienwnklr/free-drawing/blob/master/src/utils/MicroEvent.ts#L20)

***

### setContent()

> **setContent**(`content`): `void`

#### Parameters

• **content**: `string` \| `Node`

#### Returns

`void`

#### Inherited from

[`Dropdown`](../../../../Dropdown/Dropdown/classes/Dropdown.md).[`setContent`](../../../../Dropdown/Dropdown/classes/Dropdown.md#setcontent)

#### Source

[components/Dropdown/Dropdown.ts:33](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Dropdown/Dropdown.ts#L33)

***

### show()

> **show**(): `void`

#### Returns

`void`

#### Inherited from

[`Dropdown`](../../../../Dropdown/Dropdown/classes/Dropdown.md).[`show`](../../../../Dropdown/Dropdown/classes/Dropdown.md#show)

#### Source

[components/Dropdown/Dropdown.ts:41](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Dropdown/Dropdown.ts#L41)

***

### trigger()

> **trigger**(`events`, ...`args`): `void`

#### Parameters

• **events**: `string`

• ...**args**: `any`

#### Returns

`void`

#### Inherited from

[`Dropdown`](../../../../Dropdown/Dropdown/classes/Dropdown.md).[`trigger`](../../../../Dropdown/Dropdown/classes/Dropdown.md#trigger)

#### Source

[utils/MicroEvent.ts:49](https://github.com/fabienwnklr/free-drawing/blob/master/src/utils/MicroEvent.ts#L49)
