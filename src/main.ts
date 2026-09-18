import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/http-exception/http-exception.filter.js';
import { LoggingInterceptor } from './common/logging/logging.interceptor.js';
import { TransformInterceptor } from './common/transform/transform.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO-te thakena emon field strip kore dey
      forbidNonWhitelisted: true, // extra field pathale error dey
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalInterceptors(new TransformInterceptor());
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
