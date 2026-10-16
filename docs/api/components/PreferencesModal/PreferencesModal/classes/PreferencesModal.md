**@fabwcie/free-drawing** • [API](../../../../README.md)

***

[@fabwcie/free-drawing](../../../../README.md) / [components/PreferencesModal/PreferencesModal](../README.md) / PreferencesModal

# Class: PreferencesModal

Preferences of user (theme, language, zen mode, grid, snapping, auto save, name in collaboration sessions):
applied together with Save (Cancel, Escape or close keep current ones), saved in browser by drawer
(and by the app of a logged in user)

## Extends

- [`Modal`](../../../Modal/Modal/classes/Modal.md)

## Constructors

### new PreferencesModal(drawer)

> **new PreferencesModal**(`drawer`): [`PreferencesModal`](PreferencesModal.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../Drawer/classes/Drawer.md)

#### Returns

[`PreferencesModal`](PreferencesModal.md)

#### Overrides

[`Modal`](../../../Modal/Modal/classes/Modal.md).[`constructor`](../../../Modal/Modal/classes/Modal.md#constructors)

#### Source

[packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts:37](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts#L37)

## Properties

### $autoSave

> **$autoSave**: `HTMLInputElement`

#### Source

[packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts:27](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts#L27)

***

### $backdrop

> **$backdrop**: `HTMLDivElement`

#### Inherited from

[`Modal`](../../../Modal/Modal/classes/Modal.md).[`$backdrop`](../../../Modal/Modal/classes/Modal.md#$backdrop)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:19](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L19)

***

### $cancelButton

> **$cancelButton**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts:32](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts#L32)

***

### $grid

> **$grid**: `HTMLInputElement`

#### Source

[packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts:25](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts#L25)

***

### $keepTool

> **$keepTool**: `null` \| `HTMLInputElement` = `null`

Keep tool after drawing, with selection widget only

#### Source

[packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts:29](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts#L29)

***

### $language

> **$language**: `HTMLSelectElement`

#### Source

[packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts:23](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts#L23)

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

### $name

> **$name**: `null` \| `HTMLInputElement` = `null`

Name in collaboration sessions, with `collaboration` option

#### Source

[packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts:31](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts#L31)

***

### $saveButton

> **$saveButton**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts:33](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts#L33)

***

### $snapping

> **$snapping**: `HTMLInputElement`

#### Source

[packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts:26](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts#L26)

***

### $themes

> **$themes**: `HTMLInputElement`[]

#### Source

[packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts:22](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts#L22)

***

### $zen

> **$zen**: `HTMLInputElement`

#### Source

[packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts:24](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts#L24)

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

> **save**(): `void`

Fields applied together (one preferences change), dialog closed

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts:130](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts#L130)

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

#### Returns

`void`

#### Overrides

[`Modal`](../../../Modal/Modal/classes/Modal.md).[`show`](../../../Modal/Modal/classes/Modal.md#show)

#### Source

[packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts:121](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts#L121)

***

### update()

> **update**(): `void`

Fields show current preferences

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts:149](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/PreferencesModal/PreferencesModal.ts#L149)
