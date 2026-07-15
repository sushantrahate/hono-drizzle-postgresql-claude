import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import postgres from 'postgres';
import { describe, expect, it } from 'vitest';

import { NotFoundError } from '@/errors/app-error';
import { errorHandler, notFoundHandler } from '@/middleware/error-handler.middleware';
import type { AppVariables } from '@/types/hono';

// Minimal stand-in for the real per-request LogLayer instance — only the
// `.withError(...).error(...)` chain the handler calls needs to exist.
const noopLog = {
  withError: () => ({ error: () => undefined }),
} as unknown as AppVariables['log'];

// `postgres`'s type declarations only expose the inherited `Error(message?,
// options?)` constructor, even though the driver's real constructor takes a
// props object — build `code` on afterward to stay type-safe while matching
// runtime shape.
function buildPostgresError(code: string, message: string) {
  return Object.assign(new postgres.PostgresError(message), { code });
}

function buildApp() {
  const app = new Hono<{ Variables: AppVariables }>();
  app.use(async (c, next) => {
    c.set('log', noopLog);
    await next();
  });
  app.onError(errorHandler);
  app.notFound(notFoundHandler);

  app.get('/app-error', () => {
    throw new NotFoundError('Widget not found');
  });
  app.get('/postgres-error', () => {
    throw buildPostgresError('23505', 'duplicate key');
  });
  app.get('/postgres-error-unmapped', () => {
    throw buildPostgresError('42601', 'syntax error');
  });
  app.get('/http-exception', () => {
    throw new HTTPException(504, { message: 'Request timed out' });
  });
  app.get('/unknown-error', () => {
    throw new Error('boom');
  });

  return app;
}

describe('errorHandler', () => {
  it('maps an AppError subclass to its statusCode and message', async () => {
    const res = await buildApp().request('/app-error');
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ success: false, message: 'Widget not found' });
  });

  it('maps a PostgresError unique_violation (23505) to 409', async () => {
    const res = await buildApp().request('/postgres-error');
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ success: false });
  });

  it('falls through an unmapped PostgresError code to the generic 500', async () => {
    const res = await buildApp().request('/postgres-error-unmapped');
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ success: false, message: 'Internal server error' });
  });

  it('passes an HTTPException through via getResponse()', async () => {
    const res = await buildApp().request('/http-exception');
    expect(res.status).toBe(504);
  });

  it('maps an unknown error to a generic 500 without leaking details', async () => {
    const res = await buildApp().request('/unknown-error');
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toMatchObject({ success: false, message: 'Internal server error' });
    expect(JSON.stringify(body)).not.toContain('boom');
  });

  it('returns a 404 unifiedResponse shape for an undefined route', async () => {
    const res = await buildApp().request('/does-not-exist');
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({
      success: false,
      message: 'Route not found or wrong API method',
    });
  });
});
