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

[packages/free-drawing/src/Drawer.ts:207](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L207)

## Properties

### $el

> **$el**: `HTMLDivElement`

#### Source

[packages/free-drawing/src/Drawer.ts:143](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L143)

***

### $stageContainer

> **$stageContainer**: `HTMLDivElement`

#### Source

[packages/free-drawing/src/Drawer.ts:146](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L146)

***

### \_events

> **\_events**: `object` = `{}`

#### Index signature

 \[`key`: `string`\]: `TCallback`[]

#### Inherited from

[`default`](../../utils/MicroEvent/classes/default.md).[`_events`](../../utils/MicroEvent/classes/default.md#_events)

#### Source

[packages/free-drawing/src/utils/MicroEvent.ts:33](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/utils/MicroEvent.ts#L33)

***

### activeTool

> **activeTool**: `"pan"` \| `"selection"` \| `"brush"` \| `"eraser"` \| `"undo"` \| `"redo"` \| `"text"` \| `"rect"` \| `"circle"` \| `"ellipse"` \| `"square"` \| `"arrow"` \| `"line"` \| `"star"` \| `"triangle"` \| `"polygon"` \| `"diamond"` \| `"heart"` \| `"cloud"` \| `"highlighter"` \| `"laser"` \| `"frame"` = `'brush'`

#### Source

[packages/free-drawing/src/Drawer.ts:153](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L153)

***

### activeWidget

> **activeWidget**: [`BaseWidget`](../../components/toolbar/widgets/BaseWidget/classes/BaseWidget.md)

#### Source

[packages/free-drawing/src/Drawer.ts:154](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L154)

***

### background

> **background**: `Rect`

#### Source

[packages/free-drawing/src/Drawer.ts:157](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L157)

***

### bgLayer

> **bgLayer**: `Layer`

#### Source

[packages/free-drawing/src/Drawer.ts:204](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L204)

***

### clearConfirmModal

> **clearConfirmModal**: `null` \| [`ConfirmModal`](../../components/Modal/ConfirmModal/classes/ConfirmModal.md) = `null`

#### Source

[packages/free-drawing/src/Drawer.ts:174](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L174)

***

### clearStoredConfirmModal

> **clearStoredConfirmModal**: `null` \| [`ConfirmModal`](../../components/Modal/ConfirmModal/classes/ConfirmModal.md) = `null`

#### Source

[packages/free-drawing/src/Drawer.ts:175](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L175)

***

### collaboration

> **collaboration**: `null` \| [`Collaboration`](../../components/Collaboration/Collaboration/classes/Collaboration.md) = `null`

Collaboration session: drawing changes sent to and received from other users of a room

#### Source

[packages/free-drawing/src/Drawer.ts:141](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L141)

***

### collaborationModal

> **collaborationModal**: `null` \| [`CollaborationModal`](../../components/CollaborationModal/CollaborationModal/classes/CollaborationModal.md) = `null`

#### Source

[packages/free-drawing/src/Drawer.ts:142](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L142)

***

### commandPalette

> **commandPalette**: `null` \| [`CommandPalette`](../../components/CommandPalette/CommandPalette/classes/CommandPalette.md) = `null`

Created on first use, see `showCommandPalette`

#### Source

[packages/free-drawing/src/Drawer.ts:178](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L178)

***

### contextMenu

> **contextMenu**: [`ContextMenu`](../../components/ContextMenu/ContextMenu/classes/ContextMenu.md)

#### Source

[packages/free-drawing/src/Drawer.ts:202](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L202)

***

### debug

> **debug**: `boolean` = `false`

#### Source

[packages/free-drawing/src/Drawer.ts:182](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L182)

***

### drawLayer

> **drawLayer**: `Layer`

#### Source

[packages/free-drawing/src/Drawer.ts:150](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L150)

***

### exportModal

> **exportModal**: `null` \| [`ExportModal`](../../components/ExportModal/ExportModal/classes/ExportModal.md) = `null`

#### Source

[packages/free-drawing/src/Drawer.ts:176](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L176)

***

### grid

> **grid**: `boolean` = `false`

#### Source

[packages/free-drawing/src/Drawer.ts:203](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L203)

***

### gridLayer

> **gridLayer**: `Layer`

#### Source

[packages/free-drawing/src/Drawer.ts:149](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L149)

***

### help

> **help**: [`Help`](../../components/tools/Help/Help/classes/Help.md)

#### Source

[packages/free-drawing/src/Drawer.ts:172](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L172)

***

### hotKey

> **hotKey**: [`HotKey`](../../utils/HotKey/classes/HotKey.md)

#### Source

[packages/free-drawing/src/Drawer.ts:205](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L205)

***

### i18n

> **i18n**: [`I18n`](../../i18n/I18n/classes/I18n.md)

Texts of interface, see `t` and `setLanguage`

#### Source

[packages/free-drawing/src/Drawer.ts:167](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L167)

***

### layersPanel

> **layersPanel**: `undefined` \| [`LayersPanel`](../../components/LayersPanel/LayersPanel/classes/LayersPanel.md)

Panel listing shapes (`layersPanel` option)

#### Source

[packages/free-drawing/src/Drawer.ts:163](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L163)

***

### layout

> **layout**: [`DrawerLayout`](../../DrawerLayout/classes/DrawerLayout.md)

Container of the drawer and regions of its interface, see `layout.add`

#### Source

[packages/free-drawing/src/Drawer.ts:145](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L145)

***

### options

> **options**: [`DrawerOptions`](../../@types/drawer/type-aliases/DrawerOptions.md)

#### Source

[packages/free-drawing/src/Drawer.ts:155](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L155)

***

### position

> **position**: `undefined` \| [`Position`](../../components/tools/Position/Position/classes/Position.md)

#### Source

[packages/free-drawing/src/Drawer.ts:159](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L159)

***

### preferencesModal

> **preferencesModal**: `null` \| [`PreferencesModal`](../../components/PreferencesModal/PreferencesModal/classes/PreferencesModal.md) = `null`

Created on first use, see `showPreferences`

#### Source

[packages/free-drawing/src/Drawer.ts:180](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L180)

***

### readOnly

> **readOnly**: `boolean` = `false`

Drawing can't be modified by user (see `setReadOnly`)

#### Source

[packages/free-drawing/src/Drawer.ts:134](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L134)

***

### ready

> **ready**: `Promise`\<`void`\>

Resolved once drawing of `storage` option is loaded (rejected if it can't be), at once without it

#### Source

[packages/free-drawing/src/Drawer.ts:190](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L190)

***

### selectionLayer

> **selectionLayer**: `Layer`

#### Source

[packages/free-drawing/src/Drawer.ts:151](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L151)

***

### selectionMenu

> **selectionMenu**: `undefined` \| [`SelectionMenu`](../../components/SelectionMenu/SelectionMenu/classes/SelectionMenu.md)

Menu next to selected shapes (`selectionMenu` option)

#### Source

[packages/free-drawing/src/Drawer.ts:161](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L161)

***

### setting

> **setting**: [`Settings`](../../components/tools/Settings/Settings/classes/Settings.md)

#### Source

[packages/free-drawing/src/Drawer.ts:173](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L173)

***

### socket

> **socket**: `null` \| [`CollaborationSocket`](../../components/Collaboration/Collaboration/type-aliases/CollaborationSocket.md) = `null`

Collaboration socket, connected during a collaboration session

#### Source

[packages/free-drawing/src/Drawer.ts:139](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L139)

***

### stage

> **stage**: `Stage`

#### Source

[packages/free-drawing/src/Drawer.ts:147](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L147)

***

### theme

> **theme**: [`Theme`](../../@types/drawer/type-aliases/Theme.md) = `'light'`

Theme chosen ('system': device one), see `setTheme`

#### Source

[packages/free-drawing/src/Drawer.ts:165](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L165)

***

### toolbar

> **toolbar**: [`Toolbar`](../../components/toolbar/Toolbar/classes/Toolbar.md)

#### Source

[packages/free-drawing/src/Drawer.ts:152](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L152)

***

### undoRedo

> **undoRedo**: [`UndoRedo`](../../components/tools/UndoRedo/UndoRedo/classes/UndoRedo.md)

#### Source

[packages/free-drawing/src/Drawer.ts:201](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L201)

***

### zoom

> **zoom**: `undefined` \| [`Zoom`](../../components/tools/Zoom/Zoom/classes/Zoom.md)

#### Source

[packages/free-drawing/src/Drawer.ts:158](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L158)

## Accessors

### $drawerContainer

> **`get`** **$drawerContainer**(): `HTMLDivElement`

Container of the drawer: canvas and interface (`layout.$container`)

#### Returns

`HTMLDivElement`

#### Source

[packages/free-drawing/src/Drawer.ts:1956](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1956)

***

### $footerContainer

> **`get`** **$footerContainer**(): `HTMLElement`

#### Deprecated

use `layout.add('footer', $element)`

#### Returns

`HTMLElement`

#### Source

[packages/free-drawing/src/Drawer.ts:1970](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1970)

***

### $footerLeftElement

> **`get`** **$footerLeftElement**(): `HTMLDivElement`

#### Deprecated

use `layout.add('footerStart', $element)`

#### Returns

`HTMLDivElement`

#### Source

[packages/free-drawing/src/Drawer.ts:1977](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1977)

***

### $headerContainer

> **`get`** **$headerContainer**(): `HTMLDivElement`

#### Deprecated

use `layout.add('header', $element)`

#### Returns

`HTMLDivElement`

#### Source

[packages/free-drawing/src/Drawer.ts:1963](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1963)

***

### language

> **`get`** **language**(): `"en"` \| `"fr"` \| `"es"` \| `"de"`

Language of interface shown

#### Returns

`"en"` \| `"fr"` \| `"es"` \| `"de"`

#### Source

[packages/free-drawing/src/Drawer.ts:1743](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1743)

***

### languageChoice

> **`get`** **languageChoice**(): `"en"` \| `"fr"` \| `"es"` \| `"de"` \| `"auto"`

Language chosen: 'auto' (browser one) or a language

#### Returns

`"en"` \| `"fr"` \| `"es"` \| `"de"` \| `"auto"`

#### Source

[packages/free-drawing/src/Drawer.ts:1750](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1750)

***

### user

> **`get`** **user**(): `null` \| [`DrawerUser`](../../@types/drawer/type-aliases/DrawerUser.md)

User of the app (`user` option), null for anonymous user

#### Returns

`null` \| [`DrawerUser`](../../@types/drawer/type-aliases/DrawerUser.md)

#### Source

[packages/free-drawing/src/Drawer.ts:523](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L523)

## Methods

### ~~UIPointerEvents()~~

> **UIPointerEvents**(`state`): `void`

#### Parameters

• **state**: `"none"` \| `"all"`

#### Returns

`void`

#### Deprecated

use `layout.setPointerEvents`

#### Source

[packages/free-drawing/src/Drawer.ts:1949](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1949)

***

### \_createSocket()

> **`protected`** **\_createSocket**(): `Promise`\<[`CollaborationSocket`](../../components/Collaboration/Collaboration/type-aliases/CollaborationSocket.md)\>

Socket connected to collaboration server: true is page origin, string is server url, options give url and
data read by server on connection (socket.io client is loaded only then)

#### Returns

`Promise`\<[`CollaborationSocket`](../../components/Collaboration/Collaboration/type-aliases/CollaborationSocket.md)\>

#### Source

[packages/free-drawing/src/Drawer.ts:621](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L621)

***

### \_duringAction()

> **\_duringAction**(): `boolean`

#### Returns

`boolean`

#### Source

[packages/free-drawing/src/Drawer.ts:869](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L869)

***

### \_getPointerPos()

> **\_getPointerPos**(): `Vector2d`

Pointer in view, center of view when pointer is out of canvas (menu, keyboard)

#### Returns

`Vector2d`

#### Source

[packages/free-drawing/src/Drawer.ts:755](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L755)

***

### \_getRelativePointerPos()

> **\_getRelativePointerPos**(): `Vector2d`

Pointer in drawing (view moved and zoomed), center of view when pointer is out of canvas (menu, keyboard)

#### Returns

`Vector2d`

#### Source

[packages/free-drawing/src/Drawer.ts:748](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L748)

***

### \_hasPointer()

> **\_hasPointer**(): `boolean`

Pointer registered by stage: over canvas, or during a pointer action (konva forgets it when pointer leaves canvas)

#### Returns

`boolean`

#### Source

[packages/free-drawing/src/Drawer.ts:741](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L741)

***

### \_onActionEnd()

> **\_onActionEnd**(): `void`

Pointer action of a widget ended: changes of collaborators received meanwhile are applied

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:637](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L637)

***

### \_onCollaborationRight()

> **\_onCollaborationRight**(`canEdit`): `void`

Right to draw of this user given or removed by owner of collaboration room

#### Parameters

• **canEdit**: `boolean`

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:430](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L430)

***

### \_preferencesChanged()

> **\_preferencesChanged**(): `void`

A preference may have changed: saved in browser, event once current code ends (several changes give one event)

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:1831](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1831)

***

### \_update()

> **\_update**(): `void`

Update bg position (grid is redrawn with stage) and position widget, after view move or zoom

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:764](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L764)

***

### addShape()

> **addShape**\<`T`\>(`shape`): `T`

Add drawing shape (or group) to draw layer, draggable only with selection tool.
Every drawing shape must be added with this method (tools, history, collaboration...)

#### Type parameters

• **T** extends [`DrawingShape`](../../@types/drawer/type-aliases/DrawingShape.md)

#### Parameters

• **shape**: `T`

#### Returns

`T`

added shape

#### Source

[packages/free-drawing/src/Drawer.ts:692](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L692)

***

### canGroupShapes()

> **canGroupShapes**(`shapes`): `boolean`

Shapes can be grouped: 2 at least, of the same group (or drawing)

#### Parameters

• **shapes**: [`DrawingShape`](../../@types/drawer/type-aliases/DrawingShape.md)[]= `undefined`

Selected shapes by default

#### Returns

`boolean`

#### Source

[packages/free-drawing/src/Drawer.ts:1323](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1323)

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

[packages/free-drawing/src/Drawer.ts:1985](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1985)

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

[packages/free-drawing/src/Drawer.ts:2006](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L2006)

***

### copyImage()

> **copyImage**(`format`, `options`): `Promise`\<`void`\>

Copy image of selected shapes (whole drawing without selection) to clipboard: png image, or svg image and text
(pasted as svg code in editors), message shown

#### Parameters

• **format**: `"png"` \| `"svg"`= `'png'`

• **options**: [`ExportImageOptions`](../type-aliases/ExportImageOptions.md)= `{}`

#### Returns

`Promise`\<`void`\>

#### Source

[packages/free-drawing/src/Drawer.ts:1184](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1184)

***

### copyLink()

> **copyLink**(): `Promise`\<`void`\>

Copy link to drawing (see `getLink`) to clipboard

#### Returns

`Promise`\<`void`\>

#### Source

[packages/free-drawing/src/Drawer.ts:1639](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1639)

***

### deleteShapes()

> **deleteShapes**(`shapes`): `boolean`

Remove shapes (selected ones by default), removed from selection

#### Parameters

• **shapes**: [`DrawingShape`](../../@types/drawer/type-aliases/DrawingShape.md)[]= `undefined`

#### Returns

`boolean`

true if a shape was removed (change saved)

#### Source

[packages/free-drawing/src/Drawer.ts:1262](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1262)

***

### duplicateShapes()

> **duplicateShapes**(`shapes`): [`DrawingShape`](../../@types/drawer/type-aliases/DrawingShape.md)[]

Copy shapes (selected ones by default) a little further, copies are selected

#### Parameters

• **shapes**: [`DrawingShape`](../../@types/drawer/type-aliases/DrawingShape.md)[]= `undefined`

#### Returns

[`DrawingShape`](../../@types/drawer/type-aliases/DrawingShape.md)[]

copies, on top of drawing (change saved)

#### Source

[packages/free-drawing/src/Drawer.ts:1210](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1210)

***

### exportCanvas()

> **exportCanvas**(`options`): `null` \| `HTMLCanvasElement`

Drawing (or selected shapes) rendered on a canvas as exported in png, synchronous (preview), null if nothing to export

#### Parameters

• **options**: [`ExportImageOptions`](../type-aliases/ExportImageOptions.md)= `{}`

#### Returns

`null` \| `HTMLCanvasElement`

#### Source

[packages/free-drawing/src/Drawer.ts:1528](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1528)

***

### exportImage()

> **exportImage**(`format`, `options`): `Promise`\<`Blob`\>

Drawing (or selected shapes) as png, svg or pdf image

#### Parameters

• **format**: [`ImageFormat`](../../utils/export/type-aliases/ImageFormat.md)

• **options**: [`ExportImageOptions`](../type-aliases/ExportImageOptions.md)= `{}`

#### Returns

`Promise`\<`Blob`\>

#### Throws

nothing to export

#### Source

[packages/free-drawing/src/Drawer.ts:1506](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1506)

***

### fitFrame()

> **fitFrame**(`frame`): `void`

Frame drawn or resized: takes shapes of drawing entirely in it, gives back to drawing its shapes out of it

#### Parameters

• **frame**: [`Frame`](../../utils/frame/classes/Frame.md)

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:1426](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1426)

***

### fitTextWidth()

> **fitTextWidth**(`shapes`): `boolean`

Fit width of texts (selected ones by default, also texts of groups) to their content: box of their longest line,
lines no longer wrapped, text stays in place

#### Parameters

• **shapes**: [`DrawingShape`](../../@types/drawer/type-aliases/DrawingShape.md)[]= `undefined`

#### Returns

`boolean`

true if a text changed (change saved)

#### Source

[packages/free-drawing/src/Drawer.ts:1156](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1156)

***

### flipShapes()

> **flipShapes**(`direction`, `shapes`): `void`

Flip shapes (selected ones by default) around the center of their box, texts are still read from left to right

#### Parameters

• **direction**: `"horizontal"` \| `"vertical"`

• **shapes**: [`DrawingShape`](../../@types/drawer/type-aliases/DrawingShape.md)[]= `undefined`

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:1085](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1085)

***

### focus()

> **focus**(`options`?): `void`

Focus drawer div container (usefull for keyevent for example)

#### Parameters

• **options?**: `FocusOptions`

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:2181](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L2181)

***

### getCollaborationLink()

> **getCollaborationLink**(`room`): `string`

Link to join a room: current page with `#room=<id>&by=<user id>`, owner knows who shared it

#### Parameters

• **room**: `undefined` \| `string`= `undefined`

Room id, room of current session by default

#### Returns

`string`

#### Source

[packages/free-drawing/src/Drawer.ts:500](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L500)

***

### getDrawingFile()

> **getDrawingFile**(`shapes`): [`DrawingFile`](../../utils/drawingFile/type-aliases/DrawingFile.md)

Drawing as file content (`.freedrawing` file, link): background color and drawing shapes

#### Parameters

• **shapes**: [`DrawingShape`](../../@types/drawer/type-aliases/DrawingShape.md)[]= `undefined`

#### Returns

[`DrawingFile`](../../utils/drawingFile/type-aliases/DrawingFile.md)

#### Source

[packages/free-drawing/src/Drawer.ts:1062](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1062)

***

### getDrawingShapeByName()

> **getDrawingShapeByName**(`shapeType`): (`Shape`\<`ShapeConfig`\> \| `Group`)[]

Get all drawing shape by name

#### Parameters

• **shapeType**: `"selection"` \| `"text"` \| `"rect"` \| `"ellipse"` \| `"arrow"` \| `"line"` \| `"triangle"` \| `"diamond"` \| `"heart"` \| `"cloud"` \| `"highlighter"` \| `"frame"` \| `"background"` \| `"group"` \| `"straightLine"` \| `"guideLine"` \| `"gridLine"`

Shape type

#### Returns

(`Shape`\<`ShapeConfig`\> \| `Group`)[]

#### Source

[packages/free-drawing/src/Drawer.ts:730](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L730)

***

### getDrawingShapes()

> **getDrawingShapes**(): [`DrawingShape`](../../@types/drawer/type-aliases/DrawingShape.md)[]

Get all shape drawing

#### Returns

[`DrawingShape`](../../@types/drawer/type-aliases/DrawingShape.md)[]

#### Source

[packages/free-drawing/src/Drawer.ts:681](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L681)

***

### getExportShapes()

> **getExportShapes**(`selected`): [`DrawingShape`](../../@types/drawer/type-aliases/DrawingShape.md)[]

Shapes to export: selected ones when there is a selection, else all drawing shapes

#### Parameters

• **selected**: `boolean`= `true`

Selected shapes only

#### Returns

[`DrawingShape`](../../@types/drawer/type-aliases/DrawingShape.md)[]

#### Source

[packages/free-drawing/src/Drawer.ts:1496](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1496)

***

### getLink()

> **getLink**(): `Promise`\<`string`\>

Link to current page with drawing in its hash (`#<drawer id>=<data>`), no server needed

#### Returns

`Promise`\<`string`\>

#### Source

[packages/free-drawing/src/Drawer.ts:1628](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1628)

***

### getPreferences()

> **getPreferences**(): [`Preferences`](../../@types/drawer/type-aliases/Preferences.md)

Interface settings of user (e.g. saved by the app for its logged in user)

#### Returns

[`Preferences`](../../@types/drawer/type-aliases/Preferences.md)

#### Source

[packages/free-drawing/src/Drawer.ts:1769](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1769)

***

### getSelectedShapes()

> **getSelectedShapes**(): [`DrawingShape`](../../@types/drawer/type-aliases/DrawingShape.md)[]

Drawing shapes selected with selection tool

#### Returns

[`DrawingShape`](../../@types/drawer/type-aliases/DrawingShape.md)[]

#### Source

[packages/free-drawing/src/Drawer.ts:1074](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1074)

***

### getShapeLabel()

> **getShapeLabel**(`shape`): `string`

Name of a shape (layers panel): name given by user, else first line of a text, else type of shape

#### Parameters

• **shape**: [`DrawingShape`](../../@types/drawer/type-aliases/DrawingShape.md)

#### Returns

`string`

#### Source

[packages/free-drawing/src/Drawer.ts:1374](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1374)

***

### getUserId()

> **getUserId**(): `string`

Id of this user in collaboration sessions (rights given by owners): of `user` option, else kept in browser

#### Returns

`string`

#### Source

[packages/free-drawing/src/Drawer.ts:544](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L544)

***

### getUserName()

> **getUserName**(): `string`

Name shown to other users in collaboration sessions: given for this visit, else of `user` option, else kept in browser

#### Returns

`string`

#### Source

[packages/free-drawing/src/Drawer.ts:589](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L589)

***

### getWidget()

> **getWidget**\<`T`\>(`name`): `undefined` \| `T`

Get widget by name

#### Type parameters

• **T**

#### Parameters

• **name**: `"pan"` \| `"selection"` \| `"brush"` \| `"eraser"` \| `"undo"` \| `"redo"` \| `"text"` \| `"rect"` \| `"circle"` \| `"ellipse"` \| `"square"` \| `"arrow"` \| `"line"` \| `"star"` \| `"triangle"` \| `"polygon"` \| `"diamond"` \| `"heart"` \| `"cloud"` \| `"highlighter"` \| `"laser"` \| `"frame"`

#### Returns

`undefined` \| `T`

#### Source

[packages/free-drawing/src/Drawer.ts:865](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L865)

***

### getZoomLevel()

> **getZoomLevel**(): `number`

Get zoom level

#### Returns

`number`

#### Source

[packages/free-drawing/src/Drawer.ts:645](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L645)

***

### groupShapes()

> **groupShapes**(`shapes`): `null` \| `Group`

Group shapes (selected ones by default, 2 at least, of the same group): moved, transformed, hidden, locked,
ordered and named together. The group takes place of top shape and is selected

#### Parameters

• **shapes**: [`DrawingShape`](../../@types/drawer/type-aliases/DrawingShape.md)[]= `undefined`

#### Returns

`null` \| `Group`

group (change saved)

#### Source

[packages/free-drawing/src/Drawer.ts:1292](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1292)

***

### hasUnsavedChanges()

> **hasUnsavedChanges**(): `boolean`

Drawing has changes not saved yet: without auto save, until `save` (or `saveNow`)

#### Returns

`boolean`

#### Source

[packages/free-drawing/src/Drawer.ts:922](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L922)

***

### hideGrid()

> **hideGrid**(): `void`

Hide grid

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:2168](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L2168)

***

### isDarkMode()

> **isDarkMode**(): `boolean`

Dark theme shown (chosen, or of device with 'system' theme)

#### Returns

`boolean`

#### Source

[packages/free-drawing/src/Drawer.ts:1888](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1888)

***

### loadDrawing()

> **loadDrawing**(`file`): `void`

Replace drawing by a drawing file content, undo restores previous drawing

#### Parameters

• **file**: `string` \| [`DrawingFile`](../../utils/drawingFile/type-aliases/DrawingFile.md)

Content or its JSON

#### Returns

`void`

#### Throws

not a drawing file

#### Source

[packages/free-drawing/src/Drawer.ts:1584](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1584)

***

### loadFromStorage()

> **loadFromStorage**(): `Promise`\<`void`\>

Load drawing of `storage` option (on init, again after login...): it replaces drawing (kept if nothing is
stored), history starts from it, changes are saved in storage once it is loaded

#### Returns

`Promise`\<`void`\>

Rejected if drawing can't be loaded (shown in a toast): changes are not saved

#### Source

[packages/free-drawing/src/Drawer.ts:996](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L996)

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

[packages/free-drawing/src/utils/MicroEvent.ts:47](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/utils/MicroEvent.ts#L47)

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

[packages/free-drawing/src/utils/MicroEvent.ts:39](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/utils/MicroEvent.ts#L39)

***

### open()

> **open**(): `Promise`\<`void`\>

Open a `.freedrawing` file chosen by user, it replaces drawing (undo restores it)

#### Returns

`Promise`\<`void`\>

#### Source

[packages/free-drawing/src/Drawer.ts:1613](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1613)

***

### placeInFrames()

> **placeInFrames**(`shapes`): `void`

Shapes (drawn, moved, transformed) put in the frame containing their center, or back in drawing out of frames.
Frames and shapes of groups are not concerned.

#### Parameters

• **shapes**: [`DrawingShape`](../../@types/drawer/type-aliases/DrawingShape.md)[]

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:1410](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1410)

***

### reorderShapes()

> **reorderShapes**(`order`, `shapes`): `boolean`

Move shapes in stacking order: `forward` / `backward` above / below the next shape they overlap,
`front` / `back` above / below all shapes (relative order of moved shapes is kept)

#### Parameters

• **order**: [`ShapeOrder`](../../@types/drawer/type-aliases/ShapeOrder.md)

• **shapes**: [`DrawingShape`](../../@types/drawer/type-aliases/DrawingShape.md)[]= `undefined`

Selected shapes by default

#### Returns

`boolean`

true if a shape moved (change saved)

#### Source

[packages/free-drawing/src/Drawer.ts:1484](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1484)

***

### resetDrawer()

> **resetDrawer**(): `void`

Reset drawer to its initial state: remove drawing (without confirmation), white background
and drawing options given on init (color, width, opacity, text style...)

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:2189](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L2189)

***

### rotateShapes()

> **rotateShapes**(`angle`, `shapes`): `void`

Rotate shapes (selected ones by default) around the center of their box

#### Parameters

• **angle**: `number`

Degrees, clockwise when positive (90: quarter turn right, -90: left)

• **shapes**: [`DrawingShape`](../../@types/drawer/type-aliases/DrawingShape.md)[]= `undefined`

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:1118](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1118)

***

### save()

> **save**(): `Promise`\<`void`\>

Save drawing in `storage` option (once its drawing is loaded), else in localStorage

#### Returns

`Promise`\<`void`\>

Resolved once saved (errors are shown in a toast)

#### Source

[packages/free-drawing/src/Drawer.ts:895](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L895)

***

### saveAs()

> **saveAs**(`name`): `Promise`\<`void`\>

Save drawing in a `.freedrawing` file, with browser save dialog when available (Chromium) else downloaded

#### Parameters

• **name**: `string`= `'drawing'`

File name without extension

#### Returns

`Promise`\<`void`\>

#### Source

[packages/free-drawing/src/Drawer.ts:1599](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1599)

***

### saveNow()

> **saveNow**(): `Promise`\<`void`\>

Save drawing (`save`) and tell it, from menu and command palette

#### Returns

`Promise`\<`void`\>

#### Source

[packages/free-drawing/src/Drawer.ts:914](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L914)

***

### setAutoSave()

> **setAutoSave**(`autoSave`): `void`

Save drawing on each change, or only with `save` / `saveNow` (preference): pending changes saved when enabled

#### Parameters

• **autoSave**: `boolean`

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:930](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L930)

***

### setBgColor()

> **setBgColor**(`color`): `void`

Change background color

#### Parameters

• **color**: [`ColorLike`](../../@types/drawer/type-aliases/ColorLike.md)

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:1671](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1671)

***

### setEdges()

> **setEdges**(`value`): `void`

Set corners of rectangles (new and selected ones)

#### Parameters

• **value**: [`Edges`](../../@types/drawer/type-aliases/Edges.md)

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:1903](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1903)

***

### setFillColor()

> **setFillColor**(`color`): `void`

Set background color of rectangles and ellipses (new and selected ones)

#### Parameters

• **color**: [`ColorLike`](../../@types/drawer/type-aliases/ColorLike.md)

`'transparent'` for none

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:1701](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1701)

***

### setKeepTool()

> **setKeepTool**(`keepTool`): `void`

Keep drawing tool after drawing a shape, else selection tool is activated with the drawn shape (preference)

#### Parameters

• **keepTool**: `boolean`

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:942](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L942)

***

### setLanguage()

> **setLanguage**(`language`): `void`

Set language of interface (saved for next visits): every text is translated at once

#### Parameters

• **language**: `"en"` \| `"fr"` \| `"es"` \| `"de"` \| `"auto"`

'en', 'fr', 'es', 'de' or 'auto' (browser one)

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:1758](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1758)

***

### setOpacity()

> **setOpacity**(`opacity`): `void`

Set opacity of shape 0 to 1

#### Parameters

• **opacity**: `number`

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:1915](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1915)

***

### setPreferences()

> **setPreferences**(`preferences`): `void`

Apply interface settings (given ones only), one `drawer.preferences.change` event

#### Parameters

• **preferences**: `Partial`\<[`Preferences`](../../@types/drawer/type-aliases/Preferences.md)\>

Grid wins when grid and snapping are both true

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:1785](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1785)

***

### setReadOnly()

> **setReadOnly**(`readOnly`): `void`

Read only: drawing can't be modified by user (tools except pan, shortcuts and menu items modifying drawing,
text edition), API methods still modify it

#### Parameters

• **readOnly**: `boolean`

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:400](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L400)

***

### setShapeLabel()

> **setShapeLabel**(`shape`, `label`, `save`): `boolean`

Give a name to a shape (saved with it), an empty name gives back its default name (frames: their title)

#### Parameters

• **shape**: [`DrawingShape`](../../@types/drawer/type-aliases/DrawingShape.md)

• **label**: `string`

• **save**: `boolean`= `true`

Change saved (default true)

#### Returns

`boolean`

true if name changed

#### Source

[packages/free-drawing/src/Drawer.ts:1391](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1391)

***

### setShapesHidden()

> **setShapesHidden**(`hidden`, `shapes`): `boolean`

Hide shapes (selected ones by default): not drawn, selected nor exported

#### Parameters

• **hidden**: `boolean`

• **shapes**: [`DrawingShape`](../../@types/drawer/type-aliases/DrawingShape.md)[]= `undefined`

#### Returns

`boolean`

true if a shape changed (change saved)

#### Source

[packages/free-drawing/src/Drawer.ts:1456](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1456)

***

### setShapesLocked()

> **setShapesLocked**(`locked`, `shapes`): `boolean`

Lock shapes (selected ones by default): not moved, transformed nor erased on canvas, only selected to be unlocked

#### Parameters

• **locked**: `boolean`

• **shapes**: [`DrawingShape`](../../@types/drawer/type-aliases/DrawingShape.md)[]= `undefined`

#### Returns

`boolean`

true if a shape changed (change saved)

#### Source

[packages/free-drawing/src/Drawer.ts:1443](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1443)

***

### setSize()

> **setSize**(`width`, `height`): `void`

#### Parameters

• **width**: `number`

• **height**: `number`

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:2203](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L2203)

***

### setStrokeColor()

> **setStrokeColor**(`color`): `void`

Set color for draw

#### Parameters

• **color**: [`ColorLike`](../../@types/drawer/type-aliases/ColorLike.md)

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:1691](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1691)

***

### setStrokeStyle()

> **setStrokeStyle**(`style`): `void`

Set stroke style of lines, arrows, rectangles and ellipses (new and selected ones)

#### Parameters

• **style**: `undefined` \| [`StrokeStyle`](../../@types/drawer/type-aliases/StrokeStyle.md) \| `number`[]

'solid', 'dashed' or 'dotted' (deprecated dash array gives 'dashed', undefined 'solid')

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:1723](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1723)

***

### setStrokeWidth()

> **setStrokeWidth**(`width`): `void`

Set stroke width for draw

#### Parameters

• **width**: `string` \| `number`

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:1711](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1711)

***

### setTextStyle()

> **setTextStyle**(`style`): `void`

Set text style (font family, size, style, decoration, align) of new and selected text

#### Parameters

• **style**: `Partial`\<[`TextStyle`](../../@types/drawer/type-aliases/TextStyle.md)\>

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:1925](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1925)

***

### setTheme()

> **setTheme**(`theme`): `void`

Set theme (saved for next visits): in dark mode, drawing is shown with inverted colors, its colors are kept

#### Parameters

• **theme**: [`Theme`](../../@types/drawer/type-aliases/Theme.md)

'light', 'dark' or 'system' (device one)

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:1879](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1879)

***

### setUser()

> **setUser**(`user`): `void`

User logged in or out: their id is used by next collaboration sessions, their name at once

#### Parameters

• **user**: `null` \| [`DrawerUser`](../../@types/drawer/type-aliases/DrawerUser.md)

null for anonymous user (id and name kept in browser)

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:531](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L531)

***

### setUserName()

> **setUserName**(`name`): `void`

Change name shown to other users (current session and next ones)

#### Parameters

• **name**: `string`

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:596](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L596)

***

### setZoomLevel()

> **setZoomLevel**(`scale`, `point`): `void`

Set zoom level, limited from 10% to 3000%

#### Parameters

• **scale**: `number`

Zoom level (1 = 100%)

• **point**: `Vector2d`= `undefined`

Absolute position that stays in place, stage center by default

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:654](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L654)

***

### showCollaboration()

> **showCollaboration**(`joinRoom`, `invitedBy`?): `void`

Live collaboration dialog: owner starts / stops session, shares link and QR code, gives rights;
other users give their name

#### Parameters

• **joinRoom**: `null` \| `string`= `null`

Room of a link, joined once user gave a name

• **invitedBy?**: `string`

Id of user who shared the link

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:515](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L515)

***

### showCommandPalette()

> **showCommandPalette**(): `void`

Command palette: search a tool or command available now and run it

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:1566](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1566)

***

### showExport()

> **showExport**(): `void`

Export dialog: preview, png, svg, pdf, drawing file, copy to clipboard

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:1558](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1558)

***

### showGrid()

> **showGrid**(): `void`

Show grid

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:2024](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L2024)

***

### showPreferences()

> **showPreferences**(): `void`

Preferences dialog: theme, language, zen mode, grid, snapping, name in collaboration sessions

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:1574](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1574)

***

### startCollaboration()

> **startCollaboration**(`room`?, `name`?, `invitedBy`?): `Promise`\<`string`\>

Start a live collaboration session in a room (`collaboration` option gives the server), current session is stopped

#### Parameters

• **room?**: `string`

Room id, new room by default

• **name?**: `string`= `undefined`

Name shown to other users, saved for next sessions

• **invitedBy?**: `string`

Id of user who shared the link (see `getCollaborationLink`), shown to owner

#### Returns

`Promise`\<`string`\>

Link to join the room

#### Source

[packages/free-drawing/src/Drawer.ts:442](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L442)

***

### stopCollaboration()

> **stopCollaboration**(): `void`

Stop live collaboration session (drawing is kept)

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:482](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L482)

***

### t()

> **t**(`key`, `params`?): `string`

Text of interface in current language

#### Parameters

• **key**: `"drawer.label"` \| `"language.auto"` \| `"toast.collaborationUnavailable"` \| `"toast.canDraw"` \| `"toast.viewOnly"` \| `"toast.saveFailed"` \| `"toast.saved"` \| `"toast.loadFailed"` \| `"toast.invalidFile"` \| `"toast.linkCopied"` \| `"toast.linkNotCopied"` \| `"toast.invalidLink"` \| `"toast.clipboardUnavailable"` \| `"toast.exportFailed"` \| `"toast.imageCopied"` \| `"toast.imageNotCopied"` \| `"toast.selectionTool"` \| `"modal.close"` \| `"confirm.message"` \| `"confirm.clearCanvas"` \| `"confirm.clearStorage"` \| `"confirm.cancel"` \| `"confirm.confirm"` \| `"menu.label"` \| `"menu.open"` \| `"menu.saveAs"` \| `"menu.save"` \| `"menu.unsaved"` \| `"menu.copyLink"` \| `"menu.collaboration"` \| `"menu.collaborationOn"` \| `"menu.collaborationUsers"` \| `"menu.export"` \| `"menu.clearCanvas"` \| `"menu.showGrid"` \| `"menu.zenMode"` \| `"menu.darkMode"` \| `"menu.github"` \| `"menu.githubLabel"` \| `"menu.clearStorage"` \| `"menu.background"` \| `"menu.language"` \| `"menu.commands"` \| `"menu.preferences"` \| `"preferences.title"` \| `"preferences.autoSave"` \| `"preferences.save"` \| `"preferences.appearance"` \| `"preferences.theme"` \| `"preferences.light"` \| `"preferences.dark"` \| `"preferences.system"` \| `"preferences.drawing"` \| `"commands.search"` \| `"commands.empty"` \| `"commands.file"` \| `"commands.language"` \| `"color.white"` \| `"color.lightGray"` \| `"color.lightBlue"` \| `"color.lightYellow"` \| `"color.lightBeige"` \| `"color.lightRed"` \| `"color.lightGreen"` \| `"color.black"` \| `"color.red"` \| `"color.green"` \| `"color.blue"` \| `"color.orange"` \| `"color.yellow"` \| `"color.pink"` \| `"color.transparent"` \| `"color.custom"` \| `"help.title"` \| `"help.documentation"` \| `"help.issue"` \| `"help.shortcuts"` \| `"help.tools"` \| `"help.editor"` \| `"help.view"` \| `"help.or"` \| `"help.selectAll"` \| `"help.deleteSelection"` \| `"help.duplicate"` \| `"help.group"` \| `"help.selectInGroup"` \| `"help.constrainDrawing"` \| `"help.whileDrawing"` \| `"help.arrowUnlinked"` \| `"help.constrainSelection"` \| `"help.whileTransforming"` \| `"help.move"` \| `"help.forwardBackward"` \| `"help.frontBack"` \| `"help.lock"` \| `"help.paste"` \| `"help.open"` \| `"help.save"` \| `"help.export"` \| `"help.grid"` \| `"help.layers"` \| `"help.layersSelect"` \| `"help.snap"` \| `"help.zoom"` \| `"help.toolsConstrain"` \| `"key.delete"` \| `"key.arrows"` \| `"key.click"` \| `"key.space"` \| `"key.wheel"` \| `"toolbar.label"` \| `"toolbar.moreTools"` \| `"toolbar.keepTool"` \| `"tools.pan"` \| `"tools.selection"` \| `"tools.brush"` \| `"tools.eraser"` \| `"tools.text"` \| `"tools.line"` \| `"tools.square"` \| `"tools.circle"` \| `"tools.arrow"` \| `"tools.triangle"` \| `"tools.diamond"` \| `"tools.heart"` \| `"tools.cloud"` \| `"tools.highlighter"` \| `"tools.laser"` \| `"tools.frame"` \| `"zoom.label"` \| `"zoom.out"` \| `"zoom.in"` \| `"zoom.reset"` \| `"history.label"` \| `"history.undo"` \| `"history.redo"` \| `"position.label"` \| `"position.recenter"` \| `"context.paste"` \| `"context.snap"` \| `"context.lock"` \| `"context.unlock"` \| `"selectionMenu.label"` \| `"action.duplicate"` \| `"action.group"` \| `"action.ungroup"` \| `"action.sendToBack"` \| `"action.sendBackward"` \| `"action.bringForward"` \| `"action.bringToFront"` \| `"action.delete"` \| `"action.rotateRight"` \| `"action.rotateLeft"` \| `"action.flipHorizontal"` \| `"action.flipVertical"` \| `"action.fitTextWidth"` \| `"action.copyPng"` \| `"action.copySvg"` \| `"overlay.tool"` \| `"overlay.selection"` \| `"overlay.shape"` \| `"overlay.brush"` \| `"overlay.highlighter"` \| `"overlay.text"` \| `"overlay.stroke"` \| `"overlay.color"` \| `"overlay.background"` \| `"overlay.strokeWidth"` \| `"overlay.strokeStyle"` \| `"overlay.edges"` \| `"overlay.opacity"` \| `"overlay.layers"` \| `"width.thin"` \| `"width.medium"` \| `"width.thick"` \| `"width.extraThick"` \| `"style.solid"` \| `"style.dashed"` \| `"style.dotted"` \| `"edges.sharp"` \| `"edges.round"` \| `"edges.radius"` \| `"edges.auto"` \| `"text.fontFamily"` \| `"text.fontSize"` \| `"text.small"` \| `"text.medium"` \| `"text.large"` \| `"text.extraLarge"` \| `"text.style"` \| `"text.bold"` \| `"text.italic"` \| `"text.underline"` \| `"text.strikethrough"` \| `"text.align"` \| `"text.alignLeft"` \| `"text.alignCenter"` \| `"text.alignRight"` \| `"layers.title"` \| `"layers.group"` \| `"layers.close"` \| `"layers.empty"` \| `"layers.drag"` \| `"layers.shapesOf"` \| `"layers.hide"` \| `"layers.lock"` \| `"layers.delete"` \| `"layers.name"` \| `"layers.toggle"` \| `"layers.range"` \| `"shapes.freehand"` \| `"shapes.line"` \| `"shapes.rect"` \| `"shapes.ellipse"` \| `"shapes.arrow"` \| `"shapes.triangle"` \| `"shapes.diamond"` \| `"shapes.heart"` \| `"shapes.cloud"` \| `"shapes.highlighter"` \| `"shapes.frame"` \| `"shapes.frameName"` \| `"shapes.text"` \| `"shapes.group"` \| `"export.title"` \| `"export.empty"` \| `"export.options"` \| `"export.selected"` \| `"export.background"` \| `"export.dark"` \| `"export.scale"` \| `"export.saveAs"` \| `"export.saveFile"` \| `"export.copy"` \| `"export.preview"` \| `"collab.title"` \| `"collab.intro"` \| `"collab.introInvited"` \| `"collab.introJoined"` \| `"collab.introJoinedOf"` \| `"collab.name"` \| `"collab.anonymous"` \| `"collab.link"` \| `"collab.copy"` \| `"collab.qrCode"` \| `"collab.start"` \| `"collab.join"` \| `"collab.stop"` \| `"collab.connected"` \| `"collab.connecting"` \| `"collab.you"` \| `"collab.invitedBy"` \| `"collab.canDrawLabel"` \| `"collab.canDraw"` \| `"collab.owner"` \| `"collab.viewOnly"`

• **params?**: [`TranslationParams`](../../i18n/I18n/type-aliases/TranslationParams.md)

Values of `{name}` placeholders

#### Returns

`string`

#### Source

[packages/free-drawing/src/Drawer.ts:1736](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1736)

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

[packages/free-drawing/src/Drawer.ts:1938](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1938)

***

### toggleDarkMode()

> **toggleDarkMode**(): `void`

Switch between light and dark themes

#### Returns

`void`

#### Source

[packages/free-drawing/src/Drawer.ts:1895](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1895)

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

[packages/free-drawing/src/utils/MicroEvent.ts:70](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/utils/MicroEvent.ts#L70)

***

### ungroupShapes()

> **ungroupShapes**(`shapes`): [`DrawingShape`](../../@types/drawer/type-aliases/DrawingShape.md)[]

Ungroup groups (selected ones by default): their shapes take their place with the same look (transform,
hidden, locked) and are selected

#### Parameters

• **shapes**: [`DrawingShape`](../../@types/drawer/type-aliases/DrawingShape.md)[]= `undefined`

#### Returns

[`DrawingShape`](../../@types/drawer/type-aliases/DrawingShape.md)[]

shapes of groups (change saved)

#### Source

[packages/free-drawing/src/Drawer.ts:1336](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/Drawer.ts#L1336)
