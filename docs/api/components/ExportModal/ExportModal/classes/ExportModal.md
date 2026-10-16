**@fabwcie/free-drawing** • [API](../../../../README.md)

***

[@fabwcie/free-drawing](../../../../README.md) / [components/ExportModal/ExportModal](../README.md) / ExportModal

# Class: ExportModal

Export dialog: preview, options (selected shapes or whole drawing, background, dark mode, scale),
image or drawing file saved, image copied to clipboard

## Extends

- [`Modal`](../../../Modal/Modal/classes/Modal.md)

## Constructors

### new ExportModal(drawer)

> **new ExportModal**(`drawer`): [`ExportModal`](ExportModal.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../Drawer/classes/Drawer.md)

#### Returns

[`ExportModal`](ExportModal.md)

#### Overrides

[`Modal`](../../../Modal/Modal/classes/Modal.md).[`constructor`](../../../Modal/Modal/classes/Modal.md#constructors)

#### Source

[packages/free-drawing/src/components/ExportModal/ExportModal.ts:24](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ExportModal/ExportModal.ts#L24)

## Properties

### $backdrop

> **$backdrop**: `HTMLDivElement`

#### Inherited from

[`Modal`](../../../Modal/Modal/classes/Modal.md).[`$backdrop`](../../../Modal/Modal/classes/Modal.md#$backdrop)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:19](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L19)

***

### $background

> **$background**: `HTMLInputElement`

#### Source

[packages/free-drawing/src/components/ExportModal/ExportModal.ts:19](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ExportModal/ExportModal.ts#L19)

***

### $buttons

> **$buttons**: `HTMLButtonElement`[]

#### Source

[packages/free-drawing/src/components/ExportModal/ExportModal.ts:22](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ExportModal/ExportModal.ts#L22)

***

### $dark

> **$dark**: `HTMLInputElement`

#### Source

[packages/free-drawing/src/components/ExportModal/ExportModal.ts:20](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ExportModal/ExportModal.ts#L20)

***

### $empty

> **$empty**: `HTMLParagraphElement`

#### Source

[packages/free-drawing/src/components/ExportModal/ExportModal.ts:17](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ExportModal/ExportModal.ts#L17)

***

### $modal

> **$modal**: `HTMLDivElement`

#### Inherited from

[`Modal`](../../../Modal/Modal/classes/Modal.md).[`$modal`](../../../Modal/Modal/classes/Modal.md#$modal)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:13](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L13)

***

### $modalBody

> **$modalBody**: `HTMLDivElement`

#### Inherited from

[`Modal`](../../../Modal/Modal/classes/Modal.md).[`$modalBody`](../../../Modal/Modal/classes/Modal.md#$modalbody)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:15](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L15)

***

### $modalFooter

> **$modalFooter**: `HTMLDivElement`

#### Inherited from

[`Modal`](../../../Modal/Modal/classes/Modal.md).[`$modalFooter`](../../../Modal/Modal/classes/Modal.md#$modalfooter)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:16](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L16)

***

### $modalHeader

> **$modalHeader**: `HTMLDivElement`

#### Inherited from

[`Modal`](../../../Modal/Modal/classes/Modal.md).[`$modalHeader`](../../../Modal/Modal/classes/Modal.md#$modalheader)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:14](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L14)

***

### $preview

> **$preview**: `HTMLCanvasElement`

Rendered image, replaced on each update

#### Source

[packages/free-drawing/src/components/ExportModal/ExportModal.ts:15](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ExportModal/ExportModal.ts#L15)

***

### $previewContainer

> **$previewContainer**: `HTMLDivElement`

#### Source

[packages/free-drawing/src/components/ExportModal/ExportModal.ts:16](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ExportModal/ExportModal.ts#L16)

***

### $scales

> **$scales**: `HTMLInputElement`[]

#### Source

[packages/free-drawing/src/components/ExportModal/ExportModal.ts:21](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ExportModal/ExportModal.ts#L21)

***

### $selected

> **$selected**: `HTMLInputElement`

#### Source

[packages/free-drawing/src/components/ExportModal/ExportModal.ts:18](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ExportModal/ExportModal.ts#L18)

***

### drawer

> **drawer**: [`Drawer`](../../../../Drawer/classes/Drawer.md)

#### Inherited from

[`Modal`](../../../Modal/Modal/classes/Modal.md).[`drawer`](../../../Modal/Modal/classes/Modal.md#drawer)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:18](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L18)

***

### options

> **options**: [`ModalOptions`](../../../../@types/modal/interfaces/ModalOptions.md)

#### Inherited from

[`Modal`](../../../Modal/Modal/classes/Modal.md).[`options`](../../../Modal/Modal/classes/Modal.md#options)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:17](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L17)

## Accessors

### exportOptions

> **`get`** **exportOptions**(): `Required`\<[`ExportImageOptions`](../../../../Drawer/type-aliases/ExportImageOptions.md)\>

Options chosen in dialog

#### Returns

`Required`\<[`ExportImageOptions`](../../../../Drawer/type-aliases/ExportImageOptions.md)\>

#### Source

[packages/free-drawing/src/components/ExportModal/ExportModal.ts:120](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ExportModal/ExportModal.ts#L120)

## Methods

### appendBodyContent()

> **appendBodyContent**(`content`): `void`

#### Parameters

• **content**: `string`

#### Returns

`void`

#### Inherited from

[`Modal`](../../../Modal/Modal/classes/Modal.md).[`appendBodyContent`](../../../Modal/Modal/classes/Modal.md#appendbodycontent)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:170](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L170)

***

### copy()

> **copy**(): `Promise`\<`void`\>

Copy png image to clipboard

#### Returns

`Promise`\<`void`\>

#### Source

[packages/free-drawing/src/components/ExportModal/ExportModal.ts:191](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ExportModal/ExportModal.ts#L191)

***

### destroy()

> **destroy**(): `void`

#### Returns

`void`

#### Inherited from

[`Modal`](../../../Modal/Modal/classes/Modal.md).[`destroy`](../../../Modal/Modal/classes/Modal.md#destroy)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:222](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L222)

***

### hide()

> **hide**(): `void`

#### Returns

`void`

#### Inherited from

[`Modal`](../../../Modal/Modal/classes/Modal.md).[`hide`](../../../Modal/Modal/classes/Modal.md#hide)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:202](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L202)

***

### isVisible()

> **isVisible**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`Modal`](../../../Modal/Modal/classes/Modal.md).[`isVisible`](../../../Modal/Modal/classes/Modal.md#isvisible)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:218](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L218)

***

### save()

> **save**(`format`): `Promise`\<`void`\>

Save image or drawing file (selected shapes or whole drawing)

#### Parameters

• **format**: [`ImageFormat`](../../../../utils/export/type-aliases/ImageFormat.md) \| `"json"`

#### Returns

`Promise`\<`void`\>

#### Source

[packages/free-drawing/src/components/ExportModal/ExportModal.ts:169](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ExportModal/ExportModal.ts#L169)

***

### setBodyContent()

> **setBodyContent**(`content`): `void`

#### Parameters

• **content**: `string`

#### Returns

`void`

#### Inherited from

[`Modal`](../../../Modal/Modal/classes/Modal.md).[`setBodyContent`](../../../Modal/Modal/classes/Modal.md#setbodycontent)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:166](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L166)

***

### setFooterContent()

> **setFooterContent**(`content`): `void`

#### Parameters

• **content**: `string`

#### Returns

`void`

#### Inherited from

[`Modal`](../../../Modal/Modal/classes/Modal.md).[`setFooterContent`](../../../Modal/Modal/classes/Modal.md#setfootercontent)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:174](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L174)

***

### setHeaderContent()

> **setHeaderContent**(`content`): `void`

#### Parameters

• **content**: `string`

#### Returns

`void`

#### Inherited from

[`Modal`](../../../Modal/Modal/classes/Modal.md).[`setHeaderContent`](../../../Modal/Modal/classes/Modal.md#setheadercontent)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:160](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L160)

***

### setTitle()

> **setTitle**(`title`): `void`

Title in header

#### Parameters

• **title**: `string`

#### Returns

`void`

#### Inherited from

[`Modal`](../../../Modal/Modal/classes/Modal.md).[`setTitle`](../../../Modal/Modal/classes/Modal.md#settitle)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:65](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L65)

***

### show()

> **show**(): `void`

Show dialog, selected shapes exported when there is a selection (whole drawing can be chosen in dialog)

#### Returns

`void`

#### Overrides

[`Modal`](../../../Modal/Modal/classes/Modal.md).[`show`](../../../Modal/Modal/classes/Modal.md#show)

#### Source

[packages/free-drawing/src/components/ExportModal/ExportModal.ts:132](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ExportModal/ExportModal.ts#L132)

***

### updatePreview()

> **updatePreview**(): `void`

Preview rendered at once (canvas shown as is: no image encoding), at screen resolution

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/ExportModal/ExportModal.ts:146](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ExportModal/ExportModal.ts#L146)
