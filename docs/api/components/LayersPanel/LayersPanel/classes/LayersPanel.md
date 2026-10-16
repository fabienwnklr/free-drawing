**@fabwcie/free-drawing** • [API](../../../../README.md)

***

[@fabwcie/free-drawing](../../../../README.md) / [components/LayersPanel/LayersPanel](../README.md) / LayersPanel

# Class: LayersPanel

Panel listing drawing shapes, top one first, shapes of groups under them (expanded): select them (Shift adds),
rename (double click, F2), reorder in their group (drag handle, Alt + arrows), hide, lock and delete them,
group and ungroup selection

## Constructors

### new LayersPanel(drawer)

> **new LayersPanel**(`drawer`): [`LayersPanel`](LayersPanel.md)

#### Parameters

• **drawer**: [`Drawer`](../../../../Drawer/classes/Drawer.md)

#### Returns

[`LayersPanel`](LayersPanel.md)

#### Source

[packages/free-drawing/src/components/LayersPanel/LayersPanel.ts:86](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/LayersPanel/LayersPanel.ts#L86)

## Properties

### $button

> **$button**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/LayersPanel/LayersPanel.ts:67](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/LayersPanel/LayersPanel.ts#L67)

***

### $buttonContainer

> **$buttonContainer**: `HTMLDivElement`

#### Source

[packages/free-drawing/src/components/LayersPanel/LayersPanel.ts:66](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/LayersPanel/LayersPanel.ts#L66)

***

### $closeButton

> **$closeButton**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/LayersPanel/LayersPanel.ts:71](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/LayersPanel/LayersPanel.ts#L71)

***

### $empty

> **$empty**: `HTMLParagraphElement`

#### Source

[packages/free-drawing/src/components/LayersPanel/LayersPanel.ts:73](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/LayersPanel/LayersPanel.ts#L73)

***

### $groupButton

> **$groupButton**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/LayersPanel/LayersPanel.ts:69](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/LayersPanel/LayersPanel.ts#L69)

***

### $hint

> **$hint**: `HTMLParagraphElement`

Shortcuts selecting several rows

#### Source

[packages/free-drawing/src/components/LayersPanel/LayersPanel.ts:75](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/LayersPanel/LayersPanel.ts#L75)

***

### $list

> **$list**: `HTMLUListElement`

#### Source

[packages/free-drawing/src/components/LayersPanel/LayersPanel.ts:72](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/LayersPanel/LayersPanel.ts#L72)

***

### $panel

> **$panel**: `HTMLDivElement`

#### Source

[packages/free-drawing/src/components/LayersPanel/LayersPanel.ts:68](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/LayersPanel/LayersPanel.ts#L68)

***

### $ungroupButton

> **$ungroupButton**: `HTMLButtonElement`

#### Source

[packages/free-drawing/src/components/LayersPanel/LayersPanel.ts:70](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/LayersPanel/LayersPanel.ts#L70)

***

### drawer

> **drawer**: [`Drawer`](../../../../Drawer/classes/Drawer.md)

#### Source

[packages/free-drawing/src/components/LayersPanel/LayersPanel.ts:65](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/LayersPanel/LayersPanel.ts#L65)

## Methods

### isVisible()

> **isVisible**(): `boolean`

#### Returns

`boolean`

#### Source

[packages/free-drawing/src/components/LayersPanel/LayersPanel.ts:181](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/LayersPanel/LayersPanel.ts#L181)

***

### moveShape()

> **moveShape**(`shape`, `index`): `boolean`

Move a shape to a place of its group (or drawing): 0 is top

#### Parameters

• **shape**: [`DrawingShape`](../../../../@types/drawer/type-aliases/DrawingShape.md)

• **index**: `number`

#### Returns

`boolean`

true if it moved (change saved)

#### Source

[packages/free-drawing/src/components/LayersPanel/LayersPanel.ts:577](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/LayersPanel/LayersPanel.ts#L577)

***

### setExpanded()

> **setExpanded**(`group`, `expanded`): `void`

Expand or collapse a group

#### Parameters

• **group**: `Group`

• **expanded**: `boolean`

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/LayersPanel/LayersPanel.ts:218](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/LayersPanel/LayersPanel.ts#L218)

***

### toggle()

> **toggle**(`show`): `void`

Show or hide panel

#### Parameters

• **show**: `boolean`= `!this.isVisible()`

Toggle by default

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/LayersPanel/LayersPanel.ts:189](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/LayersPanel/LayersPanel.ts#L189)

***

### update()

> **update**(): `void`

List shapes again (after drawing changes), focus kept on same control

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/LayersPanel/LayersPanel.ts:227](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/LayersPanel/LayersPanel.ts#L227)

***

### updateSelection()

> **updateSelection**(): `void`

Rows of selected shapes highlighted, first one scrolled into view, group buttons enabled

#### Returns

`void`

#### Source

[packages/free-drawing/src/components/LayersPanel/LayersPanel.ts:262](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/components/LayersPanel/LayersPanel.ts#L262)
