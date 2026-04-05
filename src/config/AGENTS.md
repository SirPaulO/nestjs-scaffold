# config/ — Configuration Factories

NestJS `registerAs` config factories loaded by `ConfigModule.forRoot()` in `AppModule`.
Import via `@config/*` path alias.

---

## Factories

| File | Namespace | Purpose |
|---|---|---|
| `database.config.ts` | `database` | TypeORM connection, pooling, migrations, snake_case naming |
| `cache.config.ts` | `cache` | Valkey/Redis host, port, TTL, max entries |

---

## Adding a Config Factory

1. Create `src/config/my-feature.config.ts` using `registerAs('my-feature', () => ({...}))`.
2. Export it from `src/config/index.ts`.
3. Add it to the `load: []` array in `AppModule`'s `ConfigModule.forRoot()`.
4. Document each env var in `.env.example`.

---

## Environment Variables

See `.env.example` for the full list.
The `database.config.ts` also exports a bare `DataSource` used by the TypeORM CLI
(migration commands).
