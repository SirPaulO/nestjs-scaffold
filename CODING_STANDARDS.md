# Coding Standards

> **Read this before writing code or reviewing a PR in this repository.**
> It defines the coding conventions, patterns, folder structure, and architecture every change must follow.
>
> This repo (`backend-skeleton`) is the **canonical reference** that new services are cloned from.
> Part 1 below is the shared standard; Part 2 is specific to this service.

---

# Part 1 — Shared standards (identical across all backend services)

## 1. Language & TypeScript

- **No `any`.** Use `unknown` and narrow, or a precise type/interface.
- **Strict mode** is on (`strict`, `strictNullChecks`, `noImplicitAny`, `noUnusedLocals`,
  `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `strictBindCallApply`). Fix every
  TS error before committing — do not suppress with `// @ts-ignore`.
- **Explicit return types** on all public/exported methods.
- `module: commonjs`, `target: ES2023`, `moduleResolution: node`. Source maps + `inlineSources` on (Sentry).

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
  They are configured in **three places that must stay in sync**: `tsconfig.json` `paths`,
  `package.json` jest `moduleNameMapper`, and ts-node for migrations.

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

## 7. Error handling & API shape

- The global **`HttpExceptionFilter`** (`src/common/filters/`) guarantees every error returns
  `{ statusCode, message, error, errorCode, details }`.
- Use the **`AppErrorCode`** enum (`src/common/constants/error-codes.ts`) for machine-readable codes.
- 403s are deliberately vague unless debug mode (`APP_DEBUG` / `X-Debug-Mode`, non-prod). Don't leak internals
  in error messages.

## 8. Caching

- Use **`CacheService`** (`src/modules/cache/`) over Valkey: `get`/`set`/`del`/`delPattern`/`getOrSet`
  (cache-aside)/`incr`. Build keys with `buildKey(prefix, ...parts)` and the `CachePrefix`/`CacheTTL` enums.
- **Invalidate on write** — clear/patch affected keys whenever the underlying data changes.

## 9. Auth & internal endpoints

- JWT via `AuthModule` (Passport `jwt` strategy, `JwtAuthGuard`, `@Public()` to opt out).
- Service-to-service / system endpoints live under `modules/internal` and are guarded by **`ApiKeyGuard`**
  (`X-Api-Key` checked against the `SYSTEM_API_KEYS` comma list). Always `@ApiSecurity('api-key')` them.

## 10. Observability

- `instrument.ts` initialises Sentry and **must be the first import in `main.ts`** (it patches
  http/pg/ioredis/etc. before NestJS loads them).
- NestJS `Logger` output bridges to Sentry Logs (`enableLogs`). `SentryGlobalFilter` is wired as `APP_FILTER`.
- Each service uses its **own** Sentry project in the `sentry:sourcemaps` script.

## 11. Bootstrap (`main.ts`) invariants

`import './instrument'` first → create app with `rawBody: true` + env `LOG_LEVEL` → global `ValidationPipe`
(`whitelist`/`forbidNonWhitelisted`/`transform`, 422 on error) → global `HttpExceptionFilter` → CORS from
`CORS_ORIGIN` → Swagger gated by `ENABLE_DOCS` → listen on `0.0.0.0:${PORT}`.

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
- Parameterised queries only (TypeORM) — never string-interpolate SQL.
- CORS restricted to configured origins; rate-limit auth-sensitive endpoints; never log secrets/PII.

## 15. Git & Definition of Done

- **Conventional Commits** (`feat(scope):`, `fix(scope):`, `test:`, `docs:`, `refactor:`, `chore:`), enforced
  by commitlint. Branches: `feature/…`, `fix/…`, `hotfix/…`, `refactor/…`. All commits **SSH-signed**
  (`source /home/sirpaul/Documents/load.sh` first).
- **Definition of Done — `npm run verify` (lint + build + jest --coverage) green with zero errors.** Fix every
  failure, even pre-existing ones surfaced by the run. Never weaken prod code just to pass a test. Update the
  relevant `AGENTS.md` for any architecture/route/behaviour change. Add new env vars to `.env.example`.

---

# Part 2 — This service: `backend-skeleton`

## Purpose
Generic NestJS 11 + TypeScript scaffold. **This is the template** — clone it to start a new backend service.
It deliberately ships only the cross-cutting infrastructure; feature modules are added per service.

## What ships in the skeleton
- `src/common/` — `HttpExceptionFilter`, `ApiKeyGuard`, `RolesGuard`, `@Public()`/`@Roles()` decorators,
  custom validators (future-date, phone, strong-password, timezone), pagination DTO, `AppErrorCode`.
- `src/config/` — `databaseConfig` (+ `dataSource`) and `cacheConfig`.
- `src/database/` — `BaseEntity`, `SnakeNamingStrategy`.
- `src/modules/auth/` — JWT strategy + guard, `JwtPayload` interface.
- `src/modules/cache/` — `CacheModule` + `CacheService` (Valkey).
- `src/modules/internal/` — `ApiKeyGuard`-protected `GET /internal/health`.

## When you clone this to make a new service
Follow the rename checklist in `README.md`: `package.json` `name`, the `sentry:sourcemaps` `--project`,
`docker-compose.yml` container names + `DATABASE_NAME`, and the `AGENTS.md` title. Then add feature modules
under `src/modules/<name>/` following §12.

## Code-review checklist (skeleton)
Because clones inherit everything here, treat any drift from Part 1 in this repo as a **blocking** review
finding — the skeleton must stay exemplary. Verify new shared utilities are generic (no domain logic) and
documented in the relevant `src/**/AGENTS.md`.
