**@fabwcie/free-drawing** • [API](../../../../../../README.md)

***

[@fabwcie/free-drawing](../../../../../../README.md) / [components/tools/Overlay/BrushOverlay/BrushOverlay](../README.md) / BrushOverlay

# Class: BrushOverlay

All common tool for all shape (color, opacity for now)

## Extends

- [`BaseOverlay`](../../../BaseOverlay/classes/BaseOverlay.md)

## Constructors

### new BrushOverlay(drawer)

> **new BrushOverlay**(`drawer`): [`BrushOverlay`](BrushOverlay.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../../../Drawer/classes/Drawer.md)

#### Returns

[`BrushOverlay`](BrushOverlay.md)

#### Overrides

[`BaseOverlay`](../../../BaseOverlay/classes/BaseOverlay.md).[`constructor`](../../../BaseOverlay/classes/BaseOverlay.md#constructors)

#### Source

[components/tools/Overlay/BrushOverlay/BrushOverlay.ts:8](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BrushOverlay/BrushOverlay.ts#L8)

## Properties

### $fontSizeBtnContainer

> **$fontSizeBtnContainer**: `HTMLDivElement`

#### Inherited from

[`BaseOverlay`](../../../BaseOverlay/classes/BaseOverlay.md).[`$fontSizeBtnContainer`](../../../BaseOverlay/classes/BaseOverlay.md#$fontsizebtncontainer)

#### Source

[components/tools/Overlay/BaseOverlay.ts:24](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L24)

***

### $fontSizeContainer

> **$fontSizeContainer**: `HTMLDivElement`

#### Inherited from

[`BaseOverlay`](../../../BaseOverlay/classes/BaseOverlay.md).[`$fontSizeContainer`](../../../BaseOverlay/classes/BaseOverlay.md#$fontsizecontainer)

#### Source

[components/tools/Overlay/BaseOverlay.ts:23](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L23)

***

### $opacityContainer

> **$opacityContainer**: `HTMLDivElement`

#### Inherited from

[`BaseOverlay`](../../../BaseOverlay/classes/BaseOverlay.md).[`$opacityContainer`](../../../BaseOverlay/classes/BaseOverlay.md#$opacitycontainer)

#### Source

[components/tools/Overlay/BaseOverlay.ts:26](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L26)

***

### $opacityRange

> **$opacityRange**: `HTMLInputElement`

#### Inherited from

[`BaseOverlay`](../../../BaseOverlay/classes/BaseOverlay.md).[`$opacityRange`](../../../BaseOverlay/classes/BaseOverlay.md#$opacityrange)

#### Source

[components/tools/Overlay/BaseOverlay.ts:27](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L27)

***

### $overlayContainer

> **$overlayContainer**: `HTMLDivElement`

#### Inherited from

[`BaseOverlay`](../../../BaseOverlay/classes/BaseOverlay.md).[`$overlayContainer`](../../../BaseOverlay/classes/BaseOverlay.md#$overlaycontainer)

#### Source

[components/tools/Overlay/BaseOverlay.ts:14](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L14)

***

### $strokeColorBtnContainer

> **$strokeColorBtnContainer**: `HTMLDivElement`

#### Inherited from

[`BaseOverlay`](../../../BaseOverlay/classes/BaseOverlay.md).[`$strokeColorBtnContainer`](../../../BaseOverlay/classes/BaseOverlay.md#$strokecolorbtncontainer)

#### Source

[components/tools/Overlay/BaseOverlay.ts:18](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L18)

***

### $strokeColorContainer

> **$strokeColorContainer**: `HTMLDivElement`

#### Inherited from

[`BaseOverlay`](../../../BaseOverlay/classes/BaseOverlay.md).[`$strokeColorContainer`](../../../BaseOverlay/classes/BaseOverlay.md#$strokecolorcontainer)

#### Source

[components/tools/Overlay/BaseOverlay.ts:17](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L17)

***

### $strokeWidthBtnContainer

> **$strokeWidthBtnContainer**: `HTMLDivElement`

#### Inherited from

[`BaseOverlay`](../../../BaseOverlay/classes/BaseOverlay.md).[`$strokeWidthBtnContainer`](../../../BaseOverlay/classes/BaseOverlay.md#$strokewidthbtncontainer)

#### Source

[components/tools/Overlay/BaseOverlay.ts:21](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L21)

***

### $strokeWidthContainer

> **$strokeWidthContainer**: `HTMLDivElement`

#### Inherited from

[`BaseOverlay`](../../../BaseOverlay/classes/BaseOverlay.md).[`$strokeWidthContainer`](../../../BaseOverlay/classes/BaseOverlay.md#$strokewidthcontainer)

#### Source

[components/tools/Overlay/BaseOverlay.ts:20](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L20)

***

### drawer

> **drawer**: [`Drawer`](../../../../../../Drawer/classes/Drawer.md)

#### Inherited from

[`BaseOverlay`](../../../BaseOverlay/classes/BaseOverlay.md).[`drawer`](../../../BaseOverlay/classes/BaseOverlay.md#drawer)

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

#### Inherited from

[`BaseOverlay`](../../../BaseOverlay/classes/BaseOverlay.md).[`selectors`](../../../BaseOverlay/classes/BaseOverlay.md#selectors)

#### Source

[components/tools/Overlay/BaseOverlay.ts:29](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L29)

## Methods

### appendContent()

> **appendContent**(`elements`): `void`

#### Parameters

• **elements**: `HTMLElement`[]

#### Returns

`void`

#### Inherited from

[`BaseOverlay`](../../../BaseOverlay/classes/BaseOverlay.md).[`appendContent`](../../../BaseOverlay/classes/BaseOverlay.md#appendcontent)

#### Source

[components/tools/Overlay/BaseOverlay.ts:187](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L187)

***

### hide()

> **hide**(): `void`

#### Returns

`void`

#### Inherited from

[`BaseOverlay`](../../../BaseOverlay/classes/BaseOverlay.md).[`hide`](../../../BaseOverlay/classes/BaseOverlay.md#hide)

#### Source

[components/tools/Overlay/BaseOverlay.ts:255](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L255)

***

### show()

> **show**(`shape`?): `void`

#### Parameters

• **shape?**: (`Shape`\<`ShapeConfig`\> \| `Group`)[]

#### Returns

`void`

#### Inherited from

[`BaseOverlay`](../../../BaseOverlay/classes/BaseOverlay.md).[`show`](../../../BaseOverlay/classes/BaseOverlay.md#show)

#### Source

[components/tools/Overlay/BaseOverlay.ts:191](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/tools/Overlay/BaseOverlay.ts#L191)
