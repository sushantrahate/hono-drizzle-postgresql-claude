import { describe, expect, it } from 'vitest';

import { BODY_SIZE_LIMIT_BYTES, RATE_LIMIT_MAX_REQUESTS } from '@/config/security.config';

// Smoke test: confirms Vitest runs and the `@/*` alias resolves to `src/*`.
describe('security.config', () => {
  it('exposes the expected threshold values', () => {
    expect(BODY_SIZE_LIMIT_BYTES).toBe(1 * 1024 * 1024);
    expect(RATE_LIMIT_MAX_REQUESTS).toBe(100);
  });
});
