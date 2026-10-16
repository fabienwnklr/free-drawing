**@fabwcie/free-drawing** • [API](../../../README.md)

***

[@fabwcie/free-drawing](../../../README.md) / [utils/MicroEvent](../README.md) / default

# Class: default

## Extended by

- [`Drawer`](../../../Drawer/classes/Drawer.md)
- [`Dropdown`](../../../components/Dropdown/Dropdown/classes/Dropdown.md)
- [`Toast`](../../../components/Toast/Toast/classes/Toast.md)

## Constructors

### new default()

> **new default**(): [`default`](default.md)

#### Returns

[`default`](default.md)

#### Source

[packages/free-drawing/src/utils/MicroEvent.ts:35](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/utils/MicroEvent.ts#L35)

## Properties

### \_events

> **\_events**: `object` = `{}`

#### Index signature

 \[`key`: `string`\]: `TCallback`[]

#### Source

[packages/free-drawing/src/utils/MicroEvent.ts:33](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/utils/MicroEvent.ts#L33)

## Methods

### off()

> **off**(`events`, `fct`): `void`

#### Parameters

• **events**: `string`

• **fct**: `TCallback`

#### Returns

`void`

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

#### Source

[packages/free-drawing/src/utils/MicroEvent.ts:39](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/utils/MicroEvent.ts#L39)

***

### trigger()

> **trigger**(`events`, ...`args`): `void`

#### Parameters

• **events**: `string`

• ...**args**: `any`

#### Returns

`void`

#### Source

[packages/free-drawing/src/utils/MicroEvent.ts:70](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/utils/MicroEvent.ts#L70)
