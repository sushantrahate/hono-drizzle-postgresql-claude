import type { HealthRepository } from './health.repository';
import type { HealthStatus } from './health.types';

/**
 * Health check business logic — decides overall status from the individual
 * dependency checks so `health.handler.ts` never branches on DB state
 * itself. Depends only on the `HealthRepository` interface, never the
 * Drizzle implementation.
 */
export class HealthService {
  constructor(private readonly healthRepository: HealthRepository) {}

  /** Runs all dependency checks and reports overall app health. */
  async getStatus(): Promise<HealthStatus> {
    const databaseOk = await this.healthRepository.checkDatabase();
    // `status` and `database` happen to share one check today; kept as
    // separate fields since `status` is meant to summarize *all* dependency
    // checks once there's more than one.
    const database = databaseOk ? 'ok' : 'error';
    return {
      status: database,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database,
    };
  }
}
