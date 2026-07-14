import fs from 'fs';
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

/** Mirrors the NODE_ENV -> .env.<suffix> resolution in src/config/env.ts */
const toFileSuffix = (env?: string) => {
  switch ((env || '').toLowerCase()) {
    case 'development':
    case 'dev':
      return 'dev';
    case 'production':
    case 'prod':
      return 'prod';
    case 'test':
      return 'test';
    default:
      return 'dev';
  }
};

const envFile = `.env.${toFileSuffix(process.env.NODE_ENV)}`;
if (fs.existsSync(envFile)) {
  config({ path: envFile });
}

export default defineConfig({
  schema: './src/db/schema/*',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
