// src/middleware/request-logger.middleware.ts
import { createMiddleware } from 'hono/factory';

import { log } from '../config/logger.config';
import type { AppVariables } from '../types/hono';

export const requestLogger = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const start = Date.now();
  const { method } = c.req;
  const path = c.req.path;

  const childLog = log.child().withContext({
    reqId: crypto.randomUUID(),
    method,
    path,
  });

  c.set('log', childLog);

  await next();

  childLog
    .withMetadata({ status: c.res.status, durationMs: Date.now() - start })
    .info('Request completed');
});
