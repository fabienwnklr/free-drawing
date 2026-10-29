# Contributing

First of all, thanks a lot for contribute to this project.

Code is not the only way to contribute. Following are also some ways to contribute and become part of the community.

- Fixing typos in the documentation
- Improving existing docs
- Triaging issues
- Sharing your opinion on existing issues
- Help the community

## Reporting bugs

Many issues reported on open source projects are usually questions or misconfiguration at the reporter's end. Therefore, we highly recommend you properly troubleshoot your issues before reporting them.

If you're reporting a bug, include as much information as possible with the code samples you have written. The scale of good to bad issues looks as follows.

- **PERFECT ISSUE**: You isolate the underlying bug. Create a failing test in the repo and open a Github issue around it.
- **GOOD ISSUE**: You isolate the underlying bug and provide a minimal reproduction of it as a Github repo. Antfu has written a great article on [Why Reproductions are Required](https://antfu.me/posts/why-reproductions-are-required).
- **DECENT ISSUE**: You correctly state your issue. Share the code that produces the issue in the first place. Also, include the related configuration files and the package version you use.

  Last but not least is to format every code block properly by following the [Github markdown syntax guide](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax).

- **POOR ISSUE**: You dump the question you have with the hope that the other person will ask the relevant questions and help you. These kinds of issues are closed automatically without any explanation.

## Having a discussion

You often want to discuss a topic or maybe share some ideas. In that case, create a discussion in the discussions forum under the **💡Ideas** category.

## Educating others

Educating others is one of the best ways to contribute to any community and earn recognition.

You can use the [**📚 Cookbooks**](https://github.com/fabienwnklr/free-drawing/discussions/categories/cookbooks) category on our discussion forum to share an article with others. The cookbooks section is NOT strictly moderated, except the shared knowledge should be relevant to the project.

## Creating pull requests

It is never a good experience to have your pull request declined after investing a lot of time and effort in writing the code. Therefore, we highly recommend you to [kick off a discussion](https://github.com/fabienwnklr/free-drawing/discussions) before starting any new work on your side.

Just start a discussion and explain what are you planning to contribute?

- **Are you trying to create a PR to fix a bug**: PRs for bugs are mostly accepted once the bug has been confirmed.
- **Are you planning to add a new feature**: Please thoroughly explain why this feature is required and share links to the learning material we can read to educate ourselves.

  For example: if you are adding a new tool or an export format, share what it is used for and how other drawing apps handle it.

> Note: You should also be available to open additional PRs for documenting the contributed feature or improvement.

## Repository setup

1. Start by cloning the repo on your local machine.

   ```sh
   git clone https://github.com/fabienwnklr/free-drawing.git
   ```

2. Install dependencies on your local, with Node.js 24. Please do not update any dependencies along with a feature request. If you find stale dependencies, create a separate PR to update them.

   The repository is made of [Yarn 1 workspaces](https://classic.yarnpkg.com/en/docs/workspaces) (the library, its components, the plugin generator, the server, the web app and the docs, one `yarn.lock` at the root): use `yarn`, not `npm` or another tool.

   ```sh
   yarn install
   ```

3. Run tests by executing the following command.

   ```sh
   yarn test
   ```

## Tools in use

Following is the list of tools in use.

| Tool                   | Usage                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript             | All of the repos are authored in TypeScript. The compiled JavaScript and Type-definitions are published on npm.                                                                                                                                                                                                                                                                                                                   |
| tsx                    | The server (`apps/server`) is run with [tsx](https://tsx.is/), without compiling TypeScript.                                                                                                                                                                                                                                                                                                                                      |
| ViteJS                 | [ViteJS](https://vitejs.dev/) is a build tool that aims to provide a faster and leaner development experience for modern web projects                                                                                                                                                                                                                                                                                             |
| Vitest                 | [Vitest](https://vitest.dev/) is a next generation testing framework powered by Vite.                                                                                                                                                                                                                                                                                                                                             |
| Versioning             | Each commit changing the library for its users updates `packages/free-drawing/CHANGELOG.md` and bumps the version in `packages/free-drawing/package.json` ([semver](https://semver.org/): major for breaking changes, minor for features, patch otherwise), then is tagged `vX.Y.Z`. The components, the extra tools and the plugin generator have their own changelog and version. `yarn release` publishes the current version. |
| ESLint                 | ESLint (`typescript-eslint`, JSDoc rules of `eslint-plugin-jsdoc`: every declaration documented) checks the sources and tests of the library, see `packages/free-drawing/eslint.config.js`.                                                                                                                                                                                                                                       |
| Prettier               | We use prettier to format the codebase for consistent visual output. If you are confused about why we are using ESLint and Prettier both, then please read [Prettier vs. Linters](https://prettier.io/docs/en/comparison.html) doc on the Prettier website.                                                                                                                                                                       |
| Conventional Changelog | All of the commits across all the repos uses [commitlint](https://github.com/conventional-changelog/commitlint/#what-is-commitlint) to enforce consistent commit messages.                                                                                                                                                                                                                                                        |
| Husky                  | We use [husky](https://typicode.github.io/husky/#/) to enforce commit conventions when committing the code. Husky is a git hooks system written in Node                                                                                                                                                                                                                                                                           |
| VitePress              | We use [VitePress](https://vitepress.dev/) to build a static web site for documentation                                                                                                                                                                                                                                                                                                                                           |

## Commands

Run them at the root of the repository.

| Command          | Description                                                                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `yarn dev`       | Demo with vite (no accounts nor collaboration)                                                                                    |
| `yarn serve`     | Server on `http://localhost:3000`: demo with accounts and live collaboration                                                      |
| `yarn test`      | Tests of every package (`vitest`), then of the server                                                                             |
| `yarn typecheck` | Type check of every package, the server and the web app                                                                           |
| `yarn lint`      | ESLint and Prettier check of the library, Prettier check of the other packages                                                    |
| `yarn format`    | Format the codebase using Prettier                                                                                                |
| `yarn build`     | Build the library in `packages/free-drawing/dist`, then the components and the extra tools                                        |
| `yarn docs`      | Documentation site (VitePress), `yarn doc:typedoc` first for the API pages                                                        |
| `yarn release`   | Push commits and version tags: the release workflow creates the GitHub release and publishes the version on npm (maintainer only) |

## Coding style

The packages are written in TypeScript (strict), the plugin generator in JavaScript checked by TypeScript. Files of the library are imported with the `@/` alias, every declaration has a JSDoc comment and every text of the interface is translated (`src/i18n`).

Also, make sure to run the following commands before pushing the code (the `pre-push` hook runs `lint` and `test`).

```sh
# Formats using prettier
yarn format

# Lints using Eslint
yarn lint
```

## Getting recognized as a contributor

We rely on Github to list all the repo contributors in the right-side panel of the repo. Following is an example of the same.

Also, we use the [auto generate release notes](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes#about-automatically-generated-release-notes) feature of Github, which adds a reference to the contributor profile within the release notes.
