import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';

@Injectable()
export class UsersService {
  private readonly users = [
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
  create(user: CreateUserDto): CreateUserDto {
    const newUser = {
      id: this.users.length + 1,
      name: user.name,
      email: user.email,
      password: user.password,
    };
    const existingUser = this.findByEmail(newUser.email);
    if (existingUser) {
      throw new ConflictException(
        `User with email ${newUser.email} already exists`,
      );
    }
    this.users.push(newUser);
    return newUser;
  }
  findOne(id: number): CreateUserDto {
    const user = this.users.find((user) => user.id === id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  findOneByEmail(email: string): CreateUserDto {
    const user = this.users.find((user) => user.email === email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }
  findByEmail(email: string): CreateUserDto | undefined {
    const user = this.users.find((user) => user.email === email);
    return user;
  }
  findAll(): CreateUserDto[] {
    return this.users;
  }
}
