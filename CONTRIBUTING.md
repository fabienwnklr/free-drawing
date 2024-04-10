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

It is never a good experience to have your pull request declined after investing a lot of time and effort in writing the code. Therefore, we highly recommend you to [kick off a discussion]() before starting any new work on your side.

Just start a discussion and explain what are you planning to contribute?

- **Are you trying to create a PR to fix a bug**: PRs for bugs are mostly accepted once the bug has been confirmed.
- **Are you planning to add a new feature**: Please thoroughly explain why this feature is required and share links to the learning material we can read to educate ourselves.

  For example: If you are adding support for snapshot testing to Japa or AdonisJS. Then share the links I can use to learn more about snapshot testing in general.

> Note: You should also be available to open additional PRs for documenting the contributed feature or improvement.

## Repository setup

1. Start by cloning the repo on your local machine.

   ```sh
   git clone <REPO_URL>
   ```

2. Install dependencies on your local. Please do not update any dependencies along with a feature request. If you find stale dependencies, create a separate PR to update them.

   We use `npm` for managing dependencies, therefore do not use `yarn` or any other tool.

   ```sh
   yarn install
   ```

3. Run tests by executing the following command.

   ```sh
   yarn test
   ```

## Tools in use

Following is the list of tools in use.

| Tool                   | Usage                                                                                                                                                                                                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript             | All of the repos are authored in TypeScript. The compiled JavaScript and Type-definitions are published on npm.                                                                                                                                                                                                |
| TS Node                | We use [ts-node](https://typestrong.org/ts-node/) to run tests or scripts without compiling TypeScript. The main goal of ts-node is to have a faster feedback loop during development                                                                                                                          |
| ViteJS                 | [ViteJS](https://vitejs.dev/) is a build tool that aims to provide a faster and leaner development experience for modern web projects                                                                                                                                                                          |
| Vitest                 | [Vitest](https://vitest.dev/) is a next generation testing framework powered by Vite.                                                                                                                                                                                                                          |
| commit-and-tag-version | We use [commit-and-tag-version](https://www.npmjs.com/package/commit-and-tag-version) to publish our packages on npm. commit-and-tag-version does all the heavy lifting of creating a release and publishes it on npm and Github. The commit-and-tag-version config is defined within the `package.json` file. |
| ESLint                 | ESLint helps us enforce a consistent coding style across all the repos with multiple contributors. All our ESLint rules are published under the [eslint-plugin-adonis](https://github.com/adonisjs-community/eslint-plugin-adonis) package.                                                                    |
| Prettier               | We use prettier to format the codebase for consistent visual output. If you are confused about why we are using ESLint and Prettier both, then please read [Prettier vs. Linters](https://prettier.io/docs/en/comparison.html) doc on the Prettier website.                                                    |
| Conventional Changelog | All of the commits across all the repos uses [commitlint](https://github.com/conventional-changelog/commitlint/#what-is-commitlint) to enforce consistent commit messages.                                                                                                                                     |
| Husky                  | We use [husky](https://typicode.github.io/husky/#/) to enforce commit conventions when committing the code. Husky is a git hooks system written in Node                                                                                                                                                        |
| VitePress              | We use [VitePress](https://vitepress.dev/) to build a static web site for documentation                                                                                                                                                                                                                        |

## Commands

| Command            | Description                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `yarn test`        | Run project tests using `vitest`                                                                                       |
| `yarn build`       | Compile the TypeScript project to JavaScript. The compiled output is written inside the `dist` directory               |
| `yarn release`     | Start the release process using `commit-and-tag-version`                                                               |
| `yarn release:major`        | Start the release as major version process using `commit-and-tag-version`                                                                                         |
| `yarn release:minor`        | Start the release as minor version process using `commit-and-tag-version`                                                                                         |
| `yarn release:patch`        | Start the release as patch version process using `commit-and-tag-version`                                                                                         |
| `yarn lint`        | Lint the codebase using ESlint                                                                                         |
| `yarn format`      | Format the codebase using Prettier                                                                                     |
| `yarn sync-labels` | Sync the labels defined inside the `.github/labels.json` file with Github. This command is for the project admin only. |

## Coding style

All of my projects are written in TypeScript.

Also, make sure to run the following commands before pushing the code.

```sh
# Formats using prettier
yarn format

# Lints using Eslint
yarn lint
```

## Getting recognized as a contributor

We rely on Github to list all the repo contributors in the right-side panel of the repo. Following is an example of the same.

Also, we use the [auto generate release notes](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes#about-automatically-generated-release-notes) feature of Github, which adds a reference to the contributor profile within the release notes.
