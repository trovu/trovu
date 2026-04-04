# AGENTS.md

## Overview

Trovu is a data-driven monorepo for the `trovu.net` search shortcut app. The main product is a static site that compiles curated YAML shortcut data into `dist/public/data.json`, then uses browser-side TypeScript modules to resolve queries into redirect URLs.

The repo also contains:

- the main web app and redirect processor
- a CLI for data compilation, validation, normalization, and migrations
- MkDocs-based documentation in `docs/`
- an Eleventy blog in `blog/`
- a browser extension in `src/web-ext/`
- a separate Raycast extension in `ext/raycast/`

When in doubt, treat `.github/workflows/deploy.yml` as the source of truth for what the project actually builds in CI.

## Runtime Map

- `src/ts/index.ts` boots the homepage UI via `Home`.
- `src/ts/process.ts` boots the redirect page via `CallHandler.handleCall()`.
- `src/ts/cli.ts` exposes the data and maintenance commands.
- `src/ts/modules/Env.ts` is the central environment loader:
    - reads compiled data
    - parses URL/query state
    - applies local storage and user config
    - resolves namespaces
- `src/ts/modules/NamespaceFetcher.ts` merges site namespaces from compiled data with optional remote user namespaces, resolves `include`, and marks shortcut reachability by priority.
- `src/ts/modules/ShortcutFinder.ts` selects the winning shortcut for a query.
- `src/ts/modules/UrlProcessor.ts` replaces placeholders, variables, types, transforms, and encodings in shortcut URLs.
- `src/ts/modules/DataManager.ts` loads and writes YAML under `data/`.
- `src/ts/modules/DataCompiler.ts` injects git metadata and loads `trovu.config.default.yml` plus optional `trovu.config.yml`.
- `src/ts/modules/Home.ts` and `src/ts/modules/home/*` drive the homepage UI, suggestions, and settings modal.

## Important Directories

- `data/shortcuts/`: curated shortcut namespaces as YAML
- `data/types/`: typed argument dictionaries, notably city and date data
- `data/schema/shortcuts.yml`: JSON schema used by `validate-data`
- `src/html/`, `src/scss/`, `src/js/`, `src/manifest/`, `src/favicon/`: static app assets
- `docs/`: MkDocs source
- `blog/`: Eleventy source
- `tests/`: Jest fixtures plus Playwright tests
- `dist/`: generated output, do not edit by hand

Note: `README.md` is a symlink to `docs/index.md`, so update `docs/index.md` if the README content needs to change.

## Setup And Core Commands

CI currently uses Node `22.22.0` and Python `3.11.9`.

For local Codex work, use `nvm use` so your shell matches the checked-in `.nvmrc`, then run `npm clean-install` after changing Node versions.

Common commands:

- `npm clean-install`
- `npm run build`
- `npm run watch`
- `npm run dev-server`
- `npm run validate-data`
- `npm run compile-data`
- `npm run test-unit`
- `npm run test-calls`
- `npm run test-fe`
- `npm run lint-yaml`
- `npm run lint-js`
- `npm run build-blog`
- `npm run build-docs`
- `pipenv run mkdocs build`
- `npm run test`

Useful workflow combinations:

- Main app local dev:
    1. `npm clean-install`
    2. `npm run build`
    3. `npm run dev-server`
- Safe Codex baseline:
    1. `nvm use`
    2. `git status --short`
    3. `npm run test`
- Frontend rebuild loop: `npm run watch`
- Data-only validation after editing YAML:
    1. `npm run validate-data`
    2. `npm run build`
    3. `npm run test-calls`
- `npm run test-fe` uses Playwright and starts the local server automatically via `webServer`.

## Build And Test Notes

- `rollup.config.js` builds:
    - the CLI to `dist/cli.mjs`
    - the homepage to `dist/public/index.html`
    - the process page to `dist/public/process/index.html`
- The main site build triggers `npm run compile-data` during the Rollup pipeline.
- `dist/` is ignored and should generally not be committed.
- `test-unit` covers modules directly.
- `test-calls` loads fixtures from `tests/calls.yml` and verifies end-to-end redirect behavior in Jest.
- `test-fe` is Playwright coverage for homepage behavior.
- `test` is the default pre/post-change safety check for local Codex work.
- Docs and blog are built separately; changes under `docs/` or `blog/` should usually be validated with their matching build commands.

## Working With Shortcut Data

Shortcut data is the heart of the app. Most behavior changes are data changes, not code changes.

Key rules:

- Each shortcut key is `KEYWORD ARGCOUNT`, for example `g 1`.
- Shortcut definitions live in namespace files under `data/shortcuts/*.yml`.
- `include` is heavily used for inheritance and may reference:
    - another key in the same namespace
    - another namespace
    - a list of fallback includes
- Placeholders in `url` are parsed by `UrlProcessor`:
    - argument placeholders like `<query>`
    - variable placeholders like `<$language>`
    - typed placeholders like `<date: {type: date}>`
    - transforms like `uppercase`, `lowercase`, `eo-cx`
- Reachability depends on namespace order. Later namespaces in the configured list have higher priority.

When editing shortcut YAML:

- validate with `npm run validate-data`
- run `npm run test-calls` if redirect behavior changed
- update docs in `docs/shortcuts/` if placeholder, include, namespace, or user-facing shortcut semantics changed

Be careful with rewrite commands:

- `npm run normalize-data`
- `node dist/cli.mjs edit-data`
- the `migrate-*` CLI commands
- `node dist/cli.mjs set-dictionaries`

These can rewrite many YAML files. Use them intentionally and review diffs closely.

## Coding Conventions

- Follow the existing style:
    - 2-space indentation
    - double quotes
    - semicolons
- The codebase mixes TypeScript files with broad `// @ts-nocheck` usage. Do not assume strict typing is enforced.
- Prefer small, local changes over broad refactors unless the task clearly calls for it.
- Keep browser code compatible with the existing DOM-driven architecture instead of introducing a framework.
- Prefer editing source files over generated output.

## Codex Safety Rules

- Do not work directly on `master`; start each Codex task from a dedicated branch, preferably `codex/<task>` when local git refs permit it.
- Treat `master` as a read/merge target, not an editing branch.
- Keep changes small, local, and reversible; defer large refactors unless explicitly requested.
- Never edit `dist/` by hand.
- Do not run broad formatting or rewrite commands unless explicitly requested.
- Review the diff before every commit.
- Do not push, merge, or rewrite history automatically.

Recommended task flow:

1. `git switch -c codex/<task>` or a close fallback branch name if slash-based refs are unavailable locally.
2. `git status --short`
3. `npm run test`
4. Make only the relevant changes.
5. Re-run the appropriate checks.
6. Review diff, then commit locally.

## Testing Guidance By Change Type

- Redirect, parsing, namespace, include, or placeholder logic:
    - add or update Jest coverage in `src/ts/modules/*.test.ts`
    - update `tests/calls.yml` when redirect outcomes change
- Homepage UX changes:
    - run `npm run build`
    - then run `npm run test-fe`
    - check `tests/playwright/home.spec.js`
- Data-only changes:
    - at minimum run `npm run validate-data`
    - also run `npm run test-calls`
- Docs-only changes:
    - prefer `pipenv run mkdocs build`
- Blog-only changes:
    - prefer `npm run build-blog`
- Logic changes in `src/ts/modules/` or other runtime code:
    - run `npm run test`

## Repo-Specific Gotchas

- `NamespaceFetcher` may fetch remote user namespaces and user config from GitHub. Tests avoid real network access by mocking `fetch` in `tests/mocks.utils.js`.
- `trovu.config.yml` is optional local override config and may exist in some developer setups without being committed.
- The browser extension under `src/web-ext/` and the Raycast extension under `ext/raycast/` are separate surfaces with their own packaging workflows.
- Prefer the GitHub Actions workflow over the Dockerfile or Makefile when you need the canonical build sequence.
- Do not add commit-blocking hooks in the initial Codex rollout; keep the first safety layer lightweight and command-driven.
