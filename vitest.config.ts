import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

// Reads the `@/*` alias straight from tsconfig.json (paths) so it isn't
// hand-duplicated here. Vite's native `resolve.tsconfigPaths` option is
// still experimental and failed to resolve `@/*` imports as of Vite 8/
// Vitest 4 — this plugin is the reliable path for now.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: false,
    environment: 'node',
    // Early in the project there may be zero test files (e.g. a fresh
    // module scaffold); don't fail CI/pre-push for that, only for actual
    // failing assertions.
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        '**/*.types.ts',
        '**/*.routes.ts',
        'src/db/migrations/**',
        'src/config/**',
        '*.config.ts',
      ],
    },
  },
});
