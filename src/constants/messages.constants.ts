// src/constants/messages.constants.ts

/**
 * Centralized `unifiedResponse(...)` message strings, grouped by outcome.
 * Handlers/middleware reference these instead of inlining string literals,
 * so wording stays consistent and only needs to change in one place.
 */

/** Messages for successful (`unifiedResponse(true, ...)`) responses. */
export const SUCCESS = {
  USER_CREATED: 'User created successfully',
  USERS_RETRIEVED: 'Users retrieved successfully',
  USER_RETRIEVED: 'User retrieved successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
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
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_IN_USE: 'Email already in use',
} as const;
