## Project Specifications

🚀 **Hono + Drizzle + PostgreSQL Boilerplate** — a modular, swappable Node.js
backend for building APIs quickly without locking into one framework or ORM.

---

## 📌 Problem (Core Idea)

Most backend boilerplates tie business logic directly to a specific framework
(Express) and ORM (Prisma). Swapping either later means rewriting controllers,
services, and repositories together.

➡️ This boilerplate keeps business logic (`service`) independent of both the
web framework and the ORM, using a **port/adapter pattern** — only the
`handler` layer knows about Hono, only the `*.repository.drizzle.ts` file
knows about Drizzle.

---

## 🧱 Tech Stack

| Category    | Choice                                          |
| ----------- | ------------------------------------------------ |
| Framework   | Hono                                             |
| Language    | TypeScript (strict)                              |
| Database    | PostgreSQL 18        |
| ORM         | Drizzle ORM + drizzle-kit                        |
| Validation  | Zod (+ `@hono/zod-validator` middleware)         |
| Responses   | uni-response (`unifiedResponse`, unified shape)  |
| Testing     | Vitest                                           |
| Lint/Format | Biome                                            |
| Git hooks   | Husky + lint-staged                              |
| Logging     | LogLayer (`@loglayer/transport-simple-pretty-terminal` dev, `ConsoleTransport` prod) |
| Security    | `hono/secure-headers`, `hono/cors`, `hono-rate-limiter`, host whitelist, `hono/body-limit`, `hono/timeout` |

---

## 🏗️ Architecture — hexagonal-lite

```
modules/<feature>/
├── <feature>.types.ts            # plain interfaces, no framework/ORM types
├── <feature>.repository.ts       # interface (port)
├── <feature>.repository.drizzle.ts # implementation (adapter) — only file that imports Drizzle
├── <feature>.service.ts          # business logic, depends on the interface only
├── <feature>.schema.ts           # zod validation
├── <feature>.routes.ts           # Hono route wiring
├── <feature>.handler.ts          # Hono Context, calls service — only file that imports Hono
└── <feature>.test.ts
```

Rule of thumb: if a file needs to import Hono or Drizzle directly, it belongs
in `handler`/`routes` or `repository.drizzle`. Everything else (`service`,
`types`, `repository` interface) must stay framework/ORM-agnostic.

All handler responses use `unifiedResponse(...)` from `uni-response`, called
directly (no wrapper file) — see `context/coding-standards.md` → Response
Format for the exact signature and conventions.

---

## 🗄️ Data Model

Each module owns its own Drizzle schema under `modules/<feature>/` (or a
shared `src/db/schema/` if a table is used across modules). Schema changes
always go through `drizzle-kit generate` + `drizzle-kit migrate` — never
hand-edit generated SQL.

The shared Drizzle + postgres.js client instance lives at `src/db/client.ts`
(raw `postgres` client also exported for graceful shutdown cleanup).

---

## 🛠️ Infrastructure

- **Logging**: shared `LogLayer` instance at `src/config/logger.config.ts`;
  per-request child logger attached via `src/middleware/request-logger.middleware.ts`
  and available as `c.var.log` (typed via `src/types/hono.ts`)
- **Graceful shutdown**: `src/utils/graceful-shutdown.ts` — closes the HTTP
  server and DB connection on `SIGTERM`/`SIGINT`, logs and exits non-zero on
  `uncaughtException`/`unhandledRejection`, force-exits after a 10s timeout
- **Security middleware**: mounted in `app.ts` in a fixed order — request
  logger → host whitelist → secure headers → CORS → rate limiter → body
  limit → timeout (see `context/coding-standards.md` for the fully
  commented reference `app.ts`)

---

## 🗂️ Development Workflow

- One feature branch per feature/fix (`feature/[name]`, `fix/[name]`)
- Follow the `/feature` skill lifecycle: load → start → review → test →
  explain → complete
- Run `/cleanup check` periodically for housekeeping (stale TODOs, unused
  imports, layer-boundary violations, env/schema drift)
- Conventional commits (`feat:`, `fix:`, `chore:`)

---

## 🧭 Roadmap

### MVP
- [x] Feature scaffolding pattern proven with a `user` module (reference shape)
- [x] `task` module speced as the second reference shape (relations + state machine)
- [x] DB migrations wired end-to-end (Drizzle + PostgreSQL 18 via Docker)
- [x] Structured logging (LogLayer)
- [x] Graceful shutdown
- [x] Security middleware baseline (headers, rate limit, CORS, host whitelist)
- [x] Vitest test runner configured
- [x] Biome for lint/format
- [ ] Auth (JWT or session, TBD per project)

### Next
- [ ] `TRUST_PROXY` env var + correct client IP handling behind a reverse proxy
- [ ] Dependabot config + `SECURITY.md`
- [ ] Additional feature modules as real projects need them

---

## 📌 Status

- In active development — hexagonal-lite architecture finalized, AI
  workflow (`/feature`, `/cleanup`) wired in, infrastructure layer
  (logging, graceful shutdown, security, testing, lint/format) speced and
  being implemented module by module