**@fabwcie/free-drawing** • [API](../../README.md)

***

[@fabwcie/free-drawing](../../README.md) / [Drawer](../README.md) / Drawer

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

[Drawer.ts:83](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L83)

## Properties

### $drawerContainer

> **$drawerContainer**: `HTMLDivElement`

#### Source

[Drawer.ts:56](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L56)

***

### $el

> **$el**: `HTMLDivElement`

#### Source

[Drawer.ts:55](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L55)

***

### $footerContainer

> **$footerContainer**: `HTMLElement`

#### Source

[Drawer.ts:77](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L77)

***

### $footerLeftElement

> **$footerLeftElement**: `HTMLDivElement`

#### Source

[Drawer.ts:78](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L78)

***

### $stageContainer

> **$stageContainer**: `HTMLDivElement`

#### Source

[Drawer.ts:57](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L57)

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

[Drawer.ts:64](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L64)

***

### activeWidget

> **activeWidget**: [`BaseWidget`](../../components/toolbar/widgets/BaseWidget/classes/BaseWidget.md)

#### Source

[Drawer.ts:65](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L65)

***

### background

> **background**: `Rect`

#### Source

[Drawer.ts:68](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L68)

***

### bgLayer

> **bgLayer**: `Layer`

#### Source

[Drawer.ts:81](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L81)

***

### clearConfirmModal

> **clearConfirmModal**: `null` \| [`ConfirmModal`](../../components/Modal/ConfirmModal/classes/ConfirmModal.md) = `null`

#### Source

[Drawer.ts:72](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L72)

***

### clearStoredConfirmModal

> **clearStoredConfirmModal**: `null` \| [`ConfirmModal`](../../components/Modal/ConfirmModal/classes/ConfirmModal.md) = `null`

#### Source

[Drawer.ts:73](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L73)

***

### contextMenu

> **contextMenu**: [`ContextMenu`](../../components/ContextMenu/ContextMenu/classes/ContextMenu.md)

#### Source

[Drawer.ts:79](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L79)

***

### debug

> **debug**: `boolean` = `false`

#### Source

[Drawer.ts:75](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L75)

***

### drawLayer

> **drawLayer**: `Layer`

#### Source

[Drawer.ts:61](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L61)

***

### grid

> **grid**: `boolean` = `false`

#### Source

[Drawer.ts:80](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L80)

***

### gridLayer

> **gridLayer**: `Layer`

#### Source

[Drawer.ts:60](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L60)

***

### help

> **help**: [`Help`](../../components/tools/Help/Help/classes/Help.md)

#### Source

[Drawer.ts:70](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L70)

***

### options

> **options**: [`DrawerOptions`](../../@types/drawer/type-aliases/DrawerOptions.md)

#### Source

[Drawer.ts:66](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L66)

***

### selectionLayer

> **selectionLayer**: `Layer`

#### Source

[Drawer.ts:62](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L62)

***

### setting

> **setting**: [`Settings`](../../components/tools/Settings/Settings/classes/Settings.md)

#### Source

[Drawer.ts:71](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L71)

***

### socket

> **socket**: `Socket`\<`DefaultEventsMap`, `DefaultEventsMap`\>

#### Source

[Drawer.ts:54](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L54)

***

### stage

> **stage**: `Stage`

#### Source

[Drawer.ts:58](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L58)

***

### toolbar

> **toolbar**: [`Toolbar`](../../components/toolbar/Toolbar/classes/Toolbar.md)

#### Source

[Drawer.ts:63](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L63)

***

### undoRedo

> **undoRedo**: [`UndoRedo`](../../components/tools/UndoRedo/UndoRedo/classes/UndoRedo.md)

#### Source

[Drawer.ts:76](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L76)

***

### zoom

> **zoom**: `undefined` \| [`Zoom`](../../components/tools/Zoom/Zoom/classes/Zoom.md)

#### Source

[Drawer.ts:69](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L69)

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

[Drawer.ts:229](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L229)

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

[Drawer.ts:221](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L221)

***

### \_update()

> **\_update**(): `void`

Update grid lines and bg position

#### Returns

`void`

#### Source

[Drawer.ts:240](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L240)

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

[Drawer.ts:595](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L595)

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

[Drawer.ts:622](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L622)

***

### focus()

> **focus**(): `void`

Focus drawer div container (usefull for keyevent for example)

#### Returns

`void`

#### Source

[Drawer.ts:844](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L844)

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

[Drawer.ts:213](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L213)

***

### getDrawingShapes()

> **getDrawingShapes**(): `Shape`\<`ShapeConfig`\>[]

Get all shape drawing

#### Returns

`Shape`\<`ShapeConfig`\>[]

#### Source

[Drawer.ts:203](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L203)

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

[Drawer.ts:402](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L402)

***

### getZoomLevel()

> **getZoomLevel**(): `number`

Get zoom level

#### Returns

`number`

#### Source

[Drawer.ts:195](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L195)

***

### hideGrid()

> **hideGrid**(): `void`

Hide grid

#### Returns

`void`

#### Source

[Drawer.ts:832](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L832)

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

### resetDrawer()

> **resetDrawer**(): `void`

Reset draw to default state (bgcolor, color, remove draw, etc.)

#### Returns

`void`

#### Source

[Drawer.ts:851](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L851)

***

### save()

> **save**(): `void`

Save current draw state to localstorage

#### Returns

`void`

#### Source

[Drawer.ts:461](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L461)

***

### setBgColor()

> **setBgColor**(`color`): `void`

Change background color

#### Parameters

• **color**: [`ColorLike`](../../@types/drawer/type-aliases/ColorLike.md)

#### Returns

`void`

#### Source

[Drawer.ts:470](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L470)

***

### setOpacity()

> **setOpacity**(`opacity`): `void`

Set opacity of shape 0 to 1

#### Parameters

• **opacity**: `number`

#### Returns

`void`

#### Source

[Drawer.ts:550](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L550)

***

### setSize()

> **setSize**(`width`, `height`): `void`

#### Parameters

• **width**: `number`

• **height**: `number`

#### Returns

`void`

#### Source

[Drawer.ts:860](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L860)

***

### setStrokeColor()

> **setStrokeColor**(`color`): `void`

Set color for draw

#### Parameters

• **color**: [`ColorLike`](../../@types/drawer/type-aliases/ColorLike.md)

#### Returns

`void`

#### Source

[Drawer.ts:486](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L486)

***

### setStrokeStyle()

> **setStrokeStyle**(`dashed`): `void`

#### Parameters

• **dashed**: `undefined` \| `number`[]

#### Returns

`void`

#### Source

[Drawer.ts:528](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L528)

***

### setStrokeWidth()

> **setStrokeWidth**(`width`): `void`

Set stroke width for draw

#### Parameters

• **width**: `string` \| `number`

#### Returns

`void`

#### Source

[Drawer.ts:508](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L508)

***

### showGrid()

> **showGrid**(): `void`

Show grid

#### Returns

`void`

#### Source

[Drawer.ts:642](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L642)

***

### toast()

> **toast**(`message`, `type`?, `timeout`?, `showIcon`?): [`Toast`](../../components/Toast/Toast/classes/Toast.md)

Show toast message for user

#### Parameters

• **message**: `string`

Message to show

• **type?**: `"error"` \| `"neutral"` \| `"info"` \| `"warning"` \| `"danger"`

Type of toast

• **timeout?**: `number`

• **showIcon?**: `boolean`

#### Returns

[`Toast`](../../components/Toast/Toast/classes/Toast.md)

#### Source

[Drawer.ts:573](https://github.com/fabienwnklr/free-drawing/blob/master/src/Drawer.ts#L573)

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
