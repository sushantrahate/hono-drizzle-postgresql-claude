// src/middleware/rate-limiter.middleware.ts
import { getConnInfo } from '@hono/node-server/conninfo';
import type { Context } from 'hono';
import { rateLimiter } from 'hono-rate-limiter';
import { unifiedResponse } from 'uni-response';

import { env } from '../config/env';
import { RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS } from '../config/security.config';
import { ERROR } from '../constants/messages.constants';
import type { AppVariables } from '../types/hono';

/**
 * Resolves the client IP for rate-limiting purposes.
 *
 * Only trusts `X-Forwarded-For` when `TRUST_PROXY` is enabled — otherwise a
 * client could set that header itself and spoof a different IP on every
 * request, making the limiter useless. When trusted, takes the left-most
 * entry (the original client, as set by the first proxy hop).
 */
const getClientIp = (c: Context): string => {
  if (env.TRUST_PROXY) {
    const forwardedFor = c.req.header('x-forwarded-for');
    const firstIp = forwardedFor?.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  return getConnInfo(c).remote.address ?? 'unknown';
};

const tooManyRequests = (c: Context) => {
  c.var.log.warn(`Rate limit exceeded for client IP: ${getClientIp(c)}`);
  return c.json(unifiedResponse(false, ERROR.TOO_MANY_REQUESTS), 429);
};

/** Creates a rate limiter with the given window/limit, keyed by client IP */
export const createRateLimiter = (windowMs: number, limit: number) =>
  rateLimiter<{ Variables: AppVariables }>({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    keyGenerator: getClientIp,
    handler: tooManyRequests,
  });

/** Global default rate limiter, applied to all routes */
export const globalRateLimiter = createRateLimiter(RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS);
