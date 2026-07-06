export interface JwtPayload {
  sub: string;
  roles?: string[];
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}
