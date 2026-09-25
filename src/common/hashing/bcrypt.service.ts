import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { HashingService } from './hashing.service.js';
@Injectable()
export class BcryptService implements HashingService {
  async hash(data: string) {
    return bcrypt.hash(data, 10);
  }
  async compare(data: string, encrypted: string) {
    return bcrypt.compare(data, encrypted);
  }
}
