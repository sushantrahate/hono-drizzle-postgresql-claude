# Security Hardening

## Overview

Add baseline security middleware to the boilerplate — secure headers, rate
limiting, host/origin whitelisting, and a few related protections that
round out a production-ready API, using Hono's built-in and community
middleware.

## Requirements

### Secure headers (Helmet equivalent)

- Use `hono/secure-headers` (built-in, no extra install) in `app.ts`
- Configure explicitly rather than relying on defaults alone:
  - `contentSecurityPolicy` — sensible default-src 'self' policy (adjust per
    project once real frontend origins are known)
  - `xFrameOptions: 'DENY'`
  - `xContentTypeOptions: 'nosniff'`
  - `referrerPolicy: 'no-referrer'`
  - `strictTransportSecurity` enabled in production only (HSTS makes no
    sense over local HTTP dev)

### Rate limiting

- Use `hono-rate-limiter` (community package, already scoped out earlier)
- Apply a global default limiter in `app.ts` (e.g. 100 requests / 15 min per
  IP) plus the ability for individual routes to apply a stricter limiter
  (e.g. auth/login endpoints once they exist)
- **Must correctly identify client IP behind a reverse proxy** — if deployed
  behind nginx/a load balancer, `X-Forwarded-For` needs to be trusted
  correctly or every request will appear to come from the same IP and the
  limiter becomes useless. Document the trust-proxy consideration even if
  local dev doesn't need it yet.
- Rate limit rejections should return a `unifiedResponse(false, ...)`-shaped
  429, not the package's default error body

### Host / origin whitelisting

- CORS: use `hono/cors` (built-in) restricted to an explicit allow-list, not
  `origin: '*'`
- Add `ALLOWED_ORIGINS` to `env-schema.ts` as a comma-separated list
  (reuse the `commaSeparatedList` pattern already used for `CLIENT_URLS` in
  other projects) — validate each entry is a valid http(s) URL. This drives
  `hono/cors`'s `origin` option.
- Add `ALLOWED_HOSTS` to `env-schema.ts` as a **separate** comma-separated
  list — this is host *names* (e.g. `api.example.com`, `localhost:3000`),
  not full URLs, so it's a distinct field from `ALLOWED_ORIGINS`, not a
  reuse of it. Add a `commaSeparatedList` transform same as the others.
- Add `src/middleware/host-whitelist.middleware.ts`:
  - Reads the incoming `Host` header from the request
  - Rejects with `unifiedResponse(false, 'Host not allowed')` + 403 if the
    header doesn't exactly match an entry in `ALLOWED_HOSTS`
  - Mount early in `app.ts`, before CORS and rate limiting — no point
    processing a request further if the Host itself is untrusted
  - Log rejections via the shared `log` instance with the offending Host
    value, for visibility into potential DNS-rebinding/scanning attempts
- This is deliberately separate from CORS: CORS is enforced by the
  **browser** based on the response's `Access-Control-Allow-Origin` header
  and can be bypassed entirely by non-browser clients (curl, server-to-server
  calls, scripts). Host whitelisting is enforced **server-side** on every
  request regardless of client — it's the actual protection against
  host-header injection and DNS rebinding, CORS is not.

### Other suggested additions

- **Request body size limit** — use `hono/body-limit` to cap incoming
  request bodies (e.g. 1MB default) to prevent large-payload DoS attempts
- **Request timeout** — use `hono/timeout` so a hung handler/DB query can't
  hold a connection open indefinitely
- **`npm audit` in CI/pre-push** — add `npm audit --audit-level=high` to the
  Husky pre-push hook (alongside lint/test/build) so known-vulnerable
  dependencies block a push rather than going unnoticed
- **Error responses must never leak stack traces or internal details** —
  confirm the centralized error-handling middleware (from earlier setup)
  strips this in production; only return generic messages + a request id
  for correlation with server-side logs

## Notes

- Depends on `uni-response` being installed — rate-limit rejections,
  host-mismatch rejections, and error responses should all use
  `unifiedResponse(...)` directly (see `context/coding-standards.md` →
  Response Format), wrapped in `c.json(...)`. No custom wrapper file —
  call `unifiedResponse` directly in middleware, same as handlers do.
- This boilerplate is a JSON API with no server-rendered HTML and no
  cookie-based sessions yet, so CSRF protection (`hono/csrf`) is **not**
  included in this pass — revisit if/when cookie-based auth is added later
- Depends on the logging feature (already implemented) for logging rejected
  requests (rate-limited, host-mismatched, oversized body) with useful
  context — use the shared `log` instance, not `console.log`
- This is infrastructure, not a `modules/` feature — lives in `src/app.ts`,
  `src/middleware/`, and `src/config/`, not under `src/modules/`
- Keep all thresholds (rate limit window/max, body size limit, timeout
  duration) as named constants or env-driven values, not magic numbers
  buried in `app.ts` — someone should be able to tune these without
  hunting through the file