# config/ — Configuration Factories

NestJS `registerAs` config factories loaded by `ConfigModule.forRoot()` in `AppModule`.
Import via `@config/*` path alias.

---

## Factories

| File | Namespace | Purpose |
|---|---|---|
| `database.config.ts` | `database` | TypeORM connection, pooling, migrations, snake_case naming |
| `cache.config.ts` | `cache` | Valkey/Redis host, port, TTL, max entries |
| `rate-limit.config.ts` | `rateLimit` | `RATE_LIMIT_TTL`/`RATE_LIMIT_MAX` consumed by the global `ThrottlerModule` |

### `database.config.ts` — fail-closed by design

- Throws at import/instantiation if `DATABASE_USERNAME` / `DATABASE_PASSWORD` / `DATABASE_NAME`
  are unset — there is **no** `?? 'postgres'`-style fallback. Every clone must set real
  credentials, even locally (see `.env.example`).
- `DATABASE_SSL=true` verifies certificates by default (`rejectUnauthorized: true`). Supply
  `DATABASE_SSL_CA` for a custom CA bundle, or set `DATABASE_SSL_REJECT_UNAUTHORIZED=false` only
  as a deliberate, informed opt-out.

---

## Adding a Config Factory

1. Create `src/config/my-feature.config.ts` using `registerAs('my-feature', () => ({...}))`.
2. Export it from `src/config/index.ts`.
3. Add it to the `load: []` array in `AppModule`'s `ConfigModule.forRoot()`.
4. Document each env var in `.env.example`.

---

## Environment Variables

See `.env.example` for the full list.

The `database.config.ts` also exports a bare `DataSource` used by the TypeORM CLI (migration
commands). Because the CLI bootstraps that file directly — outside Nest's `ConfigModule` — the file
calls `dotenv`'s `config()` at load time so the CLI `DataSource` still reads `.env`. Keep that call;
removing it breaks `migration:generate` / `migration:run`.
