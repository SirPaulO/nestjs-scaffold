import { config as loadEnv } from 'dotenv';
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from '../database/strategies/snake-naming.strategy';

// The TypeORM CLI (migration:generate/run) bootstraps this file directly,
// outside Nest's ConfigModule, so load `.env` here for the CLI DataSource.
loadEnv();

/**
 * Database configuration for TypeORM
 * Supports connection pooling, migrations, and snake_case naming strategy
 */
export const databaseConfig = registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    username: process.env.DATABASE_USERNAME ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? 'postgres',
    database: process.env.DATABASE_NAME ?? 'backend',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
    logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : false,
    ssl:
      process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,
    namingStrategy: new SnakeNamingStrategy(),
    extra: {
      max: parseInt(process.env.DATABASE_POOL_MAX ?? '20', 10),
      min: parseInt(process.env.DATABASE_POOL_MIN ?? '5', 10),
      idleTimeoutMillis: parseInt(
        process.env.DATABASE_IDLE_TIMEOUT ?? '30000',
        10,
      ),
      connectionTimeoutMillis: parseInt(
        process.env.DATABASE_CONNECTION_TIMEOUT ?? '2000',
        10,
      ),
    },
  }),
);

/**
 * DataSource configuration for TypeORM CLI (migrations)
 */
const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  username: process.env.DATABASE_USERNAME ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? 'postgres',
  database: process.env.DATABASE_NAME ?? 'backend',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: false,
  namingStrategy: new SnakeNamingStrategy(),
};

export const dataSource = new DataSource(dataSourceOptions);
