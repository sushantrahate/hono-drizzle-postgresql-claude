# Logging

## Overview

Add structured logging via [LogLayer](https://loglayer.dev), replacing ad-hoc
`console.log`/`console.error` calls across the codebase (including
`server.ts`'s graceful shutdown logging). LogLayer has a native Hono
integration and is transport-agnostic, so this stays Pino-free — dev output
uses LogLayer's built-in pretty terminal transport, production uses its
console/JSON transport. No logging *library* lock-in: if we ever want to
swap the underlying transport (Pino, Winston, Datadog, etc.) later, the
`log.info()`/`log.error()` call sites in the rest of the codebase never
change.

## Requirements

- Install `loglayer` and `@loglayer/transport-simple-pretty-terminal`
  (dev-only pretty console output, no Pino dependency)
- Create `src/config/logger.config.ts` exporting a single shared `LogLayer`
  instance:
  - `development`/`test`: use `getSimplePrettyTerminal()` — colorized,
    readable terminal output
  - `production`: use the built-in `ConsoleTransport` — plain
    structured/JSON-friendly output for log aggregators
  - Toggle between the two via `enabled: process.env.NODE_ENV === '...'`
    on each transport, matching the pattern in LogLayer's own docs
  - Log level driven by `LOG_LEVEL` env var where the transport supports it
- Create `src/middleware/request-logger.middleware.ts` — a Hono middleware
  (via `createMiddleware` from `hono/factory`) that:
  - Creates a child logger per request using `log.child().withContext({...})`
    with `reqId` (generated via `crypto.randomUUID()`), `method`, and `path`
  - Sets it on the context: `c.set('log', childLog)`
  - Logs request completion (status code, duration in ms) after `await next()`
  - Mount this early in the middleware chain in `app.ts`
- Extend Hono's `Variables` type so `c.get('log')` / `c.var.log` is fully
  typed inside handlers — define this alongside the app's `Hono<{ Variables
  }>` generic in `app.ts` (or a shared `src/types/hono.ts` if it grows)
- Use `c.var.log` inside handlers/middleware wherever request-scoped
  logging is needed (e.g. inside an error-handling middleware)
- Replace `console.log`/`console.error` calls in `src/server.ts` (including
  the graceful shutdown logic from the graceful-shutdown feature, if already
  implemented) with the shared logger instance from `logger.config.ts`
  directly (no request context available there)
- Add `LOG_LEVEL` as an optional env var in `env-schema.ts`
  (`z.enum(['fatal','error','warn','info','debug','trace']).optional()`)

## Notes

- Do not add Pino, Winston, or any other logging library as a dependency —
  LogLayer's built-in transports (`ConsoleTransport`,
  `@loglayer/transport-simple-pretty-terminal`) cover dev and prod needs
  without one. Adding an underlying transport library is a future option,
  not a requirement, and should only happen if a real need (e.g. shipping
  logs to Datadog) shows up later.
- Keep the shared `LogLayer` instance in `src/config/logger.config.ts` a
  singleton — don't instantiate multiple `LogLayer` instances across the
  codebase
- This is infrastructure, not a `modules/` feature — lives in `src/config/`
  and `src/middleware/`, not under `src/modules/`
- Should not log full request bodies by default (risk of logging
  passwords/tokens/PII) — log method/path/status/duration only unless a
  specific route opts in to more verbose logging later
- Depends conceptually on the graceful-shutdown feature for full effect
  (that feature's `console.log` calls should switch to this logger once
  both exist) but can be implemented independently — order doesn't block
  either feature