# Error Handling Middleware

## Overview

Add a centralized, global error boundary so every module's `handler.ts` can
stay thin per `coding-standards.md` (no per-route try/catch, no business
logic). Thrown service/repository errors and Postgres errors get mapped to
consistent `unifiedResponse(false, ...)` failure shapes, and the client never
sees a raw stack trace or ORM error. This was scoped out of the
security-hardening pass and is a prerequisite for the upcoming user-module
CRUD API — its service/repository layer will throw typed errors and expects
this middleware to translate them.

## Requirements

### Typed error classes

- New `src/errors/app-error.ts` — a minimal hierarchy, per
  `coding-standards.md` ("plain `Error` subclasses is fine — no need for a
  full domain error hierarchy"):
  - `AppError` (base) — carries a `statusCode` and `message`
  - `NotFoundError` (404)
  - `ConflictError` (409) — e.g. duplicate email/unique-constraint conflicts
    surfaced at the service layer
  - `ValidationError` (400) — for validation failures outside Zod's
    request-body schema validation (e.g. cross-field business rules checked
    in `service.ts`)
  - `UnauthorizedError` (401) — not used yet, but needed once auth lands so
    services don't need a second error-handling pass added later
- These are shared infra, not feature-specific — live outside `modules/`,
  the same way `src/db/schema/` is called out as shared-across-modules in
  `project-overview.md`

### Global error handler

- New `src/middleware/error-handler.middleware.ts`, wired via
  `app.onError(...)` in `app.ts` — **not** `app.use(...)`, since Hono's error
  boundary is a separate mechanism from the middleware pipeline and doesn't
  need a pipeline-order comment
- Mapping, in order:
  1. `error instanceof AppError` (or a subclass) → `c.json(unifiedResponse(false, error.message), error.statusCode)`
  2. `error instanceof PostgresError` (exported by the `postgres` driver
     already in use — it extends `Error` and carries a `.code` field
     matching the Postgres SQLSTATE code) — map `23505` (unique violation) to
     409 conflict; structure the mapping so more codes can be added later
     without pre-building handling for codes not yet needed
  3. `error instanceof HTTPException` (already used for the existing 504
     timeout in `app.ts`) → pass through `error.getResponse()`
  4. Anything else (unexpected/unknown error) → log the full error
     server-side via `c.var.log.error(...)`, return a generic
     `c.json(unifiedResponse(false, 'Internal server error'), 500)` — never
     the real error message or stack

### 404 handling

- Add `app.notFound(...)` in `app.ts` for requests that don't match any
  route — currently they fall through to Hono's default response
- Returns `c.json(unifiedResponse(false, 'Not found'), 404)`

### Wiring in `app.ts`

- Add `app.onError(errorHandler)` and `app.notFound(notFoundHandler)` near
  the bottom of `app.ts`, before `export default app;`
- These aren't part of the numbered `app.use(...)` pipeline-order comments
  already in the file — add a short comment noting they're global fallbacks,
  not pipeline stages, so a future reader doesn't try to reason about their
  position relative to the numbered list

### Tests

- New `src/middleware/error-handler.middleware.test.ts` — per
  `coding-standards.md`'s testing guidance ("focus on logic with real
  branching"), this mapping logic qualifies
- Spin up a minimal Hono app with the error handler wired and a few routes
  that each throw a different error type (an `AppError` subclass, a
  `PostgresError`-shaped error with `code: '23505'`, a generic `Error`, and
  an `HTTPException`); assert the response status and `unifiedResponse` body
  shape for each branch
- Also assert an undefined route returns the `404` `unifiedResponse` shape

## Notes

- Depends on `uni-response` (already installed) and the logging feature
  (already implemented) for `c.var.log`
- Depends on the `postgres` driver's exported `PostgresError` class
  (confirmed present in `node_modules/postgres/types/index.d.ts`) — import it
  from `postgres`, don't redefine it
- This is infrastructure, not a `modules/` feature — lives in
  `src/errors/`, `src/middleware/`, and `src/app.ts`
- Blocks the next feature (user module CRUD, no auth) — its
  `user.service.ts` will throw `NotFoundError`/`ConflictError` and rely on
  this middleware to shape the HTTP response, keeping `user.handler.ts` free
  of try/catch
- Out of scope: ESLint/Prettier/Husky setup (deferred to its own future
  feature spec), and any auth-specific error handling beyond having
  `UnauthorizedError` available for later use
