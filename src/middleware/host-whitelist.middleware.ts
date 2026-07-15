// src/middleware/host-whitelist.middleware.ts
import { createMiddleware } from 'hono/factory';
import { unifiedResponse } from 'uni-response';

import { env } from '../config/env';
import { ERROR } from '../constants/messages.constants';
import type { AppVariables } from '../types/hono';

const allowedHosts = new Set(env.ALLOWED_HOSTS.map((host) => host.toLowerCase()));

export const hostWhitelist = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const host = c.req.header('host');

  if (!host || !allowedHosts.has(host.toLowerCase())) {
    c.var.log.warn(`Rejected request with disallowed Host header: ${host ?? '(missing)'}`);
    return c.json(unifiedResponse(false, ERROR.HOST_NOT_ALLOWED), 403);
  }

  await next();
});
