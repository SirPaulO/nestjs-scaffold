# Security Policy

## Reporting a vulnerability

**Do not open a public issue for security problems.**

Report privately via GitHub's **[Security Advisories](../../security/advisories/new)** (Security →
Report a vulnerability), or email the maintainers/security team. Include:

- a description and impact,
- steps to reproduce or a proof of concept,
- affected branch/commit and any relevant configuration.

You'll get an acknowledgement, and we'll coordinate a fix and disclosure timeline with you.

> Replace the reporting channel above with your team's real contact (security email or advisory URL)
> when you clone this skeleton into a service.

## Supported versions

This is a template repository; security fixes land on `main`. Services cloned from it are
responsible for their own supported-version policy.

## Security posture

This skeleton is **secure by default and fails closed** — please keep these guarantees intact:

- **Deny by default:** every route requires a JWT unless explicitly `@Public()`.
- **Fail-closed config:** the app refuses to boot without `CORS_ORIGIN`, database credentials, or
  `JWT_SECRET`. There is no unrestricted `*` CORS fallback and no default database password.
- **Constant-time API keys:** `X-Api-Key` on `/internal/*` is compared with `timingSafeEqual` and
  denies everything when `SYSTEM_API_KEYS` is unset.
- **Hardening wired in:** global rate limiting (`@nestjs/throttler`), `helmet()`, TLS certificate
  verification on by default.
- **No data leakage:** Sentry scrubs Authorization/Cookie/X-Api-Key headers and secret-shaped
  fields before anything leaves the process; never log secrets or PII.

## Handling secrets

- Never commit secrets, tokens, or `.env` files (they are git-ignored — keep it that way).
- `.env.example` contains placeholders only; set real values locally and in your deployment's secret
  manager.
- CI/release secrets (e.g. `SENTRY_AUTH_TOKEN`) belong in GitHub Actions secrets, not the repo.

See [`CODING_STANDARDS.md`](CODING_STANDARDS.md) §9/§14 for the full security standard.
