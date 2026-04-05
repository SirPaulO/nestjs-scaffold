import {
  Controller,
  Post,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Public } from '@common/decorators';
import { AuthTokens } from './interfaces';

class LoginDto {
  email!: string;
  password!: string;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Email / password login.
   * The local strategy validates credentials; on success Passport populates req.user.
   */
  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  async login(
    @Request() req: { user: { id: string; email: string; roles: string[] } },
  ): Promise<AuthTokens> {
    return this.authService.login(req.user.id, req.user.email, req.user.roles);
  }
}
