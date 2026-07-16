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

✅ Clean Architecture, Framework-Agnostic Design – Each feature module keeps its routes, handler, service, repository (port + adapter), schema, and types together, with business logic isolated from Hono and Drizzle\
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

## Scripts

| Command             | Description                              |
| -------------------- | ----------------------------------------- |
| `npm run dev`         | Start the dev server (watch mode)         |
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