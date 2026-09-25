import type { Provider } from '@nestjs/common';

export const APP_CONFIG = 'APP_CONFIG';
export const LOGGER = 'LOGGER';

export interface AppConfig {
  appName: string;
}

export interface AppLogger {
  log(message: string): void;
}

export const createLoggerProviders = (config: AppConfig): Provider[] => [
  // value provider: the options passed to LoggerModule.forRoot()
  { provide: APP_CONFIG, useValue: config },
  // factory provider: built at startup, with APP_CONFIG injected into the factory
  {
    provide: LOGGER,
    useFactory: (config: AppConfig): AppLogger => ({
      log: (message) =>
        console.log(`[${config.appName}] ${new Date().toISOString()} ${message}`),
    }),
    inject: [APP_CONFIG],
  },
];
