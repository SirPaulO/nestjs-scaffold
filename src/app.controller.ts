import { Controller, Get } from '@nestjs/common';
import { Public } from '@common/decorators';

@Controller()
export class AppController {
  /**
   * Liveness/readiness probe. Intentionally the only unauthenticated route
   * in the app — everything else denies by default (global JwtAuthGuard).
   * Used by the Docker HEALTHCHECK and orchestrator health probes.
   */
  @Public()
  @Get('health')
  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}
