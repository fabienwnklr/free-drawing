**@fabwcie/free-drawing** • [API](../../../../README.md)

***

[@fabwcie/free-drawing](../../../../README.md) / [components/CollaborationModal/CollaborationModal](../README.md) / CollaborationModal

# Class: CollaborationModal

Live collaboration dialog: start a session, join one from a link (name required), session link with copy button
and QR code, users of the session with rights given by the owner, stop session

## Extends

- [`Modal`](../../../Modal/Modal/classes/Modal.md)

## Constructors

### new CollaborationModal(drawer)

> **new CollaborationModal**(`drawer`): [`CollaborationModal`](CollaborationModal.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../Drawer/classes/Drawer.md)

#### Returns

[`CollaborationModal`](CollaborationModal.md)

#### Overrides

[`Modal`](../../../Modal/Modal/classes/Modal.md).[`constructor`](../../../Modal/Modal/classes/Modal.md#constructors)

#### Source

[packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts:29](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts#L29)

## Properties

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

[packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts:22](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts#L22)

***

### $intro

> **$intro**: `HTMLParagraphElement`

#### Source

[packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts:13](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts#L13)

***

### $joinButton

> **$joinButton**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts:21](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts#L21)

***

### $link

> **$link**: `HTMLInputElement`

#### Source

[packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts:16](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts#L16)

***

### $members

> **$members**: `HTMLUListElement`

#### Source

[packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts:19](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts#L19)

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

> **$name**: `HTMLInputElement`

#### Source

[packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts:14](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts#L14)

***

### $qrCode

> **$qrCode**: `HTMLDivElement`

#### Source

[packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts:17](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts#L17)

***

### $session

> **$session**: `HTMLDivElement`

#### Source

[packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts:15](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts#L15)

***

### $startButton

> **$startButton**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts:20](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts#L20)

***

### $stopButton

> **$stopButton**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts:23](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts#L23)

***

### $users

> **$users**: `HTMLParagraphElement`

#### Source

[packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts:18](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts#L18)

***

### drawer

> **drawer**: [`Drawer`](../../../../Drawer/classes/Drawer.md)

#### Inherited from

[`Modal`](../../../Modal/Modal/classes/Modal.md).[`drawer`](../../../Modal/Modal/classes/Modal.md#drawer)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:18](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L18)

***

### invitedBy?

> **`optional`** **invitedBy**: `string`

Id of user who shared the link

#### Source

[packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts:27](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts#L27)

***

### joinRoom

> **joinRoom**: `null` \| `string` = `null`

Room of a link, joined once user gives a name

#### Source

[packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts:25](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts#L25)

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

### cancelJoin()

> **cancelJoin**(): `void`

Room of link not joined, removed from page url

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts:158](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts#L158)

***

### copyLink()

> **copyLink**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Source

[packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts:164](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts#L164)

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

### join()

> **join**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Source

[packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts:142](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts#L142)

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

> **show**(`joinRoom`, `invitedBy`?): `void`

Show dialog

#### Parameters

• **joinRoom**: `null` \| `string`= `null`

Room of a link: user gives a name before joining it

• **invitedBy?**: `string`

Id of user who shared the link

#### Returns

`void`

#### Overrides

[`Modal`](../../../Modal/Modal/classes/Modal.md).[`show`](../../../Modal/Modal/classes/Modal.md#show)

#### Source

[packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts:126](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts#L126)

***

### start()

> **start**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Source

[packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts:134](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts#L134)

***

### update()

> **update**(): `Promise`\<`void`\>

Owner: session (link, QR code, users and rights, stop), other users: their name only,
else join form or start button

#### Returns

`Promise`\<`void`\>

#### Source

[packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts:229](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CollaborationModal/CollaborationModal.ts#L229)
