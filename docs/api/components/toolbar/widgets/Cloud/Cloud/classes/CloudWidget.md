**@fabwcie/free-drawing** • [API](../../../../../../README.md)

***

[@fabwcie/free-drawing](../../../../../../README.md) / [components/toolbar/widgets/Cloud/Cloud](../README.md) / CloudWidget

# Class: CloudWidget

Tool drawing a closed shape in the dragged box (triangle, diamond, heart, cloud): background color, stroke style,
Shift draws it in a square

## Extends

- [`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md)

## Constructors

### new CloudWidget(drawer)

> **new CloudWidget**(`drawer`): [`CloudWidget`](CloudWidget.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../../../Drawer/classes/Drawer.md)

#### Returns

[`CloudWidget`](CloudWidget.md)

#### Overrides

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`constructor`](../../../PathShapeWidget/classes/PathShapeWidget.md#constructors)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Cloud/Cloud.ts:13](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Cloud/Cloud.ts#L13)

## Properties

### $button

> **$button**: `HTMLButtonElement`

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`$button`](../../../PathShapeWidget/classes/PathShapeWidget.md#$button)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:21](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L21)

***

### $container

> **`protected`** **`readonly`** **$container**: `HTMLElement`

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`$container`](../../../PathShapeWidget/classes/PathShapeWidget.md#$container)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:18](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L18)

***

### cursor

> **`protected`** **cursor**: `string` = `crosshairCursor`

Stage cursor while widget is active

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`cursor`](../../../PathShapeWidget/classes/PathShapeWidget.md#cursor)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/ShapeWidget.ts:56](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/ShapeWidget.ts#L56)

***

### drawer

> **`protected`** **drawer**: [`Drawer`](../../../../../../Drawer/classes/Drawer.md)

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`drawer`](../../../PathShapeWidget/classes/PathShapeWidget.md#drawer)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:36](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L36)

***

### hasEdges

> **`protected`** **hasEdges**: `boolean` = `false`

Corners sharp or round (`edges` option)

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`hasEdges`](../../../PathShapeWidget/classes/PathShapeWidget.md#hasedges)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/ShapeWidget.ts:62](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/ShapeWidget.ts#L62)

***

### hasFill

> **`protected`** **hasFill**: `boolean` = `true`

Shapes of tool have a background color (rectangle, ellipse)

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`hasFill`](../../../PathShapeWidget/classes/PathShapeWidget.md#hasfill)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/PathShapeWidget.ts:25](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/PathShapeWidget.ts#L25)

***

### id

> **id**: `"pan"` \| `"selection"` \| `"brush"` \| `"eraser"` \| `"undo"` \| `"redo"` \| `"text"` \| `"rect"` \| `"circle"` \| `"ellipse"` \| `"square"` \| `"arrow"` \| `"line"` \| `"star"` \| `"triangle"` \| `"polygon"` \| `"diamond"` \| `"heart"` \| `"cloud"` \| `"highlighter"` \| `"laser"` \| `"frame"`

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`id`](../../../PathShapeWidget/classes/PathShapeWidget.md#id)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:22](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L22)

***

### inAction

> **inAction**: `boolean` = `false`

Pointer action in progress (drawing, erasing, selecting...), see `startAction` / `endAction`

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`inAction`](../../../PathShapeWidget/classes/PathShapeWidget.md#inaction)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:29](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L29)

***

### options

> **`readonly`** **options**: [`WidgetOptions`](../../../../../../@types/toolbar/type-aliases/WidgetOptions.md)

Widget options given with drawer `widgets` option

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`options`](../../../PathShapeWidget/classes/PathShapeWidget.md#options)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:27](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L27)

***

### overlay

> **overlay**: [`ShapeOverlay`](../../../../../tools/Overlay/ShapeOverlay/ShapeOverlay/classes/ShapeOverlay.md)

Options of the tool (color, width...), shown while widget is active (see `showOverlayOnActive`)

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`overlay`](../../../PathShapeWidget/classes/PathShapeWidget.md#overlay)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/ShapeWidget.ts:55](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/ShapeWidget.ts#L55)

***

### path

> **`protected`** **path**: `string`

Path in a box of width and height 1, see `scalePath`

#### Overrides

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`path`](../../../PathShapeWidget/classes/PathShapeWidget.md#path)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Cloud/Cloud.ts:9](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Cloud/Cloud.ts#L9)

***

### pointerEvent

> **`protected`** **pointerEvent**: `null` \| `MouseEvent` \| `TouchEvent` = `null`

Last pointer event of drawing (modifier keys)

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`pointerEvent`](../../../PathShapeWidget/classes/PathShapeWidget.md#pointerevent)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/ShapeWidget.ts:64](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/ShapeWidget.ts#L64)

***

### shapeName

> **`protected`** **shapeName**: `string` = `shapeName.cloud`

Name of shapes (see `shapeName`)

#### Overrides

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`shapeName`](../../../PathShapeWidget/classes/PathShapeWidget.md#shapename)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Cloud/Cloud.ts:7](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Cloud/Cloud.ts#L7)

***

### shortcut

> **shortcut**: `undefined` \| `string`

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`shortcut`](../../../PathShapeWidget/classes/PathShapeWidget.md#shortcut)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:23](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L23)

***

### showOverlayOnActive

> **`protected`** **showOverlayOnActive**: `boolean` = `true`

Show `overlay` while widget is active (false when overlay depends on something else, e.g. selection)

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`showOverlayOnActive`](../../../PathShapeWidget/classes/PathShapeWidget.md#showoverlayonactive)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:31](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L31)

## Accessors

### isDisabled

> **`get`** **isDisabled**(): `boolean`

#### Returns

`boolean`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:103](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L103)

***

### isPaint

> **`get`** **isPaint**(): `boolean`

#### Deprecated

use `inAction`

#### Returns

`boolean`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/ShapeWidget.ts:82](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/ShapeWidget.ts#L82)

***

### shapeStyle

> **`get`** **`protected`** **shapeStyle**(): `object`

Style of new shapes, from drawer options

#### Returns

`object`

##### dash

> **dash**: `undefined` \| `number`[]

##### fill

> **fill**: `undefined` \| [`ColorLike`](../../../../../../@types/drawer/type-aliases/ColorLike.md)

##### hitStrokeWidth

> **hitStrokeWidth**: `number`

##### lineCap

> **lineCap**: `"round"`

##### opacity

> **opacity**: `number`

##### stroke

> **stroke**: [`ColorLike`](../../../../../../@types/drawer/type-aliases/ColorLike.md) = `strokeColor`

##### strokeWidth

> **strokeWidth**: `number`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/ShapeWidget.ts:101](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/ShapeWidget.ts#L101)

## Methods

### addTo()

`Internal`

> **addTo**(`parent`): `void`

Adds this to `parent`.
Returns the element that was just added to `parent`.

#### Parameters

• **parent**: `HTMLElement`

#### Returns

`void`

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`addTo`](../../../PathShapeWidget/classes/PathShapeWidget.md#addto)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:69](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L69)

***

### afterDraw()

> **`protected`** **afterDraw**(`shapes`): `void`

Shapes drawn with this tool: selection tool activated with them, unless tool is kept (`keepTool` preference)

#### Parameters

• **shapes**: [`DrawingShape`](../../../../../../@types/drawer/type-aliases/DrawingShape.md)[]

#### Returns

`void`

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`afterDraw`](../../../PathShapeWidget/classes/PathShapeWidget.md#afterdraw)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:189](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L189)

***

### clearSelection()

> **clearSelection**(): `void`

Unselect shapes, with selection widget (implemented by it)

#### Returns

`void`

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`clearSelection`](../../../PathShapeWidget/classes/PathShapeWidget.md#clearselection)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:181](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L181)

***

### createShape()

> **`protected`** **createShape**(`start`): `Path`

New shape at drag start

#### Parameters

• **start**: `Vector2d`

#### Returns

`Path`

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`createShape`](../../../PathShapeWidget/classes/PathShapeWidget.md#createshape)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/PathShapeWidget.ts:31](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/PathShapeWidget.ts#L31)

***

### endAction()

> **`protected`** **endAction**(): `void`

Pointer action ends (pointer up)

#### Returns

`void`

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`endAction`](../../../PathShapeWidget/classes/PathShapeWidget.md#endaction)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:165](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L165)

***

### initEvents()

> **`protected`** **initEvents**(): `void`

Add widget events (with `onStage`), called on activation

#### Returns

`void`

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`initEvents`](../../../PathShapeWidget/classes/PathShapeWidget.md#initevents)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/ShapeWidget.ts:133](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/ShapeWidget.ts#L133)

***

### onActive()

> **`protected`** **onActive**(): `void`

Called on activation, after events, cursor and overlay setup

#### Returns

`void`

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`onActive`](../../../PathShapeWidget/classes/PathShapeWidget.md#onactive)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/ShapeWidget.ts:128](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/ShapeWidget.ts#L128)

***

### onConstrainChange()

> **`protected`** **onConstrainChange**(`constrain`): `void`

Shift pressed or released during a pointer action (square, circle, straight line...), without pointer move

#### Parameters

• **constrain**: `boolean`

Shift pressed

#### Returns

`void`

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`onConstrainChange`](../../../PathShapeWidget/classes/PathShapeWidget.md#onconstrainchange)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/ShapeWidget.ts:123](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/ShapeWidget.ts#L123)

***

### onDesactive()

> **`protected`** **onDesactive**(): `void`

Called on deactivation, after events removal and overlay hidden

#### Returns

`void`

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`onDesactive`](../../../PathShapeWidget/classes/PathShapeWidget.md#ondesactive)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:142](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L142)

***

### onDrawEnd()?

> **`protected`** **`optional`** **onDrawEnd**(`shape`): `void`

Drawing ended: shape drawn, or null (removed: simple click)

#### Parameters

• **shape**: `null` \| `Path`

#### Returns

`void`

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`onDrawEnd`](../../../PathShapeWidget/classes/PathShapeWidget.md#ondrawend)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/ShapeWidget.ts:120](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/ShapeWidget.ts#L120)

***

### onStage()

> **`protected`** **onStage**(`events`, `handler`): `void`

Listen stage events while widget is active.
Events are namespaced with widget id, so they are removed on deactivation without removing other listeners.

#### Parameters

• **events**: `string`

Space separated event names

• **handler**: `KonvaEventListener`\<`Stage`, `any`\>

#### Returns

`void`

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`onStage`](../../../PathShapeWidget/classes/PathShapeWidget.md#onstage)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:113](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L113)

***

### removeEvents()

> **`protected`** **removeEvents**(): `void`

Remove widget events, called on deactivation

#### Returns

`void`

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`removeEvents`](../../../PathShapeWidget/classes/PathShapeWidget.md#removeevents)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:130](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L130)

***

### setActive()

> **setActive**(`active`): `void`

#### Parameters

• **active**: `boolean`

#### Returns

`void`

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`setActive`](../../../PathShapeWidget/classes/PathShapeWidget.md#setactive)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:213](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L213)

***

### setDisabled()

> **setDisabled**(`disabled`): `void`

#### Parameters

• **disabled**: `boolean`

#### Returns

`void`

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`setDisabled`](../../../PathShapeWidget/classes/PathShapeWidget.md#setdisabled)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:91](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L91)

***

### shareLive()

> **`protected`** **shareLive**(...`shapes`): `void`

Shapes being drawn shown to collaborators while drawing (final state is sent on change)

#### Parameters

• ...**shapes**: [`DrawingShape`](../../../../../../@types/drawer/type-aliases/DrawingShape.md)[]

#### Returns

`void`

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`shareLive`](../../../PathShapeWidget/classes/PathShapeWidget.md#sharelive)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:174](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L174)

***

### startAction()

> **`protected`** **startAction**(): `void`

Pointer action starts (pointer down): shortcuts are disabled and UI (toolbar, overlays...) ignores pointer

#### Returns

`void`

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`startAction`](../../../PathShapeWidget/classes/PathShapeWidget.md#startaction)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:157](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L157)

***

### toggleDisable()

> **toggleDisable**(): `void`

Disable / enable widget, a disabled widget can not be activated

#### Returns

`void`

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`toggleDisable`](../../../PathShapeWidget/classes/PathShapeWidget.md#toggledisable)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:87](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L87)

***

### updateCursor()

> **updateCursor**(): `void`

#### Returns

`void`

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`updateCursor`](../../../PathShapeWidget/classes/PathShapeWidget.md#updatecursor)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:150](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L150)

***

### updateShape()

> **`protected`** **updateShape**(`shape`, `start`, `end`, `constrain`): `void`

Update shape geometry from drag start to end

#### Parameters

• **shape**: `Path`

• **start**: `Vector2d`

• **end**: `Vector2d`

• **constrain**: `boolean`

Shift key pressed (square, circle, 45 degrees...)

#### Returns

`void`

#### Inherited from

[`PathShapeWidget`](../../../PathShapeWidget/classes/PathShapeWidget.md).[`updateShape`](../../../PathShapeWidget/classes/PathShapeWidget.md#updateshape)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/PathShapeWidget.ts:43](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/PathShapeWidget.ts#L43)
