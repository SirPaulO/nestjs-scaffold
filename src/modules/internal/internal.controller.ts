import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '@common/guards';

@ApiTags('Internal')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('internal')
export class InternalController {
  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Internal health check (requires X-Api-Key header)' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 401, description: 'Invalid or missing X-Api-Key header' })
  health(): { status: string } {
    return { status: 'ok' };
  }
}
