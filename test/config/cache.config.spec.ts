import { cacheConfig } from '@config/cache.config';

describe('cacheConfig', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should apply default values when no VALKEY_* vars are set', () => {
    delete process.env.VALKEY_HOST;
    delete process.env.VALKEY_PORT;
    delete process.env.VALKEY_USER;
    delete process.env.VALKEY_PASSWORD;
    delete process.env.VALKEY_DB;

    expect(cacheConfig()).toEqual({
      host: 'localhost',
      port: 6379,
      username: undefined,
      password: undefined,
      db: 0,
    });
  });

  it('should read every value from the environment when set', () => {
    process.env.VALKEY_HOST = 'valkey.internal';
    process.env.VALKEY_PORT = '6380';
    process.env.VALKEY_USER = 'app';
    process.env.VALKEY_PASSWORD = 'secret';
    process.env.VALKEY_DB = '2';

    expect(cacheConfig()).toEqual({
      host: 'valkey.internal',
      port: 6380,
      username: 'app',
      password: 'secret',
      db: 2,
    });
  });
});
