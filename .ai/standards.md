# Backend Standards

> **Source of truth** for how a backend service in this platform is structured, configured, and developed.

---

## 1. Technology Stack

| Category | Standard | Notes |
|----------|----------|-------|
| Runtime | **Node.js 24 LTS** | `.nvmrc` → `v24.13.1`; Dockerfile `node:24-alpine`; CI `node-version: '24'`. |
| Framework | **NestJS 11.x** | `@nestjs/*` `^11.0.0`. |
| Language | **TypeScript 5.7.x** | strict mode, see §4. |
| ORM | **TypeORM 0.3.x** | with `SnakeNamingStrategy`. |
| Database | **PostgreSQL 18** (`postgres:18-alpine`) | |
| Cache / Queue | **Valkey 7** (Redis-compatible) via `ioredis` + `cache-manager` | |
| Validation | `class-validator` + `class-transformer` | on every DTO. |
| Auth | `@nestjs/passport` + `passport-jwt` + `@nestjs/jwt` | JWT bearer. |
| Observability | `@sentry/nestjs` `^10` + `@sentry/cli` | see §9. |
| Docs | `@nestjs/swagger` `^11` | served at `/api/docs` (gated by `ENABLE_DOCS`). |
| Test | Jest 29/30 + `ts-jest` + `supertest` | see §6. |
| Lint/Format | ESLint 9 (flat config) + Prettier 3 | see §5. |
| Git hooks | Husky 9 | see §7. |

**Rule:** the stack table in each repo's `AGENTS.md` must match this and the actual `package.json`/`.nvmrc`/`Dockerfile`.

### 1.1 Version targets (locked — conservative major strategy)

| Package | Target | Notes |
|---------|--------|-------|
| Node | **24.x LTS** | `.nvmrc` → `v24.13.1`; Dockerfile `node:24-alpine`; CI `node-version: '24'` |
| `@nestjs/*` core | `^11.1.x` | common 11.1.24, swagger 11.4.4, typeorm 11.0.1, schedule 6.1.3, cache-manager 3.1.2, axios 4.0.1, jwt/passport 11.x |
| `typeorm` | `^0.3.30` | **stay 0.3.x** — TypeORM 1.0 is a separate, deferred upgrade |
| `typescript` | `~5.9.3` | **stay 5.x** — TypeScript 6.0 is deferred |
| `eslint` + `@eslint/js` | `^9.39.4` | **stay 9.x** — ESLint 10 is deferred |
| `typescript-eslint` | `^8.60.1` | matched to ESLint 9 / TS 5.9 |
| `prettier` | `^3.8.3` | |
| `jest` + `@types/jest` | `^30.4.2` / `^30` | |
| `ts-jest` | `^29.4.11` | supports jest 30 |
| `@types/node` | `^24.13.1` | pinned to match Node 24 runtime (not 25.x latest) |
| `class-validator` | `^0.15.1` | bump 0.14 → 0.15 |
| `class-transformer` | `^0.5.1` | unchanged |
| `@sentry/nestjs` | `^10.56.0` | |
| `@sentry/cli` | `^3.5.0` | bump 2.x → 3.x |
| `ioredis` | `^5.11.1` | |
| `pg` | `^8.21.0` | |
| `cache-manager` | `^7.2.8` | |
| `husky` | `^9.1.7` | unchanged |
| `@commitlint/cli` + `config-conventional` | `^21.0.2` | required |
| `zod` | 3.x or 4.x latest-in-major | unification 3→4 deferred |

---

## 2. Repository Layout

Every service has this top-level shape:

```
.
├── .ai/                  # AI-facing planning & standards docs (this file lives here)
├── .github/workflows/    # ci.yml + sentry-sourcemaps.yml
├── .husky/               # pre-commit hook
├── .vscode/
├── src/                  # see §3
├── test/                 # jest-e2e.json + e2e specs (and unit specs — see §6)
├── .env.example          # every env var documented here (committed)
├── .nvmrc                # pinned Node version
├── .prettierrc
├── eslint.config.mjs
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
├── package.json
├── docker-compose.yml    # local Postgres + Valkey
├── Dockerfile            # multi-stage (development / build / production)
├── AGENTS.md             # technical reference (humans + agents)
├── CLAUDE.md             # thin pointer: `@AGENTS.md`
└── README.md
```

### `.env` files
- `.env.example` is the **committed, authoritative** list of every variable. Adding a new env var **requires** adding it here (enforced by convention + DoD).
- `.env`, `.env.dev`, `.env.prd` are local/secret and git-ignored.

---

## 3. Source Tree (`src/`)

```
src/
├── main.ts               # bootstrap (see §8)
├── instrument.ts         # Sentry init — MUST be the first import in main.ts
├── app.module.ts         # root module: Sentry, Config, TypeORM, feature modules
├── app.controller.ts     # root/health controller
├── common/               # cross-cutting, framework-agnostic-ish shared code
│   ├── constants/        # e.g. error-codes.ts (AppErrorCode enum)
│   ├── decorators/       # @Public(), @Roles(), …  (barrel: index.ts)
│   ├── dto/              # shared DTOs (e.g. pagination.dto.ts)
│   ├── filters/          # HttpExceptionFilter (barrel: index.ts)
│   ├── guards/           # ApiKeyGuard, RolesGuard (barrel: index.ts)
│   ├── validators/       # custom class-validator validators
│   └── index.ts          # top-level barrel
├── config/               # registerAs() config factories + index barrel
│   ├── database.config.ts   # exports databaseConfig + dataSource (CLI)
│   ├── cache.config.ts
│   └── index.ts
├── database/
│   ├── entities/base.entity.ts   # BaseEntity (uuid id + timestamptz audit cols)
│   ├── migrations/               # TypeORM migrations
│   ├── seeds/                    # seed.ts (optional)
│   └── strategies/snake-naming.strategy.ts
└── modules/              # one folder per feature/domain
    ├── auth/             # JWT auth, strategies/, guards/, interfaces/
    ├── cache/            # CacheModule + CacheService (Valkey)
    └── internal/         # internal API-key-guarded endpoints (e.g. /internal/health)
```

### Module folder convention

```
src/modules/<name>/
├── <name>.module.ts
├── <name>.controller.ts
├── <name>.service.ts
├── dto/                  # separate create / update / response DTOs
├── entities/            # if the module owns tables
├── strategies/ guards/ interfaces/   # as needed
└── AGENTS.md            # module-level docs when the module is non-trivial
```

### Path aliases (always use these — never deep relative imports in `src/`)
`@modules/*`, `@common/*`, `@config/*`, `@database/*` → `src/modules/*`, etc.
Configured in **three places that must stay in sync**: `tsconfig.json` `paths`, `package.json` jest `moduleNameMapper`, and (implicitly) ts-node for migrations.

---

## 4. TypeScript Standards

`tsconfig.json` (canonical):
- `module: commonjs`, `target: ES2023`, `moduleResolution: node`
- `strict: true` plus explicitly: `strictNullChecks`, `noImplicitAny`, `strictBindCallApply`,
  `noFallthroughCasesInSwitch`, `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters`
- `esModuleInterop`, `isolatedModules`, `declaration`, `removeComments`,
  `emitDecoratorMetadata`, `experimentalDecorators`, `allowSyntheticDefaultImports`
- `sourceMap: true` + `inlineSources: true` (for Sentry source maps)
- `outDir: ./dist`, `incremental: true`, `skipLibCheck: true`
- `paths` aliases as in §3

Coding rules (from `AGENTS.md`, unified):
- **No `any`.** Use `unknown` (and narrow) or a precise type.
- **Explicit return types** on public methods.
- **Naming:** Classes/Services/Controllers `PascalCase`; variables/functions `camelCase`;
  constants `UPPER_SNAKE_CASE`. Files match the class and use suffixes:
  `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.entity.ts`, `*.dto.ts`, `*.spec.ts`.
- **File length ≤ 300 lines; function length ≤ 50 lines.**
- **Import order:** Node → External → NestJS → Internal (`@…` aliases) → Relative.
- **Constructor injection only** (`private readonly`); no `@Inject()` property injection
  (except framework tokens like `CACHE_MANAGER`).
- **Datetimes stored as UTC** (`timestamptz`).
- **No N+1 queries** — eager load or `QueryBuilder` joins.
- **No `console.log`** — inject NestJS `Logger` with `ClassName.name` context.

---

## 5. Lint & Format

**ESLint** — flat config (`eslint.config.mjs`), `typescript-eslint` type-checked.
Canonical rule set:

Production `**/*.ts` (errors): `no-explicit-any`, `no-floating-promises`, `no-unsafe-*`
(argument/assignment/call/member-access/return), `prefer-nullish-coalescing`,
`prefer-optional-chain`, `require-await`, `no-unused-vars` (`argsIgnorePattern: '^_'`),
`prettier/prettier`.

Test `**/*.spec.ts` / `**/test/**`: `no-explicit-any` off; `no-unsafe-*` relaxed to **warn**;
`prefer-*` off; `require-await` & `no-unused-vars` stay error.

**Prettier** (`.prettierrc`, identical everywhere — keep it that way):
```json
{ "singleQuote": true, "trailingComma": "all", "semi": true,
  "printWidth": 80, "tabWidth": 2, "useTabs": false, "endOfLine": "auto" }
```

Commands: `npm run lint` (check) · `npm run format` (eslint --fix + prettier --write).

---

## 6. Testing

- **Framework:** Jest + `ts-jest`, `testEnvironment: node`, `testRegex: .*\.spec\.ts$`.
- **Coverage gate:** **80%** on branches/functions/lines/statements (`coverageThreshold.global`),
  output to `.coverage/`. Critical paths (auth, capacity, validation) aim for 100%.
- **Migrations/seeds/factories excluded** from coverage (`coveragePathIgnorePatterns`).
- **Spec location:** specs live under `test/`, mirroring the `src/` tree, importing the subject by
  relative path (e.g. `test/modules/foo/foo.service.spec.ts`). **Do not** place `*.spec.ts` next to
  source. Enforce via jest `roots: ['<rootDir>/test']`.
- **E2E:** `npm run test:e2e` using `test/jest-e2e.json`.
- **Pattern:** Arrange → Act → Assert inside `describe('ServiceName') > describe('methodName') > it('should … when …')`.
  Mock all external dependencies; test success and failure paths.
- `moduleNameMapper` must mirror the tsconfig `paths` aliases.

---

## 7. Git, Hooks & CI

### Conventional Commits
`feat(scope): …`, `fix(scope): …`, `test(scope): …`, `docs(scope): …`, `refactor`, `chore`.
Branches: `feature/…`, `fix/…`, `hotfix/…`, `refactor/…`.
Enforce with `commitlint` + `@commitlint/config-conventional`.

### Commit signing (required)
All commits are SSH-signed. Load the key before committing:
```bash
eval $(../load.sh)
```

### Husky `pre-commit` (canonical)
```sh
#!/bin/sh
npm install
npm run verify          # lint + build + jest --coverage
```

### `npm run verify`
`npm run lint && npm run build && jest --coverage` — the single **Definition of Done** gate.

### GitHub Actions
- `ci.yml` — on PR to `main`: checkout → setup-node (npm cache) → `npm ci` →
  `npm run lint` → `npm run build` → `npm test`. (Pass any required build-time env via `vars`/`secrets`.)
- `sentry-sourcemaps.yml` — uploads source maps on release.

---

## 8. Architectural Patterns (canonical)

- **Bootstrap (`main.ts`):** `import './instrument'` first; create app with `rawBody: true` and
  env-driven `LOG_LEVEL`; global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true,
  transform: true, errorHttpStatusCode: 422 })`; global `HttpExceptionFilter`; CORS from
  `CORS_ORIGIN` (comma list, `*` wildcard → regex); Swagger gated by `ENABLE_DOCS`; listen on
  `0.0.0.0:${PORT|3000}`.
- **Config:** `@nestjs/config` `registerAs()` factories in `src/config`, loaded in `app.module.ts`
  via `ConfigModule.forRoot({ isGlobal: true, load: [...] })`. **Never read `process.env` in business
  logic** — inject `ConfigService` or a typed config (exception: `main.ts`/`instrument.ts` bootstrap).
- **Database:** `databaseConfig` registerAs returns `TypeOrmModuleOptions`; a separate exported
  `dataSource` (same options) drives the TypeORM CLI for migrations. `SnakeNamingStrategy` maps
  camelCase entities → snake_case columns. All entities extend `BaseEntity` (uuid `id`,
  `createdAt`/`updatedAt`/`deletedAt` as `timestamptz`, soft-delete). Pool tuning via `DATABASE_POOL_*`.
- **Errors:** global `HttpExceptionFilter` returns a consistent shape
  `{ statusCode, message, error, errorCode, details }`, with `AppErrorCode` enum, debug-gated
  messages (`APP_DEBUG` / `X-Debug-Mode` non-prod), vague 403s, and class-validator extraction.
  Use NestJS built-in exceptions (`NotFoundException`, `BadRequestException`, …).
- **Internal endpoints:** `modules/internal` — `ApiKeyGuard` (`X-Api-Key` vs `SYSTEM_API_KEYS`
  comma list), `@ApiSecurity('api-key')`, e.g. `GET /internal/health`.
- **Auth:** `AuthModule` registers Passport JWT + `JwtModule` (secret + `JWT_EXPIRATION`);
  `JwtStrategy`, `JwtAuthGuard`, `@Public()` decorator to opt out.
- **Cache:** `CacheModule` + `CacheService` over `cache-manager` + ioredis; `CachePrefix`/`CacheTTL`
  enums, `buildKey`, `getOrSet` (cache-aside), `delPattern`, `incr`/`decr`. Invalidate on writes.
- **Swagger:** `introspectComments: true` (nest-cli plugin); bearer (`JWT-auth`) + api-key security schemes.
- **Multi-tenancy / RBAC / queues** (opt-in): tenant resolved per request via guard;
  roles/permissions in DB checked by guards + `@Roles()`/`@Permissions()`; Bull queues on Valkey.
  These are **opt-in** per service.

---

## 9. Observability (Sentry)

- `instrument.ts` calls `Sentry.init()` and **must be imported before anything else** in `main.ts`
  so it can patch `http`/`pg`/`ioredis`/`openai`/etc.
- DSN disabled in `development`; `enableLogs: true` bridges NestJS `Logger` → Sentry Logs;
  `tracesSampleRate` from `SENTRY_TRACES_SAMPLE_RATE` (lower in prod); `pg`/`ioredis`/TypeORM/OpenAI auto-instrumented.
- `app.module.ts` registers `SentryModule.forRoot()` + `SentryGlobalFilter` (as `APP_FILTER`).
- Source maps: `build:prod` runs `sentry:sourcemaps` (inject + upload) per `--project <name>`.
  **Each service must use its own Sentry project name** (e.g. `tavolai-<service>`); a cloned
  placeholder project name must be renamed on service creation.

---

## 10. Documentation Standard (`AGENTS.md` / `CLAUDE.md`)

- **`CLAUDE.md` is a thin pointer:** its entire content is `@AGENTS.md`. Rich architecture notes
  belong in `AGENTS.md` and module-level `AGENTS.md` files, not inline in `CLAUDE.md`.
- **`AGENTS.md`** is the technical reference: overview, stack table, project structure, architecture &
  patterns, Definition of Done, local dev, standards, testing, git workflow, security, performance.
- **Module-level `AGENTS.md`** for non-trivial modules, linked from the root `AGENTS.md` table.
- **Keep docs in lockstep with code:** after any change affecting architecture, routes, module
  behaviour, or standards, update the relevant `AGENTS.md`. After adding env vars, update `.env.example`.

---

## 11. Definition of Done

A task is **not** complete until, with zero errors:
```bash
npm run verify     # lint + build + jest --coverage (80% gate)
```
Plus:
- Fix **every** failure, even pre-existing/unrelated ones surfaced by the run.
- Adapt tests to the codebase; never weaken production code just to pass a test (unless that change was the task).
- Update `AGENTS.md` (+ module docs) for architectural/route/behaviour/standard changes.
- Add every new env var to `.env.example`.
