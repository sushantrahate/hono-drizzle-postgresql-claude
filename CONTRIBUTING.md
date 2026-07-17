# Contributing

Thanks for your interest in contributing! This is a boilerplate/reference
project, so contributions that improve its clarity, correctness, or
usefulness as a starting point are especially welcome.

## Getting Started

1. Clone the repo:
   ```bash
   git clone https://github.com/sushantrahate/hono-drizzle-postgresql-claude.git
   cd hono-drizzle-postgresql-claude
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start a local PostgreSQL 18 instance (via Docker, or a local install —
   whatever you have available), and copy `.env.example` to `.env.dev`,
   filling in your local `DATABASE_URL` and any other required values.
4. Run the database migrations:
   ```bash
   npm run db:migrate
   ```
5. Start the dev server:
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:4000`.

## Before Making Large Changes

Please open an issue to discuss the change first if it's a large refactor,
a new feature module, or anything touching the core architecture
(`app.ts`, middleware pipeline, DB client, error handling). This avoids
wasted effort on both sides if the change doesn't fit the project's
direction.

Small fixes (typos, docs, obvious bugs) don't need an issue first — feel
free to open a PR directly.

## The Actual Rulebook

This repo's coding conventions — architecture layering, response format,
validation, error handling, naming, comments, and testing — are documented
in [`context/coding-standards.md`](context/coding-standards.md). Read that
before writing code; this file only covers process.

## Optional: `/feature` Claude Code Skill

If you use [Claude Code](https://claude.com/claude-code), this repo ships a
`/feature` skill that drives the standard feature workflow (load → start →
implement → test → review → explain → complete). It's entirely optional —
you're welcome to work without it — but it encodes the same expectations
described below (branch naming, build/test gates before commit, etc.).

## Branching

Create a new branch per feature or fix:

- `feature/[name]` for new functionality
- `fix/[name]` for bug fixes

## Pre-PR Checklist

Before opening a PR, make sure all of the following pass locally:

```bash
npm run lint
npm run test
npm run build
```

These also run automatically via Husky git hooks (`lint-staged` on commit,
full `lint && test && build` on push), but please verify locally first.

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: ...` — new functionality
- `fix: ...` — bug fixes
- `chore: ...` — tooling, config, dependency changes
- `docs: ...` — documentation only

Keep commits focused — one logical change per commit.

## PR Review

Reviews will check for:

- **Layer boundaries** — `service.ts` never imports Hono or Drizzle;
  Drizzle is confined to `*.repository.drizzle.ts`; Hono `Context` is
  confined to `*.handler.ts`
- **Response format** — all handler responses use `unifiedResponse(...)`
  per `context/coding-standards.md`
- **Documentation** — TSDoc on exported functions/methods, route comments,
  and comments explaining non-obvious "why" decisions, per the Comments &
  Documentation section of `context/coding-standards.md`

## Reporting Vulnerabilities

Please do **not** open a public issue for security vulnerabilities. See
[`SECURITY.md`](SECURITY.md) for the private disclosure process.
