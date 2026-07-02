import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '@common/guards';
import { Public } from '@common/decorators';

// Internal (service-to-service) routes authenticate via X-Api-Key, not a
// user JWT, so they opt out of the global JwtAuthGuard — ApiKeyGuard below
// still fully guards every route on this controller.
@Public()
@ApiTags('Internal')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('internal')
export class InternalController {
  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Internal health check (requires X-Api-Key header)',
  })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({
    status: 401,
    description: 'Invalid or missing X-Api-Key header',
  })
  health(): { status: string } {
    return { status: 'ok' };
  }
}
