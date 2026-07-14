# Review Action

1. Read current-feature.md to understand the goals
2. Review all code changes made for this feature
3. Check for:
   - ✅ Goals met
   - ❌ Goals missing or incomplete
   - ⚠️ Code quality issues or bugs
   - 🚫 Scope creep (code beyond goals)
   - 🧱 Layer boundary violations (e.g. Drizzle imported in `service.ts`,
     Hono imported outside `handler.ts`/`routes.ts`)
4. Final verdict: Ready to complete or needs changes
