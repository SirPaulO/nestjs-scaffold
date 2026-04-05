import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig, cacheConfig } from './config';
import { CacheModule } from './modules/cache/cache.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, cacheConfig],
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (db: ReturnType<typeof databaseConfig>) => db,
    }),
    CacheModule,
    AuthModule,
    // Add feature modules here
  ],
})
export class AppModule {}
