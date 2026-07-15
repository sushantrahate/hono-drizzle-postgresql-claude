# Current Feature: Biome Setup

## Status

In Progress

## Goals

- Install `@biomejs/biome` as a dev dependency, pinned exact version (`--save-exact`)
- Run `npx @biomejs/biome init` and configure `biome.json`:
  - `formatter`: enabled, 2-space indent, line width 100
  - `linter`: enabled, `recommended` rule set
  - `javascript.formatter`: single quotes, semicolons always
  - `assist.actions.source.organizeImports`: enabled
  - `files.includes`: v2 glob syntax (`**` plus `!**/dist/**`,
    `!**/node_modules/**`, `!**/src/db/migrations/**`, `!**/coverage/**`) —
    not `files.ignore`, which is deprecated in Biome 2.x
- Update `package.json` scripts: `lint` (`biome check .`), `lint:fix`
  (`biome check --write .`), `format` (`biome format --write .`)
- Install `husky` and `lint-staged` as dev dependencies, run `npx husky init`
- Configure `lint-staged` in `package.json`:
  `"**/*.{ts,json}": ["biome check --write --no-errors-on-unmatched"]`
- Wire two Husky hooks:
  - `.husky/pre-commit` → `npx lint-staged`
  - `.husky/pre-push` → `npm run lint && npm run test && npm run build`
- Configure `.vscode/settings.json` for format-on-save via the Biome
  extension (`editor.defaultFormatter: biomejs.biome`, code-actions-on-save)
- Document the lint/format setup in `context/coding-standards.md` and
  `README.md`
- Confirm `npm run lint` and `npm run format` run clean across the existing
  codebase

## Notes

- Biome does not do full type-aware linting — `tsc` (via `build`) already
  catches type-flow issues separately; this is a deliberate trade-off, not
  an oversight
- If a needed lint rule has no Biome equivalent, note it here rather than
  layering in another lint tool alongside Biome
- Infrastructure, not a `modules/` feature — touches `biome.json`,
  `package.json`, `.husky/`, `.vscode/`, `context/coding-standards.md`
- No dependency on other in-flight work — safe to implement independently;
  doing it now (before more modules accumulate) means less to reconcile
  against Biome's formatting opinions later
- lint-staged glob (`**/*.{ts,json}`) doesn't cover `.tsx` — moot today (no
  `.tsx` files exist), but revisit if `hono/jsx` handlers get added, since
  `tsconfig.json` already sets `jsx: "react-jsx"`

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup
- Zod-validated env config (`src/config/env-schema.ts`, `src/config/env.ts`)
- Drizzle + local PostgreSQL Setup — installed drizzle-orm/postgres/drizzle-kit,
  added drizzle.config.ts, src/db/client.ts, src/db/schema/, db:generate/migrate/studio
  scripts, and updated env files, .gitignore, and context docs
- Logging — installed `loglayer` + `@loglayer/transport-simple-pretty-terminal`,
  added `src/config/logger.config.ts` (singleton LogLayer, pretty terminal in
  dev/test, ConsoleTransport in prod), `src/middleware/request-logger.middleware.ts`
  (per-request child logger on `c.var.log`), `src/types/hono.ts` (typed
  `Variables`), replaced `console.log` in `server.ts`, and added optional
  `LOG_LEVEL` to `env-schema.ts`
- Graceful Shutdown — added `src/utils/graceful-shutdown.ts` (`Server` class
  wrapping startup/shutdown), exported the raw `postgres` client from
  `src/db/client.ts` for cleanup, wired `SIGTERM`/`SIGINT` (close HTTP
  server, close DB connection, WS-close placeholder, 10s force-exit
  timeout) and `uncaughtException`/`unhandledRejection` (log + exit
  non-zero, no cleanup) handlers, all logged via the shared `LogLayer`
  instance
- Security Hardening — added `hono/secure-headers` (explicit CSP
  `default-src 'self'`, `xFrameOptions: DENY`, `xContentTypeOptions: nosniff`,
  `referrerPolicy: no-referrer`, HSTS in production only), `hono/cors`
  restricted to an `ALLOWED_ORIGINS` allow-list, server-side Host-header
  whitelisting via `src/middleware/host-whitelist.middleware.ts` and
  `ALLOWED_HOSTS` (separate from CORS, mounted first, case-insensitive
  match), IP-based rate limiting via `hono-rate-limiter`
  (`src/middleware/rate-limiter.middleware.ts`, `createRateLimiter` factory
  for future stricter per-route limiters) with a `TRUST_PROXY` env flag
  gating whether `X-Forwarded-For` is trusted, a 1MB `hono/body-limit`, and a
  10s `hono/timeout`. All rejections (host mismatch, rate limit, oversized
  body) log via the shared `log` instance and return `unifiedResponse`-shaped
  bodies. Thresholds live in `src/config/security.config.ts`. Centralized
  error-handling middleware, the Husky/`npm audit` pre-push hook, and unit
  tests were out of scope (repo has no error middleware, no Husky/lint/test
  scripts, and no Vitest installed yet) — left as follow-ups for their own
  passes.
- Vitest Setup — installed `vitest` + `@vitest/coverage-v8`, added
  `vitest.config.ts` (node environment, explicit globals, v8 coverage
  excluding types/routes/migrations/config files, `passWithNoTests` so an
  empty suite doesn't fail CI/pre-push), and `test`/`test:watch`/
  `test:coverage` npm scripts. Added a `@/*` -> `src/*` path alias to
  `tsconfig.json` (didn't exist previously) resolved via
  `vite-tsconfig-paths` — Vite's native `resolve.tsconfigPaths` is still
  experimental and failed to resolve aliases in this Vite 8/Vitest 4 setup.
  Added `tsconfig.build.json` so `npm run build` excludes `*.test.ts` from
  `dist` (excluding test files from the base tsconfig broke alias
  resolution for Vitest). Added a smoke test
  (`src/config/security.config.test.ts`) proving the runner and alias work
  end-to-end, since no `user` module exists yet to test directly.
- Error Handling Middleware — added `src/errors/app-error.ts` (framework-
  agnostic `AppError` base + `NotFoundError`/`ConflictError`/
  `ValidationError`/`UnauthorizedError` subclasses, plain `number`
  `statusCode` so `service.ts` files can throw these without importing
  Hono), and `src/middleware/error-handler.middleware.ts` exporting
  `errorHandler` (wired via `app.onError`, not `app.use`) and
  `notFoundHandler` (wired via `app.notFound`). Mapping order: `AppError`
  subclass → its status/message; `postgres.PostgresError` `23505` (unique
  violation) → 409 via a lookup table structured for more codes later;
  `HTTPException` → `.getResponse()`; anything else → logged via
  `c.var.log.withError(...)` and a generic 500 that never leaks the real
  error. Both wired near the bottom of `app.ts` with a comment noting
  they're global fallbacks outside the numbered middleware pipeline. Added
  `src/middleware/error-handler.middleware.test.ts` covering all branches
  including the unmapped-Postgres-code fallthrough; discovered along the
  way that `postgres`'s TS types only expose the inherited
  `Error(message?, options?)` constructor (not the driver's real
  object-literal constructor), invisible to `npm run build` since
  `tsconfig.build.json` excludes test files and Vitest doesn't type-check —
  worked around with a small `buildPostgresError(code, message)` test
  helper. Unblocks the upcoming user-module CRUD feature.
