**@fabwcie/free-drawing** • [API](../../../README.md)

***

[@fabwcie/free-drawing](../../../README.md) / [utils/binding](../README.md) / getBoundEnds

# Function: getBoundEnds()

> **getBoundEnds**(`layer`, `start`, `end`): `null` \| `object`

Ends of an arrow from its linked shapes (layer coordinates): at their side, or on their outline aiming at the
other end (its side, its shape center or its point)

## Parameters

• **layer**: `Container`\<`Node`\<`NodeConfig`\>, `ContainerConfig`\>

• **start**: `Vector2d` \| [`BoundEnd`](../type-aliases/BoundEnd.md)

Start linked to a shape, or start point

• **end**: `Vector2d` \| [`BoundEnd`](../type-aliases/BoundEnd.md)

End linked to a shape, or end point

## Returns

`null` \| `object`

## Source

[packages/free-drawing/src/utils/binding.ts:178](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/utils/binding.ts#L178)
