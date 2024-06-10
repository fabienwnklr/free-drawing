**@fabwcie/free-drawing** • [API](../../../../README.md)

***

[@fabwcie/free-drawing](../../../../README.md) / [components/Toast/Toast](../README.md) / Toast

# Class: Toast

## Extends

- [`default`](../../../../utils/MicroEvent/classes/default.md)

## Constructors

### new Toast(drawer, message, type, timeout, showIcon)

> **new Toast**(`drawer`, `message`, `type`, `timeout`, `showIcon`): [`Toast`](Toast.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../Drawer/classes/Drawer.md)

• **message**: `string`

• **type**: `"error"` \| `"neutral"` \| `"info"` \| `"warning"` \| `"danger"`= `'neutral'`

• **timeout**: `number`= `5000`

• **showIcon**: `boolean`= `true`

#### Returns

[`Toast`](Toast.md)

#### Overrides

[`default`](../../../../utils/MicroEvent/classes/default.md).[`constructor`](../../../../utils/MicroEvent/classes/default.md#constructors)

#### Source

[components/Toast/Toast.ts:13](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Toast/Toast.ts#L13)

## Properties

### $toastContainer

> **$toastContainer**: `HTMLDivElement`

#### Source

[components/Toast/Toast.ts:10](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Toast/Toast.ts#L10)

***

### \_events

> **\_events**: `object` = `{}`

#### Index signature

 \[`key`: `string`\]: `TCallback`[]

#### Inherited from

[`default`](../../../../utils/MicroEvent/classes/default.md).[`_events`](../../../../utils/MicroEvent/classes/default.md#_events)

#### Source

[utils/MicroEvent.ts:14](https://github.com/fabienwnklr/free-drawing/blob/master/src/utils/MicroEvent.ts#L14)

***

### timeout

> **timeout**: `number` = `5000`

#### Source

[components/Toast/Toast.ts:11](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Toast/Toast.ts#L11)

## Methods

### destroy()

> **destroy**(): `void`

#### Returns

`void`

#### Source

[components/Toast/Toast.ts:66](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Toast/Toast.ts#L66)

***

### hide()

> **hide**(): `void`

#### Returns

`void`

#### Source

[components/Toast/Toast.ts:58](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Toast/Toast.ts#L58)

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

### show()

> **show**(): `void`

#### Returns

`void`

#### Source

[components/Toast/Toast.ts:46](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Toast/Toast.ts#L46)

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
