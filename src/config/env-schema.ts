// src/config/env-schema.ts
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).optional(),

  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .url('DATABASE_URL must be a valid connection string')
    .refine((v) => /^postgres(ql)?:\/\//i.test(v), 'DATABASE_URL must start with postgres:// or postgresql://'),
});

export type EnvVars = z.infer<typeof envSchema>;