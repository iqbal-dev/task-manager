import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { APP_CONFIG, type AppConfig } from './logger.provider.js';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(@Inject(APP_CONFIG) private readonly logger: AppConfig) {}

  use(req: Request, res: Response, next: NextFunction) {
    console.log(
      `[${this.logger.appName}] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`,
    );
    next();
  }
}
