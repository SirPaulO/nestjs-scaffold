/**
 * Baseline environment variables for the unit test run.
 *
 * Several config factories fail CLOSED at import/instantiation time when a
 * required secret is missing (JwtStrategy, database.config.ts). That's the
 * desired production behaviour, but it means unit tests need *some* value
 * present before they can import those modules at all. Individual specs
 * that exercise the fail-closed branch itself override/delete the relevant
 * variable (with `jest.resetModules()` + a fresh `require`) inside the test.
 *
 * `setupFiles` runs once per test file, before the test file's own imports,
 * so these are guaranteed to be set before any module under test loads.
 */
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.DATABASE_HOST = process.env.DATABASE_HOST ?? 'localhost';
process.env.DATABASE_PORT = process.env.DATABASE_PORT ?? '5432';
process.env.DATABASE_USERNAME = process.env.DATABASE_USERNAME ?? 'test_user';
process.env.DATABASE_PASSWORD =
  process.env.DATABASE_PASSWORD ?? 'test_password';
process.env.DATABASE_NAME = process.env.DATABASE_NAME ?? 'test_db';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
process.env.CORS_ORIGIN =
  process.env.CORS_ORIGIN ?? 'http://localhost:3000';
process.env.SYSTEM_API_KEYS =
  process.env.SYSTEM_API_KEYS ?? 'test-system-api-key';
