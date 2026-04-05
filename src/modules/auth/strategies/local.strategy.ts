import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { AppErrorCode } from '@common/constants/error-codes';

/**
 * Local strategy that authenticates users via email + password.
 * Delegates credential validation to AuthService.validateUser.
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(email: string, password: string): Promise<unknown> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException(
        'Invalid credentials',
        AppErrorCode.INVALID_CREDENTIALS,
      );
    }
    return user;
  }
}
