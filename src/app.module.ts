import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { databaseConfig, cacheConfig, rateLimitConfig } from './config';
import { CacheModule } from './modules/cache/cache.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards';
import { InternalModule } from './modules/internal/internal.module';
import { AppController } from './app.controller';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    // Global guards run in declaration order and must ALL pass.
    // Rate-limit first (applies even to unauthenticated/invalid requests,
    // which is exactly what protects login/guessing endpoints), then deny
    // every route by default unless it opts out with @Public().
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, cacheConfig, rateLimitConfig],
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (db: ReturnType<typeof databaseConfig>) => db,
    }),
    ThrottlerModule.forRootAsync({
      inject: [rateLimitConfig.KEY],
      useFactory: (rateLimit: ReturnType<typeof rateLimitConfig>) => ({
        throttlers: [{ ttl: rateLimit.ttl, limit: rateLimit.limit }],
      }),
    }),
    CacheModule,
    AuthModule,
    InternalModule,
    // Add feature modules here
  ],
  controllers: [AppController],
})
export class AppModule {}
