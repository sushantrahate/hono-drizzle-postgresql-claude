# Current Feature

<!-- Feature Name -->

## Status

<!-- Not Started|In Progress|Completed -->

Not Started

## Goals

<!-- Goals & requirements -->

## Notes

<!-- Any extra notes -->

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- Zod-validated env config (`src/config/env-schema.ts`, `src/config/env.ts`) —
  NODE_ENV/PORT/DATABASE_URL validation, loads `.env.<suffix>` based on NODE_ENV
- Drizzle + local PostgreSQL Setup — installed drizzle-orm/postgres/drizzle-kit,
  added drizzle.config.ts, src/db/client.ts, src/db/schema/, db:generate/migrate/studio
  scripts, and updated env files, .gitignore, and context docs
