# Standards Rollout — Execution Plan

## Context

`backend-skeleton/.ai/standards.md` established the canonical standard for every backend service
(`assistant`, `backend`, `notifications`, `backend-skeleton`) and documented the drift each repo has
accumulated. This plan turns that standards doc + its Remediation Plan into a concrete, ordered set of
execution tasks, with an overall Definition of Done for the refactor.

**Why now:** the repos are mid-reorg into ~5 microservices all cloned from `backend-skeleton`
(`assistant/.ai/MICROSERVICES_REORG.md`). Locking the skeleton's standards and converging the existing
services *before* the split means new services inherit clean, identical config instead of propagating drift.

This is a **convergence + housekeeping** refactor: config, tooling, hooks, docs, dependency alignment, and
cruft removal. It does **not** change runtime behaviour and is **not** the microservices reorg.

> **Deliverable note:** the first execution task copies this plan to
> `backend-skeleton/.ai/standards-rollout-plan.md` so it lives next to `standards.md` as the durable repo
> artifact (the user asked for the plan "in the same folder"). Plan-mode only permits editing the harness
> plan file right now, so the `.ai/` copy is created at execution time.

## Decisions locked (from planning Q&A)

1. **Node 24 LTS** everywhere (`.nvmrc`, Dockerfile base, CI `node-version`, AGENTS stack tables).
2. **Dependencies:** bump to latest **within current majors**; **conservative** on the three high-risk
   majors — stay on **TypeORM 0.3.x, TypeScript 5.x, ESLint 9**. `@types/node` pinned to **24.x** to match
   the runtime (not the 25.x latest).
3. **assistant `CLAUDE.md`:** migrate the rich inline content into `AGENTS.md` + per-module `AGENTS.md`,
   then reduce `CLAUDE.md` to `@AGENTS.md`.
4. **Delete all `*:Zone.Identifier` files** (27 found, all under `notifications/`).

## Version targets (concrete, latest-within-conservative-major)

| Package | Target | Notes |
|---------|--------|-------|
| Node | **24.x LTS** | `.nvmrc` → `v24.x` (pin exact at execution); Dockerfile `node:24-alpine`; CI `node-version: '24'` |
| `@nestjs/*` core | `^11.1.x` | common 11.1.24, swagger 11.4.4, typeorm 11.0.1, schedule 6.1.3, cache-manager 3.1.2, axios 4.0.1, jwt/passport 11.x |
| `typeorm` | `^0.3.30` | **stay 0.3.x** (1.0 deferred) |
| `typescript` | `~5.9.3` | **stay 5.x** (6.0 deferred) |
| `eslint` + `@eslint/js` | `^9.39.4` | **stay 9.x** (10 deferred) |
| `typescript-eslint` | `^8.60.1` | matches ESLint 9 / TS 5.9 |
| `prettier` | `^3.8.3` | |
| `jest` + `@types/jest` | `^30.4.2` | bump `notifications` 29→30 |
| `ts-jest` | `^29.4.11` | supports jest 30 |
| `@types/node` | `^24.13.1` | match Node 24 |
| `class-validator` | `^0.15.1` | bump backend/notifications/skeleton 0.14→0.15 |
| `class-transformer` | `^0.5.1` | unchanged |
| `@sentry/nestjs` / `@sentry/cli` | `^10.56.0` / `^3.5.0` | bump assistant/notifications/skeleton cli 2.x→3.x |
| `ioredis` / `pg` / `cache-manager` | `^5.11.1` / `^8.21.0` / `^7.2.8` | |
| `husky` | `^9.1.7` | unchanged |
| `@commitlint/cli` + `config-conventional` | `^21.0.2` | **add** to skeleton/notifications/assistant |
| `zod` | per-repo major (backend 4.x, others 3.x latest) | unification 3→4 **deferred** |
| service-specific | latest-in-major | openai 6.42 (assistant), firebase-admin 13.10 (notifications), bcrypt 6.0 (backend) |

## Phased execution

Each phase is independently shippable; run `npm run verify` at the end of each repo's work before moving on.
Recommended commit granularity: one branch/PR per repo, conventional-commit messages, SSH-signed
(`eval $(../load.sh)` first).

### Phase 0 — Bootstrap (skeleton)
- Copy this plan to `backend-skeleton/.ai/standards-rollout-plan.md`.
- Add the **Version targets** table above to `standards.md` (replace the "pick one" Node ambiguity in §1
  and Phase 0 with the locked Node 24 decision).

### Phase 1 — `backend-skeleton` (make the reference canonical first)
Files: `package.json`, `.nvmrc`, `Dockerfile`, `.github/workflows/ci.yml`, `AGENTS.md`, `README.md`,
new `commitlint.config.js`.
- **Node 24:** `.nvmrc` → v24.x; `Dockerfile` `node:20-alpine` → `node:24-alpine` (all 3 stages); CI
  `node-version: '20'`→`'24'` (already structurally fine).
- **Dependency bumps** per the targets table (`@types/node`→24, class-validator→0.15, sentry-cli→3, etc.).
- **Promote good practices the other repos already have:**
  - Add `commitlint` + `@commitlint/config-conventional` (devDeps) + `commitlint.config.js`
    (extends `@commitlint/config-conventional`) — adopt `backend`'s setup.
  - Add jest `roots: ['<rootDir>/test']` and adopt the "specs mirror `src/`, live under `test/`" convention
    (from `assistant`/`backend`).
  - Settle one canonical `tsconfig.json` form (keep skeleton's `baseUrl`/`moduleResolution: node`) and
    document it.
- **README:** add a **"Creating a new service"** section pointing at `.ai/standards.md` + a **rename
  checklist** (`package.json` `name`, `sentry:sourcemaps` `--project`, docker-compose container names
  `backend-postgres`/`backend-valkey`, `DATABASE_NAME`).
- Verify `pre-commit` already runs `npm run verify` (it does) and `CLAUDE.md` is `@AGENTS.md` (it is).

### Phase 2 — `notifications` (closest to skeleton)
Files: 27 `*:Zone.Identifier` files (delete), `package.json`, `AGENTS.md`, `.nvmrc`, `Dockerfile`,
CI, `.husky/pre-commit`, new `commitlint.config.js`.
- **Delete all 27 `*:Zone.Identifier` files** (WSL download cruft) across `.husky/`, `.github/workflows/`,
  `src/common/**`, `src/database/**`, `src/modules/**`.
- **Sentry:** `package.json` `sentry:sourcemaps` `--project tavolai-skeleton` → `tavolai-notifications`
  (both inject + upload invocations).
- **AGENTS.md:** retitle "Backend Skeleton — Technical Reference" → Notifications; describe its real modules
  (FCM/web-push, channels, subscriptions, internal/user-deletion); fix stack table (Node 24, NestJS 11, PG 18).
- **jest `collectCoverageFrom`:** widen from the notifications-module-only scope to `src/**` (matching the
  80% global gate), or document the scoped exception explicitly.
- Add `commitlint` (parity with skeleton); Node 24; dependency bumps (incl. jest 29→30, sentry-cli→3,
  class-validator→0.15).
- Confirm `CLAUDE.md` = `@AGENTS.md` (it is).

### Phase 3 — `assistant` (most drift)
Files: `.husky/pre-commit`, `CLAUDE.md`, `AGENTS.md` + new per-module `AGENTS.md`, `package.json`, `.nvmrc`,
`Dockerfile`, CI, new `docker-compose.yml`, new `src/modules/internal/`, new `commitlint.config.js`.
- **Husky:** replace `npm install && npm run lint && npm run format` with `npm install && npm run verify`
  (current hook mutates files mid-commit and skips build/tests).
- **CLAUDE.md migration (migrate-then-point):**
  - Move the large architecture/Flows/i18n/data-model narrative from `CLAUDE.md` into `AGENTS.md` and split
    the deep sections into per-module `AGENTS.md` files: `flows/`, `conversations/`, `webhooks/`,
    `customers/`, `ai/`, `workers/`, and `common/i18n/` (only `src/database/AGENTS.md` exists today).
  - Reduce `CLAUDE.md` to `@AGENTS.md`. Preserve the "Definition of Done", "Configuration", "Git/signing"
    content inside `AGENTS.md`.
- **AGENTS.md:** fix title typo ("Conversation Eengine"); stack table → NestJS 11 (not 10), Node 24, PG 18.
- **Parity additions:** add `src/modules/internal/` (`InternalController` + `internal.module.ts`,
  `ApiKeyGuard`-guarded `/internal/health`) copied from skeleton; add a `docker-compose.yml`
  (Postgres 18 + Valkey 7, from skeleton) — assistant currently has none.
- **jest:** confirm `ts-jest` `diagnostics: false` is intentional or align with skeleton.
- Add `commitlint`; Node 24; dependency bumps (sentry-cli→3, class-validator already 0.15, openai latest).
- Keep CI's `SYSTEM_PROMPT_TEMPLATE` env wiring (build-time var) — preserve it.

### Phase 4 — `backend` (largest; mostly compliant)
Files: `AGENTS.md`, `package.json`, `.nvmrc`, `Dockerfile`, CI.
- **AGENTS.md stack table:** NestJS `10.x`→`11.x`, PostgreSQL `15.x`→`18.x`, Node 24.
- Node 24; dependency bumps within-major (keep zod 4.x, bcrypt 6, stripe/aws-sdk latest-in-major).
- **Keep** its good bits and fold them upstream (done in Phase 1): `commitlint`, jest `forceExit: true`,
  the `cache.service.ts` eslint `no-duplicate-enum-values` override (justified). No removals.
- Confirm `CLAUDE.md` = `@AGENTS.md` (it is).

### Phase 5 — Verify, drift-guard & lock-in
- Run `npm ci && npm run verify` in **each** repo; fix all fallout.
- Add a small **Node-version consistency** guard so drift can't silently return — a CI step (or a
  `scripts/check-node-versions` doc) asserting `.nvmrc` ↔ CI `node-version` ↔ Dockerfile base all agree.
- Add a one-line pointer in every repo's `AGENTS.md`: "Standards: see `backend-skeleton/.ai/standards.md`".
- Update the `standards.md` **drift matrix** so every row reads ✅.

## Definition of Done (for this refactor)

The refactor is complete only when **all** of the following hold:

**Per-repo (all 4):**
- [ ] `npm ci && npm run verify` passes with zero errors (lint + build + jest --coverage ≥ 80% global gate).
- [ ] `.nvmrc`, `Dockerfile` base image, CI `node-version`, and the `AGENTS.md` stack table **all say Node 24**.
- [ ] `CLAUDE.md` content is exactly `@AGENTS.md` (including `assistant`).
- [ ] `.husky/pre-commit` runs `npm install && npm run verify`.
- [ ] `commitlint` + `commitlint.config.js` present and `@commitlint/config-conventional` wired.
- [ ] jest uses `roots: ['<rootDir>/test']`; all `*.spec.ts` live under `test/` mirroring `src/`.
- [ ] `coverageThreshold.global` = 80/80/80/80; coverage scope is `src/**` (or a documented exception).
- [ ] `sentry:sourcemaps` `--project` is the repo's own unique name (no `tavolai-skeleton` leftovers).
- [ ] Dependency versions match the **Version targets** table; no TypeORM 1.0 / TS 6 / ESLint 10 introduced.
- [ ] `AGENTS.md` stack table is accurate (NestJS 11, PG 18, Node 24) and links to `standards.md`.

**Cross-cutting:**
- [ ] **Zero** `*:Zone.Identifier` files anywhere in the tree (verified by `find`).
- [ ] `assistant` inline `CLAUDE.md` content fully migrated to `AGENTS.md` + per-module `AGENTS.md`; no
      architecture knowledge lost.
- [ ] `assistant` has `src/modules/internal/` (`/internal/health`) and a `docker-compose.yml`.
- [ ] `standards.md` drift matrix is all ✅; `standards-rollout-plan.md` exists in `.ai/`.
- [ ] Node-version consistency guard in place in every repo's CI (or documented).

## Verification

Per repo (run from the repo root):
```bash
nvm use            # honours .nvmrc → Node 24
npm ci
npm run verify     # lint + build + jest --coverage (must pass, ≥80%)
npm run start:dev  # smoke test: app boots, GET /api/docs (ENABLE_DOCS=true), GET /internal/health w/ X-Api-Key
```

Cross-repo consistency (run from `rsvp/`):
```bash
# No download cruft remains
find . -name '*Zone.Identifier*' -not -path '*/node_modules/*'        # expect: empty

# CLAUDE.md is a pointer in every repo
for d in assistant backend notifications backend-skeleton; do echo "$d: $(cat $d/CLAUDE.md)"; done  # expect: @AGENTS.md

# Node version agreement per repo (.nvmrc vs Dockerfile vs CI)
for d in assistant backend notifications backend-skeleton; do
  echo "== $d =="; cat $d/.nvmrc; grep -i 'FROM node' $d/Dockerfile; grep -i 'node-version' $d/.github/workflows/ci.yml
done
```

`commitlint` smoke: a non-conventional commit message is rejected; `feat(scope): x` is accepted.

## Risks & watch-items
- **typescript-eslint 8.60 × TS 5.9 × ESLint 9.39** — verify the flat config still type-checks after bumps
  (`npm run lint`); this trio is known-good but pin exact if any rule misbehaves.
- **Node 24 native modules** — `bcrypt` (backend) and `firebase-admin` (notifications) may need a clean
  `npm ci` rebuild on Node 24; CI uses prebuilt binaries.
- **assistant CLAUDE.md migration** is the largest single task — risk is *losing* nuance, not breaking code.
  Migrate content verbatim into AGENTS files before trimming; diff for completeness.
- **`notifications` coverage widening** to `src/**` may expose modules currently under 80% — may require
  adding tests or an explicit documented `collectCoverageFrom` exception.
- **jest 29→30 in notifications** — `ts-jest@29.4.11` supports jest 30; re-run e2e to confirm.

## Out of scope (explicitly deferred)
- The microservices reorg (`assistant/.ai/MICROSERVICES_REORG.md`) — separate master plan.
- Major bumps: **TypeORM 1.0**, **TypeScript 6**, **ESLint 10** — revisit as a dedicated effort.
- **zod 3 → 4** unification across `notifications`/`skeleton` — deferred (major bump, low current usage).
