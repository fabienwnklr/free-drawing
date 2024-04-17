**@fabwcie/free-drawing** • [API](../../../README.md)

***

[@fabwcie/free-drawing](../../../README.md) / [utils/perf](../README.md) / throttle

# Function: throttle()

> **throttle**\<`T`\>(`func`, `limit`): [`ThrottledFunction`](../type-aliases/ThrottledFunction.md)\<`T`\>

La fonction throttle permet d'éviter des appels consécutifs en introduisant un délai.
Elle servira surtout lorsque l'on écoutera des évènements pouvant se produire un très
grand nombre de fois dans un intervalle de temps très court (scroll, resize, mouseMove...).

## Type parameters

• **T** extends (...`args`) => `any`

## Parameters

• **func**: `T`

• **limit**: `number`= `100`

## Returns

[`ThrottledFunction`](../type-aliases/ThrottledFunction.md)\<`T`\>

## Example

```ts
// Define the function that updates the layout
function updateLayout() {
  // Update the layout...
}

// Create a throttled version of the function
const throttledUpdateLayout = throttle(updateLayout, 250);

// Listen for window scroll events and call the throttled function
window.addEventListener("scroll", throttledUpdateLayout);
```

## Source

[utils/perf.ts:58](https://github.com/fabienwnklr/free-drawing/blob/master/src/utils/perf.ts#L58)
