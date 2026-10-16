**@fabwcie/free-drawing** • [API](../../../../../../README.md)

***

[@fabwcie/free-drawing](../../../../../../README.md) / [components/toolbar/widgets/Highlighter/Highlighter](../README.md) / HighlighterWidget

# Class: HighlighterWidget

Highlighter: wide strokes of fluorescent color (its own, yellow by default), multiplied with the drawing under
them so texts and lines stay readable

## Extends

- [`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md)

## Constructors

### new HighlighterWidget(drawer)

> **new HighlighterWidget**(`drawer`): [`HighlighterWidget`](HighlighterWidget.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../../../Drawer/classes/Drawer.md)

#### Returns

[`HighlighterWidget`](HighlighterWidget.md)

#### Overrides

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`constructor`](../../../FreehandWidget/classes/FreehandWidget.md#constructors)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Highlighter/Highlighter.ts:23](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Highlighter/Highlighter.ts#L23)

## Properties

### $button

> **$button**: `HTMLButtonElement`

#### Inherited from

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`$button`](../../../FreehandWidget/classes/FreehandWidget.md#$button)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:21](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L21)

***

### $container

> **`protected`** **`readonly`** **$container**: `HTMLElement`

#### Inherited from

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`$container`](../../../FreehandWidget/classes/FreehandWidget.md#$container)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:18](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L18)

***

### color

> **color**: [`ColorLike`](../../../../../../@types/drawer/type-aliases/ColorLike.md)

Color of strokes, see `highlighterColors`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Highlighter/Highlighter.ts:19](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Highlighter/Highlighter.ts#L19)

***

### cursor

> **`protected`** **cursor**: `string` = `crosshairCursor`

Stage cursor while widget is active

#### Inherited from

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`cursor`](../../../FreehandWidget/classes/FreehandWidget.md#cursor)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/FreehandWidget.ts:33](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/FreehandWidget.ts#L33)

***

### drawer

> **`protected`** **drawer**: [`Drawer`](../../../../../../Drawer/classes/Drawer.md)

#### Inherited from

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`drawer`](../../../FreehandWidget/classes/FreehandWidget.md#drawer)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:36](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L36)

***

### id

> **id**: `"pan"` \| `"selection"` \| `"brush"` \| `"eraser"` \| `"undo"` \| `"redo"` \| `"text"` \| `"rect"` \| `"circle"` \| `"ellipse"` \| `"square"` \| `"arrow"` \| `"line"` \| `"star"` \| `"triangle"` \| `"polygon"` \| `"diamond"` \| `"heart"` \| `"cloud"` \| `"highlighter"` \| `"laser"` \| `"frame"`

#### Inherited from

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`id`](../../../FreehandWidget/classes/FreehandWidget.md#id)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:22](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L22)

***

### inAction

> **inAction**: `boolean` = `false`

Pointer action in progress (drawing, erasing, selecting...), see `startAction` / `endAction`

#### Inherited from

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`inAction`](../../../FreehandWidget/classes/FreehandWidget.md#inaction)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:29](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L29)

***

### options

> **`readonly`** **options**: [`WidgetOptions`](../../../../../../@types/toolbar/type-aliases/WidgetOptions.md)

Widget options given with drawer `widgets` option

#### Inherited from

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`options`](../../../FreehandWidget/classes/FreehandWidget.md#options)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:27](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L27)

***

### overlay

> **overlay**: [`HighlighterOverlay`](../../../../../tools/Overlay/HighlighterOverlay/HighlighterOverlay/classes/HighlighterOverlay.md)

Options of the tool (color, width...), shown while widget is active (see `showOverlayOnActive`)

#### Overrides

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`overlay`](../../../FreehandWidget/classes/FreehandWidget.md#overlay)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Highlighter/Highlighter.ts:17](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Highlighter/Highlighter.ts#L17)

***

### shortcut

> **shortcut**: `undefined` \| `string`

#### Inherited from

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`shortcut`](../../../FreehandWidget/classes/FreehandWidget.md#shortcut)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:23](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L23)

***

### showOverlayOnActive

> **`protected`** **showOverlayOnActive**: `boolean` = `true`

Show `overlay` while widget is active (false when overlay depends on something else, e.g. selection)

#### Inherited from

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`showOverlayOnActive`](../../../FreehandWidget/classes/FreehandWidget.md#showoverlayonactive)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:31](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L31)

***

### size

> **size**: `number`

Width of strokes, see `highlighterSizes`

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Highlighter/Highlighter.ts:21](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Highlighter/Highlighter.ts#L21)

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

[packages/free-drawing/src/components/toolbar/widgets/FreehandWidget.ts:53](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/FreehandWidget.ts#L53)

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

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`addTo`](../../../FreehandWidget/classes/FreehandWidget.md#addto)

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

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`afterDraw`](../../../FreehandWidget/classes/FreehandWidget.md#afterdraw)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:189](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L189)

***

### clearSelection()

> **clearSelection**(): `void`

Unselect shapes, with selection widget (implemented by it)

#### Returns

`void`

#### Inherited from

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`clearSelection`](../../../FreehandWidget/classes/FreehandWidget.md#clearselection)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:181](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L181)

***

### endAction()

> **`protected`** **endAction**(): `void`

Pointer action ends (pointer up)

#### Returns

`void`

#### Inherited from

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`endAction`](../../../FreehandWidget/classes/FreehandWidget.md#endaction)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:165](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L165)

***

### freehandSettings()

> **`protected`** **freehandSettings**(): `object`

Settings of perfect-freehand

#### Returns

`object`

##### smoothing

> **smoothing**: `number` = `0.5`

##### streamline

> **streamline**: `number` = `0.5`

##### thinning

> **thinning**: `number` = `0`

#### Overrides

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`freehandSettings`](../../../FreehandWidget/classes/FreehandWidget.md#freehandsettings)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Highlighter/Highlighter.ts:50](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Highlighter/Highlighter.ts#L50)

***

### initEvents()

> **`protected`** **initEvents**(): `void`

Add widget events (with `onStage`), called on activation

#### Returns

`void`

#### Inherited from

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`initEvents`](../../../FreehandWidget/classes/FreehandWidget.md#initevents)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/FreehandWidget.ts:57](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/FreehandWidget.ts#L57)

***

### lineStyle()

> **`protected`** **lineStyle**(): `object`

Style of new strokes (color, opacity, name...)

#### Returns

`object`

##### fill

> **fill**: [`ColorLike`](../../../../../../@types/drawer/type-aliases/ColorLike.md)

##### globalCompositeOperation

> **globalCompositeOperation**: `"multiply"`

##### name

> **name**: `string` = `shapeName.highlighter`

##### strokeWidth

> **strokeWidth**: `number` = `0`

#### Overrides

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`lineStyle`](../../../FreehandWidget/classes/FreehandWidget.md#linestyle)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Highlighter/Highlighter.ts:36](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Highlighter/Highlighter.ts#L36)

***

### onActive()

> **`protected`** **onActive**(): `void`

Called on activation, after events, cursor and overlay setup

#### Returns

`void`

#### Inherited from

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`onActive`](../../../FreehandWidget/classes/FreehandWidget.md#onactive)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:137](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L137)

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

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`onConstrainChange`](../../../FreehandWidget/classes/FreehandWidget.md#onconstrainchange)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/FreehandWidget.ts:111](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/FreehandWidget.ts#L111)

***

### onDesactive()

> **`protected`** **onDesactive**(): `void`

Called on deactivation, after events removal and overlay hidden

#### Returns

`void`

#### Inherited from

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`onDesactive`](../../../FreehandWidget/classes/FreehandWidget.md#ondesactive)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:142](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L142)

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

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`onStage`](../../../FreehandWidget/classes/FreehandWidget.md#onstage)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:113](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L113)

***

### removeEvents()

> **`protected`** **removeEvents**(): `void`

Remove widget events, called on deactivation

#### Returns

`void`

#### Inherited from

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`removeEvents`](../../../FreehandWidget/classes/FreehandWidget.md#removeevents)

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

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`setActive`](../../../FreehandWidget/classes/FreehandWidget.md#setactive)

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

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`setDisabled`](../../../FreehandWidget/classes/FreehandWidget.md#setdisabled)

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

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`shareLive`](../../../FreehandWidget/classes/FreehandWidget.md#sharelive)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:174](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L174)

***

### startAction()

> **`protected`** **startAction**(): `void`

Pointer action starts (pointer down): shortcuts are disabled and UI (toolbar, overlays...) ignores pointer

#### Returns

`void`

#### Inherited from

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`startAction`](../../../FreehandWidget/classes/FreehandWidget.md#startaction)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:157](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L157)

***

### strokeSize()

> **`protected`** **strokeSize**(): `number`

Width of strokes

#### Returns

`number`

#### Overrides

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`strokeSize`](../../../FreehandWidget/classes/FreehandWidget.md#strokesize)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/Highlighter/Highlighter.ts:46](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/Highlighter/Highlighter.ts#L46)

***

### toggleDisable()

> **toggleDisable**(): `void`

Disable / enable widget, a disabled widget can not be activated

#### Returns

`void`

#### Inherited from

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`toggleDisable`](../../../FreehandWidget/classes/FreehandWidget.md#toggledisable)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:87](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L87)

***

### updateCursor()

> **updateCursor**(): `void`

#### Returns

`void`

#### Inherited from

[`FreehandWidget`](../../../FreehandWidget/classes/FreehandWidget.md).[`updateCursor`](../../../FreehandWidget/classes/FreehandWidget.md#updatecursor)

#### Source

[packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts:150](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/toolbar/widgets/BaseWidget.ts#L150)
