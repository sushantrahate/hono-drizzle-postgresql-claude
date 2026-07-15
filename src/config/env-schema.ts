// src/config/env-schema.ts
import { z } from 'zod';

/** Parse a comma-separated env string into a trimmed, non-empty string array */
const commaSeparatedList = (fieldName: string) =>
  z
    .string()
    .min(1, `${fieldName} is required`)
    .transform((v) =>
      v
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean),
    )
    .refine((entries) => entries.length > 0, `${fieldName} must contain at least one entry`);

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).optional(),

  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .url('DATABASE_URL must be a valid connection string')
    .refine(
      (v) => /^postgres(ql)?:\/\//i.test(v),
      'DATABASE_URL must start with postgres:// or postgresql://',
    ),

  /** Full origins (scheme + host [+ port]) allowed by CORS, e.g. https://app.example.com */
  ALLOWED_ORIGINS: commaSeparatedList('ALLOWED_ORIGINS').refine(
    (origins) => origins.every((origin) => /^https?:\/\/[^/]+$/i.test(origin)),
    'ALLOWED_ORIGINS entries must be valid http(s) origins (e.g. https://example.com)',
  ),

  /** Host names (no scheme) allowed by the Host-header whitelist, e.g. api.example.com */
  ALLOWED_HOSTS: commaSeparatedList('ALLOWED_HOSTS'),

  /**
   * Whether the app is behind a reverse proxy (nginx, load balancer) that sets
   * X-Forwarded-For. Only enable this if that header is actually set by a
   * trusted proxy in front of the app — otherwise clients can spoof their own
   * IP and bypass rate limiting entirely.
   */
  TRUST_PROXY: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

export type EnvVars = z.infer<typeof envSchema>;
