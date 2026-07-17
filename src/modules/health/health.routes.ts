import { Hono } from 'hono';

import type { AppVariables } from '../../types/hono';
import { HealthHandler } from './health.handler';
import { DrizzleHealthRepository } from './health.repository.drizzle';
import { HealthService } from './health.service';

// Composition root for this module: repository -> service -> handler, wired once.
const healthRepository = new DrizzleHealthRepository();
const healthService = new HealthService(healthRepository);
const healthHandler = new HealthHandler(healthService);

export const healthRoutes = new Hono<{ Variables: AppVariables }>();

// GET /health — liveness + DB connectivity check; 503 if the DB is unreachable
healthRoutes.get('/', healthHandler.getStatus);

export default healthRoutes;
