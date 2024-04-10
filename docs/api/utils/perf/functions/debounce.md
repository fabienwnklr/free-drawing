**free-drawing** • [API](../../../README.md)

***

[free-drawing](../../../README.md) / [utils/perf](../README.md) / debounce

# Function: debounce()

> **debounce**\<`T`\>(`callback`, `delay`): (...`args`) => `void`

permet de déclencher l'appel à une fonction après un certain délai (un peu comme la fonction setTimeout())
mais permet en plus de réinitialiser le timer si on demande une nouvelle exécution dans un intervalle de temps plus court que le délai

## Type parameters

• **T** extends (...`args`) => `any`

## Parameters

• **callback**: `T`

Fonction à appeler

• **delay**: `number`= `300`

Timeout avant éxécution de la méthode

## Returns

`Function`

> ### Parameters
>
> • ...**args**: `Parameters`\<`T`\>
>
> ### Returns
>
> `void`
>

## Example

```ts
// Define the function that updates the layout
function updateLayout() {
// Update the layout...
}
// Create a debounced version of the function
const debouncedUpdateLayout = debounce(updateLayout, 250);

// Listen for window resize events and call the debounced function
window.addEventListener("resize", debouncedUpdateLayout);
```

## Source

[utils/perf.ts:22](https://github.com/fabienwnklr/free-drawing/blob/master/src/utils/perf.ts#L22)
