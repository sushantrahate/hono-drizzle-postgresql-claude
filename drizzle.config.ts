import fs from 'node:fs';
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
  // Feature modules define their own table(s) in `<feature>.repository.drizzle.ts`
  // (coding-standards.md); src/db/schema is only for tables shared across modules.
  schema: ['./src/db/schema/*', './src/modules/**/*.repository.drizzle.ts'],
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // biome-ignore lint/style/noNonNullAssertion: standalone CLI script, not routed through the app's Zod-validated env — missing DATABASE_URL should fail loudly here
    url: process.env.DATABASE_URL!,
  },
});
