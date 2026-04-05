import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

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
   * Delete multiple keys matching a pattern
   * @param pattern - Pattern to match (e.g., 'availability:restaurant-id:*')
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const store = (this.cacheManager as unknown as { store: unknown })
        .store as {
        keys?: (pattern: string) => Promise<string[]>;
        del?: (key: string) => Promise<void>;
      };

      if (store.keys && store.del) {
        const keys = await store.keys(pattern);
        await Promise.all(keys.map((key) => store.del?.(key)));
        this.logger.debug(
          `Cache pattern deleted: ${pattern} (${keys.length} keys)`,
        );
      } else {
        this.logger.warn('Pattern deletion not supported by cache store');
      }
    } catch (error) {
      this.logger.error(`Cache pattern delete error for ${pattern}:`, error);
    }
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
   * Increment a numeric value in cache
   * @param key - Cache key
   * @param delta - Amount to increment (default: 1)
   * @returns New value after increment
   */
  async incr(key: string, delta: number = 1): Promise<number> {
    try {
      const store = (this.cacheManager as unknown as { store: unknown })
        .store as {
        client?: {
          incrby?: (key: string, delta: number) => Promise<number>;
        };
      };

      if (store.client?.incrby) {
        const newValue = await store.client.incrby(key, delta);
        this.logger.debug(
          `Cache incremented: ${key} by ${delta} = ${newValue}`,
        );
        return newValue;
      }

      const current = (await this.get<number>(key)) ?? 0;
      const newValue = current + delta;
      await this.set(key, newValue);
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
