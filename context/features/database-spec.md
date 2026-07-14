# Drizzle + local PostgreSQL Setup

## Overview

Set up Drizzle ORM with PostgreSQL database.

## Requirements

Do the following, in order:

1. Install dependencies: drizzle-orm, postgres, and drizzle-kit (dev dependency) using npm

2. Create `drizzle.config.ts` at the project root, pointing schema to
   `./src/db/schema/*` and migrations output to `./src/db/migrations`,
   dialect postgresql, reading DATABASE_URL from env

3. Create `src/config/env-schema.ts` and `src/config/env-config.ts` (Zod-validated
   env vars: NODE_ENV, PORT, DATABASE_URL) if they don't already exist — check
   first before creating

4. Create `.env.dev` and `.env.example` with DATABASE_URL, PORT, NODE_ENV
   placeholders. Make sure `.env*` (except `.env.example`) is in .gitignore

5. Create `src/db/client.ts` — the drizzle + postgres.js client instance,
   importing DATABASE_URL from env-config

6. Create `src/db/schema/` folder for table definitions (empty for now,
   we'll add tables per-module later)

7. Add these npm scripts to package.json if missing:
   "db:generate": "drizzle-kit generate"
   "db:migrate": "drizzle-kit migrate"
   "db:studio": "drizzle-kit studio"

8. Update @context/coding-standards.md — add a "Database (Drizzle)" section
   if one isn't already accurate, covering: schema files live in
   src/db/schema/ or colocated in a module's *.repository.drizzle.ts file,
   always use drizzle-kit generate + migrate for schema changes, never hand-write
   migration SQL

9. Update @context/project-overview.md — under Tech Stack, confirm Drizzle
   ORM + PostgreSQL are listed correctly, and note where db/client.ts and
   db/schema/ live in the folder structure section