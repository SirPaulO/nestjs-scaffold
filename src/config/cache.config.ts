import { registerAs } from '@nestjs/config';

export const cacheConfig = registerAs('cache', () => ({
  host: process.env.VALKEY_HOST ?? 'localhost',
  port: parseInt(process.env.VALKEY_PORT ?? '6379', 10),
  username: process.env.VALKEY_USER ?? undefined,
  password: process.env.VALKEY_PASSWORD ?? undefined,
  db: parseInt(process.env.VALKEY_DB ?? '0', 10),
}));
