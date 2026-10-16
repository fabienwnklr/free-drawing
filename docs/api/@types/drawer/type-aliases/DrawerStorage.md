**@fabwcie/free-drawing** • [API](../../../README.md)

***

[@fabwcie/free-drawing](../../../README.md) / [@types/drawer](../README.md) / DrawerStorage

# Type alias: DrawerStorage

> **DrawerStorage**: `object`

Drawing saved somewhere else than localStorage (`storage` option)

## Type declaration

### load()

> **load**: () => [`DrawingFile`](../../../utils/drawingFile/type-aliases/DrawingFile.md) \| `string` \| `null` \| `Promise`\<[`DrawingFile`](../../../utils/drawingFile/type-aliases/DrawingFile.md) \| `string` \| `null`\>

Saved drawing, null if none: loaded on init (see `ready`) and by `loadFromStorage`

#### Returns

[`DrawingFile`](../../../utils/drawingFile/type-aliases/DrawingFile.md) \| `string` \| `null` \| `Promise`\<[`DrawingFile`](../../../utils/drawingFile/type-aliases/DrawingFile.md) \| `string` \| `null`\>

### save()

> **save**: (`file`) => `void` \| `Promise`\<`void`\>

Save drawing (on each change with `autoSave`): one call at a time, last drawing saved once current call ends

#### Parameters

• **file**: [`DrawingFile`](../../../utils/drawingFile/type-aliases/DrawingFile.md)

#### Returns

`void` \| `Promise`\<`void`\>

## Source

[packages/free-drawing/src/@types/drawer.ts:86](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/@types/drawer.ts#L86)
