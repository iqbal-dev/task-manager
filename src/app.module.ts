import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { LoggerMiddleware } from './common/logger/logger.middleware.js';
import { loggerProviders } from './common/logger/logger.provider.js';
import { TasksModule } from './tasks/tasks.module.js';

@Module({
  imports: [TasksModule],
  controllers: [AppController],
  providers: [AppService, ...loggerProviders],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('tasks');
  }
}
