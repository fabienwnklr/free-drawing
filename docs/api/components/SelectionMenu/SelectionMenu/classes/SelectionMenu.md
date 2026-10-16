**@fabwcie/free-drawing** • [API](../../../../README.md)

***

[@fabwcie/free-drawing](../../../../README.md) / [components/SelectionMenu/SelectionMenu](../README.md) / SelectionMenu

# Class: SelectionMenu

Menu next to selected shapes: duplicate, rotate, fit width of texts, bring forward, send backward, lock, delete, or
unlock for locked shapes.
Out of transformer (below, above, right or left of it), hidden while shapes are moved

## Constructors

### new SelectionMenu(drawer)

> **new SelectionMenu**(`drawer`): [`SelectionMenu`](SelectionMenu.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../Drawer/classes/Drawer.md)

#### Returns

[`SelectionMenu`](SelectionMenu.md)

#### Source

[packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts:47](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts#L47)

## Properties

### $backwardBtn

> **$backwardBtn**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts:40](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts#L40)

***

### $deleteBtn

> **$deleteBtn**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts:42](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts#L42)

***

### $duplicateBtn

> **$duplicateBtn**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts:34](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts#L34)

***

### $fitWidthBtn

> **$fitWidthBtn**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts:39](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts#L39)

***

### $forwardBtn

> **$forwardBtn**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts:41](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts#L41)

***

### $groupBtn

> **$groupBtn**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts:35](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts#L35)

***

### $lockBtn

> **$lockBtn**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts:43](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts#L43)

***

### $menu

> **$menu**: `HTMLDivElement`

#### Source

[packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts:33](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts#L33)

***

### $rotateLeftBtn

> **$rotateLeftBtn**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts:37](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts#L37)

***

### $rotateRightBtn

> **$rotateRightBtn**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts:38](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts#L38)

***

### $separator

> **$separator**: `HTMLSpanElement`

#### Source

[packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts:45](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts#L45)

***

### $ungroupBtn

> **$ungroupBtn**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts:36](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts#L36)

***

### $unlockBtn

> **$unlockBtn**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts:44](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts#L44)

***

### drawer

> **drawer**: [`Drawer`](../../../../Drawer/classes/Drawer.md)

#### Source

[packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts:32](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts#L32)

## Methods

### hide()

> **hide**(): `void`

Hide menu, focus back on drawer if it was in menu (e.g. selection deleted)

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts:271](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts#L271)

***

### isVisible()

> **isVisible**(): `boolean`

#### Returns

`boolean`

#### Source

[packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts:278](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts#L278)

***

### update()

> **update**(): `void`

Show menu next to selection, or hide it

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts:177](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/SelectionMenu/SelectionMenu.ts#L177)
