import { registerAs } from '@nestjs/config';

export const rateLimitConfig = registerAs('rateLimit', () => ({
  ttl: parseInt(process.env.RATE_LIMIT_TTL ?? '60000', 10),
  limit: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
}));
