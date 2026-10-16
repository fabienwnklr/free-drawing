**@fabwcie/free-drawing** • [API](../../../../README.md)

***

[@fabwcie/free-drawing](../../../../README.md) / [components/CommandPalette/CommandPalette](../README.md) / CommandPalette

# Class: CommandPalette

Command palette: search field and commands available now (tools, edition, view, file, language),
arrow keys choose one, Enter or click runs it

## Extends

- [`Modal`](../../../Modal/Modal/classes/Modal.md)

## Constructors

### new CommandPalette(drawer)

> **new CommandPalette**(`drawer`): [`CommandPalette`](CommandPalette.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../Drawer/classes/Drawer.md)

#### Returns

[`CommandPalette`](CommandPalette.md)

#### Overrides

[`Modal`](../../../Modal/Modal/classes/Modal.md).[`constructor`](../../../Modal/Modal/classes/Modal.md#constructors)

#### Source

[packages/free-drawing/src/components/CommandPalette/CommandPalette.ts:88](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CommandPalette/CommandPalette.ts#L88)

## Properties

### $backdrop

> **$backdrop**: `HTMLDivElement`

#### Inherited from

[`Modal`](../../../Modal/Modal/classes/Modal.md).[`$backdrop`](../../../Modal/Modal/classes/Modal.md#$backdrop)

#### Source

[packages/free-drawing/src/components/Modal/Modal.ts:19](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/Modal/Modal.ts#L19)

***

### $empty

> **$empty**: `HTMLParagraphElement`

#### Source

[packages/free-drawing/src/components/CommandPalette/CommandPalette.ts:81](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CommandPalette/CommandPalette.ts#L81)

***

### $input

> **$input**: `HTMLInputElement`

#### Source

[packages/free-drawing/src/components/CommandPalette/CommandPalette.ts:79](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CommandPalette/CommandPalette.ts#L79)

***

### $list

> **$list**: `HTMLDivElement`

#### Source

[packages/free-drawing/src/components/CommandPalette/CommandPalette.ts:80](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CommandPalette/CommandPalette.ts#L80)

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

### commands

> **commands**: [`Command`](../type-aliases/Command.md)[] = `[]`

Commands available when palette was opened

#### Source

[packages/free-drawing/src/components/CommandPalette/CommandPalette.ts:83](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CommandPalette/CommandPalette.ts#L83)

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

### execute()

> **execute**(`command`): `void`

Close palette (focus back in drawer), then run command

#### Parameters

• **command**: [`Command`](../type-aliases/Command.md)

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/CommandPalette/CommandPalette.ts:146](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CommandPalette/CommandPalette.ts#L146)

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

Show palette with commands available now, search field empty

#### Returns

`void`

#### Overrides

[`Modal`](../../../Modal/Modal/classes/Modal.md).[`show`](../../../Modal/Modal/classes/Modal.md#show)

#### Source

[packages/free-drawing/src/components/CommandPalette/CommandPalette.ts:136](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/CommandPalette/CommandPalette.ts#L136)
