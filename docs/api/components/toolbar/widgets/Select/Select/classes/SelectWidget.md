**@fabwcie/free-drawing** • [API](../../../../../../README.md)

***

[@fabwcie/free-drawing](../../../../../../README.md) / [components/toolbar/widgets/Select/Select](../README.md) / SelectWidget

# Class: SelectWidget

## Extends

- [`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md)

## Constructors

### new SelectWidget(drawer)

> **new SelectWidget**(`drawer`): [`SelectWidget`](SelectWidget.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../../../Drawer/classes/Drawer.md)

#### Returns

[`SelectWidget`](SelectWidget.md)

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`constructor`](../../../BaseWidget/classes/BaseWidget.md#constructors)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:106](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L106)

## Properties

### $button

> **$button**: `HTMLButtonElement`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`$button`](../../../BaseWidget/classes/BaseWidget.md#$button)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:21](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L21)

***

### $container

> **`protected`** **`readonly`** **$container**: `HTMLElement`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`$container`](../../../BaseWidget/classes/BaseWidget.md#$container)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:18](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L18)

***

### color

> **color**: [`ColorLike`](../../../../../../@types/drawer/type-aliases/ColorLike.md) = `'rgba(152, 158, 255, 1)'`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:59](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L59)

***

### cursor

> **`protected`** **cursor**: `string` = `'default'`

Stage cursor while widget is active

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`cursor`](../../../BaseWidget/classes/BaseWidget.md#cursor)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:33](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L33)

***

### defaultAnchors

> **defaultAnchors**: `string`[]

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:49](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L49)

***

### drawer

> **`protected`** **drawer**: [`Drawer`](../../../../../../Drawer/classes/Drawer.md)

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`drawer`](../../../BaseWidget/classes/BaseWidget.md#drawer)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:36](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L36)

***

### gridAnchorBound

> **gridAnchorBound**: `null` \| (`oldPos`, `newPos`) => `Vector2d` = `null`

Snap of resize anchors to grid (set by drawer while grid is shown), applied when anchor is not snapped to objects

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:100](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L100)

***

### id

> **id**: `"pan"` \| `"selection"` \| `"brush"` \| `"eraser"` \| `"undo"` \| `"redo"` \| `"text"` \| `"rect"` \| `"circle"` \| `"ellipse"` \| `"square"` \| `"arrow"` \| `"line"` \| `"star"` \| `"triangle"` \| `"polygon"` \| `"diamond"` \| `"heart"` \| `"cloud"` \| `"highlighter"` \| `"laser"` \| `"frame"`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`id`](../../../BaseWidget/classes/BaseWidget.md#id)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:22](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L22)

***

### inAction

> **inAction**: `boolean` = `false`

Pointer action in progress (drawing, erasing, selecting...), see `startAction` / `endAction`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`inAction`](../../../BaseWidget/classes/BaseWidget.md#inaction)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:29](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L29)

***

### options

> **`readonly`** **options**: [`WidgetOptions`](../../../../../../@types/toolbar/type-aliases/WidgetOptions.md)

Widget options given with drawer `widgets` option

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`options`](../../../BaseWidget/classes/BaseWidget.md#options)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:27](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L27)

***

### overlay

> **overlay**: [`SelectOverlay`](../../../../../tools/Overlay/SelectOverlay/SelectOverlay/classes/SelectOverlay.md)

Options of the tool (color, width...), shown while widget is active (see `showOverlayOnActive`)

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`overlay`](../../../BaseWidget/classes/BaseWidget.md#overlay)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:102](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L102)

***

### selectionRectangle

> **selectionRectangle**: `Rect`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:60](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L60)

***

### shortcut

> **shortcut**: `undefined` \| `string`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`shortcut`](../../../BaseWidget/classes/BaseWidget.md#shortcut)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:23](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L23)

***

### showOverlayOnActive

> **`protected`** **showOverlayOnActive**: `boolean` = `false`

Show `overlay` while widget is active (false when overlay depends on something else, e.g. selection)

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`showOverlayOnActive`](../../../BaseWidget/classes/BaseWidget.md#showoverlayonactive)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:104](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L104)

***

### snapping

> **snapping**: `boolean` = `false`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:101](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L101)

***

### transformer

> **transformer**: `Transformer`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:62](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L62)

## Accessors

### isDisabled

> **`get`** **isDisabled**(): `boolean`

#### Returns

`boolean`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:103](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L103)

***

### isSelecting

> **`get`** **isSelecting**(): `boolean`

#### Deprecated

use `inAction`

#### Returns

`boolean`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:563](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L563)

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

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`addTo`](../../../BaseWidget/classes/BaseWidget.md#addto)

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

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`afterDraw`](../../../BaseWidget/classes/BaseWidget.md#afterdraw)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:189](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L189)

***

### clearSelection()

> **clearSelection**(): `void`

Unselect shapes and hide selection overlays, overlay of active tool (brush, text...) is shown again

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`clearSelection`](../../../BaseWidget/classes/BaseWidget.md#clearselection)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:506](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L506)

***

### endAction()

> **`protected`** **endAction**(): `void`

Pointer action ends (pointer up)

#### Returns

`void`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`endAction`](../../../BaseWidget/classes/BaseWidget.md#endaction)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:165](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L165)

***

### getShapesAt()

> **getShapesAt**(`pos`, `hit`, `deep`): [`DrawingShape`](../../../../../../@types/drawer/type-aliases/DrawingShape.md)[]

Shapes (or groups) under a point (absolute position), from top to bottom: drawn there (fill, stroke, text box),
then rectangles and ellipses without background around it, smallest first, then locked shapes (or their locked
groups) in the same order

#### Parameters

• **pos**: `Vector2d`

• **hit**: `null` \| [`DrawingShape`](../../../../../../@types/drawer/type-aliases/DrawingShape.md)= `null`

Shape drawn on top (konva hit of pointer event, or its group), none by default

• **deep**: `boolean`= `false`

Shapes of groups instead of groups

#### Returns

[`DrawingShape`](../../../../../../@types/drawer/type-aliases/DrawingShape.md)[]

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:375](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L375)

***

### hideOverlay()

> **hideOverlay**(): `void`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:498](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L498)

***

### initEvents()

> **`protected`** **initEvents**(): `void`

Add widget events (with `onStage`), called on activation

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`initEvents`](../../../BaseWidget/classes/BaseWidget.md#initevents)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:189](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L189)

***

### isLocked()

> **isLocked**(): `boolean`

Selected shapes are locked: selected to be unlocked, not modified

#### Returns

`boolean`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:361](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L361)

***

### onActive()

> **`protected`** **onActive**(): `void`

Called on activation, after events, cursor and overlay setup

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`onActive`](../../../BaseWidget/classes/BaseWidget.md#onactive)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:459](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L459)

***

### onConstrainChange()?

> **`protected`** **`optional`** **onConstrainChange**(`constrain`): `void`

Shift pressed or released during a pointer action (square, circle, straight line...), without pointer move

#### Parameters

• **constrain**: `boolean`

Shift pressed

#### Returns

`void`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`onConstrainChange`](../../../BaseWidget/classes/BaseWidget.md#onconstrainchange)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:148](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L148)

***

### onDesactive()

> **`protected`** **onDesactive**(): `void`

Called on deactivation, after events removal and overlay hidden

#### Returns

`void`

#### Overrides

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`onDesactive`](../../../BaseWidget/classes/BaseWidget.md#ondesactive)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:576](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L576)

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

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`onStage`](../../../BaseWidget/classes/BaseWidget.md#onstage)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:113](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L113)

***

### removeEvents()

> **`protected`** **removeEvents**(): `void`

Remove widget events, called on deactivation

#### Returns

`void`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`removeEvents`](../../../BaseWidget/classes/BaseWidget.md#removeevents)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:130](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L130)

***

### select()

> **select**(`shapes`): `void`

Select shapes (none clears selection): transformer, anchors, selection options instead of options of active tool.
Hidden shapes are not selectable, locked ones only without other shapes: selected as a whole (locked group)
to be unlocked, not modified (no anchors, options nor move)

#### Parameters

• **shapes**: (`Shape`\<`ShapeConfig`\> \| `Group`)[]

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:327](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L327)

***

### selectAll()

> **selectAll**(): `void`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:567](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L567)

***

### setActive()

> **setActive**(`active`): `void`

#### Parameters

• **active**: `boolean`

#### Returns

`void`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`setActive`](../../../BaseWidget/classes/BaseWidget.md#setactive)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:213](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L213)

***

### ~~setBgColor()~~

> **setBgColor**(`color`): `void`

#### Parameters

• **color**: [`ColorLike`](../../../../../../@types/drawer/type-aliases/ColorLike.md)

#### Returns

`void`

#### Deprecated

use `setFillColor`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:901](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L901)

***

### setColor()

> **setColor**(`color`): `void`

Set color for draw

#### Parameters

• **color**: [`ColorLike`](../../../../../../@types/drawer/type-aliases/ColorLike.md)

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:909](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L909)

***

### setDisabled()

> **setDisabled**(`disabled`): `void`

#### Parameters

• **disabled**: `boolean`

#### Returns

`void`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`setDisabled`](../../../BaseWidget/classes/BaseWidget.md#setdisabled)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:91](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L91)

***

### setEdges()

> **setEdges**(`edges`): `void`

Set corners of selected rectangles: sharp, round (radius from their size) or radius

#### Parameters

• **edges**: [`Edges`](../../../../../../@types/drawer/type-aliases/Edges.md)

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:962](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L962)

***

### setFillColor()

> **setFillColor**(`color`): `void`

Change background color of selected rectangles and ellipses

#### Parameters

• **color**: [`ColorLike`](../../../../../../@types/drawer/type-aliases/ColorLike.md)

`'transparent'` for none

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:891](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L891)

***

### setOpacity()

> **setOpacity**(`opacity`): `void`

Set opacity of shape 0 to 1

#### Parameters

• **opacity**: `number`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:974](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L974)

***

### setStrokeStyle()

> **setStrokeStyle**(`style`): `void`

Set stroke style of selected outline shapes (not brush lines, which are filled outlines)

#### Parameters

• **style**: [`StrokeStyle`](../../../../../../@types/drawer/type-aliases/StrokeStyle.md)

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:949](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L949)

***

### setStrokeWidth()

> **setStrokeWidth**(`width`): `void`

Set stroke width for draw

#### Parameters

• **width**: `number`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:927](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L927)

***

### setTextStyle()

> **setTextStyle**(`style`): `void`

Set text style of selected text

#### Parameters

• **style**: `Partial`\<[`TextStyle`](../../../../../../@types/drawer/type-aliases/TextStyle.md)\>

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:982](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L982)

***

### shareLive()

> **`protected`** **shareLive**(...`shapes`): `void`

Shapes being drawn shown to collaborators while drawing (final state is sent on change)

#### Parameters

• ...**shapes**: [`DrawingShape`](../../../../../../@types/drawer/type-aliases/DrawingShape.md)[]

#### Returns

`void`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`shareLive`](../../../BaseWidget/classes/BaseWidget.md#sharelive)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:174](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L174)

***

### showOverlay()

> **showOverlay**(`nodes`): `void`

Show overlay for selected shapes, text overlay if selection contains only text

#### Parameters

• **nodes**: (`Shape`\<`ShapeConfig`\> \| `Group`)[]

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:479](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L479)

***

### startAction()

> **`protected`** **startAction**(): `void`

Pointer action starts (pointer down): shortcuts are disabled and UI (toolbar, overlays...) ignores pointer

#### Returns

`void`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`startAction`](../../../BaseWidget/classes/BaseWidget.md#startaction)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:157](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L157)

***

### toggleDisable()

> **toggleDisable**(): `void`

Disable / enable widget, a disabled widget can not be activated

#### Returns

`void`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`toggleDisable`](../../../BaseWidget/classes/BaseWidget.md#toggledisable)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:87](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L87)

***

### toggleSnapping()

> **toggleSnapping**(`active`): `void`

#### Parameters

• **active**: `boolean`= `true`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts:1005](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Select/Select.ts#L1005)

***

### updateCursor()

> **updateCursor**(): `void`

#### Returns

`void`

#### Inherited from

[`BaseWidget`](../../../BaseWidget/classes/BaseWidget.md).[`updateCursor`](../../../BaseWidget/classes/BaseWidget.md#updatecursor)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:150](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L150)
