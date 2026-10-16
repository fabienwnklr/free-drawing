**@fabwcie/free-drawing** • [API](../../../../README.md)

***

[@fabwcie/free-drawing](../../../../README.md) / [components/CommandPalette/CommandPalette](../README.md) / Command

# Type alias: Command

> **Command**: `object`

Command of palette

## Type declaration

### checked?

> **`optional`** **checked**: `boolean`

State of a toggle (grid, zen mode...) or current choice (tool, language)

### group

> **group**: [`TranslationKey`](../../../../i18n/en/type-aliases/TranslationKey.md)

Title of its group

### icon?

> **`optional`** **icon**: `string`

### id

> **id**: `string`

English words, also searched

### label

> **label**: `string`

Translated name

### run()

> **run**: () => `void`

#### Returns

`void`

### shortcut?

> **`optional`** **shortcut**: `string`

## Source

[packages/free-drawing/src/components/CommandPalette/CommandPalette.ts:54](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CommandPalette/CommandPalette.ts#L54)
