# Vitest Setup

## Overview

Add Vitest as the test runner for the boilerplate, configured to match this
project's TypeScript path aliases (`@/*`) and hexagonal-lite testing
convention (test the `service` layer against a fake/in-memory `repository`,
no real DB). `npm run test` already exists as a script but Vitest itself and
its config have not actually been set up yet.

## Requirements

- Install `vitest` and `@vitest/coverage-v8` (dev dependencies)
- Create `vitest.config.ts` at the project root:
  - Resolve the `@/*` path alias to `src/*`, matching `tsconfig.json`
    (use `vite-tsconfig-paths` or manually mirror the `resolve.alias` entry
    — pick whichever keeps a single source of truth for the alias, don't
    hand-maintain the same mapping in two files if avoidable)
  - `test.globals: false` — keep `describe`/`it`/`expect` as explicit
    imports rather than injected globals, consistent with this project's
    "no implicit magic" preference elsewhere (e.g. explicit Zod validation
    over implicit type coercion)
  - `test.environment: 'node'` — this is a backend API, no DOM needed
  - `test.coverage` config: provider `v8`, reporter `['text', 'html']`,
    exclude `*.types.ts`, `*.routes.ts`, `db/migrations/**`, and config
    files from coverage — these are either pure type declarations or thin
    wiring with nothing meaningful to unit test
- Update `package.json` scripts:
  ```json
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
  ```
  (`test` should run once and exit — needed for the Husky pre-push hook and
  CI; `test:watch` is the interactive dev-loop command)
- Add a first real test to prove the setup works end-to-end: if the `user`
  module exists by the time this is implemented, add/verify
  `user.service.test.ts` using a fake `UserRepository`; otherwise create a
  minimal smoke test (e.g. a trivial pure function) just to confirm Vitest
  itself runs and the `@/*` alias resolves correctly
- Confirm `npm run test` passes and exits 0 with no test files present
  edge case handled gracefully (don't let Vitest error out on an empty
  suite during early setup)

## Notes

- Test files are colocated as `<feature>.test.ts` inside each module
  (`src/modules/<feature>/`), not in a separate top-level `__tests__/`
  directory — matches `context/coding-standards.md`
- Only the `service` layer gets unit tests against a fake `repository` per
  our standards — don't scaffold `handler`/`routes` integration tests as
  part of this setup feature; that's a separate, later decision if this
  project ever wants request-level tests (Hono supports `app.request()`
  for that, worth a future feature spec, not this one)
- This is infrastructure, not a `modules/` feature — lives at the project
  root (`vitest.config.ts`) and `package.json`, not under `src/modules/`
- Depends on nothing else already built — safe to implement independently
  of logging/graceful-shutdown/security/uni-response