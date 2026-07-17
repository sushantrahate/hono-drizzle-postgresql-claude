import type { Context } from 'hono';
import { unifiedResponse } from 'uni-response';

import { ERROR, SUCCESS } from '../../constants/messages.constants';
import type { AppVariables } from '../../types/hono';
import type { HealthService } from './health.service';

type Env = { Variables: AppVariables };

/** Thin Hono handler for `/health` — validation already ran in routes.ts; this only calls the service. */
export class HealthHandler {
  constructor(private readonly healthService: HealthService) {}

  /** Reports app liveness and dependency health; 503 if any dependency check fails. */
  getStatus = async (c: Context<Env>) => {
    const status = await this.healthService.getStatus();
    if (status.status === 'ok') {
      return c.json(unifiedResponse(true, SUCCESS.HEALTH_CHECK_OK, status), 200);
    }
    return c.json(unifiedResponse(false, ERROR.HEALTH_CHECK_FAILED, status), 503);
  };
}
