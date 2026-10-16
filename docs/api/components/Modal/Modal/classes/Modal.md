**@fabwcie/free-drawing** • [API](../../../../README.md)

***

[@fabwcie/free-drawing](../../../../README.md) / [components/Modal/Modal](../README.md) / Modal

# Class: Modal

## Extended by

- [`CollaborationModal`](../../../CollaborationModal/CollaborationModal/classes/CollaborationModal.md)
- [`CommandPalette`](../../../CommandPalette/CommandPalette/classes/CommandPalette.md)
- [`ExportModal`](../../../ExportModal/ExportModal/classes/ExportModal.md)
- [`ConfirmModal`](../../ConfirmModal/classes/ConfirmModal.md)
- [`PreferencesModal`](../../../PreferencesModal/PreferencesModal/classes/PreferencesModal.md)
- [`Help`](../../../tools/Help/Help/classes/Help.md)

## Constructors

### new Modal(drawer, options)

> **new Modal**(`drawer`, `options`?): [`Modal`](Modal.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../Drawer/classes/Drawer.md)

• **options?**: `Partial`\<[`ModalOptions`](../../../../@types/modal/interfaces/ModalOptions.md)\>

#### Returns

[`Modal`](Modal.md)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:23](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L23)

## Properties

### $backdrop

> **$backdrop**: `HTMLDivElement`

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:19](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L19)

***

### $modal

> **$modal**: `HTMLDivElement`

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:13](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L13)

***

### $modalBody

> **$modalBody**: `HTMLDivElement`

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:15](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L15)

***

### $modalFooter

> **$modalFooter**: `HTMLDivElement`

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:16](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L16)

***

### $modalHeader

> **$modalHeader**: `HTMLDivElement`

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:14](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L14)

***

### drawer

> **drawer**: [`Drawer`](../../../../Drawer/classes/Drawer.md)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:18](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L18)

***

### options

> **options**: [`ModalOptions`](../../../../@types/modal/interfaces/ModalOptions.md)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:17](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L17)

## Methods

### appendBodyContent()

> **appendBodyContent**(`content`): `void`

#### Parameters

• **content**: `string`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:170](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L170)

***

### destroy()

> **destroy**(): `void`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:222](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L222)

***

### hide()

> **hide**(): `void`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:202](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L202)

***

### isVisible()

> **isVisible**(): `boolean`

#### Returns

`boolean`

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:218](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L218)

***

### setBodyContent()

> **setBodyContent**(`content`): `void`

#### Parameters

• **content**: `string`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:166](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L166)

***

### setFooterContent()

> **setFooterContent**(`content`): `void`

#### Parameters

• **content**: `string`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:174](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L174)

***

### setHeaderContent()

> **setHeaderContent**(`content`): `void`

#### Parameters

• **content**: `string`

#### Returns

`void`

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

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:65](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L65)

***

### show()

> **show**(): `void`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:178](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L178)
