/**
 * JWT access-token payload.
 * Extend `roles` or add custom claims to suit your domain.
 */
export interface JwtPayload {
  /** User ID (subject) */
  sub: string;
  /** User email */
  email: string;
  /** Role names assigned to the user */
  roles: string[];
  /** Issued-at timestamp (set by JwtModule) */
  iat?: number;
  /** Expiry timestamp (set by JwtModule) */
  exp?: number;
}
