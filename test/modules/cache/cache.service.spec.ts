import { EventEmitter } from 'events';
import type { Cache } from 'cache-manager';
import {
  CachePrefix,
  CacheService,
  CacheTTL,
} from '@modules/cache/cache.service';

interface FakeScanStream extends EventEmitter {
  pause: jest.Mock;
  resume: jest.Mock;
  destroy: jest.Mock;
}

function buildFakeScanStream(): FakeScanStream {
  const emitter = new EventEmitter() as FakeScanStream;
  emitter.pause = jest.fn();
  emitter.resume = jest.fn();
  emitter.destroy = jest.fn();
  return emitter;
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('CacheService', () => {
  let cacheManager: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    reset: jest.Mock;
    store?: { client?: unknown };
  };
  let redisClient: {
    incrby: jest.Mock;
    scanStream: jest.Mock;
    pipeline: jest.Mock;
  };
  let service: CacheService;

  beforeEach(() => {
    redisClient = {
      incrby: jest.fn(),
      scanStream: jest.fn(),
      pipeline: jest.fn(),
    };
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
      store: { client: redisClient },
    };
    service = new CacheService(cacheManager as unknown as Cache);
  });

  describe('get', () => {
    it('should return the cached value on a hit', async () => {
      cacheManager.get.mockResolvedValue('cached-value');

      await expect(service.get('key')).resolves.toBe('cached-value');
    });

    it('should return undefined on a miss', async () => {
      cacheManager.get.mockResolvedValue(undefined);

      await expect(service.get('key')).resolves.toBeUndefined();
    });

    it('should swallow errors and return undefined', async () => {
      cacheManager.get.mockRejectedValue(new Error('boom'));

      await expect(service.get('key')).resolves.toBeUndefined();
    });
  });

  describe('set', () => {
    it('should convert a TTL in seconds to milliseconds', async () => {
      cacheManager.set.mockResolvedValue(undefined);

      await service.set('key', 'value', 30);

      expect(cacheManager.set).toHaveBeenCalledWith('key', 'value', 30000);
    });

    it('should pass undefined TTL through unchanged', async () => {
      cacheManager.set.mockResolvedValue(undefined);

      await service.set('key', 'value');

      expect(cacheManager.set).toHaveBeenCalledWith(
        'key',
        'value',
        undefined,
      );
    });

    it('should swallow errors', async () => {
      cacheManager.set.mockRejectedValue(new Error('boom'));

      await expect(service.set('key', 'value')).resolves.toBeUndefined();
    });
  });

  describe('del', () => {
    it('should delete the key', async () => {
      cacheManager.del.mockResolvedValue(undefined);

      await service.del('key');

      expect(cacheManager.del).toHaveBeenCalledWith('key');
    });

    it('should swallow errors', async () => {
      cacheManager.del.mockRejectedValue(new Error('boom'));

      await expect(service.del('key')).resolves.toBeUndefined();
    });
  });

  describe('delPattern', () => {
    it('should warn and no-op when the store has no Redis client', async () => {
      cacheManager.store = {};

      await expect(service.delPattern('foo:*')).resolves.toBeUndefined();
      expect(redisClient.scanStream).not.toHaveBeenCalled();
    });

    it('should delete every key found across SCAN batches via a pipeline', async () => {
      const fakeStream = buildFakeScanStream();
      const pipelineDel = jest.fn();
      const pipelineExec = jest.fn().mockResolvedValue([]);
      redisClient.pipeline.mockReturnValue({
        del: pipelineDel,
        exec: pipelineExec,
      });
      redisClient.scanStream.mockReturnValue(fakeStream);

      const resultPromise = service.delPattern('foo:*');

      fakeStream.emit('data', ['foo:1', 'foo:2']);
      await flush();
      fakeStream.emit('data', ['foo:3']);
      await flush();
      fakeStream.emit('end');

      await resultPromise;

      expect(redisClient.scanStream).toHaveBeenCalledWith({
        match: 'foo:*',
        count: 100,
      });
      expect(pipelineDel).toHaveBeenCalledWith('foo:1');
      expect(pipelineDel).toHaveBeenCalledWith('foo:2');
      expect(pipelineDel).toHaveBeenCalledWith('foo:3');
      expect(fakeStream.pause).toHaveBeenCalled();
      expect(fakeStream.resume).toHaveBeenCalled();
    });

    it('should skip empty batches without touching the pipeline', async () => {
      const fakeStream = buildFakeScanStream();
      redisClient.scanStream.mockReturnValue(fakeStream);

      const resultPromise = service.delPattern('foo:*');

      fakeStream.emit('data', []);
      fakeStream.emit('end');

      await resultPromise;

      expect(redisClient.pipeline).not.toHaveBeenCalled();
    });

    it('should swallow a pipeline failure and abort the scan', async () => {
      const fakeStream = buildFakeScanStream();
      const pipelineDel = jest.fn();
      const pipelineExec = jest.fn().mockRejectedValue(new Error('down'));
      redisClient.pipeline.mockReturnValue({
        del: pipelineDel,
        exec: pipelineExec,
      });
      redisClient.scanStream.mockReturnValue(fakeStream);

      const resultPromise = service.delPattern('foo:*');
      fakeStream.emit('data', ['foo:1']);

      await expect(resultPromise).resolves.toBeUndefined();
      expect(fakeStream.destroy).toHaveBeenCalled();
    });

    it('should swallow a scan stream error', async () => {
      const fakeStream = buildFakeScanStream();
      redisClient.scanStream.mockReturnValue(fakeStream);

      const resultPromise = service.delPattern('foo:*');
      fakeStream.emit('error', new Error('connection reset'));

      await expect(resultPromise).resolves.toBeUndefined();
    });
  });

  describe('reset', () => {
    it('should reset the cache', async () => {
      cacheManager.reset.mockResolvedValue(undefined);

      await service.reset();

      expect(cacheManager.reset).toHaveBeenCalled();
    });

    it('should swallow errors', async () => {
      cacheManager.reset.mockRejectedValue(new Error('boom'));

      await expect(service.reset()).resolves.toBeUndefined();
    });
  });

  describe('buildKey', () => {
    it('should join the prefix and parts with a colon', () => {
      expect(service.buildKey(CachePrefix.USER, 'restaurant-1', 42)).toBe(
        'user:restaurant-1:42',
      );
    });
  });

  describe('getOrSet', () => {
    it('should return the cached value without calling the factory on a hit', async () => {
      cacheManager.get.mockResolvedValue('cached');
      const factory = jest.fn();

      const result = await service.getOrSet('key', factory, CacheTTL.USER);

      expect(result).toBe('cached');
      expect(factory).not.toHaveBeenCalled();
    });

    it('should generate and cache the value on a miss', async () => {
      cacheManager.get.mockResolvedValue(undefined);
      cacheManager.set.mockResolvedValue(undefined);
      const factory = jest.fn().mockResolvedValue('generated');

      const result = await service.getOrSet('key', factory);

      expect(result).toBe('generated');
      expect(cacheManager.set).toHaveBeenCalledWith(
        'key',
        'generated',
        undefined,
      );
    });
  });

  describe('wrap', () => {
    it('should return a function that uses the cache', async () => {
      cacheManager.get.mockResolvedValue(undefined);
      cacheManager.set.mockResolvedValue(undefined);
      const fn = jest.fn().mockResolvedValue('wrapped-value');

      const wrapped = service.wrap('key', 60, fn);
      const result = await wrapped();

      expect(result).toBe('wrapped-value');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('has', () => {
    it('should return true when the key exists', async () => {
      cacheManager.get.mockResolvedValue('value');

      await expect(service.has('key')).resolves.toBe(true);
    });

    it('should return false when the key does not exist', async () => {
      cacheManager.get.mockResolvedValue(undefined);

      await expect(service.has('key')).resolves.toBe(false);
    });
  });

  describe('mget', () => {
    it('should return only the keys found in cache', async () => {
      cacheManager.get.mockImplementation((key: string) =>
        Promise.resolve(key === 'a' ? 'value-a' : undefined),
      );

      const result = await service.mget(['a', 'b']);

      expect(result.get('a')).toBe('value-a');
      expect(result.has('b')).toBe(false);
    });
  });

  describe('mset', () => {
    it('should set every entry', async () => {
      cacheManager.set.mockResolvedValue(undefined);
      const entries = new Map<string, string>([
        ['a', '1'],
        ['b', '2'],
      ]);

      await service.mset(entries, 60);

      expect(cacheManager.set).toHaveBeenCalledWith('a', '1', 60000);
      expect(cacheManager.set).toHaveBeenCalledWith('b', '2', 60000);
    });
  });

  describe('incr', () => {
    it('should throw when the store is not Redis-backed', async () => {
      cacheManager.store = {};

      await expect(service.incr('counter')).rejects.toThrow(
        'Atomic increment requires a Redis-backed cache store',
      );
    });

    it('should atomically increment via INCRBY', async () => {
      redisClient.incrby.mockResolvedValue(5);

      await expect(service.incr('counter', 5)).resolves.toBe(5);
      expect(redisClient.incrby).toHaveBeenCalledWith('counter', 5);
    });

    it('should default the delta to 1', async () => {
      redisClient.incrby.mockResolvedValue(1);

      await service.incr('counter');

      expect(redisClient.incrby).toHaveBeenCalledWith('counter', 1);
    });

    it('should log and rethrow when the Redis command fails', async () => {
      redisClient.incrby.mockRejectedValue(new Error('connection lost'));

      await expect(service.incr('counter')).rejects.toThrow(
        'connection lost',
      );
    });
  });

  describe('decr', () => {
    it('should increment by the negated delta', async () => {
      redisClient.incrby.mockResolvedValue(-3);

      await service.decr('counter', 3);

      expect(redisClient.incrby).toHaveBeenCalledWith('counter', -3);
    });
  });
});
