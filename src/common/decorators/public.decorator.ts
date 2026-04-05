import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as public — skips JWT authentication.
 * Requires the JwtAuthGuard to check for this metadata.
 * @example
 * @Public()
 * @Post('login')
 * login(@Body() dto: LoginDto) {}
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
