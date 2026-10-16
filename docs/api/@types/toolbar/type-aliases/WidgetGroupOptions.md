**@fabwcie/free-drawing** • [API](../../../README.md)

***

[@fabwcie/free-drawing](../../../README.md) / [@types/toolbar](../README.md) / WidgetGroupOptions

# Type alias: WidgetGroupOptions

> **WidgetGroupOptions**: `object`

Group of toolbar widgets (`widgetGroups` option): one button showing its widgets, at the place of the first one

## Type declaration

### icon?

> **`optional`** **icon**: `string`

Icon: 'shapes' (default), 'more', 'grid', 'plus', name of a widget (e.g. 'square') or svg code

### title?

> **`optional`** **title**: `string`

Button tooltip, "More tools" translated by default

### widgets

> **widgets**: [`WidgetName`](WidgetName.md)[]

Widgets of the group, in this order: widgets of `widgets` option only, each one in one group

## Source

[packages/free-drawing/src/@types/toolbar.ts:74](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/@types/toolbar.ts#L74)
