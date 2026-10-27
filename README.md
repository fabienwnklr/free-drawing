# <img src="./docs/public/logo.svg" width="36" alt="" /> free-drawing

![image](https://github.com/fabienwnklr/free-drawing/assets/49644785/2a87f2dc-ee59-4cec-87a6-872f06e231fa)

Infinite canvas drawing library ([TypeScript](https://www.typescriptlang.org/) + [Konva](https://konvajs.org/)), with live collaboration: in plain JavaScript, React, Vue, or as a web component (Angular, Svelte, plain HTML...).

📝 Check documentation [here](https://free-drawing-docs.netlify.app/)

<img src="./docs/public/logo.svg" width="17" /> Check demo [here](https://free-drawing-demo.netlify.app/)

## Why free-drawing?

- **Any framework, or none**: a class for any page, a component for React and Vue, a `<free-drawing>` element for the others, with the same options and API.
- **Truly open source**: [MIT licence](LICENCE), no licence key, no watermark, no paid features.
- **Rights in live sessions**: participants view the drawing until its owner lets them draw, they ask in one click, and follow the view the owner presents.
- **A real layers panel**: name, hide, lock and reorder every shape, select ranges of them.
- **Share without a server**: a link holds the whole drawing, compressed, and files open anywhere.
- **Your own features**: tools, commands, shortcuts and menu items with a typed plugin API, a new plugin created by `npm create @fabwcie/free-drawing-plugin`.
- **Your server, or the one included**: Node server with accounts, saved drawings and live collaboration ([apps/server](apps/server)).

## Repository

| Folder | Content |
| --- | --- |
| [packages/free-drawing](packages/free-drawing) | The library, published on npm as [`@fabwcie/free-drawing`](https://www.npmjs.com/package/@fabwcie/free-drawing): [usage and options](packages/free-drawing/README.md), [changelog](packages/free-drawing/CHANGELOG.md) |
| [packages/react](packages/react) | React component, published on npm as [`@fabwcie/free-drawing-react`](https://www.npmjs.com/package/@fabwcie/free-drawing-react) ([README](packages/react/README.md)) |
| [packages/vue](packages/vue) | Vue component, published on npm as [`@fabwcie/free-drawing-vue`](https://www.npmjs.com/package/@fabwcie/free-drawing-vue) ([README](packages/vue/README.md)) |
| [packages/element](packages/element) | Web component `<free-drawing>` (Angular, Svelte, plain HTML...), published on npm as [`@fabwcie/free-drawing-element`](https://www.npmjs.com/package/@fabwcie/free-drawing-element) ([README](packages/element/README.md)) |
| [packages/create-plugin](packages/create-plugin) | Plugin generator: `npm create @fabwcie/free-drawing-plugin` ([README](packages/create-plugin/README.md)) |
| [packages/plugin-template](packages/plugin-template) | Complete plugin to copy, tested with the library ([README](packages/plugin-template/README.md)) |
| [packages/protocol](packages/protocol) | Messages of live collaboration, shared by the library and the server |
| [apps/web](apps/web) | Web app: with the server, accounts and drawings saved on server; without it (static site), demo drawing in browser |
| [apps/server](apps/server) | Server: accounts, drawings and preferences API, live collaboration (socket.io), demo page ([README](apps/server/README.md)) |
| [docs](docs) | Documentation site (VitePress) |

Packages are [yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces): run `yarn install` and the commands below at the root.

| Command | Purpose |
| --- | --- |
| `yarn dev` | Demo with vite (no collaboration server) |
| `yarn serve` | Demo with live collaboration on `http://localhost:3000` |
| `yarn test` | Tests of the library, the plugin template, the plugin generator, the components and the server |
| `yarn typecheck` | Type check of the library, the plugin template, the plugin generator, the components, the server and the web app |
| `yarn lint` | ESLint on the library, Prettier check of the packages |
| `yarn build` | Library build in `packages/free-drawing/dist`, then the components (`packages/react/dist`, `packages/vue/dist`, `packages/element/dist`) |
| `yarn build:static` | Web app in `apps/web/dist` (static demo site, or served by the server in production) |
| `yarn docs` | Documentation site (VitePress) on `http://localhost:5173`, `yarn docs:build` to build it |
| `yarn doc:typedoc` | API pages of the documentation, from the JSDoc of the library (TypeDoc) |
| `yarn doc:changelog` / `yarn doc:get-started` | Copy the changelog and README of the library, READMEs of the components and CONTRIBUTING into the documentation |
| `yarn release` | Push with tags: the release workflow creates the GitHub release and publishes the library (and new versions of the other public packages) on npm |

## Contribute

See [Contribute guide](https://github.com/fabienwnklr/free-drawing/blob/master/CONTRIBUTING.md)
