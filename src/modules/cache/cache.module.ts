import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import redisStore from 'cache-manager-ioredis-yet';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: redisStore as unknown,
        host: configService.get<string>('cache.host'),
        port: configService.get<number>('cache.port'),
        username: configService.get<string>('cache.username'),
        password: configService.get<string>('cache.password'),
        db: configService.get<number>('cache.db'),
      }),
    }) as never,
  ],
  providers: [CacheService],
  exports: [CacheService, NestCacheModule],
})
export class CacheModule {}
