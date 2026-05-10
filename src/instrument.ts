// instrument.ts MUST be the very first import in main.ts — Sentry/OpenTelemetry must
// patch Node.js modules (http, express, pg, ioredis, openai, etc.) before NestJS loads them.
import { config } from 'dotenv';
config(); // ensure env vars are available before Sentry.init()

import * as Sentry from '@sentry/nestjs';
import { consoleLoggingIntegration, nestIntegration } from '@sentry/nestjs';

Sentry.init({
  dsn: process.env.NODE_ENV === 'development' ? undefined : process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? 'production',
  release: process.env.SENTRY_RELEASE,
  sendDefaultPii: true,

  // Tracing — lower to 0.1–0.2 in high-traffic production
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.0'),

  // Structured logs — bridges NestJS Logger output to Sentry Logs UI
  enableLogs: true,
  integrations: [
    // Captures all console output (NestJS Logger uses ConsoleLogger) as Sentry Logs
    consoleLoggingIntegration(),
    nestIntegration(),
  ],

  // AI Monitoring: OpenAI is auto-instrumented — no extra config needed.
  // Database: pg/ioredis/TypeORM are auto-instrumented — no extra config needed.
});
