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

[packages/free-drawing/src/components/Toast/Toast.ts:14](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Toast/Toast.ts#L14)

## Properties

### $toastContainer

> **$toastContainer**: `HTMLDivElement`

#### Source

[packages/free-drawing/src/components/Toast/Toast.ts:11](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Toast/Toast.ts#L11)

***

### \_events

> **\_events**: `object` = `{}`

#### Index signature

 \[`key`: `string`\]: `TCallback`[]

#### Inherited from

[`default`](../../../../utils/MicroEvent/classes/default.md).[`_events`](../../../../utils/MicroEvent/classes/default.md#_events)

#### Source

[packages/free-drawing/src/utils/MicroEvent.ts:33](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/utils/MicroEvent.ts#L33)

***

### timeout

> **timeout**: `number` = `5000`

#### Source

[packages/free-drawing/src/components/Toast/Toast.ts:12](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Toast/Toast.ts#L12)

## Methods

### destroy()

> **destroy**(): `void`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/Toast/Toast.ts:76](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Toast/Toast.ts#L76)

***

### hide()

> **hide**(): `void`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/Toast/Toast.ts:70](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Toast/Toast.ts#L70)

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

### show()

> **show**(): `void`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/Toast/Toast.ts:58](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Toast/Toast.ts#L58)

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
