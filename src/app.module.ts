import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { LoggerMiddleware } from './common/logger/logger.middleware.js';
import { LoggerModule } from './common/logger/logger.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [TasksModule, LoggerModule.forRoot({ appName: 'task-manager' }), AuthModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('tasks');
  }
}
