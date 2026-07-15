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
