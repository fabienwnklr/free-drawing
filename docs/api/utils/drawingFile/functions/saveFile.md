**@fabwcie/free-drawing** • [API](../../../README.md)

***

[@fabwcie/free-drawing](../../../README.md) / [utils/drawingFile](../README.md) / saveFile

# Function: saveFile()

> **saveFile**(`name`, `content`, `type`): `Promise`\<`void`\>

Save content in a file: browser save dialog when available (Chromium), else download

## Parameters

• **name**: `string`

File name with extension

• **content**: `string` \| `Blob`

• **type**: `string`= `'application/json'`

Mime type of content

## Returns

`Promise`\<`void`\>

## Throws

`AbortError` when dialog is canceled

## Source

[packages/free-drawing/src/utils/drawingFile.ts:112](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/utils/drawingFile.ts#L112)
