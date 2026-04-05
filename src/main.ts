import { NestFactory } from '@nestjs/core';
import { ValidationPipe, HttpStatus } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@common/filters';

async function bootstrap(): Promise<void> {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger: isDevelopment
      ? ['log', 'error', 'warn', 'debug', 'verbose']
      : ['log', 'error', 'warn'],
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

  app.enableCors({ origin: corsOrigins, credentials: true });

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
    .addServer('http://localhost:3000', 'Local Development')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

bootstrap().catch((error: unknown) => {
  console.error('Application failed to start:', error);
  process.exit(1);
});
