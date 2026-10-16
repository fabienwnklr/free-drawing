**@fabwcie/free-drawing** • [API](../../../../README.md)

***

[@fabwcie/free-drawing](../../../../README.md) / [components/Collaboration/Collaboration](../README.md) / Collaboration

# Class: Collaboration

Real time collaboration in a room: changes of drawing (any tool, undo...) are sent shape by shape to other users
of the room, through a socket.io server (see apps/server), so concurrent drawings are merged

## Constructors

### new Collaboration(drawer, socket, __namedParameters)

> **new Collaboration**(`drawer`, `socket`, `__namedParameters`): [`Collaboration`](Collaboration.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../Drawer/classes/Drawer.md)

• **socket**: [`CollaborationSocket`](../type-aliases/CollaborationSocket.md)

• **\_\_namedParameters**: [`CollaborationOptions`](../type-aliases/CollaborationOptions.md)

#### Returns

[`Collaboration`](Collaboration.md)

#### Source

[packages/free-drawing/src/components/Collaboration/Collaboration.ts:98](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Collaboration/Collaboration.ts#L98)

## Properties

### invitedBy?

> **`optional`** **`readonly`** **invitedBy**: `string`

#### Source

[packages/free-drawing/src/components/Collaboration/Collaboration.ts:79](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Collaboration/Collaboration.ts#L79)

***

### members

> **members**: [`CollaborationMember`](../type-aliases/CollaborationMember.md)[] = `[]`

Users of the room with their rights, this one included

#### Source

[packages/free-drawing/src/components/Collaboration/Collaboration.ts:75](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Collaboration/Collaboration.ts#L75)

***

### name

> **name**: `string`

Name shown to other users

#### Source

[packages/free-drawing/src/components/Collaboration/Collaboration.ts:71](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Collaboration/Collaboration.ts#L71)

***

### ownerKey?

> **`optional`** **`readonly`** **ownerKey**: `string`

#### Source

[packages/free-drawing/src/components/Collaboration/Collaboration.ts:78](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Collaboration/Collaboration.ts#L78)

***

### room

> **`readonly`** **room**: `string`

#### Source

[packages/free-drawing/src/components/Collaboration/Collaboration.ts:69](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Collaboration/Collaboration.ts#L69)

***

### socket

> **`readonly`** **socket**: [`CollaborationSocket`](../type-aliases/CollaborationSocket.md)

#### Source

[packages/free-drawing/src/components/Collaboration/Collaboration.ts:68](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Collaboration/Collaboration.ts#L68)

***

### userId

> **userId**: `string`

Id of this user: given by drawer, then by server when it joins (e.g. id of logged in account)

#### Source

[packages/free-drawing/src/components/Collaboration/Collaboration.ts:77](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Collaboration/Collaboration.ts#L77)

***

### users

> **users**: `string`[] = `[]`

Names of users of the room, this one included

#### Source

[packages/free-drawing/src/components/Collaboration/Collaboration.ts:73](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Collaboration/Collaboration.ts#L73)

## Accessors

### canEdit

> **`get`** **canEdit**(): `boolean`

This user can draw (given by owner of the room)

#### Returns

`boolean`

#### Source

[packages/free-drawing/src/components/Collaboration/Collaboration.ts:292](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Collaboration/Collaboration.ts#L292)

***

### isOwner

> **`get`** **isOwner**(): `boolean`

This user created the room: gives or removes the right to draw

#### Returns

`boolean`

#### Source

[packages/free-drawing/src/components/Collaboration/Collaboration.ts:284](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Collaboration/Collaboration.ts#L284)

## Methods

### flush()

> **flush**(): `boolean`

Apply changes received during a pointer action

#### Returns

`boolean`

true if a change was applied

#### Source

[packages/free-drawing/src/components/Collaboration/Collaboration.ts:371](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Collaboration/Collaboration.ts#L371)

***

### receive()

> **receive**(`change`): `void`

Apply change of another client, after current pointer action (not to alter shape being drawn)

#### Parameters

• **change**: [`DrawingChange`](../type-aliases/DrawingChange.md)

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/Collaboration/Collaboration.ts:350](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Collaboration/Collaboration.ts#L350)

***

### send()

> **send**(): `void`

Send shapes changed since last sync, called on drawer change

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/Collaboration/Collaboration.ts:327](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Collaboration/Collaboration.ts#L327)

***

### sendLive()

> **sendLive**(`shapes`): `void`

Shapes being drawn or moved shown to other users while drawing, final state is sent by `send` on change

#### Parameters

• **shapes**: [`DrawingShape`](../../../../@types/drawer/type-aliases/DrawingShape.md)[]

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/Collaboration/Collaboration.ts:189](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Collaboration/Collaboration.ts#L189)

***

### setLaser()

> **setLaser**(`on`): `void`

Laser used (pressed) by this user: its trail is shown to other users with pointer

#### Parameters

• **on**: `boolean`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/Collaboration/Collaboration.ts:178](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Collaboration/Collaboration.ts#L178)

***

### setName()

> **setName**(`name`): `void`

Change name shown to other users

#### Parameters

• **name**: `string`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/Collaboration/Collaboration.ts:306](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Collaboration/Collaboration.ts#L306)

***

### setRight()

> **setRight**(`userId`, `canEdit`): `void`

Give or remove the right to draw to a user of the room (owner only, checked by server)

#### Parameters

• **userId**: `string`

• **canEdit**: `boolean`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/Collaboration/Collaboration.ts:299](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Collaboration/Collaboration.ts#L299)

***

### stop()

> **stop**(): `void`

Leave room, cursors of other users removed

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/Collaboration/Collaboration.ts:314](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Collaboration/Collaboration.ts#L314)

***

### updateCursors()

> **updateCursors**(): `void`

Cursors size kept after zoom

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/Collaboration/Collaboration.ts:277](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Collaboration/Collaboration.ts#L277)
