// src/errors/app-error.ts
// Deliberately framework-agnostic (plain `number`, not Hono's status-code
// type) — service/repository code throws these and must not import Hono.

/**
 * Base class for errors that should be translated into an HTTP response by
 * the global error handler. Services/repositories throw these (or a
 * subclass) instead of shaping HTTP responses themselves.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/** Requested resource doesn't exist. */
export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 404);
  }
}

/** Request conflicts with existing state (e.g. duplicate email). */
export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

/** Business-rule validation failure outside Zod's request-body schema checks. */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400);
  }
}

/** Not yet thrown anywhere — reserved so auth work doesn't need a second error-handling pass. */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}
