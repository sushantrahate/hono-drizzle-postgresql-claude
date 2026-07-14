# AI Interaction Guidelines

## Communication

- Be concise and direct
- Explain non-obvious decisions briefly
- Ask before large refactors or architectural changes
- Don't add features not in the feature spec
- Never delete files without clarification

## Workflow

This is the common workflow for every feature/fix, driven by the `/feature`
skill:

1. **Load** - Load the feature spec into @context/current-feature.md
   (`/feature load <name>`)
2. **Start** - Create the feature branch, begin implementation
   (`/feature start`)
3. **Implement** - Build the module following coding-standards.md
   (handler/routes/service/repository/schema/types)
4. **Test** - Verify endpoints via curl/REST client or Vitest. Run
   `npm run build` and `npm run test`, fix any errors (`/feature test`)
5. **Iterate** - Iterate and change things if needed
6. **Review** - Check goals met, code quality, scope creep (`/feature review`)
7. **Commit** - Only after build passes and everything works
8. **Explain** - Summarize what changed and why (`/feature explain`)
9. **Complete** - Merge to main, delete branch, reset current-feature.md,
   push once (`/feature complete`)

Do NOT commit without permission and until the build passes. If the build
fails, fix the issues first.

## Branching

Create a new branch for every feature/fix. Name branch **feature/[feature]**
or **fix/[fix]**. Ask to delete the branch once merged.

## Commits

- Ask before committing (don't auto-commit)
- Use conventional commit messages (feat:, fix:, chore:)
- Keep commits focused (one feature/fix per commit)
- Never put "Generated with Claude" in commit messages

## When Stuck

- If something isn't working after 2-3 attempts, stop and explain the issue
- Don't keep trying random fixes
- Ask for clarification if requirements are unclear

## Code Changes

- Make minimal changes to accomplish the task
- Don't refactor unrelated code unless asked
- Don't add "nice to have" features
- Preserve existing patterns in the codebase (handler/service/repository
  boundaries especially — don't let Drizzle or Hono leak into `service.ts`)

## Code Review

Review AI-generated code periodically, especially for:

- Security (auth checks, input validation, SQL injection via raw queries)
- Performance (N+1 queries, missing indexes)
- Logic errors (edge cases)
- Layer boundaries (does `service.ts` accidentally import Drizzle or Hono?)
