# Current Feature: Error Handling Middleware

## Status

In Progress

## Goals

- Add `src/errors/app-error.ts` — typed error hierarchy: `AppError` (base,
  carries `statusCode`/`message`), `NotFoundError` (404), `ConflictError`
  (409), `ValidationError` (400), `UnauthorizedError` (401, unused for now)
- Add `src/middleware/error-handler.middleware.ts`, wired via
  `app.onError(...)` in `app.ts` (not `app.use(...)`)
- Mapping order in the error handler:
  1. `AppError` (or subclass) → `unifiedResponse(false, error.message)` with
     `error.statusCode`
  2. `PostgresError` (from the `postgres` driver) → map `23505` (unique
     violation) to 409 conflict, structured so more codes can be added later
  3. `HTTPException` (already used for the 504 timeout) → pass through
     `error.getResponse()`
  4. Anything else → log full error server-side via `c.var.log.error(...)`,
     return generic `unifiedResponse(false, 'Internal server error')` 500 —
     never leak the real error/stack
- Add `app.notFound(...)` in `app.ts` → `unifiedResponse(false, 'Not found')`
  404
- Wire `app.onError(errorHandler)` and `app.notFound(notFoundHandler)` near
  the bottom of `app.ts`, before `export default app;`, with a comment
  noting they're global fallbacks, not pipeline stages
- Add `src/middleware/error-handler.middleware.test.ts` — minimal Hono app
  with the handler wired, routes throwing each error type (`AppError`
  subclass, `PostgresError`-shaped with `code: '23505'`, generic `Error`,
  `HTTPException`), asserting status + `unifiedResponse` body shape for each
  branch, plus an undefined-route 404 case

## Notes

- Shared infra (not a `modules/` feature) — lives in `src/errors/`,
  `src/middleware/`, `src/app.ts`
- Depends on `uni-response` and `c.var.log` (both already in place)
- Import `PostgresError` from `postgres` (driver already installed) — don't
  redefine it
- Blocks the upcoming user-module CRUD feature — its service/repository
  layer will throw `NotFoundError`/`ConflictError` and expects this
  middleware to translate them, keeping `user.handler.ts` free of try/catch
- Out of scope: ESLint/Prettier/Husky setup, auth-specific error handling
  beyond having `UnauthorizedError` available

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
