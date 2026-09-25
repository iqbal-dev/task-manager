import { DynamicModule, Module } from '@nestjs/common';
import { APP_CONFIG, LOGGER, createLoggerProviders } from './logger.provider.js';
import type { AppConfig } from './logger.provider.js';

@Module({})
export class LoggerModule {
  static forRoot(config: AppConfig): DynamicModule {
    return {
      module: LoggerModule,
      providers: createLoggerProviders(config),
      exports: [APP_CONFIG, LOGGER],
    };
  }
}
