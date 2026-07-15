// src/constants/messages.constants.ts

/**
 * Centralized `unifiedResponse(...)` message strings, grouped by outcome.
 * Handlers/middleware reference these instead of inlining string literals,
 * so wording stays consistent and only needs to change in one place.
 */

/** Messages for successful (`unifiedResponse(true, ...)`) responses. */
export const SUCCESS = {
  // Populated as feature modules land — e.g. USER_CREATED, USER_FOUND.
} as const;

/** Messages for failure (`unifiedResponse(false, ...)`) responses. */
export const ERROR = {
  INTERNAL_SERVER_ERROR: 'Internal server error',
  BAD_REQUEST: 'Bad Request',
  CONFLICT: 'Conflict',
  ROUTE_NOT_FOUND: 'Route not found or wrong API method',
  HOST_NOT_ALLOWED: 'Host not allowed',
  TOO_MANY_REQUESTS: 'Too many requests, please try again later',
  REQUEST_BODY_TOO_LARGE: 'Request body too large',
  REQUEST_TIMED_OUT: 'Request timed out',
} as const;
