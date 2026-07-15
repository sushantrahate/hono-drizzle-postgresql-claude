import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { secureHeaders } from 'hono/secure-headers'
import { timeout } from 'hono/timeout'
import { unifiedResponse } from 'uni-response'

import { env } from './config/env';
import { BODY_SIZE_LIMIT_BYTES, REQUEST_TIMEOUT_MS } from './config/security.config';
import { hostWhitelist } from './middleware/host-whitelist.middleware';
import { globalRateLimiter } from './middleware/rate-limiter.middleware';
import { requestLogger } from './middleware/request-logger.middleware';
import type { AppVariables } from './types/hono';

const app = new Hono<{ Variables: AppVariables }>()

app.use(requestLogger);
app.use(hostWhitelist);
app.use(
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
    },
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'no-referrer',
    strictTransportSecurity: env.NODE_ENV === 'production',
  })
);
app.use(cors({ origin: env.ALLOWED_ORIGINS }));
app.use(globalRateLimiter);
app.use(
  bodyLimit({
    maxSize: BODY_SIZE_LIMIT_BYTES,
    onError: (c) => {
      c.var.log.warn('Rejected request with oversized body');
      return c.json(unifiedResponse(false, 'Request body too large'), 413);
    },
  })
);
app.use(
  timeout(
    REQUEST_TIMEOUT_MS,
    () =>
      new HTTPException(504, {
        res: new Response(JSON.stringify(unifiedResponse(false, 'Request timed out')), {
          status: 504,
          headers: { 'Content-Type': 'application/json' },
        }),
      })
  )
);

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app
