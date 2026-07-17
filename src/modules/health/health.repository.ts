/**
 * Port for dependency checks — `health.service.ts` depends only on this
 * interface, never on `health.repository.drizzle.ts` directly, so the ORM
 * stays swappable.
 */
export interface HealthRepository {
  /** Returns `true` if the database responds to a trivial query, `false` otherwise. */
  checkDatabase(): Promise<boolean>;
}
