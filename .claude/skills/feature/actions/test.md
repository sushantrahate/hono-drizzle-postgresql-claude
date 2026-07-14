# Test Action

1. Read current-feature.md to understand what was implemented
2. Identify `service` and `repository` functions added/modified for this feature
3. Check if tests already exist for these functions
4. For functions without tests that have testable logic, write unit tests:
   - Create unit tests using Vitest
   - Focus on `service.ts` (business logic), using a fake/in-memory
     implementation of the `repository` interface — no real DB
   - Test happy path and error cases (e.g. duplicate email, not-found)
   - Do not write tests just to write them. Use your best judgement
5. Run `npm run test` to verify all tests pass
6. Report test coverage for the new feature code
