import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '@modules/auth/strategies';

function buildConfigService(jwtSecret: string | undefined): ConfigService {
  return {
    get: jest.fn().mockReturnValue(jwtSecret),
  } as unknown as ConfigService;
}

describe('JwtStrategy', () => {
  describe('constructor', () => {
    it('should throw when JWT_SECRET is not configured (fail-closed)', () => {
      expect(() => new JwtStrategy(buildConfigService(undefined))).toThrow(
        'JWT_SECRET is not configured',
      );
    });

    it('should construct successfully when JWT_SECRET is configured', () => {
      expect(
        () => new JwtStrategy(buildConfigService('a-secret')),
      ).not.toThrow();
    });
  });

  describe('validate', () => {
    it('should return the payload when it has a subject claim', () => {
      const strategy = new JwtStrategy(buildConfigService('a-secret'));

      const payload = { sub: 'user-1', roles: ['owner'] };
      expect(strategy.validate(payload)).toBe(payload);
    });

    it('should throw UnauthorizedException when the subject claim is missing', () => {
      const strategy = new JwtStrategy(buildConfigService('a-secret'));

      expect(() => strategy.validate({} as never)).toThrow(
        UnauthorizedException,
      );
    });
  });
});
