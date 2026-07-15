# Coding Standards

## TypeScript

- Strict mode enabled
- No `any` types — use proper typing or `unknown`
- Define interfaces for all inputs, outputs, and data models in `*.types.ts`
- Use type inference where obvious, explicit types where helpful

## Architecture (hexagonal-lite)

- `service.ts` must never import Hono or Drizzle — it depends only on the
  `repository` interface, not the concrete implementation
- `repository.ts` is an interface only (the port) — no implementation code
- `repository.drizzle.ts` is the only file allowed to import Drizzle for that
  module — implements the `repository.ts` interface
- `handler.ts` is the only file allowed to import Hono `Context` for that
  module — thin, no business logic, no DB calls
- `routes.ts` only wires handlers to paths — no logic
- Wiring (which repository implementation gets injected into which service)
  happens once per module, near the routes file or a small composition step —
  not scattered across handlers

## Validation

- All request input validated with Zod in `<feature>.schema.ts` before
  reaching the service layer
- Return validation errors via `unifiedResponse(false, ...)`, never a raw
  thrown Zod error — see Response Format below

## Response Format

- All handler responses use `unifiedResponse(...)` from `uni-response`,
  wrapped directly in `c.json(...)` — no custom response wrapper file
- Signature: `unifiedResponse(success, message, data?, error?, metadata?, extraFields?)`
  — positional, so only pass the params actually needed and stop there
  (don't pass `undefined` placeholders just to reach a later param)
- HTTP status codes are **not** part of the response body — `uni-response` is
  framework-agnostic by design, so status is always the second argument to
  `c.json(...)`, decided by the handler, not embedded in the response shape
- Examples:
  ```ts
  // success with data
  c.json(unifiedResponse(true, 'User created successfully', user), 201)

  // success with no data
  c.json(unifiedResponse(true, 'User deleted successfully'))

  // failure
  c.json(unifiedResponse(false, 'User not found'), 404)
  ```

## Database (Drizzle)

- Table definitions live in `<feature>.repository.drizzle.ts` or a shared
  `src/db/schema/` file if reused across modules
- Always use `drizzle-kit generate` + `drizzle-kit migrate` for schema
  changes — never hand-write migration SQL
- Run `drizzle-kit studio` locally to inspect data, not ad-hoc scripts

## Error Handling

- Services throw typed errors (plain `Error` subclasses is fine — no need for
  a full domain error hierarchy)
- Centralized error middleware translates errors + Postgres error codes
  (e.g. `23505` unique violation) into `unifiedResponse(false, ...)` failure
  shapes
- Handlers never leak raw stack traces or ORM errors to the client

## Naming

- Files: kebab-case, suffixed by role (`user.service.ts`, `user.handler.ts`)
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Types/Interfaces: PascalCase (no `I` prefix)

## Testing

- Vitest, colocated as `<feature>.test.ts` per module
- Test the `service` layer using a fake/in-memory implementation of the
  `repository` interface — no real DB needed
- Don't write tests just to write them; focus on logic with real branching

## Code Quality

- No commented-out code unless specified
- No unused imports or variables
- Keep functions under ~50 lines when possible — split if a file is doing two
  jobs