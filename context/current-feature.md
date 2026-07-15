# Current Feature: Security Hardening

## Status

In Progress

## Goals

- Secure headers via `hono/secure-headers` in `app.ts`, configured explicitly:
  `contentSecurityPolicy` (default-src 'self'), `xFrameOptions: 'DENY'`,
  `xContentTypeOptions: 'nosniff'`, `referrerPolicy: 'no-referrer'`,
  `strictTransportSecurity` enabled in production only
- Rate limiting via `hono-rate-limiter`: global default limiter in `app.ts`
  (e.g. 100 req / 15 min per IP) plus support for stricter per-route limiters
  (e.g. future auth/login endpoints)
  - Correctly identify client IP behind a reverse proxy (trust
    `X-Forwarded-For` appropriately); document the trust-proxy consideration
    even though local dev doesn't need it yet
  - Rejections return a `unifiedResponse(false, ...)`-shaped 429, not the
    package's default error body
- CORS via `hono/cors` restricted to an explicit allow-list (no `origin: '*'`)
  - Add `ALLOWED_ORIGINS` (comma-separated list of http(s) URLs) to
    `env-schema.ts` using the existing `commaSeparatedList` pattern
- Host whitelisting (separate from CORS, enforced server-side):
  - Add `ALLOWED_HOSTS` (comma-separated host *names*, not URLs) to
    `env-schema.ts` with its own `commaSeparatedList` transform
  - Add `src/middleware/host-whitelist.middleware.ts`: reads incoming `Host`
    header, rejects with `unifiedResponse(false, 'Host not allowed')` + 403 if
    it doesn't exactly match an entry in `ALLOWED_HOSTS`
  - Mount early in `app.ts`, before CORS and rate limiting
  - Log rejections via the shared `log` instance with the offending Host value
- Request body size limit via `hono/body-limit` (e.g. 1MB default)
- Request timeout via `hono/timeout` so a hung handler/DB query can't hold a
  connection open indefinitely
## Notes

- Depends on `uni-response` being installed — rate-limit rejections,
  host-mismatch rejections, and error responses should all use
  `unifiedResponse(...)` directly (see `context/coding-standards.md` →
  Response Format), wrapped in `c.json(...)`. No custom wrapper file — call
  `unifiedResponse` directly in middleware, same as handlers do.
- JSON API only, no server-rendered HTML and no cookie-based sessions yet, so
  CSRF protection (`hono/csrf`) is **not** included in this pass — revisit if
  cookie-based auth is added later
- Depends on the logging feature (already implemented) for logging rejected
  requests (rate-limited, host-mismatched, oversized body) with useful
  context — use the shared `log` instance, not `console.log`
- This is infrastructure, not a `modules/` feature — lives in `src/app.ts`,
  `src/middleware/`, and `src/config/`, not under `src/modules/`
- Keep all thresholds (rate limit window/max, body size limit, timeout
  duration) as named constants or env-driven values, not magic numbers buried
  in `app.ts`
- **Out of scope for this pass** (repo doesn't have the prerequisites yet,
  confirmed with user):
  - Centralized error-handling middleware doesn't exist at all yet (no
    `onError`/`HTTPException` handling anywhere in `src/`) — needs its own
    feature pass before "confirm it strips stack traces" makes sense
  - `npm audit` in a Husky pre-push hook — repo has no Husky, no `lint`
    script, no `test` script configured despite CLAUDE.md referencing them;
    bootstrapping that tooling is out of scope for security middleware
  - Unit tests for this feature's logic (`commaSeparatedList`/`ALLOWED_ORIGINS`
    parsing in `env-schema.ts`, host-matching in `host-whitelist.middleware.ts`,
    trust-proxy IP resolution in `rate-limiter.middleware.ts`) — Vitest isn't
    installed and no `test` script exists anywhere in the repo yet (confirmed
    no other feature has `.test.ts` files either); needs its own tooling
    bootstrap pass before any feature can have unit tests. Verified manually
    via curl instead (see `/feature review` and `/feature explain` history for
    the full list of cases exercised: valid/invalid Host, case-insensitive
    Host, CORS allow/deny, oversized body, rate-limit headers).

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
