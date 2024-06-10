**@fabwcie/free-drawing** • [API](../../../../../README.md)

***

[@fabwcie/free-drawing](../../../../../README.md) / [components/tools/Overlay/BaseOverlay](../README.md) / BaseOverlay

# Class: BaseOverlay

All common tool for all shape (color, opacity for now)

## Extended by

- [`BrushOverlay`](../../BrushOverlay/BrushOverlay/classes/BrushOverlay.md)
- [`SelectOverlay`](../../SelectOverlay/SelectOverlay/classes/SelectOverlay.md)
- [`ShapeOverlay`](../../ShapeOverlay/ShapeOverlay/classes/ShapeOverlay.md)

## Constructors

### new BaseOverlay(drawer)

> **new BaseOverlay**(`drawer`): [`BaseOverlay`](BaseOverlay.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../../Drawer/classes/Drawer.md)

#### Returns

[`BaseOverlay`](BaseOverlay.md)

#### Source

[components/tools/Overlay/BaseOverlay.ts:40](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L40)

## Properties

### $fontSizeBtnContainer

> **$fontSizeBtnContainer**: `HTMLDivElement`

#### Source

[components/tools/Overlay/BaseOverlay.ts:29](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L29)

***

### $fontSizeContainer

> **$fontSizeContainer**: `HTMLDivElement`

#### Source

[components/tools/Overlay/BaseOverlay.ts:28](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L28)

***

### $opacityContainer

> **$opacityContainer**: `HTMLDivElement`

#### Source

[components/tools/Overlay/BaseOverlay.ts:31](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L31)

***

### $opacityRange

> **$opacityRange**: `HTMLInputElement`

#### Source

[components/tools/Overlay/BaseOverlay.ts:32](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L32)

***

### $overlayContainer

> **$overlayContainer**: `HTMLDivElement`

#### Source

[components/tools/Overlay/BaseOverlay.ts:16](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L16)

***

### $strokeColorBtnContainer

> **$strokeColorBtnContainer**: `HTMLDivElement`

#### Source

[components/tools/Overlay/BaseOverlay.ts:20](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L20)

***

### $strokeColorContainer

> **$strokeColorContainer**: `HTMLDivElement`

#### Source

[components/tools/Overlay/BaseOverlay.ts:19](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L19)

***

### $strokeStyleBtnContainer

> **$strokeStyleBtnContainer**: `HTMLDivElement`

#### Source

[components/tools/Overlay/BaseOverlay.ts:26](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L26)

***

### $strokeStyleContainer

> **$strokeStyleContainer**: `HTMLDivElement`

#### Source

[components/tools/Overlay/BaseOverlay.ts:25](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L25)

***

### $strokeWidthBtnContainer

> **$strokeWidthBtnContainer**: `HTMLDivElement`

#### Source

[components/tools/Overlay/BaseOverlay.ts:23](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L23)

***

### $strokeWidthContainer

> **$strokeWidthContainer**: `HTMLDivElement`

#### Source

[components/tools/Overlay/BaseOverlay.ts:22](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L22)

***

### drawer

> **drawer**: [`Drawer`](../../../../../Drawer/classes/Drawer.md)

#### Source

[components/tools/Overlay/BaseOverlay.ts:17](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L17)

***

### selectors

> **selectors**: `object`

#### button

> **button**: `string` = `'overlay-picker__button'`

#### buttonContainer

> **buttonContainer**: `string` = `'overlay-picker-btn-container'`

#### container

> **container**: `string` = `'overlay-picker-container'`

#### Source

[components/tools/Overlay/BaseOverlay.ts:34](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L34)

## Methods

### appendContent()

> **appendContent**(`elements`): `void`

#### Parameters

• **elements**: `HTMLElement`[]

#### Returns

`void`

#### Source

[components/tools/Overlay/BaseOverlay.ts:241](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L241)

***

### hide()

> **hide**(): `void`

#### Returns

`void`

#### Source

[components/tools/Overlay/BaseOverlay.ts:321](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L321)

***

### show()

> **show**(`shape`?): `void`

#### Parameters

• **shape?**: (`Shape`\<`ShapeConfig`\> \| `Group`)[]

#### Returns

`void`

#### Source

[components/tools/Overlay/BaseOverlay.ts:245](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L245)
