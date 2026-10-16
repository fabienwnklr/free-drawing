**@fabwcie/free-drawing** • [API](../../../README.md)

***

[@fabwcie/free-drawing](../../../README.md) / [utils/export](../README.md) / createPdf

# Function: createPdf()

> **createPdf**(`jpeg`, `width`, `height`, `scale`): `Blob`

Pdf of one page showing a jpeg image (raster pdf, no library needed)

## Parameters

• **jpeg**: `Uint8Array`\<`ArrayBuffer`\>

Image bytes

• **width**: `number`

Image width in pixels

• **height**: `number`

Image height in pixels

• **scale**: `number`

Pixel ratio of image: page has the drawing size (96 dpi)

## Returns

`Blob`

## Source

[packages/free-drawing/src/utils/export.ts:310](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/utils/export.ts#L310)
