**@fabwcie/free-drawing** • [API](../../../../README.md)

***

[@fabwcie/free-drawing](../../../../README.md) / [components/ColorPicker/ColorPicker](../README.md) / ColorPicker

# Class: ColorPicker

Palette buttons, optional transparent button and custom color input, added to given container

## Constructors

### new ColorPicker($container, options)

> **new ColorPicker**(`$container`, `options`): [`ColorPicker`](ColorPicker.md)

#### Parameters

• **$container**: `HTMLElement`

• **options**: [`ColorPickerOptions`](../type-aliases/ColorPickerOptions.md)

#### Returns

[`ColorPicker`](ColorPicker.md)

#### Source

[packages/free-drawing/src/components/ColorPicker/ColorPicker.ts:32](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ColorPicker/ColorPicker.ts#L32)

## Properties

### $buttons

> **`readonly`** **$buttons**: `HTMLButtonElement`[] = `[]`

#### Source

[packages/free-drawing/src/components/ColorPicker/ColorPicker.ts:28](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ColorPicker/ColorPicker.ts#L28)

***

### $customInput

> **`readonly`** **$customInput**: `HTMLInputElement`

#### Source

[packages/free-drawing/src/components/ColorPicker/ColorPicker.ts:29](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ColorPicker/ColorPicker.ts#L29)

## Methods

### setColor()

> **setColor**(`color`): `void`

Show current color: its palette button, or custom input when not in palette

#### Parameters

• **color**: [`ColorLike`](../../../../@types/drawer/type-aliases/ColorLike.md)

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/ColorPicker/ColorPicker.ts:73](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ColorPicker/ColorPicker.ts#L73)
