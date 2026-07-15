# 🚀 Hono + TypeScript + Drizzle + PostgreSQL + Claude AI Boilerplate

A backend built with Node.js, Hono, TypeScript, and Drizzle ORM. 

```
npm install
npm run dev
```

```
open http://localhost:4000
```

## Scripts

| Command             | Description                              |
| -------------------- | ----------------------------------------- |
| `npm run dev`         | Start the dev server (watch mode)         |
| `npm run build`       | Type-check and compile to `dist/`         |
| `npm run start`       | Run the compiled production build         |
| `npm run test`        | Run the Vitest suite                      |
| `npm run lint`        | Check formatting, imports, and lint rules with Biome |
| `npm run lint:fix`    | Same as `lint`, writing fixes in place    |
| `npm run format`      | Format all files with Biome               |

Biome (lint + format) and a Husky pre-commit hook run automatically on
`git commit` (via `lint-staged`) and `git push` (`lint && test && build`).

