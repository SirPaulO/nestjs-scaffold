# Coding Standards

> **Read this before writing code or reviewing a PR in this repository.**
> It defines the coding conventions, patterns, folder structure, and architecture every change must follow.
>
> This repo (`backend-skeleton`) is the **canonical reference** that new services are cloned from.
> Part 1 below is the shared standard; Part 2 is specific to this service.

---

# Part 1 — Shared standards (identical across all backend services)

## Technology stack

| Category | Standard | Notes |
|----------|----------|-------|
| Runtime | **Node.js 24 LTS** | `.nvmrc` → `v24.13.1`; Dockerfile `node:24-alpine`; CI `node-version: '24'`. |
| Framework | **NestJS 11.x** | `@nestjs/*` `^11.x`. |
| Language | **TypeScript 6.x** | strict mode — see §1. |
| ORM | **TypeORM 1.x** | with `SnakeNamingStrategy`. |
| Database | **PostgreSQL 18** (`postgres:18-alpine`) | |
| Cache | **Valkey 7** (Redis-compatible) via `ioredis` + `cache-manager` | |
| Validation | `class-validator` + `class-transformer` | on every DTO. |
| Auth | `@nestjs/passport` + `passport-jwt` + `@nestjs/jwt` | JWT bearer. |
| Observability | `@sentry/nestjs` `^10` + `@sentry/cli` `^3` | see §10. |
| Docs | `@nestjs/swagger` `^11` | served at `/api/docs`, gated by `ENABLE_DOCS`. |
| Test | Jest 30 + `ts-jest` + `supertest` | see §13. |
| Lint/Format | ESLint 10 (flat config) + Prettier 3 | see §3 → Lint & format. |
| Git hooks | Husky 9 + commitlint | see §15. |
| Rate limiting | `@nestjs/throttler` `^6` | global `ThrottlerGuard` (§9). |
| Security headers | `helmet` `^8` | global middleware (§11). |

The stack table in each repo's `AGENTS.md` must match this and the actual
`package.json` / `.nvmrc` / `Dockerfile`.

### Version targets (track latest majors; toolchain ceilings noted)

| Package | Target | Notes |
|---------|--------|-------|
| Node | **24.x LTS** | `.nvmrc` → `v24.13.1` |
| `@nestjs/*` core | `^11.1.x` | |
| `typeorm` | `^1.1.0` | on the 1.x line — `@nestjs/typeorm` peer allows `^1.0.0-dev` |
| `typescript` | `~6.0.3` | **TS 7 held** — `typescript-eslint` peer-caps `<6.1`, `ts-jest` caps `<7` |
| `eslint` + `@eslint/js` | `^10.x` | flat config |
| `typescript-eslint` | `^8.x` | supports ESLint 10; peer-caps TypeScript at `<6.1` |
| `prettier` | `^3.x` | |
| `jest` + `@types/jest` | `^30.x` | |
| `ts-jest` | `^29.x` | supports Jest 30; peer-caps TypeScript at `<7` |
| `@types/node` | `^24.x` | pinned to the Node 24 LTS runtime (not 26.x) |
| `class-validator` / `class-transformer` | `^0.15` / `^0.5` | |
| `@sentry/nestjs` / `@sentry/cli` | `^10` / `^3` | |
| `ioredis` / `pg` / `cache-manager` | `^5` / `^8` / `^7` | |
| `helmet` / `@nestjs/throttler` | `^8` / `^6` | |
| `husky` / `@commitlint/*` | `^9` / `^21` | |
| `zod` | `^4.x` | |

## 1. Language & TypeScript

- **No `any`.** Use `unknown` and narrow, or a precise type/interface.
- **Strict mode** is on (`strict`, `strictNullChecks`, `noImplicitAny`, `noUnusedLocals`,
  `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `strictBindCallApply`). Fix every
  TS error before committing — do not suppress with `// @ts-ignore`.
- **Explicit return types** on all public/exported methods.
- **Canonical `tsconfig.json`:** `module: commonjs`, `target: ES2023`, `rootDir: "."` (TS 6
  requires it explicit; ts-jest/ts-node span `src/` + `test/`, while `tsconfig.build.json` overrides
  it with `rootDir: "./src"`). **No explicit `moduleResolution`** — it is inferred as `node10` from
  `module: commonjs`; TS 6 deprecation-gates `node10`, so `ignoreDeprecations: "6.0"` is set
  (modernizing `moduleResolution` is deferred to the eventual TS 7 migration). Also `esModuleInterop`,
  `isolatedModules`, `declaration`, `removeComments`, `emitDecoratorMetadata`, `experimentalDecorators`,
  `allowSyntheticDefaultImports`; `sourceMap` + `inlineSources` on (Sentry); `outDir: ./dist`,
  `incremental`, `skipLibCheck`; the `paths` aliases from §3. **No `baseUrl`** — each `paths` target
  is written repo-root-relative with a `./` prefix (`@modules/*` → `["./src/modules/*"]`), which
  TypeScript 6 resolves relative to the `tsconfig.json` location without needing `baseUrl`.

## 2. Naming & files

| Thing | Convention | Example |
|-------|-----------|---------|
| Classes / Services / Controllers | `PascalCase` | `ReservationService` |
| Variables / functions | `camelCase` | `findUserById` |
| Constants / enum values | `UPPER_SNAKE_CASE` | `MAX_PARTY_SIZE` |
| Files | match the class; suffix by role | `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.entity.ts`, `*.dto.ts`, `*.guard.ts`, `*.strategy.ts`, `*.spec.ts` |

## 3. Code organisation

- **Files ≤ 300 lines; functions ≤ 50 lines.** Split when you exceed this.
- **Single responsibility** — one clear purpose per class/function.
- **Import order:** Node builtins → external packages → NestJS → internal (`@…` aliases) → relative.
- **Path aliases — always use them in `src/`** instead of deep relative imports:
  `@modules/*`, `@common/*`, `@config/*`, `@database/*`.
  In `tsconfig.json` these are declared **without `baseUrl`**, so each target is written
  repo-root-relative with a `./` prefix (`@modules/*` → `["./src/modules/*"]`).
  They are configured in **three places that must stay in sync**: `tsconfig.json` `paths`,
  `package.json` jest `moduleNameMapper`, and ts-node for migrations.

### Comments

- **Minimal comments.** The code must be understandable without them — make classes, functions, and
  variables self-explanatory through naming, not narration. If a comment is only restating what the
  code already says, delete it and improve the name instead.
- **No task/progress tracking in comments.** No `TODO:`/`FIXME:` backlogs, no "step 1/2/3"
  narration, no ticket/task/PR references. That state belongs in the issue tracker, not the source.
- **No block comments** (no JSDoc `/** … */`, no `/* … */` prose). Names carry the meaning. The
  only non-prose exceptions are tool directives (`eslint-disable`, `ts-expect-error`) where
  genuinely unavoidable, and a required file license/header. Non-obvious *rationale* that would
  otherwise go in a block comment belongs in the nearest `AGENTS.md`, not inline.

### Lint & format

- **ESLint** — flat config (`eslint.config.mjs`), `typescript-eslint` type-checked. Production
  `**/*.ts` (errors): `no-explicit-any`, `no-floating-promises`, `no-unsafe-*`,
  `prefer-nullish-coalescing`, `prefer-optional-chain`, `require-await`, `no-unused-vars`
  (`argsIgnorePattern: '^_'`), `prettier/prettier`. In `**/*.spec.ts` / `test/**`: `no-explicit-any`
  off, `no-unsafe-*` relaxed to **warn**, `prefer-*` off; `require-await` and `no-unused-vars` stay errors.
- **Prettier** (`.prettierrc`, identical in every repo): `singleQuote`, `trailingComma: all`, `semi`,
  `printWidth: 80`, `tabWidth: 2`, `useTabs: false`, `endOfLine: auto`.
- Commands: `npm run lint` (check) · `npm run format` (eslint --fix + prettier --write).

## 4. NestJS patterns

- **Constructor injection only**, `private readonly`. No `@Inject()` property injection except for framework
  tokens (e.g. `CACHE_MANAGER`).
- One feature = one module folder (see §12). Keep modules **leaf-shaped**: avoid circular imports; if A needs
  B and B needs A, extract the shared piece.
- **DTOs:** separate `create` / `update` / `response` DTOs; **every** DTO field has `class-validator`
  decorators. The global `ValidationPipe` runs `whitelist: true` + `forbidNonWhitelisted: true` + `transform`,
  so undocumented fields are rejected.
- **Exceptions:** throw NestJS built-ins (`NotFoundException`, `BadRequestException`, `ForbiddenException`,
  `ConflictException`, …). Never throw bare strings.
- **Logging:** inject `Logger` from `@nestjs/common` with `ClassName.name` context. **Never `console.log`.**
- Prefer `async/await` over `.then()` chains. Never leave a floating promise (lint enforces this).

## 5. Configuration

- Config lives in `src/config/*.config.ts` as `registerAs()` factories, loaded in `app.module.ts` via
  `ConfigModule.forRoot({ isGlobal: true, load: [...] })`.
- **Never read `process.env` in business logic.** Inject `ConfigService` or a typed config. The only places
  `process.env` is allowed are `main.ts` and `instrument.ts` (bootstrap, before DI exists).
- **Every new env var must be added to `.env.example`** in the same change.

## 6. Database & TypeORM

- All entities extend **`BaseEntity`** (`src/database/entities/base.entity.ts`): UUID `id`,
  `createdAt`/`updatedAt`/`deletedAt` as `timestamptz`, soft-delete.
- **`SnakeNamingStrategy`** maps camelCase entity props → snake_case columns. Write entities in camelCase.
- **Store all datetimes as UTC** (`timestamptz`).
- **No N+1 queries** — use eager relations or `QueryBuilder` joins.
- Schema changes go through **migrations** (`npm run migration:generate`/`run`), never `synchronize` in prod.
- `databaseConfig` (registerAs) feeds the app; the exported `dataSource` feeds the TypeORM CLI — keep both
  in `src/config/database.config.ts`.
- **No weak default credentials.** `DATABASE_USERNAME`/`DATABASE_PASSWORD`/`DATABASE_NAME` have no
  `?? 'postgres'`-style fallback — `database.config.ts` throws at boot if any is unset.
- **`DATABASE_SSL=true` verifies certificates by default** (`rejectUnauthorized: true`). A custom CA
  bundle is `DATABASE_SSL_CA`; disabling verification is an explicit, logged opt-out
  (`DATABASE_SSL_REJECT_UNAUTHORIZED=false`), never the default.

## 7. Error handling & API shape

- The global **`HttpExceptionFilter`** (`src/common/filters/`) guarantees every error returns
  `{ statusCode, message, error, errorCode, details }`.
- Use the **`AppErrorCode`** enum (`src/common/constants/error-codes.ts`) for machine-readable codes.
- 403s are deliberately vague unless debug mode (`APP_DEBUG` / `X-Debug-Mode`, non-prod). Don't leak internals
  in error messages.

## 8. Caching

- Use **`CacheService`** (`src/modules/cache/`) over Valkey: `get`/`set`/`del`/`delPattern`/`getOrSet`
  (cache-aside)/`incr`/`decr`. Build keys with `buildKey(prefix, ...parts)` and the `CachePrefix`/`CacheTTL`
  enums.
- **Invalidate on write** — clear/patch affected keys whenever the underlying data changes.
- **`delPattern` uses `SCAN`, never the blocking `KEYS` command** — `KEYS` stalls every other client on the
  shared Valkey instance while it walks the whole keyspace. Batches are deleted via a pipeline as the scan
  cursor advances.
- **`incr`/`decr` are atomic (`INCRBY`) or they throw.** There is no non-atomic get-then-set fallback — that
  would silently lose increments under concurrent callers.

## 9. Auth & internal endpoints

- JWT via `AuthModule` (Passport `jwt` strategy). **`JwtAuthGuard` is a global `APP_GUARD`** — every route
  denies by default; use `@Public()` to opt a route (or whole controller) out.
- Service-to-service / system endpoints live under `modules/internal`, are marked `@Public()` (to skip the
  global JWT guard) and are guarded by **`ApiKeyGuard`** (`X-Api-Key` checked in constant time —
  `crypto.timingSafeEqual` over SHA-256 digests — against the `SYSTEM_API_KEYS` comma list; fails closed if
  unset). Always `@ApiSecurity('api-key')` them.
- **Rate limiting is global** via `@nestjs/throttler`'s `ThrottlerGuard` (a second `APP_GUARD`, registered
  before `JwtAuthGuard` so it also throttles unauthenticated/invalid requests), configured from
  `RATE_LIMIT_TTL`/`RATE_LIMIT_MAX` (`rate-limit.config.ts`).
- `helmet()` is applied as global Express middleware in `main.ts`.

## 10. Observability

- `instrument.ts` initialises Sentry and **must be the first import in `main.ts`** (it patches
  http/pg/ioredis/etc. before NestJS loads them).
- NestJS `Logger` output bridges to Sentry Logs (`enableLogs`). `SentryGlobalFilter` is wired as `APP_FILTER`.
- Each service uses its **own** Sentry project in the `sentry:sourcemaps` script.
- **`sendDefaultPii: false` by default** — opt in only via `SENTRY_SEND_DEFAULT_PII=true` and only if the
  service genuinely needs it. `beforeSend`/`beforeSendLog` scrub Authorization/Cookie/X-Api-Key headers and
  token/secret/password-shaped fields from every event, log, extra/context data, and breadcrumb before it
  leaves the process.

## 11. Bootstrap (`main.ts`) invariants

`import './instrument'` first → create app with `rawBody: true` + env `LOG_LEVEL` → `helmet()` middleware →
global `ValidationPipe` (`whitelist`/`forbidNonWhitelisted`/`transform`, 422 on error) → global
`HttpExceptionFilter` → CORS from `CORS_ORIGIN` → Swagger gated by `ENABLE_DOCS` → listen on
`0.0.0.0:${PORT}`.

- **CORS is fail-closed.** `main.ts` throws at boot if `CORS_ORIGIN` is unset — never falls back to
  `origin: '*'`, which combined with `credentials: true` would let any origin make credentialed requests.

## 12. Folder structure (canonical)

```
src/
├── main.ts            # bootstrap (see §11)
├── instrument.ts      # Sentry init — first import in main.ts
├── app.module.ts      # Sentry + Config + TypeORM + feature modules
├── app.controller.ts  # root/health
├── common/            # constants/ decorators/ dto/ filters/ guards/ validators/ (+ index barrels)
├── config/            # *.config.ts registerAs factories + index
├── database/          # entities/ (base.entity.ts) migrations/ seeds/ strategies/ (snake-naming)
└── modules/<name>/    # <name>.module.ts, .controller.ts, .service.ts, dto/, entities/, AGENTS.md
```

## 13. Testing

- Jest + `ts-jest`. Specs are **`*.spec.ts` under `test/`, mirroring the `src/` tree** — never beside source.
- **Coverage gate: 80%** (branches/functions/lines/statements); aim 100% on auth/validation/critical paths.
- Pattern: **Arrange → Act → Assert** inside `describe('ClassName') > describe('method') > it('should … when …')`.
- Mock all external dependencies; test success **and** failure paths.
- E2E specs use `test/jest-e2e.json`.

## 14. Security

- Bcrypt cost ≥ 12; JWT in `Authorization: Bearer`; refresh tokens (where used) in httpOnly cookies.
- **Every route denies by default** (global `JwtAuthGuard`); `@Public()` opts out explicitly.
- Parameterised queries only (TypeORM) — never string-interpolate SQL.
- CORS is fail-closed and restricted to configured origins (§11); global rate limiting via
  `@nestjs/throttler` (§9); `helmet()` on every service; never log secrets/PII, and Sentry scrubs
  Authorization/Cookie/token/secret-shaped fields before anything leaves the process (§10).
- No weak default credentials anywhere — API keys are compared in constant time and fail closed
  when unset; database credentials have no fallback and TLS verifies certificates by default (§6, §9).

## 15. Git & Definition of Done

- **Conventional Commits** (`feat(scope):`, `fix(scope):`, `test:`, `docs:`, `refactor:`, `chore:`), enforced
  by commitlint. Branches: `feature/…`, `fix/…`, `hotfix/…`, `refactor/…`. All commits **SSH-signed**
  — configure your own signing key (`git config user.signingkey` / an ssh-agent holding it) before
  committing; see `CONTRIBUTING.md`. Keep machine-specific key paths out of the repo.
- **Definition of Done — `npm run verify` (lint + build + jest --coverage) green with zero errors.** Fix every
  failure, even pre-existing ones surfaced by the run. Never weaken prod code just to pass a test. Update the
  relevant `AGENTS.md` for any architecture/route/behaviour change. Add new env vars to `.env.example`.
- **Husky `pre-commit`** runs `npm install` then `npm run verify`, so the gate runs before every commit
  locally. `npm run verify` = `npm run lint && npm run build && jest --coverage`.
- **CI** (`.github/workflows/ci.yml`, on PR to `main`): checkout → setup-node (npm cache) → `npm ci`
  → lint → build → test. `sentry-sourcemaps.yml` uploads source maps on push to `main` when the
  `SENTRY_AUTH_TOKEN` secret is set.

## 16. Documentation (`AGENTS.md` / `CLAUDE.md`)

- **`CLAUDE.md` is a thin pointer** — its entire content is `@AGENTS.md`. `AGENTS.md` in turn imports
  `@CODING_STANDARDS.md`, so this document loads automatically for any agent working in the repo.
- **`AGENTS.md`** is the technical reference: overview, stack table, project structure, architecture &
  patterns, Definition of Done, local dev, testing, git, security.
- **Module-level `AGENTS.md`** for non-trivial modules, linked from the root `AGENTS.md` table.
- **Keep docs in lockstep with code:** after any change to architecture, routes, module behaviour, or
  standards, update the relevant `AGENTS.md`; after adding env vars, update `.env.example`.

---

# Part 2 — This service: `backend-skeleton`

## Purpose
Generic NestJS 11 + TypeScript scaffold. **This is the template** — clone it to start a new backend service.
It deliberately ships only the cross-cutting infrastructure; feature modules are added per service.

## What ships in the skeleton
- `src/common/` — `HttpExceptionFilter`, `ApiKeyGuard`, `RolesGuard`, `@Public()`/`@Roles()` decorators,
  custom validators (future-date, phone, strong-password, timezone), pagination DTO, `AppErrorCode`.
- `src/config/` — `databaseConfig` (+ `dataSource`), `cacheConfig`, `rateLimitConfig`.
- `src/database/` — `BaseEntity`, `SnakeNamingStrategy`.
- `src/modules/auth/` — JWT strategy + guard, `JwtPayload` interface. `JwtAuthGuard` is wired as a global
  `APP_GUARD` in `app.module.ts` (deny-by-default; `@Public()` opts out).
- `src/modules/cache/` — `CacheModule` + `CacheService` (Valkey), SCAN-based `delPattern`, atomic `incr`/`decr`.
- `src/modules/internal/` — `@Public()` + `ApiKeyGuard`-protected `GET /internal/health` (opts out of the
  JWT guard since it authenticates via `X-Api-Key` instead).
- Global `ThrottlerGuard` (`@nestjs/throttler`, `RATE_LIMIT_TTL`/`RATE_LIMIT_MAX`) and `helmet()` middleware,
  both wired by default — a clone doesn't need to add rate limiting or security headers itself.
- `.dockerignore` (node_modules, `.env*`, `.git`, `.github`, `dist`, `.coverage`, logs) so `COPY . .` in the
  Dockerfile never leaks secrets or bloats the build context.

## When you clone this to make a new service
Follow the rename checklist in `README.md`: `package.json` `name`, the `sentry:sourcemaps` `--project`,
`docker-compose.yml` container names + `DATABASE_NAME`, and the `AGENTS.md` title. Then add feature modules
under `src/modules/<name>/` following §12.

## Code-review checklist (skeleton)
Because clones inherit everything here, treat any drift from Part 1 in this repo as a **blocking** review
finding — the skeleton must stay exemplary. Verify new shared utilities are generic (no domain logic) and
documented in the relevant `src/**/AGENTS.md`.
