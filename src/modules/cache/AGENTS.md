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
| `delPattern(pattern)` | Delete all keys matching a glob pattern, via `SCAN` |
| `getOrSet<T>(key, factory, ttl?)` | Cache-aside pattern |
| `has(key)` | Check existence |
| `mget<T>(keys[])` | Batch get |
| `mset<T>(map, ttl?)` | Batch set |
| `incr(key, delta?)` / `decr(key, delta?)` | Atomic increment/decrement (Redis `INCRBY`) |
| `buildKey(prefix, ...parts)` | Build namespaced key |
| `reset()` | Flush all cache entries |

### `delPattern` uses SCAN, never KEYS

`KEYS` walks the entire keyspace in one blocking call and stalls every other client on the shared
Valkey instance while it runs. `delPattern` instead uses ioredis' `scanStream` to walk the
keyspace in small cursor-based batches, pipeline-deleting each batch as it arrives (with
backpressure via `stream.pause()`/`resume()`). Falls back to a no-op with a warning log if the
configured cache store isn't Redis-backed (no `client` exposed).

### `incr`/`decr` are atomic or they throw

Both go straight to Redis' `INCRBY` (via the store's underlying ioredis client) — there is **no**
non-atomic get-then-set fallback. A read-modify-write pair racing under concurrent callers would
silently lose increments, which is worse than failing loudly. If the configured store isn't
Redis-backed, `incr`/`decr` throw rather than return a value that may be wrong.

---

## Cache Prefixes / TTLs

`CachePrefix` and `CacheTTL` enums in `cache.service.ts` provide default namespaces.
Add project-specific prefixes and TTLs as needed.

---

## Configuration

Controlled by `VALKEY_*` and `CACHE_*` env vars (see `.env.example`).
Config factory: `src/config/cache.config.ts`.
