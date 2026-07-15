# Graceful Shutdown

## Overview

Add graceful shutdown handling to `src/server.ts` so the process cleans up
properly on deploy restarts, container stops, and crashes instead of dropping
connections or leaving the DB pool open. Uses `@hono/node-server`'s returned
server instance and the `postgres.js` client from `src/db/client.ts`.

## Requirements

- Wrap server startup in a small `Server` class (or equivalent module-level
  functions if a class feels like overkill — use judgement) so
  start/shutdown logic is grouped, not scattered across `server.ts`
- On `SIGTERM` and `SIGINT`:
  - Stop accepting new connections (`server.close()` on the instance
    returned by `@hono/node-server`'s `serve()`)
  - Close the `postgres.js` connection used by Drizzle (`client.end()` from
    `src/db/client.ts`) — export the raw `postgres` client instance from
    `db/client.ts` so it can be closed, not just the wrapped `db` object
  - Close WebSocket connections **if any exist** — this boilerplate has no
    WebSocket setup yet, so this should be a clearly-marked placeholder
    function, not dead code pretending to do something
  - Force-exit after a timeout (10s) if shutdown hangs — log clearly when
    this timeout path is hit vs a clean shutdown
- On `uncaughtException` and `unhandledRejection`:
  - Log the error with context
  - Exit with a non-zero code (don't attempt graceful cleanup here — the
    process state is already unreliable at this point, per Node's own
    guidance)
- Use the shared `LogLayer` instance from `src/config/logger.config.ts`
  (`log.info(...)` / `log.error(...)`) for all shutdown/startup output —
  the logging feature is already implemented (`feature/logging`), so this
  is a hard requirement now, not a fallback. No `console.log`/`console.error`
  anywhere in `server.ts`.
- Must not break existing `npm run dev` (nodemon restarts should still
  trigger a clean shutdown+restart cycle, not hang)

## Notes

- No WebSocket implementation exists yet — keep that piece as an
  intentional placeholder, referenced in a comment, not implemented logic
- `env.PORT` is already validated via `env-schema.ts`, no need to re-parse
  or fallback with `Number(env.PORT) || 4000` — the schema guarantees a
  valid number already. Confirm this matches whatever `PORT` default ends
  up committed from the separate, currently-uncommitted PORT changes
  (`.env.example`, `env-schema.ts`, `server.ts`) — don't reintroduce a
  stale hardcoded fallback that conflicts with that change once it lands.
- Depends on the logging feature (`feature/logging`, already implemented)
  for `src/config/logger.config.ts` to exist — import the shared `log`
  instance from there directly in `server.ts`, don't create a second
  logger instance
- This is infrastructure, not a `modules/` feature — lives in `src/server.ts`
  and possibly a new `src/utils/graceful-shutdown.ts`, not under
  `src/modules/`

## Known limitation: `npm run dev` on Windows

`tsx watch` relays Ctrl+C to its child via `child.kill()`, which Windows
can't deliver as a real signal — so our handler never fires and no shutdown
logs print. Confirmed via direct `npx tsx src/server.ts` (no watch wrapper),
which works fine. Not a bug; unaffected in production (`npm run start`,
Docker/Linux).