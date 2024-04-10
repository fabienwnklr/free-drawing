**free-drawing** • [API](../../../README.md)

***

[free-drawing](../../../README.md) / [utils/MicroEvent](../README.md) / default

# Class: default

## Extended by

- [`Drawer`](../../../Drawer/classes/Drawer.md)

## Constructors

### new default()

> **new default**(): [`default`](default.md)

#### Returns

[`default`](default.md)

#### Source

[utils/MicroEvent.ts:16](https://github.com/fabienwnklr/free-drawing/blob/master/src/utils/MicroEvent.ts#L16)

## Properties

### \_events

> **\_events**: `object` = `{}`

#### Index signature

 \[`key`: `string`\]: `TCallback`[]

#### Source

[utils/MicroEvent.ts:14](https://github.com/fabienwnklr/free-drawing/blob/master/src/utils/MicroEvent.ts#L14)

## Methods

### off()

> **off**(`events`, `fct`): `void`

#### Parameters

• **events**: `string`

• **fct**: `TCallback`

#### Returns

`void`

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

#### Source

[utils/MicroEvent.ts:20](https://github.com/fabienwnklr/free-drawing/blob/master/src/utils/MicroEvent.ts#L20)

***

### trigger()

> **trigger**(`events`, ...`args`): `void`

#### Parameters

• **events**: `string`

• ...**args**: `any`

#### Returns

`void`

#### Source

[utils/MicroEvent.ts:49](https://github.com/fabienwnklr/free-drawing/blob/master/src/utils/MicroEvent.ts#L49)
