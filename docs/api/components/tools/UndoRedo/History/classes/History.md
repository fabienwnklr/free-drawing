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

[components/tools/UndoRedo/History.ts:11](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/UndoRedo/History.ts#L11)

## Properties

### appHistory

> **appHistory**: `object`[][]

#### Source

[components/tools/UndoRedo/History.ts:7](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/UndoRedo/History.ts#L7)

***

### appHistoryStep

> **appHistoryStep**: `number` = `0`

#### Source

[components/tools/UndoRedo/History.ts:8](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/UndoRedo/History.ts#L8)

***

### drawer

> **drawer**: [`Drawer`](../../../../../Drawer/classes/Drawer.md)

#### Source

[components/tools/UndoRedo/History.ts:9](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/UndoRedo/History.ts#L9)

## Methods

### canRedo()

> **canRedo**(): `boolean`

#### Returns

`boolean`

#### Source

[components/tools/UndoRedo/History.ts:56](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/UndoRedo/History.ts#L56)

***

### canUndo()

> **canUndo**(): `boolean`

#### Returns

`boolean`

#### Source

[components/tools/UndoRedo/History.ts:25](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/UndoRedo/History.ts#L25)

***

### redo()

> **redo**(): `void`

#### Returns

`void`

#### Source

[components/tools/UndoRedo/History.ts:60](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/UndoRedo/History.ts#L60)

***

### saveState()

> **saveState**(): `void`

#### Returns

`void`

#### Source

[components/tools/UndoRedo/History.ts:15](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/UndoRedo/History.ts#L15)

***

### undo()

> **undo**(): `void`

#### Returns

`void`

#### Source

[components/tools/UndoRedo/History.ts:28](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/UndoRedo/History.ts#L28)
