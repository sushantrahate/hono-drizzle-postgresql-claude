import { sql } from 'drizzle-orm';

import { log } from '../../config/logger.config';
import { db } from '../../db/client';
import type { HealthRepository } from './health.repository';

// Only file in this module allowed to import drizzle-orm, per coding-standards.md.

/** Drizzle/Postgres implementation of {@link HealthRepository}. */
export class DrizzleHealthRepository implements HealthRepository {
  /** See {@link HealthRepository.checkDatabase}. */
  async checkDatabase(): Promise<boolean> {
    try {
      await db.execute(sql`select 1`);
      return true;
    } catch (error) {
      // Logged here (not in the service) so the actual DB error (timeout,
      // auth failure, connection refused) isn't lost behind the boolean
      // this port returns.
      log.withError(error as Error).warn('Health check DB query failed');
      return false;
    }
  }
}
