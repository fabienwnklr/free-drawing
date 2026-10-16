**@fabwcie/free-drawing** • [API](../../../../../README.md)

***

[@fabwcie/free-drawing](../../../../../README.md) / [components/tools/UndoRedo/History](../README.md) / History

# Class: History

## Extended by

- [`UndoRedo`](../../UndoRedo/classes/UndoRedo.md)

## Constructors

### new History(drawer)

> **new History**(`drawer`): [`History`](History.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../../Drawer/classes/Drawer.md)

#### Returns

[`History`](History.md)

#### Source

[packages/free-drawing/src/components/tools/UndoRedo/History.ts:40](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/UndoRedo/History.ts#L40)

## Properties

### appHistory

> **appHistory**: `string`[]

Drawing states, JSON of shapes array (string is lighter than objects and compared without serializing again)

#### Source

[packages/free-drawing/src/components/tools/UndoRedo/History.ts:36](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/UndoRedo/History.ts#L36)

***

### appHistoryStep

> **appHistoryStep**: `number` = `0`

#### Source

[packages/free-drawing/src/components/tools/UndoRedo/History.ts:37](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/UndoRedo/History.ts#L37)

***

### drawer

> **drawer**: [`Drawer`](../../../../../Drawer/classes/Drawer.md)

#### Source

[packages/free-drawing/src/components/tools/UndoRedo/History.ts:38](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/UndoRedo/History.ts#L38)

## Methods

### canRedo()

> **canRedo**(): `boolean`

#### Returns

`boolean`

#### Source

[packages/free-drawing/src/components/tools/UndoRedo/History.ts:97](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/UndoRedo/History.ts#L97)

***

### canUndo()

> **canUndo**(): `boolean`

#### Returns

`boolean`

#### Source

[packages/free-drawing/src/components/tools/UndoRedo/History.ts:86](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/UndoRedo/History.ts#L86)

***

### redo()

> **redo**(): `void`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/tools/UndoRedo/History.ts:101](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/UndoRedo/History.ts#L101)

***

### reset()

> **reset**(): `void`

Current drawing is the first state (e.g. loaded from storage): nothing to undo or redo

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/tools/UndoRedo/History.ts:81](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/UndoRedo/History.ts#L81)

***

### saveState()

> **saveState**(`fromSaved`): `void`

#### Parameters

• **fromSaved**: `boolean`= `false`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/tools/UndoRedo/History.ts:44](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/UndoRedo/History.ts#L44)

***

### undo()

> **undo**(): `void`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/tools/UndoRedo/History.ts:90](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/UndoRedo/History.ts#L90)
