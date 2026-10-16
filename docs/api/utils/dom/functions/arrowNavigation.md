**@fabwcie/free-drawing** • [API](../../../README.md)

***

[@fabwcie/free-drawing](../../../README.md) / [utils/dom](../README.md) / arrowNavigation

# Function: arrowNavigation()

> **arrowNavigation**(`$container`, `getItems`, `orientation`, `onMove`?): `void`

Arrow keys move focus between items (last to first and back), Home / End to first / last item.
Handled keys are not propagated, so drawer shortcuts (e.g. arrows moving selection) are not triggered.

## Parameters

• **$container**: `HTMLElement`

• **getItems**

• **orientation**: `"horizontal"` \| `"vertical"`

• **onMove?**

called with the newly focused item

## Returns

`void`

## Source

[packages/free-drawing/src/utils/dom.ts:76](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/utils/dom.ts#L76)
