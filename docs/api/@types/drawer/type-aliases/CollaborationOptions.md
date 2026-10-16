**@fabwcie/free-drawing** • [API](../../../README.md)

***

[@fabwcie/free-drawing](../../../README.md) / [@types/drawer](../README.md) / CollaborationOptions

# Type alias: CollaborationOptions

> **CollaborationOptions**: `object`

Collaboration server and data sent on connection

## Type declaration

### auth?

> **`optional`** **auth**: `Record`\<`string`, `unknown`\> \| (`callback`) => `void`

Data read by server on connection (`socket.handshake.auth`, e.g. token of logged in user), or function giving it on each connection

### url?

> **`optional`** **url**: `string`

Server url, page origin by default

## Source

[packages/free-drawing/src/@types/drawer.ts:67](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/@types/drawer.ts#L67)
