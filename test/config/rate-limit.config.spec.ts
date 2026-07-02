import { rateLimitConfig } from '@config/rate-limit.config';

describe('rateLimitConfig', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should default to 60s / 100 requests when unset', () => {
    delete process.env.RATE_LIMIT_TTL;
    delete process.env.RATE_LIMIT_MAX;

    expect(rateLimitConfig()).toEqual({ ttl: 60000, limit: 100 });
  });

  it('should read the configured values', () => {
    process.env.RATE_LIMIT_TTL = '1000';
    process.env.RATE_LIMIT_MAX = '5';

    expect(rateLimitConfig()).toEqual({ ttl: 1000, limit: 5 });
  });
});
