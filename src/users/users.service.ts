import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HashingService } from '../common/hashing/hashing.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { SafeUser, User } from './interfaces/user.interface.js';

@Injectable()
export class UsersService {
  constructor(private readonly hashingService: HashingService) {}
  private readonly users: User[] = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: '',
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      password: '',
    },
  ];
  async create(user: CreateUserDto): Promise<SafeUser> {
    const newUser: User = {
      id: this.users.length + 1,
      name: user.name,
      email: user.email,
      password: await this.hashingService.hash(user.password),
    };
    const existingUser = this.findByEmail(newUser.email);
    if (existingUser) {
      throw new ConflictException(
        `User with email ${newUser.email} already exists`,
      );
    }
    this.users.push(newUser);
    const { password: _password, ...safeUser } = newUser;
    return safeUser;
  }
  async update(id: number, user: Partial<CreateUserDto>): Promise<SafeUser> {
    const existingUser = this.users.find((user) => user.id === id);
    if (!existingUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    const updatedUser: User = {
      ...existingUser,
      ...user,
      password: user.password
        ? await this.hashingService.hash(user.password)
        : existingUser.password,
    };
    const index = this.users.findIndex((user) => user.id === id);
    this.users[index] = updatedUser;
    const { password: _password, ...safeUser } = updatedUser;
    return safeUser;
  }
  findOne(id: number): SafeUser {
    const user = this.users.find((user) => user.id === id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }

  findOneByEmail(email: string): SafeUser {
    const user = this.users.find((user) => user.email === email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }
  findByEmail(email: string): User | undefined {
    const user = this.users.find((user) => user.email === email);
    return user;
  }
  findAll(): SafeUser[] {
    return this.users.map(({ password: _password, ...safeUser }) => safeUser);
  }
}
