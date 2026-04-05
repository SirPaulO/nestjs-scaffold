# Backend Skeleton — Technical Reference

## Overview
Generic NestJS 11 + TypeScript 5 backend scaffold.
Stack: Node 20, NestJS 11, TypeORM 0.3, PostgreSQL 18, Valkey 7 (Redis-compatible).

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
- E2E tests live in `test/` and use `jest-e2e.json`

---

## Git

Conventional Commits: `feat(scope):`, `fix(scope):`, `docs(scope):`, `test(scope):`

---

## Security Standards

- Bcrypt hashing (cost ≥ 12)
- JWT in Authorization header (Bearer)
- CORS restricted to configured origins
- Never log sensitive data (passwords, tokens, PII)
- Parameterised queries via TypeORM (no raw string interpolation)
- Input validation on every DTO via class-validator

---

## Environment Variables

All required variables are documented in `.env.example`.
Add every new variable to `.env.example` — this is mandatory.
