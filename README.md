# 🚀 Hono + Drizzle + PostgreSQL Boilerplate

A modular, swappable Node.js backend built with Hono, Drizzle ORM,
PostgreSQL, and TypeScript, following **Clean Architecture & Framework-Agnostic
Design** (a lighter-weight take on ports & adapters / hexagonal architecture)
— business logic stays independent of both the web framework and the ORM.
See [`context/project-overview.md`](context/project-overview.md)
for the full architecture and [`context/coding-standards.md`](context/coding-standards.md)
for conventions.

## ✨ Features

### 🛠️ Core

✅ TypeScript (strict) – Fully typed backend for maintainability\
✅ Hono – Lightweight, fast web framework\
✅ Drizzle ORM – Type-safe, SQL-first database interactions\
✅ PostgreSQL 18 – Relational database\

### 🎯 Development & Code Quality

✅ VS Code debugger – launch/attach configs for the server and Vitest, see [🐞 Debugging in VS Code](#-debugging-in-vs-code)\
✅ Clean Architecture, Framework-Agnostic Design – Each feature module keeps its routes, handler, service, repository (port + adapter), schema, and types together, with business logic isolated from Hono and Drizzle\
✅ `user` feature module – full CRUD reference implementation (see [API Endpoints](#-api-endpoints)) proving the module shape end-to-end\
✅ Biome – Single tool for linting, formatting, and import organization (no separate ESLint/Prettier setup)\
✅ Zod validation – Strict schema validation for request bodies and environment variables\

### 🔐 Environment & Security

✅ Environment validation – Zod-validated `.env` at startup, fails fast on missing/invalid vars\
✅ Secure headers & CORS – `hono/secure-headers` (CSP, HSTS, frame options) and an `ALLOWED_ORIGINS` allow-list\
✅ Host whitelisting – Server-side `Host` header validation, separate from CORS\
✅ Rate limiting – IP-based via `hono-rate-limiter`, with `TRUST_PROXY` to safely resolve client IP behind a reverse proxy\
✅ Body limit & timeout – `hono/body-limit` and `hono/timeout` guard against oversized payloads and hung requests\

### ⚡ API & Middleware

✅ Request validation – Zod schemas via `@hono/zod-validator` for body, params, and query\
✅ Centralized error handling – `app.onError` maps `AppError` subclasses and PostgreSQL error codes (e.g. `23505` unique violation) into consistent failure responses\
✅ Unified response structure – `uni-response`'s `unifiedResponse(...)` for every handler response\
✅ Structured logging – `LogLayer` with a per-request child logger (`c.var.log`) carrying request context\

### 🧪 Testing & CI/CD

✅ Vitest – Unit/integration testing\
✅ Husky + lint-staged – Pre-commit lint/format, pre-push lint + test + build\

### 🛑 Server Management

✅ Graceful shutdown – Closes the HTTP server and DB connection on `SIGTERM`/`SIGINT`, logs and exits non-zero on uncaught exceptions

## 📂 Project Structure

```
src/
├── app.ts                    # Hono app: middleware pipeline, route mounting, error boundary
├── server.ts                 # @hono/node-server entrypoint + graceful shutdown wiring
├── config/                   # Env validation (Zod), logger, security thresholds
├── constants/                # SUCCESS/ERROR message strings
├── db/
│   ├── client.ts              # Shared Drizzle + postgres.js client
│   ├── schema/                 # Tables shared across modules (empty until one exists)
│   └── migrations/              # drizzle-kit generate output — never hand-edited
├── errors/                   # AppError + typed subclasses (NotFoundError, ConflictError, ...)
├── middleware/                # Host whitelist, rate limiter, request logger, centralized error handler
├── types/                    # Shared Hono types (e.g. AppVariables for c.var.log)
├── utils/                    # Graceful shutdown
└── modules/                   # one folder per feature — see Layer-by-Layer Breakdown below
    ├── user/
    │   ├── user.types.ts           # plain interfaces (User, CreateUserDTO, ...) — no framework/ORM types
    │   ├── user.repository.ts      # repository interface (port) — no implementation
    │   ├── user.repository.drizzle.ts # Drizzle adapter — table schema + interface implementation
    │   ├── user.service.ts         # business logic — depends only on the repository interface
    │   ├── user.schema.ts          # Zod request validation
    │   ├── user.handler.ts         # Hono Context glue — calls service, returns unifiedResponse
    │   ├── user.routes.ts          # wires handlers to HTTP paths
    │   └── user.test.ts            # service tests against a fake in-memory repository
    └── health/                # no schema.ts — GET /health takes no input
        ├── health.types.ts          # plain interfaces (HealthStatus, ...) — no framework/ORM types
        ├── health.repository.ts     # repository interface (port) — no implementation
        ├── health.repository.drizzle.ts # Drizzle adapter — runs `select 1` to check DB connectivity
        ├── health.service.ts        # business logic — combines DB check + uptime/timestamp
        ├── health.handler.ts        # Hono Context glue — calls service, returns unifiedResponse
        ├── health.routes.ts         # wires handler to GET /health
        └── health.test.ts           # service tests against a fake in-memory repository
```

Unlike a layer-based structure (global `controllers/`, `services/`, `repositories/`
folders), this boilerplate is **feature-based**: every file for "users" lives
together under `modules/user/`. Adding a second feature means adding a second
folder — nothing under `modules/user/` changes.

## 📌 Layer-by-Layer Breakdown

### 1️⃣ Feature Modules (`modules/<feature>/`)

Each feature is self-contained — everything related to "users" lives inside
`src/modules/user/`.

🎯 Benefit:\
💡 You can add or remove a feature by adding or deleting one folder, without
touching any other feature.

🔹 **No Cluttering, Even as the Project Grows Large** – related files stay
together instead of scattering across global `controllers/`/`services/`/`repositories/`
folders.\
🔹 **Everything in One Place** – all logic for a feature (routes, handler,
service, repository, schema, types) lives in a single folder.\
🔹 **No Ambiguity in Large Systems** – with dozens of features, there's never
a question of which handler/service/repository belongs to which — the folder
name says it.\
🔹 **Scalability & Maintainability** – a new feature is a new folder under
`modules/`, with zero edits to unrelated modules.

### 2️⃣ Handlers (`<feature>.handler.ts`)

✅ The only file in the module allowed to import Hono's `Context`\
✅ Calls the service layer for business logic\
✅ Wraps every response in `unifiedResponse(...)` — thin, no business logic

📄 Example: `user.handler.ts`

```ts
export class UserHandler {
  constructor(private readonly userService: UserService) {}

  createUser = async (c: Context<Env, '/', JsonBody<typeof createUserSchema>>) => {
    const input = c.req.valid('json');
    const user = await this.userService.createUser(input);
    return c.json(unifiedResponse(true, SUCCESS.USER_CREATED, user), 201);
  };
}
```

#### 🛠️ Why This Structure?

Hono-specific logic (`Context`, status codes, `unifiedResponse`) stays here —
business logic lives in the service layer, which stays framework-agnostic.

🎯 Benefit:\
💡 Swapping Hono for another framework means rewriting `handler.ts`/`routes.ts`
only — `service.ts` and `repository.ts` don't change.

### 3️⃣ Services (`<feature>.service.ts`)

✅ Contains the feature's business rules\
✅ Does NOT depend on Hono or Drizzle\
✅ Depends only on the `repository` interface, never its implementation

📄 Example: `user.service.ts`

```ts
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(input: CreateUserInput): Promise<User> {
    const email = input.email.toLowerCase();
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError(ERROR.EMAIL_ALREADY_IN_USE);
    }
    return this.userRepository.create({ ...input, email });
  }
}
```

#### 🛠️ Why This Structure?

- No dependency on Hono requests/responses or Drizzle query syntax
- Throws typed `AppError` subclasses instead of shaping HTTP responses itself
  — the centralized error middleware translates them

🎯 Benefit:\
💡 The exact same `UserService` can be unit-tested against a fake in-memory
repository (see `user.test.ts`), reused in a CLI script, or ported to a
different framework/ORM without changes.

### 4️⃣ Repositories — Port + Adapter (`<feature>.repository.ts` + `<feature>.repository.drizzle.ts`)

✅ `repository.ts` is a plain interface — the **port** — with zero implementation\
✅ `repository.drizzle.ts` is the **adapter** — the only file in the module
allowed to import `drizzle-orm`\
✅ The service depends on the interface, never the Drizzle class directly

📄 Example: `user.repository.ts` (port)

```ts
export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  // ...
}
```

📄 Example: `user.repository.drizzle.ts` (adapter)

```ts
export class DrizzleUserRepository implements UserRepository {
  async findByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user ?? null;
  }
  // ...
}
```

🎯 Benefit:\
💡 Swapping Drizzle for another ORM means writing a new class that implements
`UserRepository` — `service.ts`, `handler.ts`, and every test stay untouched.

### 5️⃣ Schemas (`<feature>.schema.ts`)

✅ Zod schemas validate request bodies/params before anything reaches the service\
✅ Wired into `routes.ts` via `@hono/zod-validator`, one target (`json`/`param`) per route

📄 Example: `user.schema.ts`

```ts
export const createUserSchema = z.object({
  email: z.email(),
  name: z.string().min(1).optional(),
});
```

### 6️⃣ Types (`<feature>.types.ts`)

✅ Plain interfaces (`User`, `CreateUserInput`, `UpdateUserInput`) — no Hono
or Drizzle types leak in\
✅ The single shared vocabulary every other layer in the module imports

### 7️⃣ Routes (`<feature>.routes.ts`)

✅ Wires `repository → service → handler` once — the module's composition root\
✅ Registers each route with its `zValidator` middleware and a one-line comment\
✅ No business logic — only wiring

📄 Example: `user.routes.ts`

```ts
const userRepository = new DrizzleUserRepository();
const userService = new UserService(userRepository);
const userHandler = new UserHandler(userService);

export const userRoutes = new Hono<{ Variables: AppVariables }>();

// POST /users — create a user; 409 if the email is already registered
userRoutes.post('/', zValidator('json', createUserSchema), userHandler.createUser);
```

## Getting started

```
npm install
cp .env.example .env.dev   # fill in DATABASE_URL, ALLOWED_ORIGINS, ALLOWED_HOSTS
npm run db:migrate
npm run dev
```

```
open http://localhost:4000
```

See [`.env.example`](.env.example) for all required environment variables
(`DATABASE_URL`, `ALLOWED_ORIGINS`, `ALLOWED_HOSTS`, `TRUST_PROXY`, etc.).

## 📖 API Endpoints

### Users (`src/modules/user`)

The reference CRUD module — every response follows the `unifiedResponse`
shape (`{ success, message, data? }`); see
[`coding-standards.md`](context/coding-standards.md) for details.

| Method   | Path         | Description                                                              |
| -------- | ------------ | ------------------------------------------------------------------------- |
| `POST`   | `/users`     | Create a user (`email` required, `name` optional). `201`, or `409` if the email is already registered |
| `GET`    | `/users`     | List all users. `200`                                                    |
| `GET`    | `/users/:id` | Get a user by id. `200`, or `404` if not found                           |
| `PATCH`  | `/users/:id` | Update a user's `name`. `200`, or `404` if not found                     |
| `DELETE` | `/users/:id` | Delete a user. `200`, or `404` if not found                              |

### Health (`src/modules/health`)

Liveness + dependency check for uptime monitoring / container orchestration.
`data` reports `status`, `uptime` (seconds), `timestamp`, and `database`
(`'ok' | 'error'`).

| Method | Path      | Description                                                        |
| ------ | --------- | -------------------------------------------------------------------- |
| `GET`  | `/health` | App liveness + DB connectivity check. `200` if reachable, `503` if not |

## Scripts

| Command             | Description                              |
| -------------------- | ----------------------------------------- |
| `npm run dev`         | Start the dev server (watch mode)         |
| `npm run dev:debug`   | Start the dev server (watch mode) with the inspector open on port `9229` — pair with the "Attach: Dev Server (watch)" VS Code launch config, see [🐞 Debugging in VS Code](#-debugging-in-vs-code) |
| `npm run build`       | Type-check and compile to `dist/`         |
| `npm run start`       | Run the compiled production build         |
| `npm run db:generate` | Generate a Drizzle migration from schema changes |
| `npm run db:migrate`  | Apply pending Drizzle migrations          |
| `npm run db:studio`   | Open Drizzle Studio to inspect data       |
| `npm run test`        | Run the Vitest suite                      |
| `npm run test:watch`  | Run Vitest in watch mode                  |
| `npm run test:coverage` | Run Vitest with coverage               |
| `npm run lint`        | Check formatting, imports, and lint rules with Biome |
| `npm run lint:fix`    | Same as `lint`, writing fixes in place    |
| `npm run format`      | Format all files with Biome               |

Biome (lint + format) and Husky hooks run automatically: `git commit` runs
`lint-staged` on staged `*.ts`/`*.json` files; `git push` runs
`lint && test && build`.

## 🐞 Debugging in VS Code

Four launch configs live in [`.vscode/launch.json`](.vscode/launch.json).
Open the **Run and Debug** panel (`Ctrl+Shift+D`), pick a config from the
dropdown, and press `F5`. Set breakpoints by clicking left of a line number
in the gutter.

| Config                          | Use it for                                                              |
| -------------------------------- | ------------------------------------------------------------------------- |
| `Debug Server`                   | One-shot server debugging — launches `src/server.ts` directly under the debugger. No hot reload: stop and re-launch (`F5`) after editing a file |
| `Attach: Dev Server (watch)`     | Debugging with hot reload. Run `npm run dev:debug` in a terminal first (starts `tsx watch` with the inspector on port `9229`), then launch this config to attach. Reattaches automatically every time `--watch` restarts the process |
| `Debug Current Test File`        | Runs Vitest against just the file open in your active editor tab         |
| `Debug All Tests`                | Runs the full Vitest suite under the debugger                            |

Notes:

- `Debug Server` and `Attach: Dev Server (watch)` both load environment
  variables the normal way, through `src/config/env.ts` (`.env.dev`) — there's
  no separate debug env file to keep in sync.
- Only `Attach: Dev Server (watch)` sets `"restart": true`, so it
  automatically reattaches every time `tsx watch` restarts the process after
  a file change. `Debug Server` deliberately does *not* auto-relaunch —
  when the process exits (including a normal `Ctrl+C`/graceful shutdown),
  the debug session ends instead of silently relaunching.
- `Debug Server` runs `node --import tsx`, which needs Node ≥ 20.6 for a
  stable `--import` flag — the project doesn't pin a Node version, so
  confirm your local Node version if this config fails to start.
- The test configs run `node_modules/vitest/vitest.mjs` directly (the
  config documented in [Vitest's own debugging guide](https://vitest.dev/guide/debugging.html))
  rather than the `vitest` CLI bin, since VS Code's Node debugger can't
  reliably resolve npm bin shims on all platforms.

## 🤖 AI-Assisted Feature Workflow

This repo is built to be developed with [Claude Code](https://claude.com/claude-code).
`CLAUDE.md` at the repo root pulls in four context files that Claude reads
before doing any work:

- [`context/project-overview.md`](context/project-overview.md) – architecture, tech stack, roadmap
- [`context/coding-standards.md`](context/coding-standards.md) – layer boundaries, response format, naming, comment rules
- [`context/ai-interaction.md`](context/ai-interaction.md) – communication style, branching/commit rules, when to ask before acting
- [`context/current-feature.md`](context/current-feature.md) – the feature currently in flight (goals, notes, and an append-only history of everything shipped so far)

### `/feature` skill

Drives the full lifecycle of one feature/fix, from spec to merge, via
`current-feature.md`:

| Step | Command | What happens |
| --- | --- | --- |
| Load | `/feature load <name>` | Loads a feature spec (or inline description) into `current-feature.md`'s `Goals`/`Notes` sections |
| Start | `/feature start` | Creates a `feature/[name]` or `fix/[name]` branch and begins implementation |
| Implement | — | Builds the module layer by layer (`types` → `repository` → `repository.drizzle` → `service` → `schema` → `handler` → `routes`), following `coding-standards.md` |
| Test | `/feature test` | Verifies endpoints, runs `npm run build` and `npm run test`, fixes any failures |
| Review | `/feature review` | Checks goals were met, no scope creep, layer boundaries respected |
| Commit | — | Only after the build passes and everything works — never auto-committed |
| Explain | `/feature explain` | Summarizes what changed and why |
| Complete | `/feature complete` | Merges to `main`, deletes the branch, appends a summary to `current-feature.md`'s `History`, and resets `Status`/`Goals`/`Notes` for the next feature |

Ground rules enforced throughout (from `ai-interaction.md`): ask before large
refactors or architectural changes, never commit without explicit
permission, never delete files without confirmation, and stop after 2-3
failed attempts to ask for clarification instead of guessing further.

### `/cleanup` skill

Periodic housekeeping pass, independent of any single feature. `/cleanup
check` reports findings only; `/cleanup run` reports findings then asks
which numbered items to fix before touching anything. It audits things like:

- stale/out-of-order `current-feature.md` history
- leftover `console.log`/`console.error` calls (logger calls are fine)
- unused imports, stale TODOs, orphaned files/modules
- context docs (`project-overview.md`, `coding-standards.md`) drifting from actual project state
- `.env.example` vs. `envSchema` (`src/config/env-schema.ts`) variable-name drift
- stale `@ts-ignore`/`@ts-expect-error` comments
- **layer-boundary violations** — `service.ts`/`repository.ts` importing Drizzle, or anything outside `handler.ts`/`routes.ts` importing Hono
- missing files in a module's expected shape, or repositories/services wired inline in a handler instead of `routes.ts`
- schema files newer than the latest Drizzle migration (uncommitted drift)

### `code-reviewer` subagent

A read-only agent (`.claude/agents/code-reviewer.md`, Read/Grep/Glob only —
never edits) for a fresh-eyes pass after implementing or editing code,
before committing, or whenever asked to scan/review the codebase. It reads
`coding-standards.md`/`project-overview.md` first, then checks (in priority
order) layer-boundary violations, response-format compliance, documentation,
error handling, validation, testing, general code quality, and a light
security pass — reporting concrete findings grouped by category without
making any changes itself.

## ✨ Setup from scratch

### ⚡ Scaffold the project

```bash
mkdir hono-drizzle-postgresql-claude && cd hono-drizzle-postgresql-claude
npm create hono@latest .
```
```
✔ Using target directory … .
✔ Which template do you want to use? › nodejs
✔ Do you want to install project dependencies? … yes
✔ Which package manager do you want to use? › npm
```

Update README.md and push the initial commit to git.

### ⚡ Split app.ts and server.ts

`src/app.ts` — the Hono app instance, no server startup logic:
```ts
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app
```

`src/server.ts` — entry point:
```ts
import { serve } from '@hono/node-server'
import app from './app'

const port = 3001

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
```

### ⚡ Fix tsconfig.json module resolution

`npm create hono@latest` scaffolds with `"module": "NodeNext"`, which
requires explicit `.js` extensions on every relative import. Switch to:

```jsonc
// before
"module": "NodeNext",

// after
"module": "ESNext",
"moduleResolution": "Bundler",
```

### ⚡ Environment setup

```bash
npm install @hono/zod-validator dotenv
npm install --save-dev cross-env
```

- Create `.env.dev` from `.env.example`
- Add `src/config/env-schema.ts` (Zod schema) and `src/config/env.ts`
  (loads the right `.env.<suffix>` file, validates against the schema,
  fails fast on invalid/missing vars)
- Import it as the very first line of `src/server.ts`:
  ```ts
  import './config/env';
  ```
  This guarantees env validation runs before anything else touches
  `process.env`.

### ⚡ Claude Code setup

Copy `CLAUDE.md` and the `context/` folder (`project-overview.md`,
`coding-standards.md`, `ai-interaction.md`, `current-feature.md`) from this
repo into the new project, then copy `.claude/` (the `feature`/`cleanup`
skills and the `code-reviewer` subagent). Open the project in VS Code with
the Claude Code extension — no `/init` needed, the context is already
written.

### ⚡ PostgreSQL

Install and run PostgreSQL (e.g. `postgres:18-alpine` via Docker Desktop)
with:

| Variable            | Value          |
| ------------------- | -------------- |
| `POSTGRES_USER`     | `dev_user`     |
| `POSTGRES_PASSWORD` | `dev_password` |
| `POSTGRES_DB`       | `dev_db`       |

Update `.env.dev`:
```ini
DATABASE_URL="postgresql://dev_user:dev_password@localhost:5432/dev_db"
```

### ⚡ Feature specs, via `/feature`

Copy `context/features/` from this repo into the new project — each file is
a ready-made spec for one piece of infrastructure. In Claude Code:

```
/feature load <name>
```

loads that spec into `current-feature.md`'s `Goals`/`Notes` sections, then
`/feature start` branches and builds it, `/feature test` verifies it,
`/feature review` checks it, and `/feature complete` merges it and appends
to `current-feature.md`'s `History` before you load the next one. Install
`uni-response` (`npm install uni-response`) before the first one — the
response format depends on it.

Load and build them one at a time, in this order, to reconstruct the whole
project:

```
/feature load database-spec
/feature load logging
/feature load graceful-shutdown
/feature load security-hardening
/feature load vitest-setup
/feature load error-handling-middleware
/feature load biome-setup
/feature load user-management
```

### ⚡ Files with no `/feature` spec

A few standard OSS/packaging files are static/config-only and don't go
through the `/feature` workflow — copy them directly from this repo
instead:

- `LICENSE`
- `.github/dependabot.yml`
- `SECURITY.md`
- `CONTRIBUTING.md`

Finally, copy `Dockerfile` (and `.dockerignore`) from this repo for the
production image build.

If you liked it then please show your love by ⭐ the repo