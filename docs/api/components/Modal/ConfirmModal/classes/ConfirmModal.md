**@fabwcie/free-drawing** • [API](../../../../README.md)

***

[@fabwcie/free-drawing](../../../../README.md) / [components/Modal/ConfirmModal](../README.md) / ConfirmModal

# Class: ConfirmModal

## Extends

- [`Modal`](../../Modal/classes/Modal.md)

## Constructors

### new ConfirmModal(drawer, options)

> **new ConfirmModal**(`drawer`, `options`): [`ConfirmModal`](ConfirmModal.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../Drawer/classes/Drawer.md)

• **options**: `Partial`\<[`ConfirmModalOptions`](../../../../@types/modal/type-aliases/ConfirmModalOptions.md)\>= `{}`

#### Returns

[`ConfirmModal`](ConfirmModal.md)

#### Overrides

[`Modal`](../../Modal/classes/Modal.md).[`constructor`](../../Modal/classes/Modal.md#constructors)

#### Source

[packages/free-drawing/src/components/Modal/ConfirmModal.ts:20](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/ConfirmModal.ts#L20)

## Properties

### $backdrop

> **$backdrop**: `HTMLDivElement`

#### Inherited from

[`Modal`](../../Modal/classes/Modal.md).[`$backdrop`](../../Modal/classes/Modal.md#$backdrop)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:19](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L19)

***

### $cancelBtn

> **$cancelBtn**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/Modal/ConfirmModal.ts:13](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/ConfirmModal.ts#L13)

***

### $confirmBtn

> **$confirmBtn**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/Modal/ConfirmModal.ts:14](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/ConfirmModal.ts#L14)

***

### $message

> **$message**: `HTMLParagraphElement`

#### Source

[packages/free-drawing/src/components/Modal/ConfirmModal.ts:12](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/ConfirmModal.ts#L12)

***

### $modal

> **$modal**: `HTMLDivElement`

#### Inherited from

[`Modal`](../../Modal/classes/Modal.md).[`$modal`](../../Modal/classes/Modal.md#$modal)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:13](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L13)

***

### $modalBody

> **$modalBody**: `HTMLDivElement`

#### Inherited from

[`Modal`](../../Modal/classes/Modal.md).[`$modalBody`](../../Modal/classes/Modal.md#$modalbody)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:15](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L15)

***

### $modalFooter

> **$modalFooter**: `HTMLDivElement`

#### Inherited from

[`Modal`](../../Modal/classes/Modal.md).[`$modalFooter`](../../Modal/classes/Modal.md#$modalfooter)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:16](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L16)

***

### $modalHeader

> **$modalHeader**: `HTMLDivElement`

#### Inherited from

[`Modal`](../../Modal/classes/Modal.md).[`$modalHeader`](../../Modal/classes/Modal.md#$modalheader)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:14](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L14)

***

### \_options

> **\_options**: [`ConfirmModalOptions`](../../../../@types/modal/type-aliases/ConfirmModalOptions.md)

#### Source

[packages/free-drawing/src/components/Modal/ConfirmModal.ts:17](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/ConfirmModal.ts#L17)

***

### drawer

> **drawer**: [`Drawer`](../../../../Drawer/classes/Drawer.md)

#### Overrides

[`Modal`](../../Modal/classes/Modal.md).[`drawer`](../../Modal/classes/Modal.md#drawer)

#### Source

[packages/free-drawing/src/components/Modal/ConfirmModal.ts:11](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/ConfirmModal.ts#L11)

***

### onCancel()

> **onCancel**: (`modal`) => `void`

#### Parameters

• **modal**: [`ConfirmModal`](ConfirmModal.md)

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/Modal/ConfirmModal.ts:15](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/ConfirmModal.ts#L15)

***

### onConfirm()

> **onConfirm**: (`modal`) => `void`

#### Parameters

• **modal**: [`ConfirmModal`](ConfirmModal.md)

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/Modal/ConfirmModal.ts:16](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/ConfirmModal.ts#L16)

***

### options

> **options**: [`ModalOptions`](../../../../@types/modal/interfaces/ModalOptions.md)

#### Inherited from

[`Modal`](../../Modal/classes/Modal.md).[`options`](../../Modal/classes/Modal.md#options)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:17](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L17)

## Methods

### appendBodyContent()

> **appendBodyContent**(`content`): `void`

#### Parameters

• **content**: `string`

#### Returns

`void`

#### Inherited from

[`Modal`](../../Modal/classes/Modal.md).[`appendBodyContent`](../../Modal/classes/Modal.md#appendbodycontent)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:170](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L170)

***

### destroy()

> **destroy**(): `void`

#### Returns

`void`

#### Inherited from

[`Modal`](../../Modal/classes/Modal.md).[`destroy`](../../Modal/classes/Modal.md#destroy)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:222](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L222)

***

### hide()

> **hide**(): `void`

#### Returns

`void`

#### Inherited from

[`Modal`](../../Modal/classes/Modal.md).[`hide`](../../Modal/classes/Modal.md#hide)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:202](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L202)

***

### isVisible()

> **isVisible**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`Modal`](../../Modal/classes/Modal.md).[`isVisible`](../../Modal/classes/Modal.md#isvisible)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:218](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L218)

***

### setBodyContent()

> **setBodyContent**(`content`): `void`

#### Parameters

• **content**: `string`

#### Returns

`void`

#### Inherited from

[`Modal`](../../Modal/classes/Modal.md).[`setBodyContent`](../../Modal/classes/Modal.md#setbodycontent)

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

[`Modal`](../../Modal/classes/Modal.md).[`setFooterContent`](../../Modal/classes/Modal.md#setfootercontent)

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

[`Modal`](../../Modal/classes/Modal.md).[`setHeaderContent`](../../Modal/classes/Modal.md#setheadercontent)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:160](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L160)

***

### setMessage()

> **setMessage**(`message`): `void`

Message asking confirmation

#### Parameters

• **message**: `string`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/Modal/ConfirmModal.ts:53](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/ConfirmModal.ts#L53)

***

### setTitle()

> **setTitle**(`title`): `void`

Title in header

#### Parameters

• **title**: `string`

#### Returns

`void`

#### Inherited from

[`Modal`](../../Modal/classes/Modal.md).[`setTitle`](../../Modal/classes/Modal.md#settitle)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:65](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L65)

***

### show()

> **show**(): `void`

#### Returns

`void`

#### Inherited from

[`Modal`](../../Modal/classes/Modal.md).[`show`](../../Modal/classes/Modal.md#show)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:178](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L178)
