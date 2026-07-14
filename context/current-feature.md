# Current Feature: Graceful Shutdown

## Status

In Progress

## Goals

- Wrap server startup/shutdown in a small `Server` class (or module-level
  functions if simpler) in `src/server.ts` so logic is grouped, not scattered
- On `SIGTERM`/`SIGINT`:
  - Stop accepting new connections via `server.close()` on the instance
    returned by `@hono/node-server`'s `serve()`
  - Close the `postgres.js` connection (`client.end()`) — export the raw
    `postgres` client instance from `src/db/client.ts` so it can be closed,
    not just the wrapped `db` object
  - Close WebSocket connections **if any exist** — no WS setup exists yet,
    so this must be a clearly-marked placeholder function, not dead code
  - Force-exit after a 10s timeout if shutdown hangs — log clearly whether
    the timeout path or a clean shutdown was hit
- On `uncaughtException`/`unhandledRejection`: log with context and exit
  non-zero — no graceful cleanup attempt (process state unreliable)
- Use the shared `LogLayer` instance from `src/config/logger.config.ts` for
  all shutdown/startup output — no `console.log`/`console.error` in
  `server.ts`
- Must not break `npm run dev` — nodemon restarts should still trigger a
  clean shutdown+restart, not hang

## Notes

- No WebSocket implementation exists yet — keep that piece an intentional
  placeholder referenced in a comment, not implemented logic
- `env.PORT` is already validated via `env-schema.ts` — don't re-parse or
  add a fallback like `Number(env.PORT) || 4000`; confirm this matches
  whatever committed `PORT` default lands from the separate, currently
  uncommitted PORT changes (`.env.example`, `env-schema.ts`, `server.ts`)
- Depends on the already-implemented logging feature for
  `src/config/logger.config.ts` — import the shared `log` instance directly,
  don't create a second logger instance
- This is infrastructure, not a `modules/` feature — lives in
  `src/server.ts` and possibly a new `src/utils/graceful-shutdown.ts`, not
  under `src/modules/`

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
