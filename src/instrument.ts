// instrument.ts MUST be the very first import in main.ts — Sentry/OpenTelemetry must
// patch Node.js modules (http, express, pg, ioredis, openai, etc.) before NestJS loads them.
import { config } from 'dotenv';
config();

import * as Sentry from '@sentry/nestjs';
import { consoleLoggingIntegration, nestIntegration } from '@sentry/nestjs';
import type { ErrorEvent, EventHint, Log } from '@sentry/nestjs';

const SENSITIVE_KEY_PATTERN =
  /^(authorization|proxy-authorization|cookie|set-cookie|x-api-key|api[-_]?key|apikey|token|access[-_]?token|refresh[-_]?token|id[-_]?token|secret|client[-_]?secret|password|passwd|pwd|jwt|session|ssn|social[-_]?security|credit[-_]?card|card[-_]?number|cvv|pin)$/i;

const REDACTED = '[Filtered]';

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
  sendDefaultPii: process.env.SENTRY_SEND_DEFAULT_PII === 'true',
  beforeSend,
  beforeSendLog,
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.0'),
  enableLogs: true,
  integrations: [consoleLoggingIntegration(), nestIntegration()],
});
