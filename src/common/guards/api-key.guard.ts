import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);
  private readonly validKeys: string[];

  constructor(private readonly configService: ConfigService) {
    const raw = this.configService.get<string>('SYSTEM_API_KEYS') ?? '';
    this.validKeys = raw
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    if (this.validKeys.length === 0) {
      this.logger.warn(
        'SYSTEM_API_KEYS is not configured — all requests to guarded endpoints will be denied',
      );
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'];
    if (typeof apiKey === 'string' && this.validKeys.includes(apiKey)) {
      return true;
    }
    throw new UnauthorizedException('Invalid or missing API key');
  }
}
