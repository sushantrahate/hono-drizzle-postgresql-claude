# Biome Setup

## Overview

Add [Biome](https://biomejs.dev) as the lint + format tool for the
boilerplate. One Rust-based engine owns both concerns, keeping lint/format
fast and consistent — relevant since this runs on every commit/push via
Husky.

## Requirements

- Install `@biomejs/biome` as a dev dependency, pinned exact version
  (`--save-exact`)
- Run `npx @biomejs/biome init` and configure `biome.json`:
  - `formatter`: enabled, 2-space indent, line width 100
  - `linter`: enabled, `recommended` rule set
  - `javascript.formatter`: single quotes, semicolons always — matching
    this project's existing style conventions
  - `assist.actions.source.organizeImports`: enabled — reinforces the
    "no unused imports" rule in `coding-standards.md`
  - `files.includes`: use the v2 include/exclude glob syntax (`files.ignore`
    is deprecated in Biome 2.x), negating generated/output paths that
    shouldn't be linted/formatted:
    ```json
    "files": {
      "includes": [
        "**",
        "!**/dist/**",
        "!**/node_modules/**",
        "!**/src/db/migrations/**",
        "!**/coverage/**"
      ]
    }
    ```
    (`coverage/**` mirrors `.gitignore` — vitest's v8 provider writes
    `html`/`json` reports there via `test:coverage`, and those generated
    files shouldn't be linted either)
- Update `package.json` scripts:
  ```json
  "lint": "biome check .",
  "lint:fix": "biome check --write .",
  "format": "biome format --write ."
  ```
- Install `husky` and `lint-staged` as dev dependencies, then run
  `npx husky init` to scaffold `.husky/`
- Configure `lint-staged` in `package.json`:
  ```json
  "lint-staged": {
    "**/*.{ts,json}": ["biome check --write --no-errors-on-unmatched"]
  }
  ```
  (glob currently only needs `ts`/`json` — no `.tsx` files exist yet, but
  revisit if `hono/jsx` handlers are added later, since `tsconfig.json`
  already sets `jsx: "react-jsx"`)
- Wire two Husky hooks (`lint-staged` config is inert without a hook that
  invokes it):
  - `.husky/pre-commit` → `npx lint-staged`
  - `.husky/pre-push` → `npm run lint && npm run test && npm run build`
    (`biome check` already covers formatting, so a separate `format` step
    in the chain is redundant)
- Configure `.vscode/settings.json` for format-on-save via the Biome
  extension (`"editor.defaultFormatter": "biomejs.biome"`, Biome enabled as
  the code-actions-on-save formatter)
- Document the lint/format setup in `context/coding-standards.md` and
  `README.md`
- Confirm `npm run lint` and `npm run format` run clean across the existing
  codebase

## Notes

- Biome does **not** do full type-aware linting (rules that need actual
  type information, not just AST shape) — this project already runs
  `tsc`/`tsc-alias` as part of `build`, which catches the practically
  important type-flow issues separately. Accepting this trade-off
  deliberately for the speed/simplicity gain, not an oversight.
- If a specific lint rule this project needs turns out to have no Biome
  equivalent and matters in practice, note it here rather than silently
  layering in another lint tool alongside Biome — two overlapping lint
  tools reintroduces the exact config-conflict problem Biome exists to avoid
- This is infrastructure, not a `modules/` feature — touches root config
  files (`biome.json`, `package.json`, `.husky/`, `.vscode/`) and
  `context/coding-standards.md`, not `src/modules/`
- Depends on nothing else already built — safe to implement independently,
  though doing it early (before more modules/files accumulate) means less
  to reconcile against Biome's formatting opinions in one pass