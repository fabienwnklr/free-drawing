# ts-vitejs-template

Template using vitejs and typescript (and more) for create easily and quickly nice JS library !

## Table of contents

- [Features](#features)
- [Checklist](#checklist)
- [Usage](#usage)
- [Build](#build)
- [Docs](#docs)
- [Release](#release)

## Features

- 🦾 TypeScript, of course
- 🎨 Lint your commit with [commitlint](https://github.com/conventional-changelog/commitlint) using [conventional commits](https://www.conventionalcommits.org/)
- 🎨 Lint your code with [typescript-eslint](https://typescript-eslint.io/getting-started/)
- 🎨 Format your code with [prettier](https://prettier.io/)
- 💄 Perform scss using [sass](https://sass-lang.com/)
- ⚓ Manage your commit hook width [husky](https://typicode.github.io/husky/)
- ⚙️ Unit Testing with [Vitest](https://github.com/vitest-dev/vitest)
- 🧪 E2E Testing with [Playwright](https://github.com/microsoft/playwright)
- 📝 Generate change log based on commit using [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version)
- 📄 Generate static site using [docusaurus](https://docusaurus.io/)
- 🗒 Generate **markdown** doc from ts using [typedoc](https://typedoc.org/) and [typedoc-plugin-markdown](https://github.com/tgreyuk/typedoc-plugin-markdown)
- 🏷️ Generate declaration files with [vite-plugin-dts](https://github.com/qmhc/vite-plugin-dts)
- Trigger custom event with tiny plugin [MicroEvent](https://github.com/fabienwnklr/ts-vitejs-template/blob/master/src/lib/MicroPlugin.ts)
- Create plugin(s) with tiny plugin [MicroPlugin](https://github.com/fabienwnklr/ts-vitejs-template/blob/master/src/lib/MicroPlugin.ts)

## Checklist

When you use this template, try follow the checklist to update your info properly

- [ ] Change the class name file
- [ ] Change the class name file in `src` then the class name in `index.html` / `vite.config.ts` / `src/MyClass.ts` AND in script `build:docs` into `package.json`
- [ ] Change url for repo in `.versionrc.json`
- [ ] Add your style to `src/scss/style.scss` (optionnal)
- [ ] Add the favicon in `public` (optional)
- [ ] Clean up the README (optional)
- [ ] Update you website name and more in `docs` folder or remove it and update `docs:api` script

## Usage

Just run and visit [http://localhost:5173/](http://localhost:5173/)

```bash
yarn dev
```

## Build

To build the lib, run

```bash
yarn build
```

And you will see the generated file in dist that ready to be served.

## Docs

### Docusaurus website

Run dev mode website

```bash
yarn docs
```

> **for more you can see `docs/package.json` scripts**

### Api doc

Generate api doc from typedoc

```bash
yarn build:api
```

## Release

### First release

```bash
yarn release -- --first-release
```

### New release

**See all availables options [here](https://github.com/absolute-version/commit-and-tag-version#first-release)**

```bash
yarn release
```

you can precise version using `major`, `minor` or `patch`

```bash
yarn release -- --release-as minor
```

or you can pass specific version

```bash
yarn release -- --release-as 1.1.0
```
