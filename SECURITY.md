# Security Policy

## Supported Versions

This repository is a boilerplate/template project, not a versioned library
release. There is one actively supported branch: `main`. Security fixes are
made against `main` only.

## Scope

This policy covers vulnerabilities in **this repository's own code** —
application code, middleware, configuration, and infrastructure files under
`src/`, `context/`, and the repo root.

Out of scope:

- Vulnerabilities in third-party dependencies (`node_modules`). Please
  report those upstream to the dependency's own maintainers or via their
  ecosystem's advisory database (e.g. the [npm advisory
  database](https://github.com/advisories)). Dependabot is configured in
  this repo to track and update dependencies automatically.
- Downstream projects that were bootstrapped from this template. Once a
  project is cloned/forked and diverges from this boilerplate, its security
  posture is the responsibility of that project's own maintainers.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead, report privately via GitHub Security Advisories:

https://github.com/sushantrahate/hono-drizzle-postgresql-claude/security/advisories/new

### What to include

To help us triage and reproduce the issue quickly, please include:

- A clear description of the vulnerability and its potential impact
- Steps to reproduce (proof-of-concept code or a minimal repro if possible)
- The affected file(s) or endpoint(s)
- Any suggested remediation, if you have one

### What to expect

- **Acknowledgement**: we aim to acknowledge new reports within a few days.
- **Coordinated disclosure**: we'll work with you privately to understand,
  confirm, and fix the issue before any public disclosure. Please don't
  disclose the issue publicly until a fix has been released and we've
  agreed on a disclosure timeline together.
- **Credit**: reporters are credited in the advisory/release notes by
  default, unless you request to remain anonymous.

Thank you for helping keep this project and its users safe.
