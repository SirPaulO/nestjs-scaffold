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
- `DATABASE_*` - Database connection settings
- `CACHE_*` - Cache (Valkey/Redis) connection settings
- `JWT_SECRET` - JWT signing secret

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
