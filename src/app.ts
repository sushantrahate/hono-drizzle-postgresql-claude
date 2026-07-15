import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { secureHeaders } from 'hono/secure-headers';
import { timeout } from 'hono/timeout';
import { unifiedResponse } from 'uni-response';

import { env } from './config/env';
import { BODY_SIZE_LIMIT_BYTES, REQUEST_TIMEOUT_MS } from './config/security.config';
import { ERROR } from './constants/messages.constants';
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware';
import { hostWhitelist } from './middleware/host-whitelist.middleware';
import { globalRateLimiter } from './middleware/rate-limiter.middleware';
import { requestLogger } from './middleware/request-logger.middleware';
import type { AppVariables } from './types/hono';

// Typed Variables so `c.var.log` / `c.var.requestId` are typed in every handler
const app = new Hono<{ Variables: AppVariables }>();

// --- Middleware pipeline ---
// Order matters: each stage should reject/short-circuit before the next
// stage does more expensive work.

// 1. Attach a per-request logger first, so every stage below can log with
//    request context (reqId, method, path) already attached.
app.use(requestLogger);

// 2. Reject requests with an untrusted Host header before anything else
//    runs — no point spending CPU/DB on a request we're about to reject.
app.use(hostWhitelist);

// 3. Secure headers — applied to every response, cheap, no reason to gate
//    behind other checks.
app.use(
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"], // no external script/style sources by default
    },
    xFrameOptions: 'DENY', // disallow this API being framed (clickjacking)
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'no-referrer',
    strictTransportSecurity: env.NODE_ENV === 'production', // HSTS is meaningless over local HTTP
  }),
);

// 4. CORS — restricts which browser origins may call this API.
//    Note: CORS is browser-enforced only; hostWhitelist above is the
//    actual server-side protection, this is a separate, complementary layer.
app.use(cors({ origin: env.ALLOWED_ORIGINS }));

// 5. Global rate limiter — after the cheap checks above, before body
//    parsing, so abusive clients get rate-limited before we spend effort
//    reading their payload.
app.use(globalRateLimiter);

// 6. Cap request body size to prevent large-payload DoS attempts.
app.use(
  bodyLimit({
    maxSize: BODY_SIZE_LIMIT_BYTES,
    onError: (c) => {
      c.var.log.warn('Rejected request with oversized body');
      return c.json(unifiedResponse(false, ERROR.REQUEST_BODY_TOO_LARGE), 413);
    },
  }),
);

// 7. Enforce a max request duration so a hung handler/DB query can't hold
//    a connection open indefinitely.
app.use(
  timeout(
    REQUEST_TIMEOUT_MS,
    () =>
      new HTTPException(504, {
        res: new Response(JSON.stringify(unifiedResponse(false, ERROR.REQUEST_TIMED_OUT)), {
          status: 504,
          headers: { 'Content-Type': 'application/json' },
        }),
      }),
  ),
);

// --- Routes ---
// GET / — basic liveness/hello endpoint, not a real API route
app.get('/', (c) => {
  return c.text('Hello Hono!');
});

// --- Global fallbacks ---
// Not part of the numbered middleware pipeline above — Hono's error boundary
// (onError) and unmatched-route handler (notFound) run outside app.use(),
// so there's no "position relative to the other stages" to reason about.
app.onError(errorHandler);
app.notFound(notFoundHandler);

export default app;
