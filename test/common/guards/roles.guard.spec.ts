import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '@common/guards/roles.guard';
import { JwtPayload } from '@modules/auth/interfaces';

function buildContext(user?: JwtPayload): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext;
}

function buildReflector(requiredRoles: string[] | undefined): Reflector {
  return {
    getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
  } as unknown as Reflector;
}

describe('RolesGuard', () => {
  describe('canActivate', () => {
    it('should allow the request when no roles are required', () => {
      const guard = new RolesGuard(buildReflector(undefined));
      const context = buildContext({ sub: 'user-1' });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow the request when the required roles list is empty', () => {
      const guard = new RolesGuard(buildReflector([]));
      const context = buildContext({ sub: 'user-1', roles: [] });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw ForbiddenException when the user has no roles', () => {
      const guard = new RolesGuard(buildReflector(['admin']));
      const context = buildContext({ sub: 'user-1' });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when the user has an empty roles array', () => {
      const guard = new RolesGuard(buildReflector(['admin']));
      const context = buildContext({ sub: 'user-1', roles: [] });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when none of the user roles match', () => {
      const guard = new RolesGuard(buildReflector(['admin']));
      const context = buildContext({ sub: 'user-1', roles: ['staff'] });

      expect(() => guard.canActivate(context)).toThrow(
        'Required roles: admin',
      );
    });

    it('should allow the request when the user has at least one required role', () => {
      const guard = new RolesGuard(buildReflector(['admin', 'manager']));
      const context = buildContext({ sub: 'user-1', roles: ['manager'] });

      expect(guard.canActivate(context)).toBe(true);
    });
  });
});
