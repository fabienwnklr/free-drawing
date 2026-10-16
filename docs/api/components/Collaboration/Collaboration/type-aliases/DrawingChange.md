**@fabwcie/free-drawing** • [API](../../../../README.md)

***

[@fabwcie/free-drawing](../../../../README.md) / [components/Collaboration/Collaboration](../README.md) / DrawingChange

# Type alias: DrawingChange

> **DrawingChange**: `object`

Drawing change sent to other clients: shapes added or updated (konva JSON), ids of removed shapes,
`order`: ids of all shapes from bottom to top when stacking order changed,
`live`: preview of shapes being drawn or moved (final change follows)

## Type declaration

### live?

> **`optional`** **live**: `boolean`

### order?

> **`optional`** **order**: `string`[]

### remove

> **remove**: `string`[]

### upsert

> **upsert**: `string`[]

## Source

[packages/free-drawing/src/components/Collaboration/Collaboration.ts:24](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Collaboration/Collaboration.ts#L24)
