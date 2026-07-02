import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { Redis } from 'ioredis';

/**
 * Cache key prefixes for different data types
 */
export enum CachePrefix {
  SETTINGS = 'settings',
  SESSION = 'session',
  USER = 'user',
}

/**
 * Cache TTL configurations in seconds
 */
export enum CacheTTL {
  SETTINGS = 1800, // 30 minutes
  SESSION = 900, // 15 minutes
  USER = 2700, // 45 minutes
}

/**
 * Generic caching service for Valkey/Redis operations
 * Provides type-safe caching with automatic key generation and TTL management
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(CACHE_MANAGER as never)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * Get a value from cache
   * @param key - Cache key
   * @returns Cached value or undefined if not found
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await (
        this.cacheManager.get as (key: string) => Promise<T | undefined>
      )(key);

      if (value !== undefined) {
        this.logger.debug(`Cache hit: ${key}`);
      } else {
        this.logger.debug(`Cache miss: ${key}`);
      }

      return value;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Set a value in cache with TTL
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds (optional)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await (
        this.cacheManager.set as (
          key: string,
          value: unknown,
          ttl?: number,
        ) => Promise<void>
      )(key, value, ttl ? ttl * 1000 : undefined);

      this.logger.debug(`Cache set: ${key} (TTL: ${ttl ?? 'default'}s)`);
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete a value from cache
   * @param key - Cache key
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys matching a pattern.
   *
   * Uses `SCAN` (via ioredis' `scanStream`) rather than the blocking `KEYS`
   * command — `KEYS` walks the entire keyspace in one shot and stalls every
   * other client on the shared Valkey instance while it runs. `SCAN` walks it
   * incrementally in small cursor-based batches, which we pipeline-delete as
   * they arrive.
   * @param pattern - Pattern to match (e.g., 'availability:restaurant-id:*')
   */
  async delPattern(pattern: string): Promise<void> {
    const client = this.getRedisClient();
    if (!client) {
      this.logger.warn('Pattern deletion not supported by cache store');
      return;
    }

    try {
      const deletedCount = await this.scanAndDelete(client, pattern);
      this.logger.debug(
        `Cache pattern deleted: ${pattern} (${deletedCount} keys)`,
      );
    } catch (error) {
      this.logger.error(`Cache pattern delete error for ${pattern}:`, error);
    }
  }

  /**
   * Walks the keyspace with SCAN in batches, deleting each batch via a
   * pipeline. Backpressure is applied by pausing the scan stream while a
   * batch's deletion is in flight.
   */
  private scanAndDelete(client: Redis, pattern: string): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      let deletedCount = 0;
      const stream = client.scanStream({ match: pattern, count: 100 });

      stream.on('data', (keys: string[]) => {
        if (keys.length === 0) {
          return;
        }
        stream.pause();
        const pipeline = client.pipeline();
        keys.forEach((key) => pipeline.del(key));
        pipeline
          .exec()
          .then(() => {
            deletedCount += keys.length;
            stream.resume();
          })
          .catch((error: unknown) => {
            stream.destroy();
            reject(error instanceof Error ? error : new Error(String(error)));
          });
      });

      stream.on('end', () => resolve(deletedCount));
      stream.on('error', (error: unknown) =>
        reject(error instanceof Error ? error : new Error(String(error))),
      );
    });
  }

  /**
   * Returns the underlying ioredis client backing the cache store, if the
   * configured store exposes one (the Valkey/ioredis store does via its
   * `client` getter).
   */
  private getRedisClient(): Redis | undefined {
    const store = (this.cacheManager as unknown as { store?: unknown }).store;
    const client = (store as { client?: Redis } | undefined)?.client;
    return client;
  }

  /**
   * Clear all cache entries
   */
  async reset(): Promise<void> {
    try {
      await (
        this.cacheManager as unknown as { reset: () => Promise<void> }
      ).reset();
      this.logger.debug('Cache reset');
    } catch (error) {
      this.logger.error('Cache reset error:', error);
    }
  }

  /**
   * Build cache key with prefix
   * @param prefix - Cache prefix
   * @param parts - Key parts to join
   * @returns Formatted cache key
   */
  buildKey(prefix: CachePrefix, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  /**
   * Get or set a value in cache (cache-aside pattern)
   * @param key - Cache key
   * @param factory - Function to generate value if not cached
   * @param ttl - Time to live in seconds
   * @returns Cached or generated value
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== undefined) {
      return cached;
    }

    this.logger.debug(`Cache miss, generating value for: ${key}`);
    const value = await factory();
    await this.set(key, value, ttl);

    return value;
  }

  /**
   * Wrap a function with caching
   * @param key - Cache key
   * @param ttl - Time to live in seconds
   * @param fn - Function to wrap
   * @returns Wrapped function that uses cache
   */
  wrap<T>(key: string, ttl: number, fn: () => Promise<T>): () => Promise<T> {
    return async () => {
      return this.getOrSet(key, fn, ttl);
    };
  }

  /**
   * Check if a key exists in cache
   * @param key - Cache key
   * @returns True if key exists
   */
  async has(key: string): Promise<boolean> {
    try {
      const value = await this.get(key);
      return value !== undefined;
    } catch (error) {
      this.logger.error(`Cache has error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get multiple values from cache
   * @param keys - Array of cache keys
   * @returns Map of key to value
   */
  async mget<T>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();

    await Promise.all(
      keys.map(async (key) => {
        const value = await this.get<T>(key);
        if (value !== undefined) {
          results.set(key, value);
        }
      }),
    );

    return results;
  }

  /**
   * Set multiple values in cache
   * @param entries - Map of key to value
   * @param ttl - Time to live in seconds (optional)
   */
  async mset<T>(entries: Map<string, T>, ttl?: number): Promise<void> {
    await Promise.all(
      Array.from(entries.entries()).map(([key, value]) =>
        this.set(key, value, ttl),
      ),
    );
  }

  /**
   * Atomically increment a numeric value in cache using Redis' `INCRBY`.
   *
   * There is deliberately no non-atomic get-then-set fallback: a
   * read-modify-write pair racing under concurrent callers silently loses
   * increments. If the store isn't Redis-backed (no atomic primitive
   * available), fail loudly instead of returning a value that may be wrong.
   * @param key - Cache key
   * @param delta - Amount to increment (default: 1)
   * @returns New value after increment
   */
  async incr(key: string, delta: number = 1): Promise<number> {
    const client = this.getRedisClient();
    if (!client) {
      throw new Error(
        'Atomic increment requires a Redis-backed cache store; none is configured',
      );
    }

    try {
      const newValue = await client.incrby(key, delta);
      this.logger.debug(`Cache incremented: ${key} by ${delta} = ${newValue}`);
      return newValue;
    } catch (error) {
      this.logger.error(`Cache increment error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Decrement a numeric value in cache
   * @param key - Cache key
   * @param delta - Amount to decrement (default: 1)
   * @returns New value after decrement
   */
  async decr(key: string, delta: number = 1): Promise<number> {
    return this.incr(key, -delta);
  }
}
