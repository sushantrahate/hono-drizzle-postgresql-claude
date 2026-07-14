# Current Feature: Drizzle + local PostgreSQL Setup

## Status

In Progress

## Goals

- Install dependencies: drizzle-orm, postgres, and drizzle-kit (dev dependency)
- Create `drizzle.config.ts` at project root (schema: `./src/db/schema/*`,
  migrations: `./src/db/migrations`, dialect: postgresql, reads DATABASE_URL
  from env)
- Create `src/config/env-schema.ts` and `src/config/env-config.ts`
  (Zod-validated NODE_ENV, PORT, DATABASE_URL) if they don't already exist
- Create `.env.dev` and `.env.example` with DATABASE_URL, PORT, NODE_ENV
  placeholders; ensure `.env*` (except `.env.example`) is gitignored
- Create `src/db/client.ts` — drizzle + postgres.js client instance
- Create `src/db/schema/` folder (empty for now)
- Add npm scripts: `db:generate`, `db:migrate`, `db:studio`
- Update `context/coding-standards.md` with a "Database (Drizzle)" section
  if not already accurate
- Update `context/project-overview.md` Tech Stack / folder structure notes
  for db/client.ts and db/schema/

## Notes

- Requirements must be done in order (see spec)
- Check for existing env-schema.ts/env-config.ts before creating (repo
  already has `src/config/` per git status — verify contents first)
- Never hand-write migration SQL — always drizzle-kit generate + migrate

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
