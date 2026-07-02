import { config as loadEnv } from 'dotenv';
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from '../database/strategies/snake-naming.strategy';

// The TypeORM CLI (migration:generate/run) bootstraps this file directly,
// outside Nest's ConfigModule, so load `.env` here for the CLI DataSource.
loadEnv();

interface DatabaseCredentials {
  username: string;
  password: string;
  database: string;
}

/**
 * Resolves the required database credentials from the environment.
 *
 * Fails CLOSED: there is deliberately no `?? 'postgres'` / `?? 'backend'`
 * fallback. A clone that forgets to set these would otherwise silently
 * connect with well-known default credentials — refuse to boot instead.
 */
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

/**
 * Resolves TLS options for the Postgres connection.
 *
 * `DATABASE_SSL=true` no longer implies `rejectUnauthorized: false` — that
 * disabled certificate verification entirely, defeating the point of TLS
 * (silently accepts any certificate, including a MITM's). The secure default
 * is full verification; operators can supply a custom CA bundle via
 * `DATABASE_SSL_CA`, or explicitly opt out with
 * `DATABASE_SSL_REJECT_UNAUTHORIZED=false` when they understand the risk
 * (e.g. connecting to a managed DB over a private network with a
 * self-signed cert and no CA available).
 */
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

/**
 * Database configuration for TypeORM
 * Supports connection pooling, migrations, and snake_case naming strategy
 */
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

/**
 * DataSource configuration for TypeORM CLI (migrations)
 */
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
