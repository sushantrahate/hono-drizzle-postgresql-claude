---
name: cleanup
description: Clean up project housekeeping tasks (add "run" to execute fixes)
argument-hint: run|check
---

Review the codebase for cleanup tasks:

1. Make sure the history in @context/current-feature.md is in order from oldest to newest
2. Find unnecessary `console.log` statements in `src/` (Pino/logger calls are fine — flag raw `console.log`/`console.error` left in from debugging)
3. Find unused imports
4. Check for stale TODO comments
5. Find orphaned/unused files (e.g. a leftover `src/index.ts` alongside `src/server.ts`, old module folders with no route mounted in `app.ts`)
6. Check that context files (`context/project-overview.md`, `context/coding-standards.md`) match actual project state — e.g. tech stack, folder structure, module list
7. Check that `.env.example` has the same variable **names** (not values) as `envSchema` in `src/config/env-schema.ts`. If a var is in the schema but missing from `.env.example`, or in `.env.example` but not the schema, tell me.
8. Find `@ts-ignore` / `@ts-expect-error` comments that might be stale
9. **Layer boundary violations** — check every module under `src/modules/<feature>/`:
  - `*.service.ts` must not import `hono` or `drizzle-orm`
  - `*.repository.ts` (the interface file) must not import `drizzle-orm`
  - Only `*.repository.drizzle.ts` may import `drizzle-orm`
  - Only `*.handler.ts` and `*.routes.ts` may import `hono`
10. Check every module has the full expected file set (`types`, `repository`, `repository.drizzle`, `service`, `schema`, `handler`, `routes`, `test`) — flag any module missing a file, or any file that doesn't belong to a recognized module shape
11. Check for repositories/services instantiated inline inside a handler instead of wired in `routes.ts` — flags a broken composition pattern
12. Check `drizzle-kit generate` has been run for any schema file newer than the latest migration in `src/db/migrations/` (uncommitted schema drift)

**Mode: $ARGUMENTS**

If no argument or argument is "check":

- Only report findings, don't modify anything
- List what WOULD be cleaned up, grouped by the numbered category above

If the argument is "run" or "fix":

- First, report all findings with numbered items
- Then ask: "Which items would you like me to fix? (enter numbers like 1,3,5 or 'all' or 'none')"
- Wait for user response before making any changes
- Only fix the items the user specifies
- Never auto-fix item 9 (layer boundary violations) or item 12 (schema/migration drift) without explicitly confirming the fix approach first — these can involve real refactors, not just deletions
- Report what you changed