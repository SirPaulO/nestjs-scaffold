import {
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiKeyGuard } from '@common/guards/api-key.guard';

function buildContext(headers: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as unknown as ExecutionContext;
}

function buildConfigService(systemApiKeys: string | undefined): ConfigService {
  return {
    get: jest.fn().mockReturnValue(systemApiKeys),
  } as unknown as ConfigService;
}

describe('ApiKeyGuard', () => {
  describe('constructor', () => {
    it('should warn when SYSTEM_API_KEYS is not configured', () => {
      const warnSpy = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);

      new ApiKeyGuard(buildConfigService(undefined));

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('SYSTEM_API_KEYS is not configured'),
      );
      warnSpy.mockRestore();
    });

    it('should parse a comma-separated list, trimming whitespace and dropping empties', () => {
      const guard = new ApiKeyGuard(
        buildConfigService(' key-one , key-two ,, '),
      );
      const context = buildContext({ 'x-api-key': 'key-two' });

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('canActivate', () => {
    it('should allow a request whose X-Api-Key matches a configured key', () => {
      const guard = new ApiKeyGuard(buildConfigService('secret-key'));
      const context = buildContext({ 'x-api-key': 'secret-key' });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow a request matching any of several configured keys', () => {
      const guard = new ApiKeyGuard(
        buildConfigService('key-a,key-b,key-c'),
      );

      expect(
        guard.canActivate(buildContext({ 'x-api-key': 'key-a' })),
      ).toBe(true);
      expect(
        guard.canActivate(buildContext({ 'x-api-key': 'key-c' })),
      ).toBe(true);
    });

    it('should reject a request with a wrong key', () => {
      const guard = new ApiKeyGuard(buildConfigService('secret-key'));
      const context = buildContext({ 'x-api-key': 'wrong-key' });

      expect(() => guard.canActivate(context)).toThrow(
        UnauthorizedException,
      );
    });

    it('should reject a request missing the header entirely', () => {
      const guard = new ApiKeyGuard(buildConfigService('secret-key'));
      const context = buildContext({});

      expect(() => guard.canActivate(context)).toThrow(
        UnauthorizedException,
      );
    });

    it('should reject a non-string header value (e.g. duplicated header array)', () => {
      const guard = new ApiKeyGuard(buildConfigService('secret-key'));
      const context = buildContext({
        'x-api-key': ['secret-key', 'secret-key'],
      });

      expect(() => guard.canActivate(context)).toThrow(
        UnauthorizedException,
      );
    });

    it('should reject every candidate when no keys are configured (fail-closed)', () => {
      const guard = new ApiKeyGuard(buildConfigService(undefined));
      const context = buildContext({ 'x-api-key': 'anything' });

      expect(() => guard.canActivate(context)).toThrow(
        UnauthorizedException,
      );
    });

    it('should not throw a RangeError when candidate and configured keys differ in length', () => {
      const guard = new ApiKeyGuard(buildConfigService('a-very-long-key'));
      const context = buildContext({ 'x-api-key': 'x' });

      expect(() => guard.canActivate(context)).toThrow(
        UnauthorizedException,
      );
    });
  });
});
