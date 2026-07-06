import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { Redis } from 'ioredis';

export enum CachePrefix {
  SETTINGS = 'settings',
  SESSION = 'session',
  USER = 'user',
}

export enum CacheTTL {
  SETTINGS = 30 * 60,
  SESSION = 15 * 60,
  USER = 45 * 60,
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(CACHE_MANAGER as never)
    private readonly cacheManager: Cache,
  ) {}

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

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

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

  private getRedisClient(): Redis | undefined {
    const store = (this.cacheManager as unknown as { store?: unknown }).store;
    const client = (store as { client?: Redis } | undefined)?.client;
    return client;
  }

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

  buildKey(prefix: CachePrefix, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

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

  wrap<T>(key: string, ttl: number, fn: () => Promise<T>): () => Promise<T> {
    return async () => {
      return this.getOrSet(key, fn, ttl);
    };
  }

  async has(key: string): Promise<boolean> {
    try {
      const value = await this.get(key);
      return value !== undefined;
    } catch (error) {
      this.logger.error(`Cache has error for key ${key}:`, error);
      return false;
    }
  }

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

  async mset<T>(entries: Map<string, T>, ttl?: number): Promise<void> {
    await Promise.all(
      Array.from(entries.entries()).map(([key, value]) =>
        this.set(key, value, ttl),
      ),
    );
  }

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

  async decr(key: string, delta: number = 1): Promise<number> {
    return this.incr(key, -delta);
  }
}
