import { describe, expect, it } from 'vitest';

import type { HealthRepository } from '@/modules/health/health.repository';
import { HealthService } from '@/modules/health/health.service';

// In-memory stand-in for DrizzleHealthRepository so the service is tested
// against the `HealthRepository` port only, with no real DB.
class FakeHealthRepository implements HealthRepository {
  constructor(private readonly databaseUp: boolean) {}

  async checkDatabase(): Promise<boolean> {
    return this.databaseUp;
  }
}

describe('HealthService', () => {
  it('reports ok when the database check succeeds', async () => {
    const service = new HealthService(new FakeHealthRepository(true));

    const status = await service.getStatus();

    expect(status.status).toBe('ok');
    expect(status.database).toBe('ok');
    expect(typeof status.uptime).toBe('number');
    expect(typeof status.timestamp).toBe('string');
  });

  it('reports error when the database check fails', async () => {
    const service = new HealthService(new FakeHealthRepository(false));

    const status = await service.getStatus();

    expect(status.status).toBe('error');
    expect(status.database).toBe('error');
  });
});
