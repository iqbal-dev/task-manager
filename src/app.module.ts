import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { LoggerMiddleware } from './common/logger/logger.middleware.js';
import { LoggerModule } from './common/logger/logger.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { UsersModule } from './users/users.module.js';
import { HashingModule } from './common/hashing/hashing.module.js';

@Module({
  imports: [
    TasksModule,
    LoggerModule.forRoot({ appName: 'task-manager' }),
    AuthModule,
    UsersModule,
    HashingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('tasks');
  }
}
