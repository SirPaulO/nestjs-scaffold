# Backend Skeleton — Technical Reference

## Overview
Generic NestJS 11 + TypeScript 5 backend scaffold.
Stack: Node 24 LTS, NestJS 11, TypeORM 0.3, PostgreSQL 18, Valkey 7 (Redis-compatible).

Coding standards, patterns & architecture: see **`CODING_STANDARDS.md`** — read it before developing or reviewing code.

Update or create any AGENTS.md file as needed to reflect new or modified code, features, routes, and architecture.

---

## Project Structure

```
src/
├── modules/          # Feature modules (one per domain)
│   ├── auth/         # JWT authentication (see modules/auth/AGENTS.md)
│   └── cache/        # Valkey/Redis caching (see modules/cache/AGENTS.md)
├── common/           # Shared utilities (see common/AGENTS.md)
├── config/           # Config factories (see config/AGENTS.md)
├── database/         # TypeORM entities, migrations, seeds (see database/AGENTS.md)
└── main.ts

test/                 # ALL tests live here — NO *.spec.ts in src/ (see Testing)
├── modules/…/*.spec.ts  # Unit specs, mirroring the src/ tree (same relative path)
├── jest-e2e.json    # E2E jest config
└── *.e2e-spec.ts    # E2E specs
```

---

## Module Documentation

| Location | Description |
|---|---|
| `src/common/AGENTS.md` | Guards, decorators, filters, validators, DTOs |
| `src/config/AGENTS.md` | Configuration factories |
| `src/database/AGENTS.md` | Base entity, migrations, naming strategy |
| `src/modules/auth/AGENTS.md` | JWT auth, strategies, guards |
| `src/modules/cache/AGENTS.md` | Cache service and patterns |

---

## Local Development

```bash
docker-compose up -d          # Start PostgreSQL + Valkey
cp .env.example .env          # Configure environment
npm install
npm run migration:run
npm run start:dev
```

API docs: http://localhost:3000/api/docs

---

## Commands

```bash
npm run start:dev              # Watch mode
npm run start:debug            # Debug mode (port 9229)
npm run build                  # Compile TypeScript
npm run lint                   # ESLint with auto-fix
npm run format                 # Prettier
npm run test                   # Unit tests
npm run test:cov               # Coverage
npm run test:e2e               # E2E tests
npm run migration:generate -- src/database/migrations/MigrationName
npm run migration:run
npm run migration:revert
npm run db:seed                # Seed database (create src/database/seeds/seed.ts)
```

---

## Development Standards

### TypeScript
- No `any` types — use `unknown`
- Strict mode enabled; all strict compiler options on
- Always declare return types on public methods
- Classes: `PascalCase`, functions: `camelCase`, constants: `UPPER_SNAKE_CASE`

### Code Organisation
- Files ≤ 300 lines; functions ≤ 50 lines
- Constructor injection only (no `@Inject()` property injection)
- Use NestJS built-in exceptions (`NotFoundException`, `BadRequestException`, etc.)
- No `console.log` — use the NestJS `Logger`

### NestJS
- One clear purpose per module/class
- Separate DTOs for create, update, and response shapes
- Use `class-validator` on all DTOs

---

## Testing

- **Minimum coverage**: 80% overall, 100% for auth and critical paths
- Pattern: `Arrange → Act → Assert` inside `describe('ServiceName') > describe('methodName')`
- Unit tests mock all external dependencies
- **Spec location**: every `*.spec.ts` lives under `test/`, mirroring the `src/` tree
  (`src/modules/foo/foo.service.ts` → `test/modules/foo/foo.service.spec.ts`). Do **NOT**
  co-locate specs next to source. Jest `roots` is `["<rootDir>/test"]`, `testRegex: .*\.spec\.ts$`,
  coverage measured from `src/**`.
- **Subject imports**: from a spec, import the code under test (and any other `src` code) via the
  `@modules/` / `@common/` / `@config/` / `@database/` path aliases (jest `moduleNameMapper` +
  `tsconfig` `paths`), never relative `../../src/...` paths. The handful of root-level files
  (`app.module.ts`, `app.controller.ts`, `instrument.ts`) have no alias — import those via a plain
  relative path from `test/` (e.g. `../src/app.module`).
- E2E tests live in `test/` and use `jest-e2e.json`
- `setupFiles` (`test/setup-env.ts`) seeds baseline env vars (`DATABASE_USERNAME/PASSWORD/NAME`,
  `JWT_SECRET`, `CORS_ORIGIN`, `SYSTEM_API_KEYS`) before every test file loads, because several
  config factories now fail closed at import/instantiation time when a required secret is
  missing. A spec that exercises that fail-closed branch itself overrides/deletes the variable.
- `npm run verify`'s `jest --coverage` no longer passes `--passWithNoTests` — an empty test suite
  is a failing Definition of Done, not a silent pass.

---

## Git Workflow

### Commit Messages (Conventional Commits)
```
feat(scope): description
fix(scope): description
test(scope): description
docs(scope): description
```

### Branch Naming
- `feature/description`
- `fix/description`
- `hotfix/description`
- `refactor/description`

### Commit Signing

All commits are **SSH-signed** with the `id_ed25519_tavolai` key. The `load.sh` script starts an
ssh-agent, adds that key, and exports `SSH_AUTH_SOCK` / `SSH_AGENT_PID` (plus `SSH_ASKPASS`).

**Source** the script (don't `eval` it) so the exports land in your current shell:

```bash
source /home/sirpaul/Documents/load.sh
```

**For AI agents / non-interactive shells:** each command runs in a *fresh* shell — the loaded agent and
its env vars do **not** persist between separate tool calls. Source the script and commit in the **same**
invocation, chained with `&&`:

```bash
source ~/Documents/load.sh && git commit -S -m "feat(scope): message"
```

---

## Security Standards

- Bcrypt hashing (cost ≥ 12)
- JWT in Authorization header (Bearer). **Every route denies by default** — `JwtAuthGuard` is
  registered globally (`APP_GUARD` in `app.module.ts`); opt a route out explicitly with
  `@Public()` (used today by `GET /health` and the whole `InternalController`, which
  authenticates via `X-Api-Key` instead).
- Global rate limiting via `@nestjs/throttler` (`ThrottlerGuard` as a second global `APP_GUARD`,
  ahead of the JWT guard so it also throttles unauthenticated/invalid requests), configured from
  `RATE_LIMIT_TTL` / `RATE_LIMIT_MAX`.
- `helmet()` is applied as global middleware in `main.ts`.
- CORS is **fail-closed**: `main.ts` throws at boot if `CORS_ORIGIN` is unset — there is no
  fallback to an unrestricted `origin: '*'` (which combined with `credentials: true` would be
  a real vulnerability, not just a bad default).
- `ApiKeyGuard` compares `X-Api-Key` in **constant time** (`crypto.timingSafeEqual` over
  SHA-256 digests of both sides, so length differences never short-circuit the comparison) and
  fails closed (denies everything) when `SYSTEM_API_KEYS` is unset.
- Database credentials have **no weak defaults** — `database.config.ts` throws at boot if
  `DATABASE_USERNAME` / `DATABASE_PASSWORD` / `DATABASE_NAME` are unset. When `DATABASE_SSL=true`,
  certificates are verified by default (`rejectUnauthorized: true`); disabling verification
  requires the explicit opt-out `DATABASE_SSL_REJECT_UNAUTHORIZED=false`.
- Sentry (`instrument.ts`) defaults `sendDefaultPii: false` and scrubs
  Authorization/Cookie/X-Api-Key headers and token/secret/password-shaped fields from every event
  and log via `beforeSend`/`beforeSendLog` before anything leaves the process.
- Never log sensitive data (passwords, tokens, PII)
- Parameterised queries via TypeORM (no raw string interpolation)
- Input validation on every DTO via class-validator

---

## Environment Variables

All required variables are documented in `.env.example`.
Add every new variable to `.env.example` — this is mandatory.
