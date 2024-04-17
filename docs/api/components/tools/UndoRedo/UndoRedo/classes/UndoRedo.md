**@fabwcie/free-drawing** • [API](../../../../../README.md)

***

[@fabwcie/free-drawing](../../../../../README.md) / [components/tools/UndoRedo/UndoRedo](../README.md) / UndoRedo

# Class: UndoRedo

## Extends

- [`History`](../../History/classes/History.md)

## Constructors

### new UndoRedo(drawer)

> **new UndoRedo**(`drawer`): [`UndoRedo`](UndoRedo.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../../Drawer/classes/Drawer.md)

#### Returns

[`UndoRedo`](UndoRedo.md)

#### Overrides

[`History`](../../History/classes/History.md).[`constructor`](../../History/classes/History.md#constructors)

#### Source

[components/tools/UndoRedo/UndoRedo.ts:13](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/UndoRedo/UndoRedo.ts#L13)

## Properties

### $btnRedo

> **$btnRedo**: `HTMLButtonElement`

#### Source

[components/tools/UndoRedo/UndoRedo.ts:11](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/UndoRedo/UndoRedo.ts#L11)

***

### $btnUndo

> **$btnUndo**: `HTMLButtonElement`

#### Source

[components/tools/UndoRedo/UndoRedo.ts:10](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/UndoRedo/UndoRedo.ts#L10)

***

### $undoRedoContainer

> **$undoRedoContainer**: `HTMLDivElement`

#### Source

[components/tools/UndoRedo/UndoRedo.ts:9](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/UndoRedo/UndoRedo.ts#L9)

***

### appHistory

> **appHistory**: `object`[][]

#### Inherited from

[`History`](../../History/classes/History.md).[`appHistory`](../../History/classes/History.md#apphistory)

#### Source

[components/tools/UndoRedo/History.ts:7](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/UndoRedo/History.ts#L7)

***

### appHistoryStep

> **appHistoryStep**: `number` = `0`

#### Inherited from

[`History`](../../History/classes/History.md).[`appHistoryStep`](../../History/classes/History.md#apphistorystep)

#### Source

[components/tools/UndoRedo/History.ts:8](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/UndoRedo/History.ts#L8)

***

### drawer

> **drawer**: [`Drawer`](../../../../../Drawer/classes/Drawer.md)

#### Inherited from

[`History`](../../History/classes/History.md).[`drawer`](../../History/classes/History.md#drawer)

#### Source

[components/tools/UndoRedo/History.ts:9](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/UndoRedo/History.ts#L9)

## Methods

### canRedo()

> **canRedo**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`History`](../../History/classes/History.md).[`canRedo`](../../History/classes/History.md#canredo)

#### Source

[components/tools/UndoRedo/History.ts:56](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/UndoRedo/History.ts#L56)

***

### canUndo()

> **canUndo**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`History`](../../History/classes/History.md).[`canUndo`](../../History/classes/History.md#canundo)

#### Source

[components/tools/UndoRedo/History.ts:25](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/UndoRedo/History.ts#L25)

***

### manageButtons()

> **manageButtons**(): `void`

#### Returns

`void`

#### Source

[components/tools/UndoRedo/UndoRedo.ts:68](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/UndoRedo/UndoRedo.ts#L68)

***

### manageRedoBtn()

> **manageRedoBtn**(): `void`

#### Returns

`void`

#### Source

[components/tools/UndoRedo/UndoRedo.ts:60](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/UndoRedo/UndoRedo.ts#L60)

***

### manageUndoBtn()

> **manageUndoBtn**(): `void`

#### Returns

`void`

#### Source

[components/tools/UndoRedo/UndoRedo.ts:51](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/UndoRedo/UndoRedo.ts#L51)

***

### redo()

> **redo**(): `void`

#### Returns

`void`

#### Inherited from

[`History`](../../History/classes/History.md).[`redo`](../../History/classes/History.md#redo)

#### Source

[components/tools/UndoRedo/History.ts:60](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/UndoRedo/History.ts#L60)

***

### saveState()

> **saveState**(): `void`

#### Returns

`void`

#### Inherited from

[`History`](../../History/classes/History.md).[`saveState`](../../History/classes/History.md#savestate)

#### Source

[components/tools/UndoRedo/History.ts:15](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/UndoRedo/History.ts#L15)

***

### undo()

> **undo**(): `void`

#### Returns

`void`

#### Inherited from

[`History`](../../History/classes/History.md).[`undo`](../../History/classes/History.md#undo)

#### Source

[components/tools/UndoRedo/History.ts:28](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/UndoRedo/History.ts#L28)
