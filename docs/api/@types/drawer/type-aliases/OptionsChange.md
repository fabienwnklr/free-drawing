**@fabwcie/free-drawing** • [API](../../../README.md)

***

[@fabwcie/free-drawing](../../../README.md) / [@types/drawer](../README.md) / OptionsChange

# Type alias: OptionsChange

> **OptionsChange**: `Partial`\<`Pick`\<[`DrawerOptions`](DrawerOptions.md), `"strokeColor"` \| `"fillColor"` \| `"strokeWidth"` \| `"strokeStyle"` \| `"edges"` \| `"opacity"`\>\> & `object`

Options changed by Drawer setters, sent with `drawer.options.change` event (only changed keys)

## Type declaration

### textStyle?

> **`optional`** **textStyle**: `Partial`\<[`TextStyle`](TextStyle.md)\>

## Source

[packages/free-drawing/src/@types/drawer.ts:144](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/@types/drawer.ts#L144)
