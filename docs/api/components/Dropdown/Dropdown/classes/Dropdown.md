**@fabwcie/free-drawing** • [API](../../../../README.md)

***

[@fabwcie/free-drawing](../../../../README.md) / [components/Dropdown/Dropdown](../README.md) / Dropdown

# Class: Dropdown

## Extends

- [`default`](../../../../utils/MicroEvent/classes/default.md)

## Constructors

### new Dropdown()

> **new Dropdown**(): [`Dropdown`](Dropdown.md)

#### Returns

[`Dropdown`](Dropdown.md)

#### Overrides

[`default`](../../../../utils/MicroEvent/classes/default.md).[`constructor`](../../../../utils/MicroEvent/classes/default.md#constructors)

#### Source

[components/Dropdown/Dropdown.ts:11](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Dropdown/Dropdown.ts#L11)

## Properties

### $button

> **$button**: `HTMLButtonElement`

#### Source

[components/Dropdown/Dropdown.ts:6](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Dropdown/Dropdown.ts#L6)

***

### $dropdownContainer

> **$dropdownContainer**: `HTMLDivElement`

#### Source

[components/Dropdown/Dropdown.ts:5](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Dropdown/Dropdown.ts#L5)

***

### $dropdownItem

> **$dropdownItem**: `HTMLLIElement`

#### Source

[components/Dropdown/Dropdown.ts:9](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Dropdown/Dropdown.ts#L9)

***

### $dropdownList

> **$dropdownList**: `HTMLUListElement`

#### Source

[components/Dropdown/Dropdown.ts:8](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Dropdown/Dropdown.ts#L8)

***

### $menu

> **$menu**: `HTMLDivElement`

#### Source

[components/Dropdown/Dropdown.ts:7](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Dropdown/Dropdown.ts#L7)

***

### \_events

> **\_events**: `object` = `{}`

#### Index signature

 \[`key`: `string`\]: `TCallback`[]

#### Inherited from

[`default`](../../../../utils/MicroEvent/classes/default.md).[`_events`](../../../../utils/MicroEvent/classes/default.md#_events)

#### Source

[utils/MicroEvent.ts:14](https://github.com/fabienwnklr/free-drawing/blob/master/src/utils/MicroEvent.ts#L14)

## Methods

### hide()

> **hide**(): `void`

#### Returns

`void`

#### Source

[components/Dropdown/Dropdown.ts:45](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Dropdown/Dropdown.ts#L45)

***

### isShown()

> **isShown**(): `boolean`

#### Returns

`boolean`

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

[`default`](../../../../utils/MicroEvent/classes/default.md).[`off`](../../../../utils/MicroEvent/classes/default.md#off)

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

[`default`](../../../../utils/MicroEvent/classes/default.md).[`on`](../../../../utils/MicroEvent/classes/default.md#on)

#### Source

[utils/MicroEvent.ts:20](https://github.com/fabienwnklr/free-drawing/blob/master/src/utils/MicroEvent.ts#L20)

***

### setContent()

> **setContent**(`content`): `void`

#### Parameters

• **content**: `string` \| `Node`

#### Returns

`void`

#### Source

[components/Dropdown/Dropdown.ts:33](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Dropdown/Dropdown.ts#L33)

***

### show()

> **show**(): `void`

#### Returns

`void`

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

[`default`](../../../../utils/MicroEvent/classes/default.md).[`trigger`](../../../../utils/MicroEvent/classes/default.md#trigger)

#### Source

[utils/MicroEvent.ts:49](https://github.com/fabienwnklr/free-drawing/blob/master/src/utils/MicroEvent.ts#L49)
