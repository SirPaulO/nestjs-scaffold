# Backend Skeleton

A NestJS backend skeleton based on TypeScript, PostgreSQL, and Valkey.

## Quick Start

1. Clone the repository
2. Copy `.env.example` to `.env` and configure your environment variables
3. Install dependencies: `npm install`
4. Start the database services: `docker-compose up -d`
5. Run the development server: `npm run start:dev`

## Project Structure

```
src/
├── modules/          # Feature modules
│   └── cache/       # Caching layer
├── config/          # Configuration files
├── database/        # Database entities and migrations
└── main.ts          # Application entry point
```

## Available Scripts

- `npm run start:dev` - Development mode with watch
- `npm run start:debug` - Debug mode
- `npm run start:prod` - Production mode
- `npm run build` - Build for production
- `npm run lint` - Lint and fix code
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run E2E tests
- `npm run migration:generate` - Generate migration
- `npm run migration:run` - Run migrations

## Technologies

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Cache/Queue**: Valkey (Redis-compatible)
- **ORM**: TypeORM

## Generic Components

### Cache Module

Global caching service with Valkey/Redis support:

- `CacheService` - Generic caching operations (get, set, del, incr, decr, pattern matching)
- `CachePrefix` - Enum for cache key prefixes
- `CacheTTL` - Enum for TTL configurations
- `CacheModule` - Global module with Redis store configuration

### Database Configuration

- `databaseConfig` - TypeORM configuration with connection pooling
- `SnakeNamingStrategy` - Converts all database names to snake_case
- `dataSource` - TypeORM DataSource for CLI operations

## Environment Variables

Copy `.env.example` to `.env` and update the values:

- `PORT` - Server port
- `CORS_ORIGIN` - **required** comma-separated allow-list; the app refuses to boot if unset (no
  unrestricted `*` fallback)
- `DATABASE_*` - Database connection settings (`DATABASE_USERNAME`/`PASSWORD`/`NAME` are
  **required** — no default credentials)
- `CACHE_*` / `VALKEY_*` - Cache (Valkey/Redis) connection settings
- `JWT_SECRET` - **required** JWT signing secret
- `SYSTEM_API_KEYS` - comma-separated keys accepted by `ApiKeyGuard` on `/internal/*` routes
- `RATE_LIMIT_TTL` / `RATE_LIMIT_MAX` - global rate limit (`@nestjs/throttler`)

## Security Defaults

This skeleton denies by default: every route requires a JWT unless decorated `@Public()`, CORS
and database credentials fail closed if unconfigured, `helmet()` and global rate limiting are
already wired, and internal API keys are compared in constant time. See `CODING_STANDARDS.md`
§9/§14 and `AGENTS.md` → Security Standards for the full list — keep these defaults secure in any
clone; don't work around them to get a service running faster.

## Creating a new service

See **`.ai/standards.md`** for the full backend standards including stack versions, architectural
patterns, testing conventions, and the Definition of Done.

When cloning `backend-skeleton` to create a new service, complete this rename checklist before
committing any service-specific code:

- [ ] `package.json` → update `"name"` field to the new service name (e.g. `"notifications"`)
- [ ] `package.json` `sentry:sourcemaps` script → replace both `--project tavolai-skeleton` with
      the new service's Sentry project slug (e.g. `--project tavolai-notifications`)
- [ ] `docker-compose.yml` → rename container names `backend-postgres` and `backend-valkey` to
      match the new service (e.g. `notifications-postgres`, `notifications-valkey`)
- [ ] `.env.example` → update `DATABASE_NAME` to the new service's database name
- [ ] `AGENTS.md` → update the title, overview paragraph, and stack table to reflect the new service
