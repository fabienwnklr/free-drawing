**free-drawing** • [API](../../../../../README.md)

***

[free-drawing](../../../../../README.md) / [components/tools/Overlay/BaseOverlay](../README.md) / BaseOverlay

# Class: BaseOverlay

All common tool for all shape (color, opacity for now)

## Extended by

- [`BrushOverlay`](../../BrushOverlay/BrushOverlay/classes/BrushOverlay.md)
- [`SelectOverlay`](../../SelectOverlay/SelectOverlay/classes/SelectOverlay.md)

## Constructors

### new BaseOverlay(drawer)

> **new BaseOverlay**(`drawer`): [`BaseOverlay`](BaseOverlay.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../../Drawer/classes/Drawer.md)

#### Returns

[`BaseOverlay`](BaseOverlay.md)

#### Source

[components/tools/Overlay/BaseOverlay.ts:35](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L35)

## Properties

### $fontSizeBtnContainer

> **$fontSizeBtnContainer**: `HTMLDivElement`

#### Source

[components/tools/Overlay/BaseOverlay.ts:24](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L24)

***

### $fontSizeContainer

> **$fontSizeContainer**: `HTMLDivElement`

#### Source

[components/tools/Overlay/BaseOverlay.ts:23](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L23)

***

### $opacityContainer

> **$opacityContainer**: `HTMLDivElement`

#### Source

[components/tools/Overlay/BaseOverlay.ts:26](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L26)

***

### $opacityRange

> **$opacityRange**: `HTMLInputElement`

#### Source

[components/tools/Overlay/BaseOverlay.ts:27](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L27)

***

### $overlayContainer

> **$overlayContainer**: `HTMLDivElement`

#### Source

[components/tools/Overlay/BaseOverlay.ts:14](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L14)

***

### $strokeColorBtnContainer

> **$strokeColorBtnContainer**: `HTMLDivElement`

#### Source

[components/tools/Overlay/BaseOverlay.ts:18](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L18)

***

### $strokeColorContainer

> **$strokeColorContainer**: `HTMLDivElement`

#### Source

[components/tools/Overlay/BaseOverlay.ts:17](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L17)

***

### $strokeWidthBtnContainer

> **$strokeWidthBtnContainer**: `HTMLDivElement`

#### Source

[components/tools/Overlay/BaseOverlay.ts:21](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L21)

***

### $strokeWidthContainer

> **$strokeWidthContainer**: `HTMLDivElement`

#### Source

[components/tools/Overlay/BaseOverlay.ts:20](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L20)

***

### drawer

> **drawer**: [`Drawer`](../../../../../Drawer/classes/Drawer.md)

#### Source

[components/tools/Overlay/BaseOverlay.ts:15](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L15)

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

[components/tools/Overlay/BaseOverlay.ts:29](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L29)

## Methods

### appendContent()

> **appendContent**(`elements`): `void`

#### Parameters

• **elements**: `HTMLElement`[]

#### Returns

`void`

#### Source

[components/tools/Overlay/BaseOverlay.ts:187](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L187)

***

### hide()

> **hide**(): `void`

#### Returns

`void`

#### Source

[components/tools/Overlay/BaseOverlay.ts:255](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L255)

***

### show()

> **show**(`shape`?): `void`

#### Parameters

• **shape?**: (`Shape`\<`ShapeConfig`\> \| `Group`)[]

#### Returns

`void`

#### Source

[components/tools/Overlay/BaseOverlay.ts:191](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L191)
