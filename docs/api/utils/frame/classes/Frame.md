**@fabwcie/free-drawing** • [API](../../../README.md)

***

[@fabwcie/free-drawing](../../../README.md) / [utils/frame](../README.md) / Frame

# Class: Frame

Frame: area with a title above it, its shapes are moved with it and cut at its edges.
Group of its box, its title and a group of its shapes (cut), its box is its client rect (transformer, selection,
snapping, export): title and shapes out of it are not counted.

## Extends

- `Group`

## Constructors

### new Frame(config)

> **new Frame**(`config`?): [`Frame`](Frame.md)

#### Parameters

• **config?**: `GroupConfig`

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.constructor`

#### Source

node\_modules/konva/lib/Node.d.ts:124

## Properties

### \_attrsAffectingSize

> **\_attrsAffectingSize**: `string`[]

#### Inherited from

`Group._attrsAffectingSize`

#### Source

node\_modules/konva/lib/Node.d.ts:112

***

### \_attrsVersion?

> **`optional`** **\_attrsVersion**: `number`

#### Inherited from

`Group._attrsVersion`

#### Source

node\_modules/konva/lib/Node.d.ts:113

***

### \_batchingTransformChange

> **\_batchingTransformChange**: `boolean`

#### Inherited from

`Group._batchingTransformChange`

#### Source

node\_modules/konva/lib/Node.d.ts:116

***

### \_cache

> **\_cache**: `Record`\<`string`, `any`\>

#### Inherited from

`Group._cache`

#### Source

node\_modules/konva/lib/Node.d.ts:99

***

### \_canvasCache

> **\_canvasCache**: `null` \| `object`

#### Inherited from

`Group._canvasCache`

#### Source

node\_modules/konva/lib/Node.d.ts:100

***

### \_dragEventId

> **\_dragEventId**: `null` \| `number`

#### Inherited from

`Group._dragEventId`

#### Source

node\_modules/konva/lib/Node.d.ts:122

***

### \_filterUpToDate

> **\_filterUpToDate**: `boolean`

#### Inherited from

`Group._filterUpToDate`

#### Source

node\_modules/konva/lib/Node.d.ts:118

***

### \_id

> **\_id**: `number`

#### Inherited from

`Group._id`

#### Source

node\_modules/konva/lib/Node.d.ts:89

***

### \_isUnderCache

> **\_isUnderCache**: `boolean`

#### Inherited from

`Group._isUnderCache`

#### Source

node\_modules/konva/lib/Node.d.ts:119

***

### \_needClearTransformCache

> **\_needClearTransformCache**: `boolean`

#### Inherited from

`Group._needClearTransformCache`

#### Source

node\_modules/konva/lib/Node.d.ts:117

***

### \_shouldFireChangeEvents

> **\_shouldFireChangeEvents**: `boolean`

#### Inherited from

`Group._shouldFireChangeEvents`

#### Source

node\_modules/konva/lib/Node.d.ts:123

***

### \_subtreeObservers?

> **`optional`** **\_subtreeObservers**: `Set`\<`SubtreeObserver`\>

#### Inherited from

`Group._subtreeObservers`

#### Source

node\_modules/konva/lib/Node.d.ts:114

***

### absolutePosition

> **absolutePosition**: `GetSet`\<`Vector2d`, [`Frame`](Frame.md), `Vector2d`\>

#### Inherited from

`Group.absolutePosition`

#### Source

node\_modules/konva/lib/Node.d.ts:969

***

### alpha

> **alpha**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.alpha`

#### Source

node\_modules/konva/lib/Node.d.ts:948

***

### attrs

> **attrs**: `any`

#### Inherited from

`Group.attrs`

#### Source

node\_modules/konva/lib/Node.d.ts:96

***

### blue

> **blue**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.blue`

#### Source

node\_modules/konva/lib/Node.d.ts:942

***

### blurRadius

> **blurRadius**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.blurRadius`

#### Source

node\_modules/konva/lib/Node.d.ts:945

***

### brightness

> **brightness**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.brightness`

#### Source

node\_modules/konva/lib/Node.d.ts:943

***

### children

> **children**: (`Shape`\<`ShapeConfig`\> \| `Group`)[]

#### Inherited from

`Group.children`

#### Source

node\_modules/konva/lib/Container.d.ts:27

***

### className

> **className**: `string`

#### Inherited from

`Group.className`

#### Source

node\_modules/konva/lib/Node.d.ts:121

***

### clip

> **clip**: `GetSet`\<`IRect`, [`Frame`](Frame.md), `undefined` \| `null` \| `IRect`\>

#### Inherited from

`Group.clip`

#### Source

node\_modules/konva/lib/Container.d.ts:177

***

### clipFunc

> **clipFunc**: `GetSet`\<(`ctx`, `container`) => `ClipFuncOutput`, [`Frame`](Frame.md), `undefined` \| `null` \| (`ctx`, `container`) => `ClipFuncOutput`\>

#### Inherited from

`Group.clipFunc`

#### Source

node\_modules/konva/lib/Container.d.ts:182

***

### clipHeight

> **clipHeight**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.clipHeight`

#### Source

node\_modules/konva/lib/Container.d.ts:181

***

### clipWidth

> **clipWidth**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.clipWidth`

#### Source

node\_modules/konva/lib/Container.d.ts:180

***

### clipX

> **clipX**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.clipX`

#### Source

node\_modules/konva/lib/Container.d.ts:178

***

### clipY

> **clipY**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.clipY`

#### Source

node\_modules/konva/lib/Container.d.ts:179

***

### contrast

> **contrast**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.contrast`

#### Source

node\_modules/konva/lib/Node.d.ts:944

***

### dragBoundFunc

> **dragBoundFunc**: `GetSet`\<(`this`, `pos`, `event`) => `Vector2d`, [`Frame`](Frame.md), `undefined` \| `null` \| (`this`, `pos`, `event`) => `Vector2d`\>

#### Inherited from

`Group.dragBoundFunc`

#### Source

node\_modules/konva/lib/Node.d.ts:959

***

### dragDistance

> **dragDistance**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.dragDistance`

#### Source

node\_modules/konva/lib/Node.d.ts:961

***

### draggable

> **draggable**: `GetSet`\<`boolean`, [`Frame`](Frame.md), `undefined` \| `null` \| `boolean`\>

#### Inherited from

`Group.draggable`

#### Source

node\_modules/konva/lib/Node.d.ts:960

***

### embossBlend

> **embossBlend**: `GetSet`\<`boolean`, [`Frame`](Frame.md), `undefined` \| `null` \| `boolean`\>

#### Inherited from

`Group.embossBlend`

#### Source

node\_modules/konva/lib/Node.d.ts:962

***

### embossDirection

> **embossDirection**: `GetSet`\<`string`, [`Frame`](Frame.md), `undefined` \| `null` \| `string`\>

#### Inherited from

`Group.embossDirection`

#### Source

node\_modules/konva/lib/Node.d.ts:963

***

### embossStrength

> **embossStrength**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.embossStrength`

#### Source

node\_modules/konva/lib/Node.d.ts:964

***

### embossWhiteLevel

> **embossWhiteLevel**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.embossWhiteLevel`

#### Source

node\_modules/konva/lib/Node.d.ts:965

***

### enhance

> **enhance**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.enhance`

#### Source

node\_modules/konva/lib/Node.d.ts:966

***

### eventListeners

> **eventListeners**: `object`

#### Index signature

 \[`index`: `string`\]: `object`[]

#### Inherited from

`Group.eventListeners`

#### Source

node\_modules/konva/lib/Node.d.ts:90

***

### filters

> **filters**: `GetSet`\<`Filters`, [`Frame`](Frame.md), `undefined` \| `null` \| `Filters`\>

#### Inherited from

`Group.filters`

#### Source

node\_modules/konva/lib/Node.d.ts:967

***

### frame

> **`readonly`** **frame**: `true` = `true`

Not a group of shapes (types)

#### Source

[packages/free-drawing/src/utils/frame.ts:29](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/utils/frame.ts#L29)

***

### globalCompositeOperation

> **globalCompositeOperation**: `GetSet`\<`globalCompositeOperationType`, [`Frame`](Frame.md), `undefined` \| `null` \| `globalCompositeOperationType`\>

#### Inherited from

`Group.globalCompositeOperation`

#### Source

node\_modules/konva/lib/Node.d.ts:999

***

### green

> **green**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.green`

#### Source

node\_modules/konva/lib/Node.d.ts:947

***

### height

> **height**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.height`

#### Source

node\_modules/konva/lib/Node.d.ts:996

***

### hue

> **hue**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.hue`

#### Source

node\_modules/konva/lib/Node.d.ts:949

***

### id

> **id**: `GetSet`\<`string`, [`Frame`](Frame.md), `undefined` \| `null` \| `string`\>

#### Inherited from

`Group.id`

#### Source

node\_modules/konva/lib/Node.d.ts:977

***

### index

> **index**: `number`

#### Inherited from

`Group.index`

#### Source

node\_modules/konva/lib/Node.d.ts:97

***

### isolated

> **isolated**: `GetSet`\<`boolean`, [`Frame`](Frame.md), `undefined` \| `null` \| `boolean`\>

#### Inherited from

`Group.isolated`

#### Source

node\_modules/konva/lib/Group.d.ts:25

***

### kaleidoscopeAngle

> **kaleidoscopeAngle**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.kaleidoscopeAngle`

#### Source

node\_modules/konva/lib/Node.d.ts:950

***

### kaleidoscopePower

> **kaleidoscopePower**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.kaleidoscopePower`

#### Source

node\_modules/konva/lib/Node.d.ts:951

***

### levels

> **levels**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.levels`

#### Source

node\_modules/konva/lib/Node.d.ts:952

***

### listening

> **listening**: `GetSet`\<`boolean`, [`Frame`](Frame.md), `undefined` \| `null` \| `boolean`\>

#### Inherited from

`Group.listening`

#### Source

node\_modules/konva/lib/Node.d.ts:978

***

### luminance

> **luminance**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.luminance`

#### Source

node\_modules/konva/lib/Node.d.ts:946

***

### name

> **name**: `GetSet`\<`string`, [`Frame`](Frame.md), `undefined` \| `null` \| `string`\>

#### Inherited from

`Group.name`

#### Source

node\_modules/konva/lib/Node.d.ts:979

***

### nodeType

> **nodeType**: `string`

#### Inherited from

`Group.nodeType`

#### Source

node\_modules/konva/lib/Node.d.ts:120

***

### noise

> **noise**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.noise`

#### Source

node\_modules/konva/lib/Node.d.ts:953

***

### offset

> **offset**: `GetSet`\<`Vector2d`, [`Frame`](Frame.md), `undefined` \| `null` \| `Vector2d`\>

#### Inherited from

`Group.offset`

#### Source

node\_modules/konva/lib/Node.d.ts:980

***

### offsetX

> **offsetX**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.offsetX`

#### Source

node\_modules/konva/lib/Node.d.ts:981

***

### offsetY

> **offsetY**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.offsetY`

#### Source

node\_modules/konva/lib/Node.d.ts:982

***

### opacity

> **opacity**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.opacity`

#### Source

node\_modules/konva/lib/Node.d.ts:983

***

### parent

> **parent**: `null` \| `Container`\<`Node`\<`NodeConfig`\>, `ContainerConfig`\>

#### Inherited from

`Group.parent`

#### Source

node\_modules/konva/lib/Node.d.ts:98

***

### pixelSize

> **pixelSize**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.pixelSize`

#### Source

node\_modules/konva/lib/Node.d.ts:954

***

### position

> **position**: `GetSet`\<`Vector2d`, [`Frame`](Frame.md), `Vector2d`\>

#### Inherited from

`Group.position`

#### Source

node\_modules/konva/lib/Node.d.ts:968

***

### preventDefault

> **preventDefault**: `GetSet`\<`boolean`, [`Frame`](Frame.md), `undefined` \| `null` \| `boolean`\>

#### Inherited from

`Group.preventDefault`

#### Source

node\_modules/konva/lib/Node.d.ts:941

***

### red

> **red**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.red`

#### Source

node\_modules/konva/lib/Node.d.ts:955

***

### rotation

> **rotation**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.rotation`

#### Source

node\_modules/konva/lib/Node.d.ts:984

***

### saturation

> **saturation**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.saturation`

#### Source

node\_modules/konva/lib/Node.d.ts:956

***

### scale

> **scale**: `GetSet`\<`Vector2d`, [`Frame`](Frame.md), `undefined` \| `null` \| `Vector2d`\>

#### Inherited from

`Group.scale`

#### Source

node\_modules/konva/lib/Node.d.ts:986

***

### scaleX

> **scaleX**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.scaleX`

#### Source

node\_modules/konva/lib/Node.d.ts:987

***

### scaleY

> **scaleY**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.scaleY`

#### Source

node\_modules/konva/lib/Node.d.ts:988

***

### size

> **size**: `GetSet`\<`object`, [`Frame`](Frame.md), `object`\>

#### Type declaration

##### height

> **height**: `number`

##### width

> **width**: `number`

#### Inherited from

`Group.size`

#### Source

node\_modules/konva/lib/Node.d.ts:970

***

### skew

> **skew**: `GetSet`\<`Vector2d`, [`Frame`](Frame.md), `undefined` \| `null` \| `Vector2d`\>

#### Inherited from

`Group.skew`

#### Source

node\_modules/konva/lib/Node.d.ts:989

***

### skewX

> **skewX**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.skewX`

#### Source

node\_modules/konva/lib/Node.d.ts:990

***

### skewY

> **skewY**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.skewY`

#### Source

node\_modules/konva/lib/Node.d.ts:991

***

### threshold

> **threshold**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.threshold`

#### Source

node\_modules/konva/lib/Node.d.ts:957

***

### to()

> **to**: (`params`) => `Tween`

#### Parameters

• **params**: `Omit`\<`TweenConfig`, `"node"`\>

#### Returns

`Tween`

#### Inherited from

`Group.to`

#### Source

node\_modules/konva/lib/Node.d.ts:992

***

### transformsEnabled

> **transformsEnabled**: `GetSet`\<`string`, [`Frame`](Frame.md), `undefined` \| `null` \| `string`\>

#### Inherited from

`Group.transformsEnabled`

#### Source

node\_modules/konva/lib/Node.d.ts:993

***

### value

> **value**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.value`

#### Source

node\_modules/konva/lib/Node.d.ts:958

***

### visible

> **visible**: `GetSet`\<`boolean`, [`Frame`](Frame.md), `undefined` \| `null` \| `boolean`\>

#### Inherited from

`Group.visible`

#### Source

node\_modules/konva/lib/Node.d.ts:994

***

### width

> **width**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.width`

#### Source

node\_modules/konva/lib/Node.d.ts:995

***

### x

> **x**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.x`

#### Source

node\_modules/konva/lib/Node.d.ts:997

***

### y

> **y**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.y`

#### Source

node\_modules/konva/lib/Node.d.ts:998

***

### zIndex

> **zIndex**: `GetSet`\<`number`, [`Frame`](Frame.md), `undefined` \| `null` \| `number`\>

#### Inherited from

`Group.zIndex`

#### Source

node\_modules/konva/lib/Node.d.ts:985

***

### \_pendingUpdates

> **`static`** **\_pendingUpdates**: `Set`\<() => `void`\>

#### Inherited from

`Group._pendingUpdates`

#### Source

node\_modules/konva/lib/Node.d.ts:143

***

### \_subtreeObserverCount

> **`static`** **\_subtreeObserverCount**: `number`

#### Inherited from

`Group._subtreeObserverCount`

#### Source

node\_modules/konva/lib/Node.d.ts:115

***

### \_updateBatchDepth

> **`static`** **\_updateBatchDepth**: `number`

#### Inherited from

`Group._updateBatchDepth`

#### Source

node\_modules/konva/lib/Node.d.ts:142

***

### protoListenerMap

> **`static`** **protoListenerMap**: `WeakMap`\<`object`, `any`\>

#### Inherited from

`Group.protoListenerMap`

#### Source

node\_modules/konva/lib/Node.d.ts:888

## Methods

### \_addSubtreeObserver()

> **\_addSubtreeObserver**(`observer`): `void`

#### Parameters

• **observer**: `SubtreeObserver`

#### Returns

`void`

#### Inherited from

`Group._addSubtreeObserver`

#### Source

node\_modules/konva/lib/Node.d.ts:882

***

### \_batchTransformChanges()

> **\_batchTransformChanges**(`func`): `void`

#### Parameters

• **func**: `any`

#### Returns

`void`

#### Inherited from

`Group._batchTransformChanges`

#### Source

node\_modules/konva/lib/Node.d.ts:421

***

### \_clearCache()

> **\_clearCache**(`attr`?): `void`

#### Parameters

• **attr?**: `string`

#### Returns

`void`

#### Inherited from

`Group._clearCache`

#### Source

node\_modules/konva/lib/Node.d.ts:126

***

### \_clearCaches()

> **\_clearCaches**(): `void`

#### Returns

`void`

#### Inherited from

`Group._clearCaches`

#### Source

node\_modules/konva/lib/Node.d.ts:298

***

### \_clearChildren()

> **\_clearChildren**(`dispose`): [`Frame`](Frame.md)

#### Parameters

• **dispose**: `"remove"` \| `"destroy"`

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group._clearChildren`

#### Source

node\_modules/konva/lib/Container.d.ts:64

***

### \_clearSelfAndDescendantCache()

> **\_clearSelfAndDescendantCache**(`attr`?): `void`

#### Parameters

• **attr?**: `string`

#### Returns

`void`

#### Inherited from

`Group._clearSelfAndDescendantCache`

#### Source

node\_modules/konva/lib/Container.d.ts:170

***

### \_clearTransform()

> **\_clearTransform**(): `object`

#### Returns

`object`

##### offsetX

> **offsetX**: `number`

##### offsetY

> **offsetY**: `number`

##### rotation

> **rotation**: `number`

##### scaleX

> **scaleX**: `number`

##### scaleY

> **scaleY**: `number`

##### skewX

> **skewX**: `number`

##### skewY

> **skewY**: `number`

##### x

> **x**: `number`

##### y

> **y**: `number`

#### Inherited from

`Group._clearTransform`

#### Source

node\_modules/konva/lib/Node.d.ts:464

***

### \_createDragElement()

> **\_createDragElement**(`evt`): `void`

#### Parameters

• **evt**: `any`

#### Returns

`void`

#### Inherited from

`Group._createDragElement`

#### Source

node\_modules/konva/lib/Node.d.ts:898

***

### \_delegate()

> **\_delegate**(`event`, `selector`, `handler`): [`Frame`](Frame.md)

#### Parameters

• **event**: `string`

• **selector**: `string`

• **handler**

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group._delegate`

#### Source

node\_modules/konva/lib/Node.d.ts:288

***

### \_dragChange()

> **\_dragChange**(): `void`

#### Returns

`void`

#### Inherited from

`Group._dragChange`

#### Source

node\_modules/konva/lib/Node.d.ts:920

***

### \_dragCleanup()

> **\_dragCleanup**(): `void`

#### Returns

`void`

#### Inherited from

`Group._dragCleanup`

#### Source

node\_modules/konva/lib/Node.d.ts:921

***

### \_drawCachedHitCanvas()

> **\_drawCachedHitCanvas**(`context`, `hitCanvas`): `void`

#### Parameters

• **context**: `Context`

• **hitCanvas**: `HitCanvas`

#### Returns

`void`

#### Inherited from

`Group._drawCachedHitCanvas`

#### Source

node\_modules/konva/lib/Node.d.ts:258

***

### \_drawCachedSceneCanvas()

> **\_drawCachedSceneCanvas**(`context`): `void`

#### Parameters

• **context**: `Context`

#### Returns

`void`

#### Inherited from

`Group._drawCachedSceneCanvas`

#### Source

node\_modules/konva/lib/Node.d.ts:257

***

### \_drawChildNodes()

> **\_drawChildNodes**(`drawMethod`, `canvas`, `top`?): `void`

#### Parameters

• **drawMethod**: `any`

• **canvas**: `SceneCanvas`

• **top?**: `Node`\<`NodeConfig`\>

#### Returns

`void`

#### Inherited from

`Group._drawChildNodes`

#### Source

node\_modules/konva/lib/Group.d.ts:24

***

### \_drawChildren()

> **\_drawChildren**(`drawMethod`, `canvas`, `top`): `void`

#### Parameters

• **drawMethod**: `any`

• **canvas**: `any`

• **top**: `any`

#### Returns

`void`

#### Inherited from

`Group._drawChildren`

#### Source

node\_modules/konva/lib/Container.d.ts:174

***

### \_fire()

> **\_fire**(`eventType`, `evt`): `void`

#### Parameters

• **eventType**: `any`

• **evt**: `any`

#### Returns

`void`

#### Inherited from

`Group._fire`

#### Source

node\_modules/konva/lib/Node.d.ts:890

***

### \_fireAndBubble()

> **\_fireAndBubble**(`eventType`, `evt`, `compareShape`?): `void`

#### Parameters

• **eventType**: `any`

• **evt**: `any`

• **compareShape?**: `any`

#### Returns

`void`

#### Inherited from

`Group._fireAndBubble`

#### Source

node\_modules/konva/lib/Node.d.ts:887

***

### \_fireChangeEvent()

> **\_fireChangeEvent**(`attr`, `oldVal`, `newVal`): `void`

#### Parameters

• **attr**: `any`

• **oldVal**: `any`

• **newVal**: `any`

#### Returns

`void`

#### Inherited from

`Group._fireChangeEvent`

#### Source

node\_modules/konva/lib/Node.d.ts:832

***

### \_generalFind()

> **\_generalFind**\<`ChildNode`\>(`selector`, `findOne`): `ChildNode`[]

#### Type parameters

• **ChildNode** extends `Node`\<`NodeConfig`\>

#### Parameters

• **selector**: `string` \| `Function`

• **findOne**: `boolean`

#### Returns

`ChildNode`[]

#### Inherited from

`Group._generalFind`

#### Source

node\_modules/konva/lib/Container.d.ts:140

***

### \_getAbsoluteOpacity()

> **\_getAbsoluteOpacity**(): `number`

#### Returns

`number`

#### Inherited from

`Group._getAbsoluteOpacity`

#### Source

node\_modules/konva/lib/Node.d.ts:535

***

### \_getAbsoluteTransform()

> **\_getAbsoluteTransform**(`top`?): `Transform`

#### Parameters

• **top?**: `null` \| `Node`\<`NodeConfig`\>

#### Returns

`Transform`

#### Inherited from

`Group._getAbsoluteTransform`

#### Source

node\_modules/konva/lib/Node.d.ts:649

***

### \_getCache()

> **\_getCache**(`attr`, `privateGetter`): `any`

#### Parameters

• **attr**: `string`

• **privateGetter**: `Function`

#### Returns

`any`

#### Inherited from

`Group._getCache`

#### Source

node\_modules/konva/lib/Node.d.ts:128

***

### \_getCachedAbsoluteTransform()

> **\_getCachedAbsoluteTransform**(): `Transform`

#### Returns

`Transform`

#### Inherited from

`Group._getCachedAbsoluteTransform`

#### Source

node\_modules/konva/lib/Node.d.ts:650

***

### \_getCachedHitCanvas()

> **\_getCachedHitCanvas**(`top`?): `null` \| `HitCanvas`

#### Parameters

• **top?**: `Node`\<`NodeConfig`\>

#### Returns

`null` \| `HitCanvas`

#### Inherited from

`Group._getCachedHitCanvas`

#### Source

node\_modules/konva/lib/Node.d.ts:206

***

### \_getCachedSceneCanvas()

> **\_getCachedSceneCanvas**(): `Canvas`

#### Returns

`Canvas`

#### Inherited from

`Group._getCachedSceneCanvas`

#### Source

node\_modules/konva/lib/Node.d.ts:259

***

### \_getCachedSceneRect()

> **\_getCachedSceneRect**(`config`): `undefined` \| `IRect`

#### Parameters

• **config**: `GetClientRectConfig`

#### Returns

`undefined` \| `IRect`

#### Inherited from

`Group._getCachedSceneRect`

#### Source

node\_modules/konva/lib/Node.d.ts:255

***

### \_getCanvasCache()

> **\_getCanvasCache**(): `null` \| `object`

#### Returns

`null` \| `object`

#### Inherited from

`Group._getCanvasCache`

#### Source

node\_modules/konva/lib/Node.d.ts:129

***

### \_getProtoListeners()

> **\_getProtoListeners**(`eventType`): `any`

#### Parameters

• **eventType**: `any`

#### Returns

`any`

#### Inherited from

`Group._getProtoListeners`

#### Source

node\_modules/konva/lib/Node.d.ts:889

***

### \_getStage()

> **\_getStage**(): `null` \| `Stage`

#### Returns

`null` \| `Stage`

#### Inherited from

`Group._getStage`

#### Source

node\_modules/konva/lib/Node.d.ts:614

***

### \_getTransform()

> **\_getTransform**(): `Transform`

#### Returns

`Transform`

#### Inherited from

`Group._getTransform`

#### Source

node\_modules/konva/lib/Node.d.ts:684

***

### \_hasCachedAncestor()

> **\_hasCachedAncestor**(): `boolean`

#### Returns

`boolean`

#### Inherited from

`Group._hasCachedAncestor`

#### Source

node\_modules/konva/lib/Node.d.ts:648

***

### \_isListening()

> **\_isListening**(`relativeTo`?): `boolean`

#### Parameters

• **relativeTo?**: `Node`\<`NodeConfig`\>

#### Returns

`boolean`

#### Inherited from

`Group._isListening`

#### Source

node\_modules/konva/lib/Node.d.ts:369

***

### \_isMatch()

> **\_isMatch**(`selector`): `any`

#### Parameters

• **selector**: `string` \| `Function`

#### Returns

`any`

#### Inherited from

`Group._isMatch`

#### Source

node\_modules/konva/lib/Node.d.ts:599

***

### \_isVisible()

> **\_isVisible**(`relativeTo`?): `boolean`

#### Parameters

• **relativeTo?**: `Node`\<`NodeConfig`\>

#### Returns

`boolean`

#### Inherited from

`Group._isVisible`

#### Source

node\_modules/konva/lib/Node.d.ts:385

***

### \_listenDrag()

> **\_listenDrag**(): `void`

#### Returns

`void`

#### Inherited from

`Group._listenDrag`

#### Source

node\_modules/konva/lib/Node.d.ts:919

***

### \_multiplyOwnTransform()

> **\_multiplyOwnTransform**(`at`): `Transform`

#### Parameters

• **at**: `Transform`

#### Returns

`Transform`

#### Inherited from

`Group._multiplyOwnTransform`

#### Source

node\_modules/konva/lib/Node.d.ts:651

***

### \_notifySubtreeChange()

> **\_notifySubtreeChange**(): `void`

#### Returns

`void`

#### Inherited from

`Group._notifySubtreeChange`

#### Source

node\_modules/konva/lib/Node.d.ts:884

***

### \_off()

> **\_off**(`type`, `name`?, `callback`?): `void`

#### Parameters

• **type**: `any`

• **name?**: `any`

• **callback?**: `any`

#### Returns

`void`

#### Inherited from

`Group._off`

#### Source

node\_modules/konva/lib/Node.d.ts:831

***

### \_prepareListeners()

> **\_prepareListeners**(): `void`

remove event bindings from the node. Pass in a string of
 event types delimmited by a space to remove multiple event
 bindings at once such as 'mousedown mouseup mousemove'.
 include a namespace to remove an event binding by name
 such as 'click.foobar'. If you only give a name like '.foobar',
 all events in that namespace will be removed.

#### Returns

`void`

#### Inherited from

`Group._prepareListeners`

#### Method

#### Name

Konva.Node#off

#### Example

```ts
// remove listener
node.off('click');

// remove multiple listeners
node.off('click touchstart');

// remove listener by name
node.off('click.foo');
```

#### Source

node\_modules/konva/lib/Node.d.ts:283

***

### \_releaseCanvasCache()

> **\_releaseCanvasCache**(): `void`

#### Returns

`void`

#### Inherited from

`Group._releaseCanvasCache`

#### Source

node\_modules/konva/lib/Node.d.ts:127

***

### \_remove()

> **\_remove**(): `void`

#### Returns

`void`

#### Inherited from

`Group._remove`

#### Source

node\_modules/konva/lib/Node.d.ts:299

***

### \_removeSubtreeObserver()

> **\_removeSubtreeObserver**(`observer`): `void`

#### Parameters

• **observer**: `SubtreeObserver`

#### Returns

`void`

#### Inherited from

`Group._removeSubtreeObserver`

#### Source

node\_modules/konva/lib/Node.d.ts:883

***

### \_requestDraw()

> **\_requestDraw**(): `void`

#### Returns

`void`

#### Inherited from

`Group._requestDraw`

#### Source

node\_modules/konva/lib/Node.d.ts:885

***

### \_setAttr()

> **\_setAttr**\<`AttrConfig`, `K`\>(`key`, `val`): `void`

#### Type parameters

• **AttrConfig** extends `GroupConfig`

• **K** extends `AnyString`\<keyof `GroupConfig`\>

#### Parameters

• **key**: `K`

• **val**: `K` extends keyof `AttrConfig` ? `AttrConfig`\[`K`\] : `any`

#### Returns

`void`

#### Inherited from

`Group._setAttr`

#### Source

node\_modules/konva/lib/Node.d.ts:886

***

### \_setChildrenIndices()

> **\_setChildrenIndices**(): `void`

#### Returns

`void`

#### Inherited from

`Group._setChildrenIndices`

#### Source

node\_modules/konva/lib/Container.d.ts:171

***

### \_setDragPosition()

> **\_setDragPosition**(`evt`, `elem`): `void`

#### Parameters

• **evt**: `any`

• **elem**: `any`

#### Returns

`void`

#### Inherited from

`Group._setDragPosition`

#### Source

node\_modules/konva/lib/Node.d.ts:905

***

### \_setTransform()

> **\_setTransform**(`trans`): `void`

#### Parameters

• **trans**: `any`

#### Returns

`void`

#### Inherited from

`Group._setTransform`

#### Source

node\_modules/konva/lib/Node.d.ts:463

***

### \_toKonvaCanvas()

> **\_toKonvaCanvas**(`config`): `SceneCanvas`

#### Parameters

• **config**: `any`

#### Returns

`SceneCanvas`

#### Inherited from

`Group._toKonvaCanvas`

#### Source

node\_modules/konva/lib/Node.d.ts:703

***

### \_transformedRect()

> **\_transformedRect**(`rect`, `top`?): `IRect`

#### Parameters

• **rect**: `IRect`

• **top?**: `null` \| `Node`\<`NodeConfig`\>

#### Returns

`IRect`

#### Inherited from

`Group._transformedRect`

#### Source

node\_modules/konva/lib/Node.d.ts:256

***

### \_validateAdd()

> **\_validateAdd**(`child`): `void`

#### Parameters

• **child**: `Node`\<`NodeConfig`\>

#### Returns

`void`

#### Inherited from

`Group._validateAdd`

#### Source

node\_modules/konva/lib/Group.d.ts:23

***

### add()

> **add**(...`children`): [`Frame`](Frame.md)

add a child and children into container

#### Parameters

• ...**children**: (`Shape`\<`ShapeConfig`\> \| `Group`)[]

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.add`

#### Name

Konva.Container#add

#### Method

#### Example

```ts
layer.add(rect);
layer.add(shape1, shape2, shape3);
// empty arrays are accepted, though each individual child must be defined
layer.add(...shapes);
```

#### Source

node\_modules/konva/lib/Container.d.ts:78

***

### addEventListener()

> **addEventListener**(`type`, `handler`): [`Frame`](Frame.md)

#### Parameters

• **type**: `string`

• **handler**

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.addEventListener`

#### Source

node\_modules/konva/lib/Node.d.ts:286

***

### addName()

> **addName**(`name`): [`Frame`](Frame.md)

add name to node

#### Parameters

• **name**: `string`

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.addName`

#### Method

#### Name

Konva.Node#addName

#### Example

```ts
node.name('red');
node.addName('selected');
node.name(); // return 'red selected'
```

#### Source

node\_modules/konva/lib/Node.d.ts:844

***

### cache()

> **cache**(`config`?): [`Frame`](Frame.md)

cache node to improve drawing performance, apply filters, or create more accurate
 hit regions. For all basic shapes size of cache canvas will be automatically detected.
 If you need to cache your custom `Konva.Shape` instance you have to pass shape's bounding box
 properties. Look at [https://konvajs.org/docs/performance/Shape_Caching.html](https://konvajs.org/docs/performance/Shape_Caching.html) for more information.

#### Parameters

• **config?**: `CanvasConfig` & `object`

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.cache`

#### Method

#### Name

Konva.Node#cache

#### Example

```ts
// cache a shape with the x,y position of the bounding box at the center and
// the width and height of the bounding box equal to the width and height of
// the shape obtained from shape.width() and shape.height()
image.cache();

// cache a node and define the bounding box position and size
node.cache({
  x: -30,
  y: -30,
  width: 100,
  height: 200
});

// cache a node and draw a red border around the bounding box
// for debugging purposes
node.cache({
  x: -30,
  y: -30,
  width: 100,
  height: 200,
  offset : 10,
  drawBorder: true
});
```

#### Source

node\_modules/konva/lib/Node.d.ts:201

***

### clearCache()

> **clearCache**(): [`Frame`](Frame.md)

clear cached canvas

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.clearCache`

#### Method

#### Name

Konva.Node#clearCache

#### Example

```ts
node.clearCache();
```

#### Source

node\_modules/konva/lib/Node.d.ts:156

***

### clone()

> **clone**(`obj`?): [`Frame`](Frame.md)

#### Parameters

• **obj?**: `any`

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.clone`

#### Source

node\_modules/konva/lib/Container.d.ts:155

***

### destroy()

> **destroy**(): [`Frame`](Frame.md)

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.destroy`

#### Source

node\_modules/konva/lib/Container.d.ts:79

***

### destroyChildren()

> **destroyChildren**(): [`Frame`](Frame.md)

destroy all children nodes.

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.destroyChildren`

#### Method

#### Name

Konva.Container#destroyChildren

#### Source

node\_modules/konva/lib/Container.d.ts:63

***

### dispatchEvent()

> **dispatchEvent**(`evt`): [`Frame`](Frame.md)

#### Parameters

• **evt**: `any`

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.dispatchEvent`

#### Source

node\_modules/konva/lib/Node.d.ts:285

***

### draw()

> **draw**(): [`Frame`](Frame.md)

draw both scene and hit graphs.  If the node being drawn is the stage, all of the layers will be cleared and redrawn

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.draw`

#### Method

#### Name

Konva.Node#draw

#### Source

node\_modules/konva/lib/Node.d.ts:897

***

### drawHit()

> **drawHit**(`can`?, `top`?): [`Frame`](Frame.md)

#### Parameters

• **can?**: `HitCanvas`

• **top?**: `Node`\<`NodeConfig`\>

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.drawHit`

#### Source

node\_modules/konva/lib/Container.d.ts:173

***

### drawScene()

> **drawScene**(`can`?, `top`?): [`Frame`](Frame.md)

#### Parameters

• **can?**: `SceneCanvas`

• **top?**: `Node`\<`NodeConfig`\>

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.drawScene`

#### Source

node\_modules/konva/lib/Container.d.ts:172

***

### find()

> **find**\<`ChildNode`\>(`selector`): `ChildNode`[]

return an array of nodes that match the selector.
You can provide a string with '#' for id selections and '.' for name selections.
Or a function that will return true/false when a node is passed through.  See example below.
With strings you can also select by type or class name. Pass multiple selectors
separated by a comma.

#### Type parameters

• **ChildNode** extends `Node`\<`NodeConfig`\>

#### Parameters

• **selector**: `any`

#### Returns

`ChildNode`[]

#### Inherited from

`Group.find`

#### Method

#### Name

Konva.Container#find

#### Example

```ts
Passing a string as a selector
// select node with id foo
var node = stage.find('#foo');

// select nodes with name bar inside layer
var nodes = layer.find('.bar');

// select all groups inside layer
var nodes = layer.find('Group');

// select all rectangles inside layer
var nodes = layer.find('Rect');

// select node with an id of foo or a name of bar inside layer
var nodes = layer.find('#foo, .bar');

Passing a function as a selector

// get all groups with a function
var groups = stage.find(node => {
 return node.getType() === 'Group';
});

// get only Nodes with partial opacity
var alphaNodes = layer.find(node => {
 return node.getType() === 'Node' && node.getAbsoluteOpacity() < 1;
});
```

#### Source

node\_modules/konva/lib/Container.d.ts:120

***

### findAncestor()

> **findAncestor**(`selector`, `includeSelf`?, `stopNode`?): `Node`\<`NodeConfig`\>

get ancestor (parent or parent of the parent, etc) of the node that match passed selector

#### Parameters

• **selector**: `string` \| `Function`

selector for search

• **includeSelf?**: `boolean`

show we think that node is ancestro itself?

• **stopNode?**: `Container`\<`Node`\<`NodeConfig`\>, `ContainerConfig`\>

optional node where we need to stop searching (one of ancestors)

#### Returns

`Node`\<`NodeConfig`\>

ancestor

#### Inherited from

`Group.findAncestor`

#### Method

#### Name

Konva.Node#findAncestor

#### Example

```ts
// get one of the parent group
var group = node.findAncestors('.mygroup');
```

#### Source

node\_modules/konva/lib/Node.d.ts:598

***

### findAncestors()

> **findAncestors**(`selector`, `includeSelf`?, `stopNode`?): `Node`\<`NodeConfig`\>[]

get all ancestors (parent then parent of the parent, etc) of the node

#### Parameters

• **selector**: `string` \| `Function`

selector for search

• **includeSelf?**: `boolean`

show we think that node is ancestro itself?

• **stopNode?**: `Node`\<`NodeConfig`\>

optional node where we need to stop searching (one of ancestors)

#### Returns

`Node`\<`NodeConfig`\>[]

[ancestors]

#### Inherited from

`Group.findAncestors`

#### Method

#### Name

Konva.Node#findAncestors

#### Example

```ts
// get one of the parent group
var parentGroups = node.findAncestors('Group');
```

#### Source

node\_modules/konva/lib/Node.d.ts:584

***

### findOne()

> **findOne**\<`ChildNode`\>(`selector`): `undefined` \| `ChildNode`

return a first node from `find` method

#### Type parameters

• **ChildNode** extends `Node`\<`NodeConfig`\> = `Node`\<`NodeConfig`\>

#### Parameters

• **selector**: `string` \| `Function`

#### Returns

`undefined` \| `ChildNode`

#### Inherited from

`Group.findOne`

#### Method

#### Name

Konva.Container#findOne

#### Example

```ts
// select node with id foo
var node = stage.findOne('#foo');

// select node with name bar inside layer
var nodes = layer.findOne('.bar');

// select the first node to return true in a function
var node = stage.findOne(node => {
 return node.getType() === 'Shape'
})
```

#### Source

node\_modules/konva/lib/Container.d.ts:139

***

### fire()

> **fire**(`eventType`, `evt`?, `bubble`?): [`Frame`](Frame.md)

fire event

#### Parameters

• **eventType**: `string`

event type.  can be a regular event, like click, mouseover, or mouseout, or it can be a custom event, like myCustomEvent

• **evt?**: `any`

event object

• **bubble?**: `boolean`

setting the value to false, or leaving it undefined, will result in the event
 not bubbling.  Setting the value to true will result in the event bubbling.

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.fire`

#### Method

#### Name

Konva.Node#fire

#### Example

```ts
// manually fire click event
node.fire('click');

// fire custom event
node.fire('foo');

// fire custom event with custom event object
node.fire('foo', {
  bar: 10
});

// fire click event that bubbles
node.fire('click', null, true);
```

#### Source

node\_modules/konva/lib/Node.d.ts:639

***

### getAbsoluteOpacity()

> **getAbsoluteOpacity**(): `any`

get absolute opacity

#### Returns

`any`

#### Inherited from

`Group.getAbsoluteOpacity`

#### Method

#### Name

Konva.Node#getAbsoluteOpacity

#### Source

node\_modules/konva/lib/Node.d.ts:534

***

### getAbsolutePosition()

> **getAbsolutePosition**(`top`?): `object`

get absolute position of a node. That function can be used to calculate absolute position, but relative to any ancestor

#### Parameters

• **top?**: `Node`\<`NodeConfig`\>

optional ancestor node

#### Returns

`object`

##### x

> **x**: `number`

##### y

> **y**: `number`

#### Inherited from

`Group.getAbsolutePosition`

#### Method

#### Name

Konva.Node#getAbsolutePosition

#### Example

```ts
// returns absolute position relative to top-left corner of canvas
node.getAbsolutePosition();

// calculate absolute position of node, inside stage
// so stage transforms are ignored
node.getAbsolutePosition(stage)
```

#### Source

node\_modules/konva/lib/Node.d.ts:458

***

### getAbsoluteRotation()

> **getAbsoluteRotation**(): `number`

get absolute rotation of the node which takes into
 account its ancestor rotations

#### Returns

`number`

#### Inherited from

`Group.getAbsoluteRotation`

#### Method

#### Name

Konva.Node#getAbsoluteRotation

#### Example

```ts
// get absolute rotation
var rotation = node.getAbsoluteRotation();
```

#### Source

node\_modules/konva/lib/Node.d.ts:676

***

### getAbsoluteScale()

> **getAbsoluteScale**(`top`?): `object`

get absolute scale of the node which takes into
 account its ancestor scales

#### Parameters

• **top?**: `Node`\<`NodeConfig`\>

#### Returns

`object`

##### x

> **x**: `number`

##### y

> **y**: `number`

#### Inherited from

`Group.getAbsoluteScale`

#### Method

#### Name

Konva.Node#getAbsoluteScale

#### Example

```ts
// get absolute scale x
var scaleX = node.getAbsoluteScale().x;
```

#### Source

node\_modules/konva/lib/Node.d.ts:662

***

### getAbsoluteTransform()

> **getAbsoluteTransform**(`top`?): `Transform`

get absolute transform of the node which takes into
 account its ancestor transforms

#### Parameters

• **top?**: `null` \| `Node`\<`NodeConfig`\>

#### Returns

`Transform`

#### Inherited from

`Group.getAbsoluteTransform`

#### Method

#### Name

Konva.Node#getAbsoluteTransform

#### Source

node\_modules/konva/lib/Node.d.ts:647

***

### getAbsoluteZIndex()

> **getAbsoluteZIndex**(): `number`

get absolute z-index which takes into account sibling
 and ancestor indices

#### Returns

`number`

#### Inherited from

`Group.getAbsoluteZIndex`

#### Method

#### Name

Konva.Node#getAbsoluteZIndex

#### Source

node\_modules/konva/lib/Node.d.ts:409

***

### getAllIntersections()

> **getAllIntersections**(`pos`): `Shape`\<`ShapeConfig`\>[]

get all shapes that intersect a point.  Note: because this method must clear a temporary
canvas and redraw every shape inside the container, it should only be used for special situations
because it performs very poorly.  Please use the Konva.Stage#getIntersection method if at all possible
because it performs much better.
Nodes with listening set to false or invisible nodes are not detected

#### Parameters

• **pos**: `any`

#### Returns

`Shape`\<`ShapeConfig`\>[]

array of shapes

#### Inherited from

`Group.getAllIntersections`

#### Method

#### Name

Konva.Container#getAllIntersections

#### Source

node\_modules/konva/lib/Container.d.ts:169

***

### getAncestors()

> **getAncestors**(): `Node`\<`NodeConfig`\>[]

get ancestors

#### Returns

`Node`\<`NodeConfig`\>[]

#### Inherited from

`Group.getAncestors`

#### Method

#### Name

Konva.Node#getAncestors

#### Example

```ts
shape.getAncestors().forEach(function(node) {
  console.log(node.id());
})
```

#### Source

node\_modules/konva/lib/Node.d.ts:332

***

### getAttr()

> **getAttr**\<`AttrConfig`, `K`\>(`attr`): `K` extends keyof `AttrConfig` ? `AttrConfig`\[`K`\] : `any`

get attr

#### Type parameters

• **AttrConfig** extends `GroupConfig`

• **K** extends `AnyString`\<keyof `GroupConfig`\>

#### Parameters

• **attr**: `K`

#### Returns

`K` extends keyof `AttrConfig` ? `AttrConfig`\[`K`\] : `any`

#### Inherited from

`Group.getAttr`

#### Method

#### Name

Konva.Node#getAttr

#### Example

```ts
var x = node.getAttr('x');
```

#### Source

node\_modules/konva/lib/Node.d.ts:321

***

### getAttrs()

> **getAttrs**(): `GroupConfig`

get attrs object literal

#### Returns

`GroupConfig`

#### Inherited from

`Group.getAttrs`

#### Method

#### Name

Konva.Node#getAttrs

#### Source

node\_modules/konva/lib/Node.d.ts:339

***

### getChildren()

> **getChildren**(`filterFunc`?): (`Shape`\<`ShapeConfig`\> \| `Group`)[]

returns an array of direct descendant nodes

#### Parameters

• **filterFunc?**

filter function

#### Returns

(`Shape`\<`ShapeConfig`\> \| `Group`)[]

#### Inherited from

`Group.getChildren`

#### Method

#### Name

Konva.Container#getChildren

#### Example

```ts
// get all children
var children = layer.getChildren();

// get only circles
var circles = layer.getChildren(function(node){
   return node.getClassName() === 'Circle';
});
```

#### Source

node\_modules/konva/lib/Container.d.ts:43

***

### getClassName()

> **getClassName**(): `string`

get class name, which may return Stage, Layer, Group, or shape class names like Rect, Circle, Text, etc.

#### Returns

`string`

#### Inherited from

`Group.getClassName`

#### Method

#### Name

Konva.Node#getClassName

#### Source

node\_modules/konva/lib/Node.d.ts:822

***

### getClientRect()

> **getClientRect**(`config`): `IRect`

#### Parameters

• **config**: `GetClientRectConfig`= `{}`

#### Returns

`IRect`

#### Overrides

`Group.getClientRect`

#### Source

[packages/free-drawing/src/utils/frame.ts:31](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/utils/frame.ts#L31)

***

### getDepth()

> **getDepth**(): `number`

get node depth in node tree.  Returns an integer.
 e.g. Stage depth will always be 0.  Layers will always be 1.  Groups and Shapes will always
 be >= 2

#### Returns

`number`

#### Inherited from

`Group.getDepth`

#### Method

#### Name

Konva.Node#getDepth

#### Example

```ts
var depth = shape.getDepth(); // 2 for a shape right inside of a layer
```

#### Source

node\_modules/konva/lib/Node.d.ts:420

***

### getDragDistance()

> **getDragDistance**(): `number`

#### Returns

`number`

#### Inherited from

`Group.getDragDistance`

#### Source

node\_modules/konva/lib/Node.d.ts:830

***

### getLayer()

> **getLayer**(): `null` \| `Layer`

get layer ancestor

#### Returns

`null` \| `Layer`

#### Inherited from

`Group.getLayer`

#### Method

#### Name

Konva.Node#getLayer

#### Source

node\_modules/konva/lib/Node.d.ts:606

***

### getParent()

> **getParent**(): `null` \| `Container`\<`Node`\<`NodeConfig`\>, `ContainerConfig`\>

get parent container

#### Returns

`null` \| `Container`\<`Node`\<`NodeConfig`\>, `ContainerConfig`\>

#### Inherited from

`Group.getParent`

#### Method

#### Name

Konva.Node#getParent

#### Source

node\_modules/konva/lib/Node.d.ts:571

***

### getPosition()

> **getPosition**(): `object`

#### Returns

`object`

##### x

> **x**: `number`

##### y

> **y**: `number`

#### Inherited from

`Group.getPosition`

#### Source

node\_modules/konva/lib/Node.d.ts:423

***

### getRelativePointerPosition()

> **getRelativePointerPosition**(): `null` \| `object`

get position of first pointer (like mouse or first touch) relative to local coordinates of current node

#### Returns

`null` \| `object`

#### Inherited from

`Group.getRelativePointerPosition`

#### Method

#### Name

Konva.Node#getRelativePointerPosition

#### Example

```ts
// let's think we have a rectangle at position x = 10, y = 10
// now we clicked at x = 15, y = 15 of the stage
// if you want to know position of the click, related to the rectangle you can use
rect.getRelativePointerPosition();
```

#### Source

node\_modules/konva/lib/Node.d.ts:439

***

### getSize()

> **getSize**(): `object`

#### Returns

`object`

##### height

> **height**: `number`

##### width

> **width**: `number`

#### Inherited from

`Group.getSize`

#### Source

node\_modules/konva/lib/Node.d.ts:812

***

### getStage()

> **getStage**(): `null` \| `Stage`

get stage ancestor

#### Returns

`null` \| `Stage`

#### Inherited from

`Group.getStage`

#### Method

#### Name

Konva.Node#getStage

#### Source

node\_modules/konva/lib/Node.d.ts:613

***

### getTransform()

> **getTransform**(): `Transform`

get transform of the node

#### Returns

`Transform`

#### Inherited from

`Group.getTransform`

#### Method

#### Name

Konva.Node#getTransform

#### Source

node\_modules/konva/lib/Node.d.ts:683

***

### getType()

> **getType**(): `string`

get the node type, which may return Stage, Layer, Group, or Shape

#### Returns

`string`

#### Inherited from

`Group.getType`

#### Method

#### Name

Konva.Node#getType

#### Source

node\_modules/konva/lib/Node.d.ts:829

***

### getZIndex()

> **getZIndex**(): `number`

#### Returns

`number`

#### Inherited from

`Group.getZIndex`

#### Source

node\_modules/konva/lib/Node.d.ts:401

***

### hasChildren()

> **hasChildren**(): `boolean`

determine if node has children

#### Returns

`boolean`

#### Inherited from

`Group.hasChildren`

#### Method

#### Name

Konva.Container#hasChildren

#### Source

node\_modules/konva/lib/Container.d.ts:50

***

### hasName()

> **hasName**(`name`): `boolean`

check is node has name

#### Parameters

• **name**: `any`

#### Returns

`boolean`

#### Inherited from

`Group.hasName`

#### Method

#### Name

Konva.Node#hasName

#### Example

```ts
node.name('red');
node.hasName('red');   // return true
node.hasName('selected'); // return false
node.hasName(''); // return false
```

#### Source

node\_modules/konva/lib/Node.d.ts:857

***

### hide()

> **hide**(): [`Frame`](Frame.md)

hide node.  Hidden nodes are no longer detectable

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.hide`

#### Method

#### Name

Konva.Node#hide

#### Source

node\_modules/konva/lib/Node.d.ts:400

***

### isAncestorOf()

> **isAncestorOf**(`node`): `boolean`

determine if node is an ancestor
of descendant

#### Parameters

• **node**: `Node`\<`NodeConfig`\>

#### Returns

`boolean`

#### Inherited from

`Group.isAncestorOf`

#### Method

#### Name

Konva.Container#isAncestorOf

#### Source

node\_modules/konva/lib/Container.d.ts:154

***

### isCached()

> **isCached**(): `boolean`

determine if node is currently cached

#### Returns

`boolean`

#### Inherited from

`Group.isCached`

#### Method

#### Name

Konva.Node#isCached

#### Source

node\_modules/konva/lib/Node.d.ts:213

***

### isClientRectOnScreen()

> **isClientRectOnScreen**(`margin`?): `boolean`

determine if node (at least partially) is currently in user-visible area

#### Parameters

• **margin?**

optional margin in pixels

• **margin\.x?**: `number`

• **margin\.y?**: `number`

#### Returns

`boolean`

#### Inherited from

`Group.isClientRectOnScreen`

#### Method

#### Name

Konva.Node#isClientRectOnScreen

#### Example

```ts
// get index
// default calculations
var isOnScreen = node.isClientRectOnScreen()
// increase object size (or screen size) for cases when objects close to the screen still need to be marked as "visible"
var isOnScreen = node.isClientRectOnScreen({ x: stage.width(), y: stage.height() })
```

#### Source

node\_modules/konva/lib/Node.d.ts:937

***

### isDragging()

> **isDragging**(): `boolean`

determine if node is currently in drag and drop mode

#### Returns

`boolean`

#### Inherited from

`Group.isDragging`

#### Method

#### Name

Konva.Node#isDragging

#### Source

node\_modules/konva/lib/Node.d.ts:918

***

### isListening()

> **isListening**(): `any`

determine if node is listening for events by taking into account ancestors.

Parent    | Self      | isListening
listening | listening |
----------+-----------+------------
T         | T         | T
T         | F         | F
F         | T         | F
F         | F         | F

#### Returns

`any`

#### Inherited from

`Group.isListening`

#### Method

#### Name

Konva.Node#isListening

#### Source

node\_modules/konva/lib/Node.d.ts:368

***

### isVisible()

> **isVisible**(): `any`

determine if node is visible by taking into account ancestors.

Parent    | Self      | isVisible
visible   | visible   |
----------+-----------+------------
T         | T         | T
T         | F         | F
F         | T         | F
F         | F         | F

#### Returns

`any`

#### Inherited from

`Group.isVisible`

#### Method

#### Name

Konva.Node#isVisible

#### Source

node\_modules/konva/lib/Node.d.ts:384

***

### move()

> **move**(`change`): [`Frame`](Frame.md)

move node by an amount relative to its current position

#### Parameters

• **change**: `Vector2d`

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.move`

#### Method

#### Name

Konva.Node#move

#### Example

```ts
// move node in x direction by 1px and y direction by 2px
node.move({
  x: 1,
  y: 2
});
```

#### Source

node\_modules/konva/lib/Node.d.ts:490

***

### moveDown()

> **moveDown**(): `boolean`

move node down

#### Returns

`boolean`

#### Inherited from

`Group.moveDown`

#### Method

#### Name

Konva.Node#moveDown

#### Source

node\_modules/konva/lib/Node.d.ts:519

***

### moveTo()

> **moveTo**(`newContainer`): [`Frame`](Frame.md)

move node to another container

#### Parameters

• **newContainer**: `any`

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.moveTo`

#### Method

#### Name

Konva.Node#moveTo

#### Example

```ts
// move node from current layer into layer2
node.moveTo(layer2);
```

#### Source

node\_modules/konva/lib/Node.d.ts:546

***

### moveToBottom()

> **moveToBottom**(): `boolean`

move node to the bottom of its siblings

#### Returns

`boolean`

#### Inherited from

`Group.moveToBottom`

#### Method

#### Name

Konva.Node#moveToBottom

#### Source

node\_modules/konva/lib/Node.d.ts:526

***

### moveToTop()

> **moveToTop**(): `boolean`

move node to the top of its siblings

#### Returns

`boolean`

#### Inherited from

`Group.moveToTop`

#### Method

#### Name

Konva.Node#moveToTop

#### Source

node\_modules/konva/lib/Node.d.ts:505

***

### moveUp()

> **moveUp**(): `boolean`

move node up

#### Returns

`boolean`

flag is moved or not

#### Inherited from

`Group.moveUp`

#### Method

#### Name

Konva.Node#moveUp

#### Source

node\_modules/konva/lib/Node.d.ts:512

***

### off()

> **off**(`evtStr`?, `callback`?): [`Frame`](Frame.md)

#### Parameters

• **evtStr?**: `string`

• **callback?**: `Function`

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.off`

#### Source

node\_modules/konva/lib/Node.d.ts:284

***

### on()

#### on(evtStr, handler)

> **on**\<`K`\>(`evtStr`, `handler`): [`Frame`](Frame.md)

##### Type parameters

• **K** extends `string` \| `number`

##### Parameters

• **evtStr**: `K`

• **handler**: `KonvaEventListener`\<[`Frame`](Frame.md), `NodeEventMap`\[`K`\]\>

##### Returns

[`Frame`](Frame.md)

##### Inherited from

`Group.on`

##### Source

node\_modules/konva/lib/Node.d.ts:260

#### on(evtStr, selector, handler)

> **on**\<`K`\>(`evtStr`, `selector`, `handler`): [`Frame`](Frame.md)

##### Type parameters

• **K** extends `string` \| `number`

##### Parameters

• **evtStr**: `K`

• **selector**: `string`

• **handler**: `KonvaEventListener`\<`Node`\<`NodeConfig`\>, `NodeEventMap`\[`K`\]\>

##### Returns

[`Frame`](Frame.md)

##### Inherited from

`Group.on`

##### Source

node\_modules/konva/lib/Node.d.ts:261

***

### remove()

> **remove**(): [`Frame`](Frame.md)

remove a node from parent, but don't destroy. You can reuse the node later.

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.remove`

#### Method

#### Name

Konva.Node#remove

#### Example

```ts
node.remove();
```

#### Source

node\_modules/konva/lib/Node.d.ts:297

***

### removeChildren()

> **removeChildren**(): [`Frame`](Frame.md)

remove all children. Children will be still in memory.
If you want to completely destroy all children please use "destroyChildren" method instead

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.removeChildren`

#### Method

#### Name

Konva.Container#removeChildren

#### Source

node\_modules/konva/lib/Container.d.ts:57

***

### removeEventListener()

> **removeEventListener**(`type`): [`Frame`](Frame.md)

#### Parameters

• **type**: `string`

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.removeEventListener`

#### Source

node\_modules/konva/lib/Node.d.ts:287

***

### removeName()

> **removeName**(`name`): [`Frame`](Frame.md)

remove name from node

#### Parameters

• **name**: `any`

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.removeName`

#### Method

#### Name

Konva.Node#removeName

#### Example

```ts
node.name('red selected');
node.removeName('selected');
node.hasName('selected'); // return false
node.name(); // return 'red'
```

#### Source

node\_modules/konva/lib/Node.d.ts:870

***

### rotate()

> **rotate**(`theta`): [`Frame`](Frame.md)

rotate node by an amount in degrees relative to its current rotation

#### Parameters

• **theta**: `number`

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.rotate`

#### Method

#### Name

Konva.Node#rotate

#### Source

node\_modules/konva/lib/Node.d.ts:498

***

### setAbsolutePosition()

> **setAbsolutePosition**(`pos`): [`Frame`](Frame.md)

#### Parameters

• **pos**: `Vector2d`

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.setAbsolutePosition`

#### Source

node\_modules/konva/lib/Node.d.ts:462

***

### setAttr()

> **setAttr**\<`AttrConfig`, `K`\>(`attr`, `val`): [`Frame`](Frame.md)

set attr

#### Type parameters

• **AttrConfig** extends `GroupConfig`

• **K** extends `AnyString`\<keyof `GroupConfig`\>

#### Parameters

• **attr**: `K`

• **val**: `K` extends keyof `AttrConfig` ? `AttrConfig`\[`K`\] : `any`

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.setAttr`

#### Method

#### Name

Konva.Node#setAttr

#### Example

```ts
node.setAttr('x', 5);
```

#### Source

node\_modules/konva/lib/Node.d.ts:881

***

### setAttrs()

> **setAttrs**(`config`?): [`Frame`](Frame.md)

set multiple attrs at once using an object literal

#### Parameters

• **config?**: `GroupConfig`

object containing key value pairs

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.setAttrs`

#### Method

#### Name

Konva.Node#setAttrs

#### Example

```ts
node.setAttrs({
  x: 5,
  fill: 'red'
});
```

#### Source

node\_modules/konva/lib/Node.d.ts:352

***

### setDraggable()

> **setDraggable**(`draggable`): `void`

#### Parameters

• **draggable**: `any`

#### Returns

`void`

#### Inherited from

`Group.setDraggable`

#### Source

node\_modules/konva/lib/Node.d.ts:912

***

### setPosition()

> **setPosition**(`pos`): [`Frame`](Frame.md)

#### Parameters

• **pos**: `Vector2d`

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.setPosition`

#### Source

node\_modules/konva/lib/Node.d.ts:422

***

### setSize()

> **setSize**(`size`): [`Frame`](Frame.md)

#### Parameters

• **size**: `any`

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.setSize`

#### Source

node\_modules/konva/lib/Node.d.ts:811

***

### setZIndex()

> **setZIndex**(`zIndex`): [`Frame`](Frame.md)

#### Parameters

• **zIndex**: `any`

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.setZIndex`

#### Source

node\_modules/konva/lib/Node.d.ts:527

***

### shouldDrawHit()

> **shouldDrawHit**(`top`?): `any`

#### Parameters

• **top?**: `Node`\<`NodeConfig`\>

#### Returns

`any`

#### Inherited from

`Group.shouldDrawHit`

#### Source

node\_modules/konva/lib/Node.d.ts:386

***

### show()

> **show**(): [`Frame`](Frame.md)

show node. set visible = true

#### Returns

[`Frame`](Frame.md)

#### Inherited from

`Group.show`

#### Method

#### Name

Konva.Node#show

#### Source

node\_modules/konva/lib/Node.d.ts:393

***

### startDrag()

> **startDrag**(`evt`?, `bubbleEvent`?): `void`

initiate drag and drop.

#### Parameters

• **evt?**: `any`

• **bubbleEvent?**: `boolean`

#### Returns

`void`

#### Inherited from

`Group.startDrag`

#### Method

#### Name

Konva.Node#startDrag

#### Source

node\_modules/konva/lib/Node.d.ts:904

***

### stopDrag()

> **stopDrag**(`evt`?): `void`

stop drag and drop

#### Parameters

• **evt?**: `any`

#### Returns

`void`

#### Inherited from

`Group.stopDrag`

#### Method

#### Name

Konva.Node#stopDrag

#### Source

node\_modules/konva/lib/Node.d.ts:911

***

### toBlob()

> **toBlob**(`config`?): `Promise`\<`Blob`\>

Converts node into a blob.  Since the toBlob method is asynchronous,
 the resulting blob can only be retrieved from the config callback
 or the returned Promise.

#### Parameters

• **config?**: `CanvasConfig` & `object` & `object`

#### Returns

`Promise`\<`Blob`\>

rejects if the canvas can not be encoded

#### Inherited from

`Group.toBlob`

#### Method

#### Name

Konva.Node#toBlob

#### Example

```ts
var blob = await node.toBlob({});
```

#### Source

node\_modules/konva/lib/Node.d.ts:808

***

### toCanvas()

> **toCanvas**(`config`?): `HTMLCanvasElement`

converts node into an canvas element.

#### Parameters

• **config?**: `CanvasConfig`

#### Returns

`HTMLCanvasElement`

#### Inherited from

`Group.toCanvas`

#### Method

#### Name

Konva.Node#toCanvas

#### Example

```ts
var canvas = node.toCanvas();
```

#### Source

node\_modules/konva/lib/Node.d.ts:723

***

### toDataURL()

> **toDataURL**(`config`?): `string`

Creates a composite data URL (base64 string). If MIME type is not
specified, then "image/png" will result. For "image/jpeg", specify a quality
level as quality (range 0.0 - 1.0)

#### Parameters

• **config?**: `CanvasConfig` & `object` & `object`

#### Returns

`string`

#### Inherited from

`Group.toDataURL`

#### Method

#### Name

Konva.Node#toDataURL

#### Source

node\_modules/konva/lib/Node.d.ts:748

***

### toImage()

> **toImage**(`config`?): `Promise`\<`HTMLImageElement`\>

converts node into an image.  Since the toImage
 method is asynchronous, the resulting image can only be retrieved from the config callback
 or the returned Promise.  toImage is most commonly used
 to cache complex drawings as an image so that they don't have to constantly be redrawn

#### Parameters

• **config?**: `CanvasConfig` & `object` & `object`

#### Returns

`Promise`\<`HTMLImageElement`\>

#### Inherited from

`Group.toImage`

#### Method

#### Name

Konva.Node#toImage

#### Example

```ts
var image = node.toImage({
  callback(img) {
    // do stuff with img
  }
});
```

#### Source

node\_modules/konva/lib/Node.d.ts:783

***

### toJSON()

> **toJSON**(): `string`

convert Node into a JSON string.  Returns a JSON string.

#### Returns

`string`

#### Inherited from

`Group.toJSON`

#### Method

#### Name

Konva.Node#toJSON

#### Source

node\_modules/konva/lib/Node.d.ts:564

***

### toObject()

> **toObject**(): `object`

#### Returns

`object`

##### attrs

> **attrs**: `any`

##### children?

> **`optional`** **children**: `any`[]

##### className

> **className**: `string`

#### Inherited from

`Group.toObject`

#### Source

node\_modules/konva/lib/Container.d.ts:142

***

### \_beginUpdateBatch()

> **`static`** **\_beginUpdateBatch**(): () => `void`

#### Returns

`Function`

> ##### Returns
>
> `void`
>

#### Inherited from

`Group._beginUpdateBatch`

#### Source

node\_modules/konva/lib/Node.d.ts:147

***

### \_createNode()

> **`static`** **\_createNode**(`obj`, `container`?): `any`

#### Parameters

• **obj**: `any`

• **container?**: `any`

#### Returns

`any`

#### Inherited from

`Group._createNode`

#### Source

node\_modules/konva/lib/Node.d.ts:1015

***

### \_flushUpdateBatch()

> **`static`** **\_flushUpdateBatch**(): `void`

#### Returns

`void`

#### Inherited from

`Group._flushUpdateBatch`

#### Source

node\_modules/konva/lib/Node.d.ts:145

***

### \_runAfterUpdateBatch()

> **`static`** **\_runAfterUpdateBatch**(`cb`): `void`

#### Parameters

• **cb**

#### Returns

`void`

#### Inherited from

`Group._runAfterUpdateBatch`

#### Source

node\_modules/konva/lib/Node.d.ts:144

***

### \_updateBatch()

> **`static`** **\_updateBatch**\<`T`\>(`fn`): `T`

#### Type parameters

• **T**

#### Parameters

• **fn**

#### Returns

`T`

#### Inherited from

`Group._updateBatch`

#### Source

node\_modules/konva/lib/Node.d.ts:146

***

### create()

> **`static`** **create**(`data`, `container`?): `any`

create node with JSON string or an Object. Deserialization restores attributes only,
 not functions, images or event handlers (that would make the serialized object huge):
 `sceneFunc`/`hitFunc` of custom shapes, images and `fillPatternImage`, `clipFunc`,
 `dragBoundFunc`, filter functions, the `nodes`, `boundBoxFunc` and `anchorStyleFunc`
 of a Transformer, typed arrays and the `cache()` state. If your app uses them (it probably
 does), select the nodes after loading the stage and set these properties again with
 `on()`, `sceneFunc()`, `image()` and so on

#### Parameters

• **data**: `any`

string or object

• **container?**: `any`

optional container dom element used only if you're
 creating a stage node

#### Returns

`any`

#### Inherited from

`Group.create`

#### Method

#### Memberof

Konva.Node

#### Source

node\_modules/konva/lib/Node.d.ts:1014
