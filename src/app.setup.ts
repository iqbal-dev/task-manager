import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import type { AppConfig } from './config/configuration.js';

/**
 * Everything that shapes HTTP behaviour lives here so that main.ts and the
 * e2e tests boot the exact same application.
 */
export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService<AppConfig, true>);
  const docsEnabled = config.get('nodeEnv', { infer: true }) !== 'production';

  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  // Swagger UI needs inline scripts, so CSP is only relaxed when docs are on.
  app.use(helmet(docsEnabled ? { contentSecurityPolicy: false } : undefined));
  const origin = config.get('corsOrigin', { infer: true });
  app.enableCors({
    origin: origin === '*' ? true : origin.split(',').map((o) => o.trim()),
  });

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips fields that are not on the DTO
      forbidNonWhitelisted: true, // rejects requests carrying extra fields
      transform: true, // runs @Transform and converts payloads to DTO instances
    }),
  );
  // Response path runs in reverse: serialize (strip @Exclude) -> wrap -> log.
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  if (docsEnabled) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Task Manager API')
        .setDescription('Users, authentication and per-user tasks')
        .setVersion('1.0')
        .addBearerAuth()
        .build(),
    );
    SwaggerModule.setup('docs', app, document);
  }
}
