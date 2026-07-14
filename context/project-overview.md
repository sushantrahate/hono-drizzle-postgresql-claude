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

| Category   | Choice                      |
| ---------- | ---------------------------- |
| Framework  | Hono                         |
| Language   | TypeScript (strict)          |
| Database   | PostgreSQL                   |
| ORM        | Drizzle ORM + drizzle-kit    |
| Validation | Zod                          |
| Responses  | uni-response (unified shape) |
| Testing    | Vitest                       |
| Lint/Format| ESLint + Prettier            |
| Git hooks  | Husky + lint-staged          |
| Logging    | Pino                         |

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

---

## 🗄️ Data Model

Each module owns its own Drizzle schema under `modules/<feature>/` (or a
shared `src/db/schema/` if a table is used across modules). Schema changes
always go through `drizzle-kit generate` + `drizzle-kit migrate` — never
hand-edit generated SQL.

The shared Drizzle + postgres.js client instance lives at `src/db/client.ts`.

---

## 🗂️ Development Workflow

- One feature branch per feature/fix (`feature/[name]`, `fix/[name]`)
- Follow the `/feature` skill lifecycle: load → start → review → test →
  explain → complete
- Conventional commits (`feat:`, `fix:`, `chore:`)

---

## 🧭 Roadmap

### MVP
- Feature scaffolding pattern proven with a `user` module
- DB migrations wired end-to-end
- Auth (JWT or session, TBD per project)

### Next
- Additional feature modules as needed
- Rate limiting, request logging, structured error handling polished

---

## 📌 Status

- In development — boilerplate structure finalized (hexagonal-lite), AI
  workflow being wired in
