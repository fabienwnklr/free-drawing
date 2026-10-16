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

[packages/free-drawing/src/components/Dropdown/Dropdown.ts:13](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Dropdown/Dropdown.ts#L13)

## Properties

### $button

> **$button**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/Dropdown/Dropdown.ts:8](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Dropdown/Dropdown.ts#L8)

***

### $dropdownContainer

> **$dropdownContainer**: `HTMLDivElement`

#### Source

[packages/free-drawing/src/components/Dropdown/Dropdown.ts:7](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Dropdown/Dropdown.ts#L7)

***

### $dropdownItem

> **$dropdownItem**: `HTMLLIElement`

#### Source

[packages/free-drawing/src/components/Dropdown/Dropdown.ts:11](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Dropdown/Dropdown.ts#L11)

***

### $dropdownList

> **$dropdownList**: `HTMLUListElement`

#### Source

[packages/free-drawing/src/components/Dropdown/Dropdown.ts:10](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Dropdown/Dropdown.ts#L10)

***

### $menu

> **$menu**: `HTMLDivElement`

#### Source

[packages/free-drawing/src/components/Dropdown/Dropdown.ts:9](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Dropdown/Dropdown.ts#L9)

***

### \_events

> **\_events**: `object` = `{}`

#### Index signature

 \[`key`: `string`\]: `TCallback`[]

#### Inherited from

[`default`](../../../../utils/MicroEvent/classes/default.md).[`_events`](../../../../utils/MicroEvent/classes/default.md#_events)

#### Source

[packages/free-drawing/src/utils/MicroEvent.ts:33](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/utils/MicroEvent.ts#L33)

## Methods

### hide()

> **hide**(): `void`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/Dropdown/Dropdown.ts:49](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Dropdown/Dropdown.ts#L49)

***

### isShown()

> **isShown**(): `boolean`

#### Returns

`boolean`

#### Source

[packages/free-drawing/src/components/Dropdown/Dropdown.ts:55](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Dropdown/Dropdown.ts#L55)

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

[packages/free-drawing/src/utils/MicroEvent.ts:47](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/utils/MicroEvent.ts#L47)

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

[packages/free-drawing/src/utils/MicroEvent.ts:39](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/utils/MicroEvent.ts#L39)

***

### setContent()

> **setContent**(`content`): `void`

#### Parameters

• **content**: `string` \| `Node`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/Dropdown/Dropdown.ts:37](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Dropdown/Dropdown.ts#L37)

***

### show()

> **show**(): `void`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/Dropdown/Dropdown.ts:45](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Dropdown/Dropdown.ts#L45)

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

[packages/free-drawing/src/utils/MicroEvent.ts:70](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/utils/MicroEvent.ts#L70)
