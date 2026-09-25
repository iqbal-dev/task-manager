import { Module } from '@nestjs/common';
import { HashingModule } from '../common/hashing/hashing.module.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [HashingModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
