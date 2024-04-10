**free-drawing** • [API](../../README.md)

***

[free-drawing](../../README.md) / [Drawer](../README.md) / Drawer

# Class: Drawer

Drawer constructor. A drawer is used to draw multiple shapes

## Memberof

Drawer

## Example

```ts
const drawer = new Drawer(document.getElementById('draw'), {
  width: 500,
  height: 800,
});
```

## Extends

- [`default`](../../utils/MicroEvent/classes/default.md)

## Constructors

### new Drawer($el, options)

> **new Drawer**(`$el`, `options`): [`Drawer`](Drawer.md)

#### Parameters

• **$el**: `HTMLDivElement`

• **options**: `Partial`\<[`DrawerOptions`](../../@types/drawer/type-aliases/DrawerOptions.md)\>= `{}`

#### Returns

[`Drawer`](Drawer.md)

#### Overrides

[`default`](../../utils/MicroEvent/classes/default.md).[`constructor`](../../utils/MicroEvent/classes/default.md#constructors)

#### Source

[Drawer.ts:72](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L72)

## Properties

### $clearConfirmModal

> **$clearConfirmModal**: `null` \| [`ConfirmModal`](../../components/Modal/ConfirmModal/classes/ConfirmModal.md) = `null`

#### Source

[Drawer.ts:61](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L61)

***

### $clearStoredConfirmModal

> **$clearStoredConfirmModal**: `null` \| [`ConfirmModal`](../../components/Modal/ConfirmModal/classes/ConfirmModal.md) = `null`

#### Source

[Drawer.ts:62](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L62)

***

### $drawerContainer

> **$drawerContainer**: `HTMLDivElement`

#### Source

[Drawer.ts:45](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L45)

***

### $el

> **$el**: `HTMLDivElement`

#### Source

[Drawer.ts:44](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L44)

***

### $footerContainer

> **$footerContainer**: `HTMLElement`

#### Source

[Drawer.ts:66](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L66)

***

### $footerLeftElement

> **$footerLeftElement**: `HTMLDivElement`

#### Source

[Drawer.ts:67](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L67)

***

### $stageContainer

> **$stageContainer**: `HTMLDivElement`

#### Source

[Drawer.ts:46](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L46)

***

### \_events

> **\_events**: `object` = `{}`

#### Index signature

 \[`key`: `string`\]: `TCallback`[]

#### Inherited from

[`default`](../../utils/MicroEvent/classes/default.md).[`_events`](../../utils/MicroEvent/classes/default.md#_events)

#### Source

[utils/MicroEvent.ts:14](https://github.com/fabienwnklr/free-drawing/blob/master/src/utils/MicroEvent.ts#L14)

***

### activeTool

> **activeTool**: `"pan"` \| `"selection"` \| `"brush"` \| `"eraser"` \| `"undo"` \| `"redo"` \| `"text"` \| `"rect"` \| `"circle"` \| `"ellipse"` \| `"square"` \| `"arrow"` \| `"line"` \| `"star"` \| `"triangle"` \| `"polygon"` = `'brush'`

#### Source

[Drawer.ts:53](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L53)

***

### activeWidget

> **activeWidget**: [`BaseWidget`](../../components/toolbar/widgets/BaseWidget/classes/BaseWidget.md)

#### Source

[Drawer.ts:54](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L54)

***

### background

> **background**: `Rect`

#### Source

[Drawer.ts:57](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L57)

***

### bgLayer

> **bgLayer**: `Layer`

#### Source

[Drawer.ts:70](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L70)

***

### contextMenu

> **contextMenu**: [`ContextMenu`](../../components/ContextMenu/ContextMenu/classes/ContextMenu.md)

#### Source

[Drawer.ts:68](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L68)

***

### debug

> **debug**: `boolean` = `false`

#### Source

[Drawer.ts:64](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L64)

***

### drawLayer

> **drawLayer**: `Layer`

#### Source

[Drawer.ts:50](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L50)

***

### grid

> **grid**: `boolean` = `false`

#### Source

[Drawer.ts:69](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L69)

***

### gridLayer

> **gridLayer**: `Layer`

#### Source

[Drawer.ts:49](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L49)

***

### help

> **help**: [`Help`](../../components/tools/Help/Help/classes/Help.md)

#### Source

[Drawer.ts:59](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L59)

***

### options

> **options**: [`DrawerOptions`](../../@types/drawer/type-aliases/DrawerOptions.md)

#### Source

[Drawer.ts:55](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L55)

***

### selectionLayer

> **selectionLayer**: `Layer`

#### Source

[Drawer.ts:51](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L51)

***

### setting

> **setting**: [`Settings`](../../components/tools/Settings/Settings/classes/Settings.md)

#### Source

[Drawer.ts:60](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L60)

***

### stage

> **stage**: `Stage`

#### Source

[Drawer.ts:47](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L47)

***

### toolbar

> **toolbar**: [`Toolbar`](../../components/toolbar/Toolbar/classes/Toolbar.md)

#### Source

[Drawer.ts:52](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L52)

***

### undoRedo

> **undoRedo**: [`UndoRedo`](../../components/tools/UndoRedo/UndoRedo/classes/UndoRedo.md)

#### Source

[Drawer.ts:65](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L65)

***

### zoom

> **zoom**: `undefined` \| [`Zoom`](../../components/tools/Zoom/Zoom/classes/Zoom.md)

#### Source

[Drawer.ts:58](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L58)

## Methods

### \_getPointerPos()

> **\_getPointerPos**(): `object`

#### Returns

`object`

##### x

> **x**: `number`

##### y

> **y**: `number`

#### Source

[Drawer.ts:208](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L208)

***

### \_getRelativePointerPos()

> **\_getRelativePointerPos**(): `object`

#### Returns

`object`

##### x

> **x**: `number`

##### y

> **y**: `number`

#### Source

[Drawer.ts:200](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L200)

***

### \_update()

> **\_update**(): `void`

Update grid lines and bg position

#### Returns

`void`

#### Source

[Drawer.ts:219](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L219)

***

### clearCanvas()

> **clearCanvas**(`force`): `void`

Clear canvas draw

#### Parameters

• **force**: `boolean`= `false`

Force clear (don't show confirm modal)

#### Returns

`void`

#### Source

[Drawer.ts:534](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L534)

***

### clearStoredData()

> **clearStoredData**(`force`): `void`

Remove localstorage data

#### Parameters

• **force**: `boolean`= `false`

Force clear (don't show confirm modal)

#### Returns

`void`

#### Source

[Drawer.ts:561](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L561)

***

### focus()

> **focus**(): `void`

Focus drawer div container (usefull for keyevent for example)

#### Returns

`void`

#### Source

[Drawer.ts:783](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L783)

***

### getDrawingShapeByName()

> **getDrawingShapeByName**(`shapeType`): (`Shape`\<`ShapeConfig`\> \| `Group`)[]

Get all drawing shape by name

#### Parameters

• **shapeType**: `"selection"` \| `"text"` \| `"line"` \| `"background"` \| `"guideLine"` \| `"gridLine"`

Shape type

#### Returns

(`Shape`\<`ShapeConfig`\> \| `Group`)[]

#### Source

[Drawer.ts:192](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L192)

***

### getDrawingShapes()

> **getDrawingShapes**(): `Shape`\<`ShapeConfig`\>[]

Get all shape drawing

#### Returns

`Shape`\<`ShapeConfig`\>[]

#### Source

[Drawer.ts:182](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L182)

***

### getWidget()

> **getWidget**\<`T`\>(`name`): `undefined` \| `T`

Get widget by name

#### Type parameters

• **T**

#### Parameters

• **name**: `"pan"` \| `"selection"` \| `"brush"` \| `"eraser"` \| `"undo"` \| `"redo"` \| `"text"` \| `"rect"` \| `"circle"` \| `"ellipse"` \| `"square"` \| `"arrow"` \| `"line"` \| `"star"` \| `"triangle"` \| `"polygon"`

#### Returns

`undefined` \| `T`

#### Source

[Drawer.ts:381](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L381)

***

### getZoomLevel()

> **getZoomLevel**(): `number`

Get zoom level

#### Returns

`number`

#### Source

[Drawer.ts:174](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L174)

***

### hideGrid()

> **hideGrid**(): `void`

Hide grid

#### Returns

`void`

#### Source

[Drawer.ts:771](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L771)

***

### off()

> **off**(`events`, `fct`): `void`

#### Parameters

• **events**: `string`

• **fct**: `TCallback`

#### Returns

`void`

#### Inherited from

[`default`](../../utils/MicroEvent/classes/default.md).[`off`](../../utils/MicroEvent/classes/default.md#off)

#### Source

[utils/MicroEvent.ts:28](https://github.com/fabienwnklr/free-drawing/blob/master/src/utils/MicroEvent.ts#L28)

***

### on()

> **on**(`events`, `fct`): `void`

#### Parameters

• **events**: `string`

• **fct**: `TCallback`

#### Returns

`void`

#### Inherited from

[`default`](../../utils/MicroEvent/classes/default.md).[`on`](../../utils/MicroEvent/classes/default.md#on)

#### Source

[utils/MicroEvent.ts:20](https://github.com/fabienwnklr/free-drawing/blob/master/src/utils/MicroEvent.ts#L20)

***

### resetDraw()

> **resetDraw**(): `void`

Reset draw to default state (bgcolor, color, remove draw, etc.)

#### Returns

`void`

#### Source

[Drawer.ts:790](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L790)

***

### save()

> **save**(): `void`

Save current draw state to localstorage

#### Returns

`void`

#### Source

[Drawer.ts:440](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L440)

***

### setBgColor()

> **setBgColor**(`color`): `void`

Change background color

#### Parameters

• **color**: [`ColorLike`](../../@types/drawer/type-aliases/ColorLike.md)

#### Returns

`void`

#### Source

[Drawer.ts:449](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L449)

***

### setColor()

> **setColor**(`color`): `void`

Set color for draw

#### Parameters

• **color**: [`ColorLike`](../../@types/drawer/type-aliases/ColorLike.md)

#### Returns

`void`

#### Source

[Drawer.ts:465](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L465)

***

### setOpacity()

> **setOpacity**(`opacity`): `void`

Set opacity of shape 0 to 1

#### Parameters

• **opacity**: `number`

#### Returns

`void`

#### Source

[Drawer.ts:495](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L495)

***

### setStrokeWidth()

> **setStrokeWidth**(`width`): `void`

Set stroke width for draw

#### Parameters

• **width**: `string` \| `number`

#### Returns

`void`

#### Source

[Drawer.ts:479](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L479)

***

### showGrid()

> **showGrid**(): `void`

Show grid

#### Returns

`void`

#### Source

[Drawer.ts:581](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L581)

***

### toast()

> **toast**(`message`, `type`?): [`Toast`](../../components/Toast/Toast/classes/Toast.md)

Show toast message for user

#### Parameters

• **message**: `string`

Message to show

• **type?**: `"error"` \| `"info"` \| `"warning"` \| `"neutral"`

Type of toast

#### Returns

[`Toast`](../../components/Toast/Toast/classes/Toast.md)

#### Source

[Drawer.ts:512](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L512)

***

### trigger()

> **trigger**(`events`, ...`args`): `void`

#### Parameters

• **events**: `string`

• ...**args**: `any`

#### Returns

`void`

#### Inherited from

[`default`](../../utils/MicroEvent/classes/default.md).[`trigger`](../../utils/MicroEvent/classes/default.md#trigger)

#### Source

[utils/MicroEvent.ts:49](https://github.com/fabienwnklr/free-drawing/blob/master/src/utils/MicroEvent.ts#L49)
