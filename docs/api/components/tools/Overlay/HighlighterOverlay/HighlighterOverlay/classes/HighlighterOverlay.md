**@fabwcie/free-drawing** • [API](../../../../../../README.md)

***

[@fabwcie/free-drawing](../../../../../../README.md) / [components/tools/Overlay/HighlighterOverlay/HighlighterOverlay](../README.md) / HighlighterOverlay

# Class: HighlighterOverlay

Options of highlighter: its own colors and widths, not those of other tools

## Constructors

### new HighlighterOverlay(drawer, options)

> **new HighlighterOverlay**(`drawer`, `options`): [`HighlighterOverlay`](HighlighterOverlay.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../../../Drawer/classes/Drawer.md)

• **options**: [`HighlighterOverlayOptions`](../type-aliases/HighlighterOverlayOptions.md)

#### Returns

[`HighlighterOverlay`](HighlighterOverlay.md)

#### Source

[packages/free-drawing/src/components/tools/Overlay/HighlighterOverlay/HighlighterOverlay.ts:40](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/Overlay/HighlighterOverlay/HighlighterOverlay.ts#L40)

## Properties

### $overlayContainer

> **`readonly`** **$overlayContainer**: `HTMLDivElement`

#### Source

[packages/free-drawing/src/components/tools/Overlay/HighlighterOverlay/HighlighterOverlay.ts:36](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/Overlay/HighlighterOverlay/HighlighterOverlay.ts#L36)

***

### $sizeButtons

> **`readonly`** **$sizeButtons**: `HTMLButtonElement`[]

#### Source

[packages/free-drawing/src/components/tools/Overlay/HighlighterOverlay/HighlighterOverlay.ts:38](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/Overlay/HighlighterOverlay/HighlighterOverlay.ts#L38)

***

### colorPicker

> **`readonly`** **colorPicker**: [`ColorPicker`](../../../../../ColorPicker/ColorPicker/classes/ColorPicker.md)

#### Source

[packages/free-drawing/src/components/tools/Overlay/HighlighterOverlay/HighlighterOverlay.ts:37](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/Overlay/HighlighterOverlay/HighlighterOverlay.ts#L37)

## Methods

### hide()

> **hide**(): `void`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/tools/Overlay/HighlighterOverlay/HighlighterOverlay.ts:87](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/Overlay/HighlighterOverlay/HighlighterOverlay.ts#L87)

***

### setChange()

> **setChange**(`change`): `void`

Color or size chosen: fields updated, widget told

#### Parameters

• **change**

• **change\.color?**: [`ColorLike`](../../../../../../@types/drawer/type-aliases/ColorLike.md)

• **change\.size?**: `number`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/tools/Overlay/HighlighterOverlay/HighlighterOverlay.ts:77](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/Overlay/HighlighterOverlay/HighlighterOverlay.ts#L77)

***

### show()

> **show**(): `void`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/tools/Overlay/HighlighterOverlay/HighlighterOverlay.ts:83](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/tools/Overlay/HighlighterOverlay/HighlighterOverlay.ts#L83)
