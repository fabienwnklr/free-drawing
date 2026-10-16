**@fabwcie/free-drawing** • [API](../../../../README.md)

***

[@fabwcie/free-drawing](../../../../README.md) / [components/ColorPicker/ColorPicker](../README.md) / ColorPickerOptions

# Type alias: ColorPickerOptions

> **ColorPickerOptions**: `object`

## Type declaration

### attr

> **attr**: `string`

Attribute of palette buttons, its value is the color

### buttonClass

> **buttonClass**: `string`

Class of palette buttons

### colors

> **colors**: `object`[]

Palette, with translation of accessible name of each color

### i18n

> **i18n**: [`I18n`](../../../../i18n/I18n/classes/I18n.md)

Texts of drawer

### onChange()

> **onChange**: (`color`) => `void`

Color chosen with a button or the custom input

#### Parameters

• **color**: [`ColorLike`](../../../../@types/drawer/type-aliases/ColorLike.md)

#### Returns

`void`

### transparent?

> **`optional`** **transparent**: `boolean`

Transparent button (default false)

## Source

[packages/free-drawing/src/components/ColorPicker/ColorPicker.ts:9](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ColorPicker/ColorPicker.ts#L9)
