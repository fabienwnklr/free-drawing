# <img src="./docs/public/logo.svg" width="36" alt="" /> free-drawing

![image](https://github.com/fabienwnklr/free-drawing/assets/49644785/2a87f2dc-ee59-4cec-87a6-872f06e231fa)

Infinite canvas drawing library ([TypeScript](https://www.typescriptlang.org/) + [Konva](https://konvajs.org/)), with live collaboration.

📝 Check documentation [here](https://free-drawing-docs.netlify.app/)

<img src="./docs/public/logo.svg" width="17" /> Check demo [here](https://free-drawing-demo.netlify.app/)

## Repository

| Folder | Content |
| --- | --- |
| [packages/free-drawing](packages/free-drawing) | The library, published on npm as [`@fabwcie/free-drawing`](https://www.npmjs.com/package/@fabwcie/free-drawing): [usage and options](packages/free-drawing/README.md), [changelog](packages/free-drawing/CHANGELOG.md) |
| [packages/protocol](packages/protocol) | Messages of live collaboration, shared by the library and the server |
| [apps/web](apps/web) | Web app: with the server, accounts and drawings saved on server; without it (static site), demo drawing in browser |
| [apps/server](apps/server) | Server: accounts, drawings and preferences API, live collaboration (socket.io), demo page ([README](apps/server/README.md)) |
| [docs](docs) | Documentation site (VitePress) |

Packages are [yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces): run `yarn install` and the commands below at the root.

| Command | Purpose |
| --- | --- |
| `yarn dev` | Demo with vite (no collaboration server) |
| `yarn serve` | Demo with live collaboration on `http://localhost:3000` |
| `yarn test` | Tests of the library and the server |
| `yarn typecheck` | Type check of the library and the server |
| `yarn lint` | ESLint on the library |
| `yarn build` | Library build in `packages/free-drawing/dist` |
| `yarn build:static` | Web app in `apps/web/dist` (static demo site, or served by the server in production) |
| `yarn docs` | Documentation site (VitePress) on `http://localhost:5173`, `yarn docs:build` to build it |
| `yarn doc:typedoc` | API pages of the documentation, from the JSDoc of the library (TypeDoc) |
| `yarn doc:changelog` / `yarn doc:get-started` | Copy the changelog, README and CONTRIBUTING of the library into the documentation |
| `yarn release` | Push with tags: the release workflow creates the GitHub release and publishes the library on npm |

## Contribute

See [Contribute guide](https://github.com/fabienwnklr/free-drawing/blob/master/CONTRIBUTING.md)
