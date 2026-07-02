import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '@modules/auth/guards';

function buildContext(): ExecutionContext {
  return {
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext;
}

function buildReflector(isPublic: boolean | undefined): Reflector {
  return {
    getAllAndOverride: jest.fn().mockReturnValue(isPublic),
  } as unknown as Reflector;
}

describe('JwtAuthGuard', () => {
  // `super.canActivate` resolves at runtime to the prototype method of the
  // dynamically-generated `AuthGuard('jwt')` base class — spy on it there.
  const passportBase = Object.getPrototypeOf(
    JwtAuthGuard.prototype,
  ) as { canActivate: () => boolean };

  describe('canActivate', () => {
    it('should bypass passport authentication for routes marked @Public()', () => {
      const superSpy = jest
        .spyOn(passportBase, 'canActivate')
        .mockReturnValue(true);
      const guard = new JwtAuthGuard(buildReflector(true));

      const result = guard.canActivate(buildContext());

      expect(result).toBe(true);
      expect(superSpy).not.toHaveBeenCalled();
      superSpy.mockRestore();
    });

    it('should delegate to passport JWT authentication for non-public routes', () => {
      const superSpy = jest
        .spyOn(passportBase, 'canActivate')
        .mockReturnValue(true);
      const guard = new JwtAuthGuard(buildReflector(false));

      const result = guard.canActivate(buildContext());

      expect(result).toBe(true);
      expect(superSpy).toHaveBeenCalledTimes(1);
      superSpy.mockRestore();
    });

    it('should delegate to passport JWT authentication when no metadata is set', () => {
      const superSpy = jest
        .spyOn(passportBase, 'canActivate')
        .mockReturnValue(true);
      const guard = new JwtAuthGuard(buildReflector(undefined));

      guard.canActivate(buildContext());

      expect(superSpy).toHaveBeenCalledTimes(1);
      superSpy.mockRestore();
    });
  });
});
