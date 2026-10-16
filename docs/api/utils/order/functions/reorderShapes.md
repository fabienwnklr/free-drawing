**@fabwcie/free-drawing** • [API](../../../README.md)

***

[@fabwcie/free-drawing](../../../README.md) / [utils/order](../README.md) / reorderShapes

# Function: reorderShapes()

> **reorderShapes**(`shapes`, `order`): `boolean`

Move shapes in stacking order of their layer, relative order of moved shapes is kept.
`forward` / `backward`: above / below the next shape they overlap (moving past other shapes changes nothing),
`front` / `back`: above / below all shapes

## Parameters

• **shapes**: `Node`\<`NodeConfig`\>[]

• **order**: [`ShapeOrder`](../../../@types/drawer/type-aliases/ShapeOrder.md)

## Returns

`boolean`

true if a shape moved

## Source

[packages/free-drawing/src/utils/order.ts:12](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/utils/order.ts#L12)
