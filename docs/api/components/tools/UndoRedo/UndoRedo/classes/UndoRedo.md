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

[packages/free-drawing/src/components/tools/UndoRedo/UndoRedo.ts:13](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/UndoRedo/UndoRedo.ts#L13)

## Properties

### $btnRedo

> **$btnRedo**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/tools/UndoRedo/UndoRedo.ts:11](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/UndoRedo/UndoRedo.ts#L11)

***

### $btnUndo

> **$btnUndo**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/tools/UndoRedo/UndoRedo.ts:10](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/UndoRedo/UndoRedo.ts#L10)

***

### $undoRedoContainer

> **$undoRedoContainer**: `HTMLDivElement`

#### Source

[packages/free-drawing/src/components/tools/UndoRedo/UndoRedo.ts:9](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/UndoRedo/UndoRedo.ts#L9)

***

### appHistory

> **appHistory**: `string`[]

Drawing states, JSON of shapes array (string is lighter than objects and compared without serializing again)

#### Inherited from

[`History`](../../History/classes/History.md).[`appHistory`](../../History/classes/History.md#apphistory)

#### Source

[packages/free-drawing/src/components/tools/UndoRedo/History.ts:36](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/UndoRedo/History.ts#L36)

***

### appHistoryStep

> **appHistoryStep**: `number` = `0`

#### Inherited from

[`History`](../../History/classes/History.md).[`appHistoryStep`](../../History/classes/History.md#apphistorystep)

#### Source

[packages/free-drawing/src/components/tools/UndoRedo/History.ts:37](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/UndoRedo/History.ts#L37)

***

### drawer

> **drawer**: [`Drawer`](../../../../../Drawer/classes/Drawer.md)

#### Inherited from

[`History`](../../History/classes/History.md).[`drawer`](../../History/classes/History.md#drawer)

#### Source

[packages/free-drawing/src/components/tools/UndoRedo/History.ts:38](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/UndoRedo/History.ts#L38)

## Methods

### canRedo()

> **canRedo**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`History`](../../History/classes/History.md).[`canRedo`](../../History/classes/History.md#canredo)

#### Source

[packages/free-drawing/src/components/tools/UndoRedo/History.ts:97](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/UndoRedo/History.ts#L97)

***

### canUndo()

> **canUndo**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`History`](../../History/classes/History.md).[`canUndo`](../../History/classes/History.md#canundo)

#### Source

[packages/free-drawing/src/components/tools/UndoRedo/History.ts:86](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/UndoRedo/History.ts#L86)

***

### manageButtons()

> **manageButtons**(): `void`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/tools/UndoRedo/UndoRedo.ts:71](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/UndoRedo/UndoRedo.ts#L71)

***

### manageRedoBtn()

> **manageRedoBtn**(): `void`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/tools/UndoRedo/UndoRedo.ts:63](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/UndoRedo/UndoRedo.ts#L63)

***

### manageUndoBtn()

> **manageUndoBtn**(): `void`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/tools/UndoRedo/UndoRedo.ts:55](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/UndoRedo/UndoRedo.ts#L55)

***

### redo()

> **redo**(): `void`

#### Returns

`void`

#### Overrides

[`History`](../../History/classes/History.md).[`redo`](../../History/classes/History.md#redo)

#### Source

[packages/free-drawing/src/components/tools/UndoRedo/UndoRedo.ts:50](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/UndoRedo/UndoRedo.ts#L50)

***

### reset()

> **reset**(): `void`

Current drawing is the first state (e.g. loaded from storage): nothing to undo or redo

#### Returns

`void`

#### Inherited from

[`History`](../../History/classes/History.md).[`reset`](../../History/classes/History.md#reset)

#### Source

[packages/free-drawing/src/components/tools/UndoRedo/History.ts:81](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/UndoRedo/History.ts#L81)

***

### saveState()

> **saveState**(`fromSaved`): `void`

#### Parameters

• **fromSaved**: `boolean`= `false`

#### Returns

`void`

#### Inherited from

[`History`](../../History/classes/History.md).[`saveState`](../../History/classes/History.md#savestate)

#### Source

[packages/free-drawing/src/components/tools/UndoRedo/History.ts:44](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/UndoRedo/History.ts#L44)

***

### undo()

> **undo**(): `void`

#### Returns

`void`

#### Overrides

[`History`](../../History/classes/History.md).[`undo`](../../History/classes/History.md#undo)

#### Source

[packages/free-drawing/src/components/tools/UndoRedo/UndoRedo.ts:45](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/UndoRedo/UndoRedo.ts#L45)
