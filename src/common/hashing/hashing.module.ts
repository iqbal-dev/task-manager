import { Module } from '@nestjs/common';
import { BcryptService } from './bcrypt.service.js';
import { HashingService } from './hashing.service.js';
@Module({
  providers: [{ provide: HashingService, useClass: BcryptService }],
  exports: [HashingService],
})
export class HashingModule {}
