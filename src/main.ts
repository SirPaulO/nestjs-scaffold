// instrument.ts MUST be first — initialises Sentry/OpenTelemetry before NestJS loads any modules
import './instrument';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, HttpStatus, INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@common/filters';

function setupCors(app: INestApplication): void {
  const corsOrigins =
    process.env.CORS_ORIGIN?.split(',').map((o) => {
      const trimmed = o.trim();
      if (trimmed.includes('*')) {
        const escaped = trimmed
          .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
          .replace(/\*/g, '.*');
        return new RegExp(`^${escaped}$`);
      }
      return trimmed;
    }) ?? '*';

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });
}

function setupDoc(app: INestApplication): void {
  const isDocsEnabled = process.env.ENABLE_DOCS === 'true';
  if (!isDocsEnabled) {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API description')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT access token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey({ type: 'apiKey', in: 'header', name: 'X-Api-Key' }, 'api-key')
    .addServer(
      `http://localhost:${process.env.PORT ?? 3000}`,
      'Local Development',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}

async function bootstrap(): Promise<void> {
  const logLevel = (process.env.LOG_LEVEL ?? 'log').toLowerCase();
  const logLevelMap: Record<string, string[]> = {
    verbose: ['log', 'error', 'warn', 'debug', 'verbose'],
    debug: ['log', 'error', 'warn', 'debug'],
    log: ['log', 'error', 'warn'],
    warn: ['error', 'warn'],
    error: ['error'],
  };
  const logLevels = (logLevelMap[logLevel] ??
    logLevelMap['log']) as import('@nestjs/common').LogLevel[];

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger: logLevels,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  setupCors(app);
  setupDoc(app);

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  process.stdout.write(
    `Application is running on: http://localhost:${process.env.PORT ?? 3000}\n`,
  );
}

bootstrap().catch((error: unknown) => {
  process.stderr.write(`Application failed to start: ${String(error)}\n`);
  process.exit(1);
});
