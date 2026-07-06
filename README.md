# Backend Skeleton

A generic NestJS backend scaffold — the canonical template new backend services are cloned from.
It ships only cross-cutting infrastructure (auth, caching, config, error handling, observability,
security defaults); feature modules are added per service.

**Stack:** Node 24 LTS · NestJS 11 · TypeScript 5 · TypeORM 0.3 · PostgreSQL 18 ·
Valkey 7 (Redis-compatible).

---

## Prerequisites

- **Node.js 24 LTS** — the version is pinned in `.nvmrc`; run `nvm use` (or install `v24.13.1`).
- **npm** (bundled with Node).
- **Docker** + **Docker Compose** — to run PostgreSQL and Valkey locally.

---

## Quick Start

```bash
nvm use                       # Node 24 (from .nvmrc)
docker compose up -d          # Start PostgreSQL + Valkey
cp .env.example .env          # Then edit .env — see "Environment" below
npm ci                        # Reproducible install from package-lock.json
npm run migration:run         # Apply database migrations
npm run start:dev             # Start in watch mode
```

Then verify it's up:

- **Health check:** `curl http://localhost:3000/health` → `{"status":"ok"}`
- **API docs (Swagger):** http://localhost:3000/api/docs (only when `ENABLE_DOCS=true`)

> The app **fails closed** on missing secrets — it refuses to boot if `CORS_ORIGIN`, the
> `DATABASE_USERNAME`/`PASSWORD`/`NAME`, or `JWT_SECRET` are unset. `.env.example` ships working
> local defaults for all of them, but change the secret-shaped ones before doing anything real.

---

## Environment

Every variable is documented in **`.env.example`** — copy it to `.env` and adjust. Adding a new env
var **requires** adding it to `.env.example` in the same change.

Values you should change before real use:

| Variable | Why |
|---|---|
| `JWT_SECRET` | Signing secret for JWTs. Use a long random string. |
| `SYSTEM_API_KEYS` | Comma-separated keys accepted by `ApiKeyGuard` on `/internal/*`. |
| `DATABASE_USERNAME` / `DATABASE_PASSWORD` / `DATABASE_NAME` | No default credentials — required. |
| `CORS_ORIGIN` | Comma-separated allow-list of browser origins. No `*` fallback. |
| `VALKEY_PASSWORD` | Cache auth password. |

Other groups: `RATE_LIMIT_TTL`/`RATE_LIMIT_MAX` (global throttling), `DATABASE_SSL*` (TLS),
`SENTRY_*` (observability), `ENABLE_DOCS` (Swagger), `LOG_LEVEL`.

> `SENTRY_AUTH_TOKEN` is **not** an app variable — it's a CI/release secret used by
> `npm run sentry:sourcemaps`. Set it as a GitHub Actions secret, not in `.env`.

---

## Project Structure

```
src/
├── main.ts               # Bootstrap: Sentry, helmet, ValidationPipe, CORS, Swagger
├── instrument.ts         # Sentry init — MUST be the first import in main.ts
├── app.module.ts         # Root module: Config + TypeORM + global guards + feature modules
├── app.controller.ts     # GET /health (public liveness probe)
├── common/               # Guards, decorators, filters, validators, DTOs, error codes
├── config/               # registerAs() config factories (database, cache, rate-limit)
├── database/             # BaseEntity, migrations, seeds, snake_case naming strategy
└── modules/
    ├── auth/             # JWT strategy + guard (global, deny-by-default)
    ├── cache/            # Valkey/Redis CacheService
    └── internal/         # X-Api-Key-guarded service-to-service routes (/internal/*)

test/                     # ALL tests live here, mirroring src/ (no *.spec.ts in src/)
```

Each non-trivial directory has its own `AGENTS.md` with the details.

---

## Available Scripts

```bash
npm run start:dev              # Watch mode
npm run start:debug            # Debug mode (port 9229)
npm run build                  # Compile TypeScript
npm run lint                   # ESLint (check only)
npm run format                 # ESLint --fix + Prettier --write
npm test                       # Unit tests
npm run test:cov               # Unit tests with coverage
npm run test:e2e               # E2E tests (test/jest-e2e.json)
npm run verify                 # lint + build + jest --coverage — the Definition of Done gate
npm run migration:generate -- src/database/migrations/MyMigration
npm run migration:run
npm run migration:revert
npm run db:seed                # Runs src/database/seeds/seed.ts (create it first)
```

---

## Testing & Definition of Done

- **`npm run verify`** (`lint` + `build` + `jest --coverage`) must be green with zero errors before
  a change is done. Coverage gate is **80%** (100% on auth/validation/critical paths).
- Unit specs live under `test/`, mirroring the `src/` tree; they mock all external dependencies.
- Full conventions: see **[`CODING_STANDARDS.md`](CODING_STANDARDS.md)** §13.

---

## Docker

```bash
docker compose up -d           # PostgreSQL + Valkey for local development
docker build -t backend .      # Build the production image (no secrets required)
```

The image is multi-stage (development → build → production) and runs as a non-root user with a
`/health` HEALTHCHECK.

---

## Security Defaults

This skeleton **denies by default** and fails closed:

- Every route requires a JWT unless marked `@Public()` (global `JwtAuthGuard`).
- Global rate limiting (`@nestjs/throttler`) and `helmet()` are wired out of the box.
- CORS and database credentials refuse to boot if unconfigured — no unrestricted `*` or default
  passwords.
- `X-Api-Key` on `/internal/*` is compared in constant time and fails closed when unset.
- Sentry scrubs auth headers and secret-shaped fields before anything leaves the process.

Keep these defaults intact in any clone — don't work around them to move faster. Full list:
[`CODING_STANDARDS.md`](CODING_STANDARDS.md) §9/§14 and [`AGENTS.md`](AGENTS.md) → Security Standards.

---

## Creating a New Service

This repo is a template. See **[`CODING_STANDARDS.md`](CODING_STANDARDS.md)** for the full backend
standards (stack & version targets, architecture, testing, Definition of Done). When cloning to
start a new service, complete this rename checklist before committing service-specific code:

- [ ] `package.json` → set `"name"` to the new service (e.g. `"notifications"`).
- [ ] `package.json` `sentry:sourcemaps` script → replace `your-sentry-org` / `your-sentry-project`
      with the service's real Sentry org and project slug.
- [ ] `docker-compose.yml` → rename container names `backend-postgres` / `backend-valkey`
      (e.g. `notifications-postgres`, `notifications-valkey`).
- [ ] `.env.example` → set `DATABASE_NAME` to the new service's database name.
- [ ] `AGENTS.md` → update the title, overview paragraph, and stack table.
- [ ] Add the `SENTRY_AUTH_TOKEN` secret in the repo's GitHub Actions settings (for source maps).

---

## Documentation

| File | What it covers |
|---|---|
| [`README.md`](README.md) | This file — getting started. |
| [`AGENTS.md`](AGENTS.md) | Technical reference for humans and AI agents (imports the standards). |
| [`CODING_STANDARDS.md`](CODING_STANDARDS.md) | Coding conventions, stack & version targets, patterns, architecture — read before writing code. |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Setup, branch/commit conventions, PR process. |
| `src/**/AGENTS.md` | Per-directory documentation. |

---

## License

Private / `UNLICENSED` (see `package.json`). Not for public distribution.
