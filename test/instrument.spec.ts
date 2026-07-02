import type { ErrorEvent, EventHint, Log } from '@sentry/nestjs';
import {
  beforeSend,
  beforeSendLog,
  scrubSensitiveData,
} from '../src/instrument';

describe('scrubSensitiveData', () => {
  it('should redact a known sensitive key', () => {
    const result = scrubSensitiveData({ authorization: 'Bearer abc123' });

    expect(result).toEqual({ authorization: '[Filtered]' });
  });

  it('should redact sensitive keys case-insensitively', () => {
    const result = scrubSensitiveData({
      Authorization: 'Bearer abc123',
      Cookie: 'session=xyz',
      'X-Api-Key': 'key-1',
    });

    expect(result).toEqual({
      Authorization: '[Filtered]',
      Cookie: '[Filtered]',
      'X-Api-Key': '[Filtered]',
    });
  });

  it('should leave non-sensitive keys untouched', () => {
    const result = scrubSensitiveData({ userId: '123', method: 'GET' });

    expect(result).toEqual({ userId: '123', method: 'GET' });
  });

  it('should redact sensitive keys nested inside objects', () => {
    const result = scrubSensitiveData({
      request: { headers: { authorization: 'Bearer abc' } },
    });

    expect(result).toEqual({
      request: { headers: { authorization: '[Filtered]' } },
    });
  });

  it('should redact sensitive keys inside array items', () => {
    const result = scrubSensitiveData([{ token: 'secret' }, { ok: true }]);

    expect(result).toEqual([{ token: '[Filtered]' }, { ok: true }]);
  });

  it('should not recurse infinitely on circular references', () => {
    const circular: Record<string, unknown> = { password: 'secret' };
    circular.self = circular;

    expect(() => scrubSensitiveData(circular)).not.toThrow();
    const result = scrubSensitiveData(circular) as Record<string, unknown>;
    expect(result.password).toBe('[Filtered]');
  });

  it('should return primitives unchanged', () => {
    expect(scrubSensitiveData('plain string')).toBe('plain string');
    expect(scrubSensitiveData(42)).toBe(42);
    expect(scrubSensitiveData(null)).toBeNull();
    expect(scrubSensitiveData(undefined)).toBeUndefined();
  });
});

describe('beforeSend', () => {
  const hint = {} as EventHint;

  it('should scrub sensitive request headers', () => {
    const event = {
      request: { headers: { authorization: 'Bearer abc', 'x-api-key': 'k' } },
    } as unknown as ErrorEvent;

    const result = beforeSend(event, hint);

    expect(result?.request?.headers).toEqual({
      authorization: '[Filtered]',
      'x-api-key': '[Filtered]',
    });
  });

  it('should scrub extra data', () => {
    const event = {
      extra: { password: 'hunter2', reservationId: 'abc' },
    } as unknown as ErrorEvent;

    const result = beforeSend(event, hint);

    expect(result?.extra).toEqual({
      password: '[Filtered]',
      reservationId: 'abc',
    });
  });

  it('should scrub contexts', () => {
    const event = {
      contexts: { auth: { token: 'secret' } },
    } as unknown as ErrorEvent;

    const result = beforeSend(event, hint);

    expect(result?.contexts).toEqual({ auth: { token: '[Filtered]' } });
  });

  it('should scrub breadcrumb data without dropping other breadcrumb fields', () => {
    const event = {
      breadcrumbs: [
        { message: 'fetch', data: { authorization: 'Bearer abc' } },
        { message: 'no-data' },
      ],
    } as unknown as ErrorEvent;

    const result = beforeSend(event, hint);

    expect(result?.breadcrumbs).toEqual([
      { message: 'fetch', data: { authorization: '[Filtered]' } },
      { message: 'no-data' },
    ]);
  });

  it('should return the event unchanged when there is nothing to scrub', () => {
    const event = { message: 'plain error' } as unknown as ErrorEvent;

    expect(beforeSend(event, hint)).toBe(event);
  });
});

describe('beforeSendLog', () => {
  it('should scrub sensitive log attributes', () => {
    const log = {
      level: 'info',
      message: 'user logged in',
      attributes: { token: 'secret', userId: '42' },
    } as unknown as Log;

    const result = beforeSendLog(log);

    expect(result?.attributes).toEqual({
      token: '[Filtered]',
      userId: '42',
    });
  });

  it('should return the log unchanged when it has no attributes', () => {
    const log = { level: 'info', message: 'no attrs' } as unknown as Log;

    expect(beforeSendLog(log)).toBe(log);
  });
});
