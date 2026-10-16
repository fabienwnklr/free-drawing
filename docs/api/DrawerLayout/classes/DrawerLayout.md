**@fabwcie/free-drawing** • [API](../../README.md)

***

[@fabwcie/free-drawing](../../README.md) / [DrawerLayout](../README.md) / DrawerLayout

# Class: DrawerLayout

Layout of a drawer: its container in the element of the drawer (canvas of the stage, interface over it), regions of
the interface, size of the window followed by a drawer of window size, interface ignoring pointer during pointer
actions, zen mode.

Order of container (stacking and tab order): canvas, header, floating elements added while the drawer is created,
footer, floating elements added later (dialogs, toasts, text editor).

## Constructors

### new DrawerLayout(drawer)

> **new DrawerLayout**(`drawer`): [`DrawerLayout`](DrawerLayout.md)

#### Parameters

• **drawer**: [`Drawer`](../../Drawer/classes/Drawer.md)

#### Returns

[`DrawerLayout`](DrawerLayout.md)

#### Source

[packages/free-drawing/src/DrawerLayout.ts:43](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/DrawerLayout.ts#L43)

## Properties

### $container

> **`readonly`** **$container**: `HTMLDivElement`

Container of the drawer: canvas and interface, keyboard shortcuts

#### Source

[packages/free-drawing/src/DrawerLayout.ts:31](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/DrawerLayout.ts#L31)

***

### $footer

> **`readonly`** **$footer**: `HTMLElement`

Bottom interface: its start, toolbar, help

#### Source

[packages/free-drawing/src/DrawerLayout.ts:35](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/DrawerLayout.ts#L35)

***

### $footerStart

> **`readonly`** **$footerStart**: `HTMLDivElement`

Bottom left interface: zoom, undo / redo

#### Source

[packages/free-drawing/src/DrawerLayout.ts:37](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/DrawerLayout.ts#L37)

***

### $header

> **`readonly`** **$header**: `HTMLDivElement`

Top left interface: settings menu, layers button, position

#### Source

[packages/free-drawing/src/DrawerLayout.ts:33](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/DrawerLayout.ts#L33)

***

### zen

> **zen**: `boolean` = `false`

Interface hidden but toolbar, menu and selection options, see `setZen`

#### Source

[packages/free-drawing/src/DrawerLayout.ts:39](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/DrawerLayout.ts#L39)

## Methods

### add()

> **add**(`region`, `$element`, `options`): `void`

Add an element of the interface to a region

#### Parameters

• **region**: [`LayoutRegion`](../type-aliases/LayoutRegion.md)

• **$element**: `HTMLElement`

• **options**: [`LayoutItemOptions`](../type-aliases/LayoutItemOptions.md)= `{}`

#### Returns

`void`

#### Source

[packages/free-drawing/src/DrawerLayout.ts:89](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/DrawerLayout.ts#L89)

***

### ready()

> **ready**(): `void`

Drawer created: floating elements added from now on are after the footer

#### Returns

`void`

#### Source

[packages/free-drawing/src/DrawerLayout.ts:79](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/DrawerLayout.ts#L79)

***

### setPointerEvents()

> **setPointerEvents**(`state`): `void`

Interface receives pointer or not (during pointer actions: drawing, selecting...), see `--drawer-pointer-events`

#### Parameters

• **state**: `"none"` \| `"all"`

#### Returns

`void`

#### Source

[packages/free-drawing/src/DrawerLayout.ts:120](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/DrawerLayout.ts#L120)

***

### setStage()

> **setStage**(`stage`): `void`

Stage created in container (konva empties it): its canvas, then header and footer drawn over it

#### Parameters

• **stage**: `Stage`

#### Returns

`void`

#### Source

[packages/free-drawing/src/DrawerLayout.ts:72](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/DrawerLayout.ts#L72)

***

### setZen()

> **setZen**(`zen`): `void`

Zen mode: elements added with `hideInZen` hidden

#### Parameters

• **zen**: `boolean`

#### Returns

`void`

#### Source

[packages/free-drawing/src/DrawerLayout.ts:111](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/DrawerLayout.ts#L111)
