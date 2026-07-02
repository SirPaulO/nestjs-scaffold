import { DataSource } from 'typeorm';
import { databaseConfig, dataSource } from '@config/database.config';

interface DbOptions {
  type: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
  logging: boolean | string[];
  ssl: boolean | { rejectUnauthorized: boolean; ca?: string };
  extra: {
    max: number;
    min: number;
    idleTimeoutMillis: number;
    connectionTimeoutMillis: number;
  };
}

describe('databaseConfig', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('credential validation (fail-closed)', () => {
    it('should throw when DATABASE_USERNAME is unset', () => {
      delete process.env.DATABASE_USERNAME;

      expect(() => databaseConfig()).toThrow(
        'DATABASE_USERNAME, DATABASE_PASSWORD and DATABASE_NAME must all be set',
      );
    });

    it('should throw when DATABASE_PASSWORD is unset', () => {
      delete process.env.DATABASE_PASSWORD;

      expect(() => databaseConfig()).toThrow(/DATABASE_PASSWORD/);
    });

    it('should throw when DATABASE_NAME is unset', () => {
      delete process.env.DATABASE_NAME;

      expect(() => databaseConfig()).toThrow(/DATABASE_NAME/);
    });

    it('should build options when every credential is set', () => {
      process.env.DATABASE_USERNAME = 'app_user';
      process.env.DATABASE_PASSWORD = 'app_password';
      process.env.DATABASE_NAME = 'app_db';

      const options = databaseConfig() as unknown as DbOptions;

      expect(options.type).toBe('postgres');
      expect(options.username).toBe('app_user');
      expect(options.password).toBe('app_password');
      expect(options.database).toBe('app_db');
    });
  });

  describe('host/port defaults', () => {
    it('should default host and port when unset', () => {
      delete process.env.DATABASE_HOST;
      delete process.env.DATABASE_PORT;

      const options = databaseConfig() as unknown as DbOptions;

      expect(options.host).toBe('localhost');
      expect(options.port).toBe(5432);
    });

    it('should use the configured host and port', () => {
      process.env.DATABASE_HOST = 'db.internal';
      process.env.DATABASE_PORT = '6543';

      const options = databaseConfig() as unknown as DbOptions;

      expect(options.host).toBe('db.internal');
      expect(options.port).toBe(6543);
    });
  });

  describe('ssl', () => {
    it('should default to disabled when DATABASE_SSL is not "true"', () => {
      delete process.env.DATABASE_SSL;

      const options = databaseConfig() as unknown as DbOptions;

      expect(options.ssl).toBe(false);
    });

    it('should default to full certificate verification when enabled', () => {
      process.env.DATABASE_SSL = 'true';
      delete process.env.DATABASE_SSL_REJECT_UNAUTHORIZED;
      delete process.env.DATABASE_SSL_CA;

      const options = databaseConfig() as unknown as DbOptions;

      expect(options.ssl).toEqual({
        rejectUnauthorized: true,
        ca: undefined,
      });
    });

    it('should include a custom CA bundle when provided', () => {
      process.env.DATABASE_SSL = 'true';
      process.env.DATABASE_SSL_CA = '-----BEGIN CERTIFICATE-----';

      const options = databaseConfig() as unknown as DbOptions;

      expect(options.ssl).toEqual({
        rejectUnauthorized: true,
        ca: '-----BEGIN CERTIFICATE-----',
      });
    });

    it('should only disable certificate verification via explicit opt-out', () => {
      process.env.DATABASE_SSL = 'true';
      process.env.DATABASE_SSL_REJECT_UNAUTHORIZED = 'false';

      const options = databaseConfig() as unknown as DbOptions;

      expect(options.ssl).toEqual({ rejectUnauthorized: false });
    });
  });

  describe('pool + logging + synchronize', () => {
    it('should apply default pool settings when unset', () => {
      delete process.env.DATABASE_POOL_MAX;
      delete process.env.DATABASE_POOL_MIN;
      delete process.env.DATABASE_IDLE_TIMEOUT;
      delete process.env.DATABASE_CONNECTION_TIMEOUT;

      const options = databaseConfig() as unknown as DbOptions;

      expect(options.extra).toEqual({
        max: 20,
        min: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    });

    it('should enable synchronize only when explicitly "true"', () => {
      process.env.DATABASE_SYNCHRONIZE = 'true';
      expect(
        (databaseConfig() as unknown as DbOptions).synchronize,
      ).toBe(true);

      process.env.DATABASE_SYNCHRONIZE = 'false';
      expect(
        (databaseConfig() as unknown as DbOptions).synchronize,
      ).toBe(false);
    });

    it('should log error/warn in development and disable logging otherwise', () => {
      process.env.NODE_ENV = 'development';
      expect(
        (databaseConfig() as unknown as DbOptions).logging,
      ).toEqual(['error', 'warn']);

      process.env.NODE_ENV = 'test';
      expect((databaseConfig() as unknown as DbOptions).logging).toBe(
        false,
      );
    });
  });

  describe('dataSource (TypeORM CLI)', () => {
    it('should export a configured DataSource instance', () => {
      expect(dataSource).toBeInstanceOf(DataSource);
      expect(dataSource.options.type).toBe('postgres');
    });
  });
});
