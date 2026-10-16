**@fabwcie/free-drawing** • [API](../../../README.md)

***

[@fabwcie/free-drawing](../../../README.md) / [utils/binding](../README.md) / findBindingTarget

# Function: findBindingTarget()

> **findBindingTarget**(`shapes`, `point`, `exclude`?): [`DrawingShape`](../../../@types/drawer/type-aliases/DrawingShape.md) \| `null`

Shape an arrow end can be linked to at a point: smallest visible shape around it (rectangles, ellipses, texts,
freehand drawings, groups), not arrows nor lines

## Parameters

• **shapes**: [`DrawingShape`](../../../@types/drawer/type-aliases/DrawingShape.md)[]

Drawing shapes

• **point**: `Vector2d`

• **exclude?**: `Node`\<`NodeConfig`\>

Arrow being drawn

## Returns

[`DrawingShape`](../../../@types/drawer/type-aliases/DrawingShape.md) \| `null`

## Source

[packages/free-drawing/src/utils/binding.ts:148](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/utils/binding.ts#L148)
