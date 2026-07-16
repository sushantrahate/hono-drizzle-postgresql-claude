# User Management

## Overview

Add the `user` module — the first real feature module in `src/modules/`,
proving out the Clean Architecture / framework-agnostic shape end-to-end
(`types` → `repository` → `repository.drizzle` → `service` → `schema` →
`handler` → `routes` → `test`). Full CRUD: Create, Read (list + by id),
Update, Delete. This module is the reference shape every future module
should copy.

## Requirements

### Endpoints

- `POST /users` — create a user
  - Body: `email` (required, valid email), `name` (optional)
  - Email is lowercased before storage and uniqueness is checked
  - `201` with the created user on success
  - `409` if the email is already registered
- `GET /users` — list all users
  - `200` with an array of users
- `GET /users/:id` — get a single user by id
  - `200` with the user, `404` if not found
- `PATCH /users/:id` — update a user
  - Body: `name` (optional) — no other fields updatable in this pass
  - `200` with the updated user, `404` if the user doesn't exist
- `DELETE /users/:id` — delete a user
  - `200` with no data on success, `404` if the user doesn't exist

### Data model

- Drizzle table `users`: `id (uuid, pk, default random)`, `email (text,
  unique, not null)`, `name (text, nullable)`, `created_at (timestamp,
  default now)`, `updated_at (timestamp, default now, updated on write)`

### Layers (per `context/coding-standards.md`)

- `user.types.ts` — `User`, `CreateUserInput`, `UpdateUserInput` plain
  interfaces
- `user.repository.ts` — interface (port): `findAll`, `findById`,
  `findByEmail`, `create`, `update`, `delete`. TSDoc on every method.
- `user.repository.drizzle.ts` — the only file in this module allowed to
  import `drizzle-orm`; table definition + implementation
- `user.service.ts` — business logic only (email uniqueness on create,
  not-found handling on update/delete), zero Hono/Drizzle imports, TSDoc
  explaining *why* each rule exists
- `user.schema.ts` — `createUserSchema`, `updateUserSchema` (Zod); `update`
  schema has no required fields
- `user.handler.ts` — thin, calls service, every response via
  `unifiedResponse(...)` wrapped in `c.json(...)`, message strings pulled
  from `src/constants/messages.constants.ts` (add `USER_CREATED`,
  `USER_UPDATED`, `USER_DELETED`, `USER_NOT_FOUND`, `EMAIL_ALREADY_IN_USE`
  keys — don't inline new string literals)
- `user.routes.ts` — one-line comment above each route, `@hono/zod-validator`
  wired per route, composition (repository → service → handler) happens here
- `user.test.ts` — Vitest, `service` layer tested against a fake in-memory
  `UserRepository`; cover: create success, create with duplicate email
  (fail), update existing user, update non-existent user (fail), delete
  existing user, delete non-existent user (fail)

### Error handling

- Service throws a typed error (or an `AppError` subclass, matching
  whatever the centralized error-handling middleware already expects) for
  the duplicate-email and not-found cases — don't handle these with ad-hoc
  `if` checks and raw responses in the handler; let the centralized error
  middleware translate the thrown error into the right `unifiedResponse` +
  status code, consistent with how Postgres error codes are already handled

## Notes

- This module must fully comply with `context/coding-standards.md` as
  written today — Response Format (`unifiedResponse` + message constants),
  Comments & Documentation (TSDoc on every exported method, route comments,
  no noise comments), layer boundaries, and Biome formatting/lint clean
- Log meaningful events via `c.var.log` (e.g. a delete/update attempt on a
  non-existent user) — don't add `console.log` anywhere
- No auth/ownership checks in this pass — this module exists to prove the
  Clean Architecture shape, not to be feature-complete; auth is a separate,
  later roadmap item
- Once this lands, update `context/project-overview.md`'s Roadmap —
  "First real feature module (`user`) proving this Clean Architecture shape
  end-to-end" moves from `[ ]` to `[x]`