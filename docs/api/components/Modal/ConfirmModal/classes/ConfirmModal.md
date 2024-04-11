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

[components/Modal/ConfirmModal.ts:20](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Modal/ConfirmModal.ts#L20)

## Properties

### $backdrop

> **$backdrop**: `HTMLDivElement`

#### Inherited from

[`Modal`](../../Modal/classes/Modal.md).[`$backdrop`](../../Modal/classes/Modal.md#$backdrop)

#### Source

[components/Modal/Modal.ts:15](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Modal/Modal.ts#L15)

***

### $cancelBtn

> **$cancelBtn**: `HTMLButtonElement`

#### Source

[components/Modal/ConfirmModal.ts:11](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Modal/ConfirmModal.ts#L11)

***

### $confirmBtn

> **$confirmBtn**: `HTMLButtonElement`

#### Source

[components/Modal/ConfirmModal.ts:12](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Modal/ConfirmModal.ts#L12)

***

### $modal

> **$modal**: `HTMLDivElement`

#### Inherited from

[`Modal`](../../Modal/classes/Modal.md).[`$modal`](../../Modal/classes/Modal.md#$modal)

#### Source

[components/Modal/Modal.ts:9](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Modal/Modal.ts#L9)

***

### $modalBody

> **$modalBody**: `HTMLDivElement`

#### Inherited from

[`Modal`](../../Modal/classes/Modal.md).[`$modalBody`](../../Modal/classes/Modal.md#$modalbody)

#### Source

[components/Modal/Modal.ts:11](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Modal/Modal.ts#L11)

***

### $modalFooter

> **$modalFooter**: `HTMLDivElement`

#### Inherited from

[`Modal`](../../Modal/classes/Modal.md).[`$modalFooter`](../../Modal/classes/Modal.md#$modalfooter)

#### Source

[components/Modal/Modal.ts:12](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Modal/Modal.ts#L12)

***

### $modalHeader

> **$modalHeader**: `HTMLDivElement`

#### Inherited from

[`Modal`](../../Modal/classes/Modal.md).[`$modalHeader`](../../Modal/classes/Modal.md#$modalheader)

#### Source

[components/Modal/Modal.ts:10](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Modal/Modal.ts#L10)

***

### \_options

> **\_options**: [`ConfirmModalOptions`](../../../../@types/modal/type-aliases/ConfirmModalOptions.md)

#### Source

[components/Modal/ConfirmModal.ts:18](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Modal/ConfirmModal.ts#L18)

***

### cancelLabel

> **cancelLabel**: `string`

#### Source

[components/Modal/ConfirmModal.ts:14](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Modal/ConfirmModal.ts#L14)

***

### confirmLabel

> **confirmLabel**: `string`

#### Source

[components/Modal/ConfirmModal.ts:16](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Modal/ConfirmModal.ts#L16)

***

### drawer

> **drawer**: [`Drawer`](../../../../Drawer/classes/Drawer.md)

#### Overrides

[`Modal`](../../Modal/classes/Modal.md).[`drawer`](../../Modal/classes/Modal.md#drawer)

#### Source

[components/Modal/ConfirmModal.ts:10](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Modal/ConfirmModal.ts#L10)

***

### message

> **message**: `string`

#### Source

[components/Modal/ConfirmModal.ts:13](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Modal/ConfirmModal.ts#L13)

***

### onCancel()

> **onCancel**: (`modal`) => `void`

#### Parameters

• **modal**: [`ConfirmModal`](ConfirmModal.md)

#### Returns

`void`

#### Source

[components/Modal/ConfirmModal.ts:15](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Modal/ConfirmModal.ts#L15)

***

### onConfirm()

> **onConfirm**: (`modal`) => `void`

#### Parameters

• **modal**: [`ConfirmModal`](ConfirmModal.md)

#### Returns

`void`

#### Source

[components/Modal/ConfirmModal.ts:17](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Modal/ConfirmModal.ts#L17)

***

### options

> **options**: [`ModalOptions`](../../../../@types/modal/interfaces/ModalOptions.md)

#### Inherited from

[`Modal`](../../Modal/classes/Modal.md).[`options`](../../Modal/classes/Modal.md#options)

#### Source

[components/Modal/Modal.ts:13](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Modal/Modal.ts#L13)

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

[components/Modal/Modal.ts:118](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Modal/Modal.ts#L118)

***

### destroy()

> **destroy**(): `void`

#### Returns

`void`

#### Inherited from

[`Modal`](../../Modal/classes/Modal.md).[`destroy`](../../Modal/classes/Modal.md#destroy)

#### Source

[components/Modal/Modal.ts:145](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Modal/Modal.ts#L145)

***

### fill()

> **fill**(): `void`

#### Returns

`void`

#### Source

[components/Modal/ConfirmModal.ts:37](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Modal/ConfirmModal.ts#L37)

***

### hide()

> **hide**(): `void`

#### Returns

`void`

#### Inherited from

[`Modal`](../../Modal/classes/Modal.md).[`hide`](../../Modal/classes/Modal.md#hide)

#### Source

[components/Modal/Modal.ts:133](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Modal/Modal.ts#L133)

***

### isVisible()

> **isVisible**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`Modal`](../../Modal/classes/Modal.md).[`isVisible`](../../Modal/classes/Modal.md#isvisible)

#### Source

[components/Modal/Modal.ts:141](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Modal/Modal.ts#L141)

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

[components/Modal/Modal.ts:114](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Modal/Modal.ts#L114)

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

[components/Modal/Modal.ts:122](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Modal/Modal.ts#L122)

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

[components/Modal/Modal.ts:108](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Modal/Modal.ts#L108)

***

### show()

> **show**(): `void`

#### Returns

`void`

#### Inherited from

[`Modal`](../../Modal/classes/Modal.md).[`show`](../../Modal/classes/Modal.md#show)

#### Source

[components/Modal/Modal.ts:126](https://github.com/fabienwnklr/free-drawing/blob/master/src/components/Modal/Modal.ts#L126)
