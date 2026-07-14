# Start Action

1. Read current-feature.md - verify Goals are populated
2. If empty, error: "Run /feature load first"
3. Set Status to "In Progress"
4. Create and checkout the feature branch (derive name from H1 heading, e.g.
   `feature/user-management`)
5. List the goals, then implement them one by one, following the hexagonal-lite
   module order from coding-standards.md:
   - `<feature>.types.ts`
   - `<feature>.repository.ts` (interface)
   - `<feature>.repository.drizzle.ts` (implementation)
   - `<feature>.service.ts`
   - `<feature>.schema.ts`
   - `<feature>.handler.ts`
   - `<feature>.routes.ts`
   - mount the route in `app.ts`
   - `drizzle-kit generate` if a new table was added
