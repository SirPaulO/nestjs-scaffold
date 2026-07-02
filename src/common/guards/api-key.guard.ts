import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'crypto';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);
  private readonly validKeyHashes: Buffer[];

  constructor(private readonly configService: ConfigService) {
    const raw = this.configService.get<string>('SYSTEM_API_KEYS') ?? '';
    this.validKeyHashes = raw
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
      .map((key) => this.hash(key));

    if (this.validKeyHashes.length === 0) {
      this.logger.warn(
        'SYSTEM_API_KEYS is not configured — all requests to guarded endpoints will be denied',
      );
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'];

    if (typeof apiKey === 'string' && this.isValidKey(apiKey)) {
      return true;
    }

    throw new UnauthorizedException('Invalid or missing API key');
  }

  /**
   * Constant-time membership check.
   *
   * Both sides are hashed to a fixed-length SHA-256 digest first so
   * `timingSafeEqual` never throws on a length mismatch (a raw comparison of
   * variable-length strings/buffers would). Every configured key is compared
   * — the loop never short-circuits — so total execution time doesn't leak
   * whether a candidate is close to a match or which key it is.
   */
  private isValidKey(candidate: string): boolean {
    const candidateHash = this.hash(candidate);
    let matched = false;

    for (const validHash of this.validKeyHashes) {
      if (timingSafeEqual(candidateHash, validHash)) {
        matched = true;
      }
    }

    return matched;
  }

  private hash(value: string): Buffer {
    return createHash('sha256').update(value).digest();
  }
}
