# Current Feature

## Status

Not Started

## Goals

<!-- Bullet points of what success looks like -->

## Notes

<!-- Additional context, constraints, or details from spec -->

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
- Biome Setup — installed `@biomejs/biome` 2.5.4 (exact) as the single
  lint+format tool; added `biome.json` (2-space/100-width formatter, single
  quotes, `recommended` lint preset, `organizeImports` assist, `files.includes`
  v2 glob syntax excluding `dist/`, `src/db/migrations/`, `.claude/`, with
  `vcs.useIgnoreFile` covering `coverage/`/`node_modules` automatically via
  `.gitignore`); added `lint`/`lint:fix`/`format` npm scripts. Installed
  `husky` + `lint-staged`, wired `.husky/pre-commit` (`npx lint-staged` on
  staged `*.ts`/`*.json`) and `.husky/pre-push` (`lint && test && build`).
  Added `.vscode/settings.json` (format-on-save, code-actions-on-save) and
  `.vscode/extensions.json` (recommends the Biome extension) — discovered
  along the way that `.gitignore`'s blanket `.vscode/*` rule was silently
  swallowing both files, so added explicit `!.vscode/settings.json` /
  `!.vscode/extensions.json` exceptions. Added `.gitattributes`
  (`* text=auto eol=lf`) to normalize line endings, since the repo had no
  line-ending policy and Windows CRLF checkouts fought Biome's LF-default
  formatter. Fixed two real lint findings surfaced by the new linter: `fs` →
  `node:fs` (`useNodejsImportProtocol`) in `drizzle.config.ts`/`env.ts`, and
  a documented `biome-ignore` on the one legitimate `noNonNullAssertion`
  (`DATABASE_URL!` in `drizzle.config.ts`). Documented in
  `coding-standards.md` (new "Lint & Format" section) and `README.md`
  (Scripts table). `npm run lint`, `format`, `build`, and `test` all verified
  clean before merge.
- `code-reviewer` subagent — added `.claude/agents/code-reviewer.md`
  (Read/Grep/Glob only, no edits) for a fresh-eyes review pass after
  implementing/editing code or before committing. Checks, in priority
  order: layer-boundary violations, response-format compliance,
  documentation, error handling, validation, testing, general code
  quality, and a light security pass, judged against this project's own
  `coding-standards.md`/`project-overview.md` rules rather than generic
  best practices. Documented in `project-overview.md` (Development
  Workflow) and `README.md` (AI-Assisted Feature Workflow).
- User Management — added `src/modules/user/` as the first real feature
  module, proving the `types` → `repository` (port) →
  `repository.drizzle` (adapter) → `service` → `schema` → `handler` →
  `routes` shape end-to-end with full CRUD (`POST/GET/GET :id/PATCH/DELETE
  /users`). Email uniqueness (create) and existence checks
  (get/update/delete) are enforced in `user.service.ts` and surfaced as
  `ConflictError`/`NotFoundError`, handled entirely by the existing
  centralized error middleware — no ad-hoc response shaping in the
  handler. Added `USER_CREATED`/`USERS_RETRIEVED`/`USER_RETRIEVED`/
  `USER_UPDATED`/`USER_DELETED`/`USER_NOT_FOUND`/`EMAIL_ALREADY_IN_USE` to
  `messages.constants.ts`. Widened `drizzle.config.ts`'s `schema` glob to
  also scan `src/modules/**/*.repository.drizzle.ts` (previously only
  `src/db/schema/*`), since per-module tables live inside the module
  itself, not the shared schema folder — without this, `drizzle-kit
  generate` silently would never have found the new `users` table. Since
  `user.handler.ts`'s methods are class properties rather than inline
  route lambdas, Hono can't auto-infer `c.req.valid(...)` types from
  `routes.ts`'s `zValidator` calls, so two small local type aliases
  (`JsonBody<S>`, `ParamValues<S>`) reconstruct just the `out` half of
  `@hono/zod-validator`'s `Input` shape (verified against Hono's actual
  `Context.req` typing that `in` is never consumed) to keep every handler
  fully typed with no `any`. Live-tested the full CRUD flow with curl
  against a local Postgres after `db:migrate`, which caught a real bug:
  `updated_at` was stamped with `new Date()` (Node's clock) while
  `created_at` used Postgres's `defaultNow()`, so any drift between the
  app-server and DB clocks could produce an `updated_at` earlier than
  `created_at` — fixed by stamping `updatedAt` with `sql\`now()\`` instead,
  so both columns share one authoritative clock. 15 Vitest tests (service
  layer against a fake in-memory `UserRepository`) plus the live smoke
  test all passed; `build`/`lint`/`test` clean. Also added **📖 API
  Endpoints**, **📂 Project Structure**, and **📌 Layer-by-Layer
  Breakdown** sections to `README.md`, and flipped
  `project-overview.md`'s roadmap checkbox for this module to `[x]`. A
  small unrelated pre-existing "hexagonal-lite" → "Clean Architecture"
  terminology rename (`CLAUDE.md`, `README.md`, `coding-standards.md`)
  that predated this feature was committed separately first, to keep it
  out of this feature's commit.
- Health Check API — added `src/modules/health/` following the same
  `types` → `repository` (port) → `repository.drizzle` (adapter) →
  `service` → `handler` → `routes` shape as the `user` module, minus a
  `schema.ts` since `GET /health` takes no input. `DrizzleHealthRepository`
  checks connectivity with a trivial `select 1`; `HealthService` combines
  that into an overall `status`/`database` (`'ok' | 'error'`) plus
  `uptime`/`timestamp`, all via `unifiedResponse(...)` — 200 when the DB
  is reachable, 503 when it isn't. Mounted at `/health` in `app.ts` inside
  the normal middleware pipeline (no bypass of rate limiting or host
  whitelist, since this is an internal-network check, not a public uptime
  endpoint). Added `HEALTH_CHECK_OK`/`HEALTH_CHECK_FAILED` to
  `messages.constants.ts`, and **Health** coverage to `README.md`'s
  Project Structure and API Endpoints sections. The `code-reviewer`
  subagent caught two real issues, both fixed: `checkDatabase()` was
  swallowing the actual DB error (timeout/auth-failure/connection-refused
  all looked identical as a bare `false`) — now logs it via the shared
  `log` singleton before returning `false`; and `HealthService.getStatus()`
  computed `status` and `database` from the same ternary twice — now
  computed once, with a comment noting they're intentionally separate
  fields in anticipation of future multi-dependency checks. Added
  `health.test.ts` (service layer against a fake in-memory
  `HealthRepository`, ok/error paths). Live-tested with curl against a
  local Postgres — `GET /health` returned 200 with real `uptime`/
  `database: "ok"`. Along the way, discovered `npm run test`'s default
  Vitest "threads" pool is intermittently flaky on this Windows machine
  (an import-time race that fails all suites at once with `Cannot read
  properties of undefined (reading 'config')`, unrelated to any file's
  actual content) — confirmed as pre-existing and out of scope for this
  feature (`--pool=forks` and plain re-runs both pass reliably); left as
  a follow-up if it recurs. `build`/`lint`/`test` all clean before merge.
- VSCode Debugger Setup — added `.vscode/launch.json` with four configs:
  `Debug Server` (one-shot, `node --import tsx src/server.ts`, no
  `restart` so it doesn't silently relaunch on exit), `Attach: Dev Server
  (watch)` (attaches on port `9229` to a new `dev:debug` npm script —
  `tsx watch --inspect` — with `restart: true` so it reattaches every
  time `--watch` restarts the process), and `Debug Current Test File` /
  `Debug All Tests` (both point `program` directly at
  `node_modules/vitest/vitest.mjs` rather than the `vitest` bin, since
  VS Code's Node debugger can't reliably resolve npm bin shims —
  `.cmd` wrappers on Windows — across platforms). No changes needed to
  `.gitignore`'s `.vscode/*` rule — the `!.vscode/launch.json` exception
  was already in place from a prior feature. Documented in a new
  "🐞 Debugging in VS Code" section in `README.md` (plus a `dev:debug`
  Scripts row and a Features-list bullet) and cross-referenced from
  `project-overview.md`'s Infrastructure section. The `code-reviewer`
  subagent caught several real issues, all fixed: `restart: true` had
  been set on the one-shot launch config too, which would have made
  VS Code silently relaunch the server on any exit (crash *or* graceful
  shutdown) instead of ending the debug session as the config's own
  description promised — removed, kept only on the attach config where
  it's actually needed; two comments restated each config's `name`
  instead of explaining "why" — replaced with real reasoning or
  dropped; and inconsistent `VSCode`/`VS Code` spelling was normalized
  to match the existing `VS Code` usage elsewhere in the README.
  Smoke-tested both the `node --import tsx` launch command and the
  `vitest.mjs` direct-invocation command manually (outside the VS Code
  UI, which isn't scriptable) before and after the fixes; `build`/
  `lint`/`test` all clean, including confirming Biome parses the JSONC
  comments in `launch.json` without complaint.
