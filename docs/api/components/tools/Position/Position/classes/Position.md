**@fabwcie/free-drawing** • [API](../../../../../README.md)

***

[@fabwcie/free-drawing](../../../../../README.md) / [components/tools/Position/Position](../README.md) / Position

# Class: Position

Position of view (x / y), with a button back to origin: not to get lost when moving

## Constructors

### new Position(drawer)

> **new Position**(`drawer`): [`Position`](Position.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../../Drawer/classes/Drawer.md)

#### Returns

[`Position`](Position.md)

#### Source

[packages/free-drawing/src/components/tools/Position/Position.ts:18](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/Position/Position.ts#L18)

## Properties

### $btnRecenter

> **$btnRecenter**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/tools/Position/Position.ts:14](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/Position/Position.ts#L14)

***

### $coordinates

> **$coordinates**: `HTMLSpanElement`

#### Source

[packages/free-drawing/src/components/tools/Position/Position.ts:13](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/Position/Position.ts#L13)

***

### $positionContainer

> **$positionContainer**: `HTMLDivElement`

#### Source

[packages/free-drawing/src/components/tools/Position/Position.ts:12](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/Position/Position.ts#L12)

***

### drawer

> **drawer**: [`Drawer`](../../../../../Drawer/classes/Drawer.md)

#### Source

[packages/free-drawing/src/components/tools/Position/Position.ts:11](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/Position/Position.ts#L11)

## Methods

### getPosition()

> **getPosition**(): `Vector2d`

Move of view center from origin, in canvas coordinates: 0, 0 at start, zoom on view center does not change it

#### Returns

`Vector2d`

#### Source

[packages/free-drawing/src/components/tools/Position/Position.ts:63](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/Position/Position.ts#L63)

***

### recenter()

> **recenter**(): `void`

Move view back to origin (view center at its start place), zoom is kept

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/tools/Position/Position.ts:78](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/Position/Position.ts#L78)

***

### update()

> **update**(): `void`

Show current position, called after each view move or zoom

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/tools/Position/Position.ts:89](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/Position/Position.ts#L89)
