# Contributing

Thanks for contributing. This guide covers local setup, our conventions, and how to get a change
merged. For the full engineering standards, read **[`CODING_STANDARDS.md`](CODING_STANDARDS.md)**
(coding conventions & architecture) and **[`AGENTS.md`](AGENTS.md)** (technical reference).

## Prerequisites

- **Node.js 24 LTS** — `nvm use` (pinned in `.nvmrc`).
- **Docker** + **Docker Compose** — for local PostgreSQL and Valkey.

## Setup

```bash
nvm use
docker compose up -d
cp .env.example .env          # set the real secrets (JWT_SECRET, DB creds, SYSTEM_API_KEYS, …)
npm ci
npm run migration:run
npm run start:dev
```

See the [README](README.md) for verifying the service is up (`/health`, `/api/docs`).

## Branches

Branch off `main` using a typed prefix:

- `feature/<short-description>`
- `fix/<short-description>`
- `hotfix/<short-description>`
- `refactor/<short-description>`

## Commits

- **Conventional Commits**, enforced by commitlint:
  `feat(scope): …`, `fix(scope): …`, `test: …`, `docs: …`, `refactor: …`, `chore: …`.
- Keep commits focused; write imperative subjects.

### Commit signing (required)

All commits are **SSH-signed**. Configure your own signing key once (paths/keys are per-developer —
never commit them):

```bash
git config user.signingkey /path/to/your/ssh_signing_key.pub
git config gpg.format ssh
git config commit.gpgsign true
```

After that, `git commit` signs automatically. If signing isn't enabled globally, pass `-S` explicitly.

## Development workflow

The Husky `pre-commit` hook runs `npm install` then `npm run verify`. Before pushing, make sure the
**Definition of Done** gate is green locally:

```bash
npm run verify     # lint + build + jest --coverage (80% gate)
```

Fix every failure it surfaces — including pre-existing ones. Never weaken production code just to
make a test pass.

## Testing

- Specs live under `test/`, mirroring the `src/` tree (e.g. `src/modules/foo/foo.service.ts` →
  `test/modules/foo/foo.service.spec.ts`). Do **not** co-locate specs with source.
- Pattern: **Arrange → Act → Assert** inside `describe('ClassName') > describe('method') > it('should … when …')`.
- Mock all external dependencies; cover success **and** failure paths.
- Import subjects via the `@modules/`, `@common/`, `@config/`, `@database/` path aliases.
- E2E specs use `test/jest-e2e.json` (`npm run test:e2e`).

## Code conventions (highlights)

Full details in [`CODING_STANDARDS.md`](CODING_STANDARDS.md). The essentials:

- No `any`; explicit return types on public methods; strict TypeScript.
- Constructor injection only; NestJS built-in exceptions; NestJS `Logger`, never `console.log`.
- **Minimal comments** — code must be self-explanatory. No block/JSDoc comments, and no task/
  progress/ticket references in comments.
- Every new env var goes in `.env.example`; update the relevant `AGENTS.md` for any
  architecture/route/behaviour change.

## Pull requests

1. Open a PR against `main`; the template checklist must be satisfied.
2. Ensure `npm run verify` is green and docs/`.env.example` are updated.
3. CI (`.github/workflows/ci.yml`) runs lint + build + tests on every PR.
4. Address review feedback; keep the branch up to date with `main`.
