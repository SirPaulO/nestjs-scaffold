/**
 * Response returned after a successful login.
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}
