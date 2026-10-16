**@fabwcie/free-drawing** • [API](../../../README.md)

***

[@fabwcie/free-drawing](../../../README.md) / [@types/toolbar](../README.md) / BrushWidgetOptions

# Type alias: BrushWidgetOptions

> **BrushWidgetOptions**: [`WidgetOptions`](WidgetOptions.md) & `object`

Brush options, freehand stroke settings of perfect-freehand

## Type declaration

### smoothing?

> **`optional`** **smoothing**: `number`

Softness of stroke edges, from 0 to 1 (1 by default)

### streamline?

> **`optional`** **streamline**: `number`

How much stroke is stabilized (follows pointer less closely), from 0 to 1 (0.5 by default)

### thinning?

> **`optional`** **thinning**: `number`

Effect of drawing speed on stroke width, from -1 to 1 (0.6 by default, 0 for constant width)

## Source

[packages/free-drawing/src/@types/toolbar.ts:62](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/@types/toolbar.ts#L62)
