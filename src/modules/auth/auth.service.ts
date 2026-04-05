import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { JwtPayload, AuthTokens } from './interfaces';

/**
 * AuthService — stub implementation.
 *
 * TODO: Inject your User repository/service and implement:
 *   - findByEmail(email): find a user record by email
 *   - register(dto): create a new user with hashed password
 *
 * The patterns below show the standard approach; wire up the DB layer
 * once you have a User entity.
 */
@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Validates credentials for the local (email/password) strategy.
   * Returns the user object on success or null on failure.
   *
   * Replace the stub lookup with a real repository call.
   */
  /**
   * Validates credentials for the local (email/password) strategy.
   * Returns the user object on success or null on failure.
   *
   * TODO: Replace with a real implementation once you have a User entity:
   *   const user = await this.usersService.findByEmail(email);
   *   if (!user) return null;
   *   const isMatch = await bcrypt.compare(password, user.passwordHash);
   *   return isMatch ? user : null;
   *
   * bcrypt is imported and available for hashing/comparison.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validateUser(_email: string, _password: string): Promise<unknown> {
    void bcrypt; // available for password comparison
    return Promise.resolve(null);
  }

  /**
   * Issues JWT access (and optionally refresh) tokens for a validated user.
   */
  login(userId: string, email: string, roles: string[]): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: userId, email, roles };
    const accessToken = this.jwtService.sign(payload);
    return Promise.resolve({ accessToken, expiresIn: 3600 });
  }
}
