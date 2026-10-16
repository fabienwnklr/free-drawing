**@fabwcie/free-drawing** • [API](../../../../README.md)

***

[@fabwcie/free-drawing](../../../../README.md) / [components/ContextMenu/ContextMenu](../README.md) / ContextMenu

# Class: ContextMenu

Menu of right click (or context menu key, Shift + F10): actions on selection when a shape is under pointer
or selected (order, rotate, flip, fit width of texts, duplicate, lock, delete, copy as image; unlock for locked
shapes), else actions on
drawing (paste, select all, copy as image, snapping, grid), with their shortcuts

## Constructors

### new ContextMenu(drawer)

> **new ContextMenu**(`drawer`): [`ContextMenu`](ContextMenu.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../Drawer/classes/Drawer.md)

#### Returns

[`ContextMenu`](ContextMenu.md)

#### Source

[packages/free-drawing/src/components/ContextMenu/ContextMenu.ts:35](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ContextMenu/ContextMenu.ts#L35)

## Properties

### $gridBtn

> **$gridBtn**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/ContextMenu/ContextMenu.ts:29](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ContextMenu/ContextMenu.ts#L29)

***

### $list

> **$list**: `HTMLDivElement`

#### Source

[packages/free-drawing/src/components/ContextMenu/ContextMenu.ts:26](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ContextMenu/ContextMenu.ts#L26)

***

### $menu

> **$menu**: `HTMLDivElement`

#### Source

[packages/free-drawing/src/components/ContextMenu/ContextMenu.ts:25](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ContextMenu/ContextMenu.ts#L25)

***

### $pasteBtn

> **$pasteBtn**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/ContextMenu/ContextMenu.ts:27](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ContextMenu/ContextMenu.ts#L27)

***

### $snappingBtn

> **$snappingBtn**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/ContextMenu/ContextMenu.ts:28](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ContextMenu/ContextMenu.ts#L28)

***

### drawer

> **drawer**: [`Drawer`](../../../../Drawer/classes/Drawer.md)

#### Source

[packages/free-drawing/src/components/ContextMenu/ContextMenu.ts:24](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ContextMenu/ContextMenu.ts#L24)

## Methods

### hide()

> **hide**(): `void`

Hide the context menu, focus back on drawer if it was in menu

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/ContextMenu/ContextMenu.ts:352](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ContextMenu/ContextMenu.ts#L352)

***

### isVisible()

> **isVisible**(): `boolean`

#### Returns

`boolean`

#### Source

[packages/free-drawing/src/components/ContextMenu/ContextMenu.ts:359](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ContextMenu/ContextMenu.ts#L359)

***

### show()

> **show**(): `void`

Show items of selection or drawing, first one focused (keyboard navigation)

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/ContextMenu/ContextMenu.ts:332](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/ContextMenu/ContextMenu.ts#L332)
