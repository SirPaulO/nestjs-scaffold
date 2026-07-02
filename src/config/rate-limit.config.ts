import { registerAs } from '@nestjs/config';

/**
 * Global rate-limit configuration, consumed by the `@nestjs/throttler`
 * ThrottlerModule wired up as a global guard in `app.module.ts`.
 */
export const rateLimitConfig = registerAs('rateLimit', () => ({
  ttl: parseInt(process.env.RATE_LIMIT_TTL ?? '60000', 10),
  limit: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
}));
