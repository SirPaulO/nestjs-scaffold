import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '@modules/auth/interfaces';
import { AppErrorCode } from '../constants/error-codes';

/**
 * Guard that enforces role-based access control.
 * Works with the @Roles() decorator.
 * Assumes the JWT guard has already populated req.user with a JwtPayload.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user: JwtPayload }>();
    const user = request.user;

    if (!user?.roles || user.roles.length === 0) {
      throw new ForbiddenException(
        'No roles assigned to user',
        AppErrorCode.FORBIDDEN,
      );
    }

    const hasRole = requiredRoles.some((role) => user.roles!.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(
        `Required roles: ${requiredRoles.join(', ')}`,
        AppErrorCode.FORBIDDEN,
      );
    }

    return true;
  }
}
