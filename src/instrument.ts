// instrument.ts MUST be the very first import in main.ts — Sentry/OpenTelemetry must
// patch Node.js modules (http, express, pg, ioredis, openai, etc.) before NestJS loads them.
import { config } from 'dotenv';
config(); // ensure env vars are available before Sentry.init()

import * as Sentry from '@sentry/nestjs';
import { consoleLoggingIntegration, nestIntegration } from '@sentry/nestjs';
import type { ErrorEvent, EventHint, Log } from '@sentry/nestjs';

/**
 * Header/field names that must never leave the process in a Sentry payload.
 * Matched case-insensitively against object keys anywhere in the event
 * (request headers, cookies, extra data, breadcrumbs, log attributes, …).
 */
const SENSITIVE_KEY_PATTERN =
  /^(authorization|proxy-authorization|cookie|set-cookie|x-api-key|api[-_]?key|apikey|token|access[-_]?token|refresh[-_]?token|id[-_]?token|secret|client[-_]?secret|password|passwd|pwd|jwt|session|ssn|social[-_]?security|credit[-_]?card|card[-_]?number|cvv|pin)$/i;

const REDACTED = '[Filtered]';

/**
 * Recursively redacts sensitive keys from an arbitrary object/array before it
 * is sent to Sentry. Guards against circular references and leaves primitives
 * untouched.
 */
export function scrubSensitiveData<T>(
  value: T,
  seen: WeakSet<object> = new WeakSet(),
): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (seen.has(value)) {
    return value;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item: unknown) =>
      scrubSensitiveData(item, seen),
    ) as unknown as T;
  }

  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(source)) {
    const entry = source[key];
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      result[key] = REDACTED;
    } else if (entry !== null && typeof entry === 'object') {
      result[key] = scrubSensitiveData(entry, seen);
    } else {
      result[key] = entry;
    }
  }

  return result as T;
}

/**
 * Scrubs sensitive headers/fields from an error event before it's sent.
 */
export function beforeSend(
  event: ErrorEvent,
  _hint: EventHint,
): ErrorEvent | null {
  if (event.request) {
    event.request = scrubSensitiveData(event.request);
  }
  if (event.extra) {
    event.extra = scrubSensitiveData(event.extra);
  }
  if (event.contexts) {
    event.contexts = scrubSensitiveData(event.contexts);
  }
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((breadcrumb) =>
      breadcrumb.data
        ? { ...breadcrumb, data: scrubSensitiveData(breadcrumb.data) }
        : breadcrumb,
    );
  }
  return event;
}

/**
 * Scrubs sensitive attributes from a structured log entry before it's sent.
 */
export function beforeSendLog(log: Log): Log | null {
  if (log.attributes) {
    return { ...log, attributes: scrubSensitiveData(log.attributes) };
  }
  return log;
}

Sentry.init({
  dsn:
    process.env.NODE_ENV === 'development' ? undefined : process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? 'production',
  release: process.env.SENTRY_RELEASE,

  // Never forward IP addresses, cookies, or request bodies verbatim by
  // default — a clone must opt in explicitly and knowingly.
  sendDefaultPii: process.env.SENTRY_SEND_DEFAULT_PII === 'true',
  beforeSend,
  beforeSendLog,

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
