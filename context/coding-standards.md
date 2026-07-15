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

## Comments & Documentation

**No file is exempt.** Every file — including infrastructure/wiring files
like `app.ts`, `server.ts`, and `config/*.ts` — must be understandable to
someone reading it top to bottom with zero prior context. If a reviewer has
to ask "what does this block do" or "why is this here," that's a missing
comment, not an acceptable gap.

### Exported functions / methods

TSDoc comment (`/** ... */`) on every exported function, service method,
repository interface method, and handler method — types describe the
*shape* of data, comments describe the *intent*.
```ts
/**
 * Creates a new user after verifying the email isn't already taken.
 * @param dto - validated user creation payload
 * @returns the newly created user
 * @throws {Error} EMAIL_ALREADY_IN_USE if the email is already registered
 */
async createUser(dto: CreateUserDTO): Promise<User> { ... }
```

### Routes

One-line comment above every route registration in `routes.ts` — method,
path, short description:
```ts
// POST /tasks — create a task; userId must reference an existing user
taskRoutes.post('/', zValidator('json', createTaskSchema), taskHandler.createTask);
```

### Infrastructure / wiring files (`app.ts`, `server.ts`, `config/*.ts`)

These files are almost pure side effects and ordering — the "why this order"
is the whole point, so comment accordingly:
- A short comment above each `app.use(...)` block stating what the
  middleware does and, if order matters, why it's positioned where it is
  relative to the others
- A comment on any config object explaining non-obvious values (e.g. why a
  CSP directive is scoped the way it is, why a timeout is set to a specific
  duration)
- Group related middleware visually with a one-line section comment if the
  file has more than ~4-5 `app.use()` calls, so the request pipeline reads
  top-to-bottom like a checklist

### General rule — comment the "why," not the "what"

Code already shows *what* it does; a comment restating that is noise.
Reserve comments for:
- Non-obvious business rules ("can't transition done → in_progress")
- Reasons behind a workaround, edge case, or ordering decision
- Anything a future reader (including yourself in 6 months) would
  reasonably ask "wait, why is this here?" about
- Bad: `// increment counter` above `counter++`
- Good: `// Postgres returns unique violations as 23505, not a typed error`

### Other rules

- **Zod schemas**: add a `.describe('...')` or an adjacent comment on any
  field whose validation rule isn't self-evident from its name/type alone
- **TODOs** must include enough context to act on later — `// TODO: <what
  and why>`, not a bare `// TODO`. The `/cleanup` skill flags stale/vague
  TODOs, so treat this as enforced, not optional.
- Comments should add information the code doesn't already convey — don't
  add a file-header banner that just restates the filename/class name

## Testing

- Vitest, colocated as `<feature>.test.ts` per module
- Test the `service` layer using a fake/in-memory implementation of the
  `repository` interface — no real DB needed
- Don't write tests just to write them; focus on logic with real branching

## Lint & Format (Biome)

- [Biome](https://biomejs.dev) owns both linting and formatting — one config
  (`biome.json`), no separate ESLint/Prettier setup
- `npm run lint` (`biome check .`) verifies formatting, import order, and
  lint rules; `npm run lint:fix` writes the fixes; `npm run format` runs the
  formatter alone
- Style: 2-space indent, 100-char line width, single quotes, semicolons
  always — enforced by `biome.json`, not manual review
- Import organization (`assist.actions.source.organizeImports`) runs as part
  of `biome check`, reinforcing the "no unused imports" rule below
- `biome.json`'s `linter.rules` uses the `recommended` preset — Biome does
  **not** do type-aware linting (rules needing real type info), so
  `npm run build` (`tsc`) remains the source of truth for type-flow issues
- Enforced automatically: `lint-staged` runs `biome check --write` on
  staged `*.ts`/`*.json` files at `git commit` (`.husky/pre-commit`);
  `npm run lint && npm run test && npm run build` all run at `git push`
  (`.husky/pre-push`)
- Generated/output paths (`dist/`, `src/db/migrations/`, and anything
  gitignored like `coverage/`) are excluded via `files.includes` in
  `biome.json` — never hand-format generated SQL or build output

## Code Quality

- No commented-out code unless specified
- No unused imports or variables
- Keep functions under ~50 lines when possible — split if a file is doing two
  jobs