**@fabwcie/free-drawing** • [API](../../README.md)

***

[@fabwcie/free-drawing](../../README.md) / [constants](../README.md) / drawerEvents

# Variable: drawerEvents

> **`const`** **drawerEvents**: `object`

Events of drawer (`drawer.on(event, callback)`) and of its components, named `drawer.<subject>.<action>`

## Type declaration

### change

> **`readonly`** **change**: `"drawer.change"` = `'drawer.change'`

Drawing changed (shapes, background...), with drawer

### collaborationChange

> **`readonly`** **collaborationChange**: `"drawer.collaboration.change"` = `'drawer.collaboration.change'`

Collaboration started or stopped, users or rights changed

### dropdownHide

> **`readonly`** **dropdownHide**: `"drawer.dropdown.hide"` = `'drawer.dropdown.hide'`

Dropdown menu hidden (event of dropdown)

### languageChange

> **`readonly`** **languageChange**: `"drawer.language.change"` = `'drawer.language.change'`

Language of interface changed, with language

### optionsChange

> **`readonly`** **optionsChange**: `"drawer.options.change"` = `'drawer.options.change'`

Drawing options changed (setters, overlays...), with changed options

### preferencesChange

> **`readonly`** **preferencesChange**: `"drawer.preferences.change"` = `'drawer.preferences.change'`

Interface settings changed (theme, language, grid, snapping), with preferences: once for several ones

### readOnlyChange

> **`readonly`** **readOnlyChange**: `"drawer.readonly.change"` = `'drawer.readonly.change'`

Read only mode changed, with read only state

### selectionChange

> **`readonly`** **selectionChange**: `"drawer.selection.change"` = `'drawer.selection.change'`

Selected shapes changed, with selected shapes

### themeChange

> **`readonly`** **themeChange**: `"drawer.theme.change"` = `'drawer.theme.change'`

Light or dark theme shown, with dark state

### toastHide

> **`readonly`** **toastHide**: `"drawer.toast.hide"` = `'drawer.toast.hide'`

Toast hidden (event of toast)

### unsavedChange

> **`readonly`** **unsavedChange**: `"drawer.unsaved.change"` = `'drawer.unsaved.change'`

Drawing has changes not saved yet (without auto save) or is saved, with unsaved state

## Source

[packages/free-drawing/src/constants.ts:162](https://github.com/fabienwnklr/free-drawing/blob/master/packages/free-drawing/src/constants.ts#L162)
