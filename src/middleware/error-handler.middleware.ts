// src/middleware/error-handler.middleware.ts
import type { Context, NotFoundHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import postgres from 'postgres';
import { unifiedResponse } from 'uni-response';

import { AppError } from '../errors/app-error';
import type { AppVariables } from '../types/hono';

/** Postgres SQLSTATE codes mapped to the HTTP status they should surface as. */
const POSTGRES_ERROR_STATUS: Record<string, ContentfulStatusCode> = {
  '23505': 409, // unique_violation
};

/**
 * Global error boundary wired via `app.onError(...)`. Maps thrown errors to
 * a consistent `unifiedResponse` failure shape so no `handler.ts` needs its
 * own try/catch, and the client never sees a raw stack trace or ORM error.
 */
export function errorHandler(error: Error, c: Context<{ Variables: AppVariables }>) {
  if (error instanceof AppError) {
    // AppError.statusCode is a plain `number` (errors/ stays Hono-agnostic per
    // coding-standards.md) — every subclass sets a real 4xx/5xx, so this is safe.
    return c.json(unifiedResponse(false, error.message), error.statusCode as ContentfulStatusCode);
  }

  if (error instanceof postgres.PostgresError) {
    const status = POSTGRES_ERROR_STATUS[error.code];
    if (status) {
      return c.json(unifiedResponse(false, 'Conflict'), status);
    }
  }

  if (error instanceof HTTPException) {
    return error.getResponse();
  }

  c.var.log.withError(error).error('Unhandled error');
  return c.json(unifiedResponse(false, 'Internal server error'), 500);
}

/** Wired via `app.notFound(...)` for requests that don't match any route. */
export const notFoundHandler: NotFoundHandler<{ Variables: AppVariables }> = (c) =>
  c.json(unifiedResponse(false, 'Not found'), 404);
