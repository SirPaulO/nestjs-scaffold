import { config as loadEnv } from 'dotenv';
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from '../database/strategies/snake-naming.strategy';

loadEnv();

interface DatabaseCredentials {
  username: string;
  password: string;
  database: string;
}

function resolveDatabaseCredentials(): DatabaseCredentials {
  const username = process.env.DATABASE_USERNAME;
  const password = process.env.DATABASE_PASSWORD;
  const database = process.env.DATABASE_NAME;

  if (!username || !password || !database) {
    throw new Error(
      'DATABASE_USERNAME, DATABASE_PASSWORD and DATABASE_NAME must all be set. ' +
        'Refusing to start with insecure default database credentials.',
    );
  }

  return { username, password, database };
}

type PostgresSslOption = boolean | { rejectUnauthorized: boolean; ca?: string };

function resolveSsl(): PostgresSslOption {
  if (process.env.DATABASE_SSL !== 'true') {
    return false;
  }

  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'false') {
    return { rejectUnauthorized: false };
  }

  return {
    rejectUnauthorized: true,
    ca: process.env.DATABASE_SSL_CA,
  };
}

export const databaseConfig = registerAs(
  'database',
  (): TypeOrmModuleOptions => {
    const { username, password, database } = resolveDatabaseCredentials();

    return {
      type: 'postgres',
      host: process.env.DATABASE_HOST ?? 'localhost',
      port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
      username,
      password,
      database,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
      synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
      logging:
        process.env.NODE_ENV === 'development' ? ['error', 'warn'] : false,
      ssl: resolveSsl(),
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
    };
  },
);

function buildDataSourceOptions(): DataSourceOptions {
  const { username, password, database } = resolveDatabaseCredentials();

  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    username,
    password,
    database,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    synchronize: false,
    logging: false,
    ssl: resolveSsl(),
    namingStrategy: new SnakeNamingStrategy(),
  };
}

export const dataSource = new DataSource(buildDataSourceOptions());
