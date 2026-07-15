// src/config/security.config.ts

/** Rate limiting */
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX_REQUESTS = 100; // per IP, per window

/** Request body size limit, in bytes */
export const BODY_SIZE_LIMIT_BYTES = 1 * 1024 * 1024; // 1MB

/** Request timeout, in ms */
export const REQUEST_TIMEOUT_MS = 10 * 1000; // 10 seconds
