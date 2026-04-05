# modules/cache/ — Caching Layer

Global Valkey/Redis caching module built on `cache-manager` + `cache-manager-ioredis-yet`.
Registered as `@Global()` — import `CacheService` anywhere without re-importing the module.

---

## API

| Method | Description |
|---|---|
| `get<T>(key)` | Retrieve a cached value |
| `set<T>(key, value, ttl?)` | Store a value (TTL in seconds) |
| `del(key)` | Delete a single key |
| `delPattern(pattern)` | Delete all keys matching a glob pattern |
| `getOrSet<T>(key, factory, ttl?)` | Cache-aside pattern |
| `has(key)` | Check existence |
| `mget<T>(keys[])` | Batch get |
| `mset<T>(map, ttl?)` | Batch set |
| `incr(key, delta?)` | Atomic increment |
| `buildKey(prefix, ...parts)` | Build namespaced key |
| `reset()` | Flush all cache entries |

---

## Cache Prefixes / TTLs

`CachePrefix` and `CacheTTL` enums in `cache.service.ts` provide default namespaces.
Add project-specific prefixes and TTLs as needed.

---

## Configuration

Controlled by `VALKEY_*` and `CACHE_*` env vars (see `.env.example`).
Config factory: `src/config/cache.config.ts`.
