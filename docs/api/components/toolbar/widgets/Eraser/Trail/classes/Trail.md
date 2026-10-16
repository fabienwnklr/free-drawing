**@fabwcie/free-drawing** • [API](../../../../../../README.md)

***

[@fabwcie/free-drawing](../../../../../../README.md) / [components/toolbar/widgets/Eraser/Trail](../README.md) / Trail

# Class: Trail

Trail following pointer: thinner towards its tail, points disappear after `duration`

## Constructors

### new Trail(layer, options)

> **new Trail**(`layer`, `options`): [`Trail`](Trail.md)

#### Parameters

• **layer**: `Layer`

• **options**: `Partial`\<[`TrailOptions`](../type-aliases/TrailOptions.md)\>= `{}`

#### Returns

[`Trail`](Trail.md)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Eraser/Trail.ts:32](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Eraser/Trail.ts#L32)

## Properties

### options

> **`readonly`** **options**: [`TrailOptions`](../type-aliases/TrailOptions.md)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Eraser/Trail.ts:26](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Eraser/Trail.ts#L26)

## Methods

### add()

> **add**(`x`, `y`): `void`

Add pointer position (layer coordinates)

#### Parameters

• **x**: `number`

• **y**: `number`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Eraser/Trail.ts:62](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Eraser/Trail.ts#L62)

***

### destroy()

> **destroy**(): `void`

Remove trail now

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Eraser/Trail.ts:76](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Eraser/Trail.ts#L76)

***

### start()

> **start**(): `void`

Start following pointer, call `add` with its positions

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Eraser/Trail.ts:42](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Eraser/Trail.ts#L42)

***

### stop()

> **stop**(): `void`

Stop following pointer, trail fades out then is removed

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Eraser/Trail.ts:69](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Eraser/Trail.ts#L69)
