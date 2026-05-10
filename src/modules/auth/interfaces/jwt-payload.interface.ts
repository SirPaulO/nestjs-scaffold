export interface JwtPayload {
  /** User ID (subject) */
  sub: string;
  /** Role names — standard claim for RBAC */
  roles?: string[];
  /** Issued-at timestamp */
  iat?: number;
  /** Expiry timestamp */
  exp?: number;
  /** Any additional claims present in the token */
  [key: string]: unknown;
}
