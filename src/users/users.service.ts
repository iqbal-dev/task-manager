import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HashingService } from '../common/hashing/hashing.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from './entities/user.entity.js';

const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly hashingService: HashingService,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    await this.assertEmailAvailable(dto.email);
    const user = this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      password: await this.hashingService.hash(dto.password),
    });
    return this.persist(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    const { password, ...changes } = dto;
    if (changes.email && changes.email !== user.email) {
      await this.assertEmailAvailable(changes.email);
    }
    Object.assign(user, changes);
    if (password) user.password = await this.hashingService.hash(password);
    return this.persist(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { createdAt: 'ASC' } });
  }

  /** Throws NotFoundException when the user does not exist. */
  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  /** Returns null when no user has this email; never throws for "not found". */
  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  /** Returns the user when the credentials are valid, otherwise null. */
  async validateCredentials(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) return null;
    const matches = await this.hashingService.compare(password, user.password);
    return matches ? user : null;
  }

  private async assertEmailAvailable(email: string): Promise<void> {
    if (await this.findByEmail(email)) {
      throw new ConflictException(`User with email ${email} already exists`);
    }
  }

  // The pre-check above is racy; the unique index is the real guarantee.
  private async persist(user: User): Promise<User> {
    try {
      return await this.usersRepository.save(user);
    } catch (error) {
      const code =
        (error as { code?: string }).code ??
        (error as { driverError?: { code?: string } }).driverError?.code;
      if (code === PG_UNIQUE_VIOLATION) {
        throw new ConflictException(
          `User with email ${user.email} already exists`,
        );
      }
      throw error;
    }
  }
}
