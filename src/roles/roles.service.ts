import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AppConfig } from '../config/configuration.js';
import { User } from '../users/entities/user.entity.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { Role } from './entities/role.entity.js';
import { ALL_PERMISSIONS } from './permission.enum.js';

const PG_UNIQUE_VIOLATION = '23505';

/** Always holds every permission; can't be edited or deleted. */
export const ADMIN_ROLE = 'admin';
/** Given to every new user; its permissions are editable, but it can't be renamed or deleted. */
export const DEFAULT_ROLE = 'user';
const SYSTEM_ROLES = [ADMIN_ROLE, DEFAULT_ROLE];

@Injectable()
export class RolesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  // Runs after migrations (or synchronize), so the tables exist.
  async onApplicationBootstrap(): Promise<void> {
    await this.seedSystemRoles();
    await this.promoteConfiguredAdmin();
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    await this.assertNameAvailable(dto.name);
    const role = this.rolesRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      permissions: dto.permissions,
    });
    return this.persist(role);
  }

  findAll(): Promise<Role[]> {
    return this.rolesRepository.find({ order: { name: 'ASC' } });
  }

  /** Throws NotFoundException when the role does not exist. */
  async findOne(id: string): Promise<Role> {
    const role = await this.rolesRepository.findOneBy({ id });
    if (!role) throw new NotFoundException(`Role with id ${id} not found`);
    return role;
  }

  /** Returns null when no role has this name; never throws for "not found". */
  findByName(name: string): Promise<Role | null> {
    return this.rolesRepository.findOneBy({ name });
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    if (role.name === ADMIN_ROLE) {
      throw new BadRequestException('The admin role cannot be changed');
    }
    if (dto.name && dto.name !== role.name) {
      if (SYSTEM_ROLES.includes(role.name)) {
        throw new BadRequestException(`Role ${role.name} cannot be renamed`);
      }
      await this.assertNameAvailable(dto.name);
    }
    Object.assign(role, dto);
    return this.persist(role);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    if (SYSTEM_ROLES.includes(role.name)) {
      throw new BadRequestException(`Role ${role.name} cannot be deleted`);
    }
    await this.rolesRepository.remove(role);
  }

  /** Idempotent: assigning a role the user already has is a no-op. */
  async assign(roleId: string, userId: string): Promise<void> {
    const [role, user] = await Promise.all([
      this.findOne(roleId),
      this.findUser(userId),
    ]);
    if (user.roles.some((r) => r.id === role.id)) return;
    user.roles.push(role);
    await this.usersRepository.save(user);
  }

  /** Idempotent, but refuses to remove the last admin (that would lock everyone out). */
  async unassign(roleId: string, userId: string): Promise<void> {
    const [role, user] = await Promise.all([
      this.findOne(roleId),
      this.findUser(userId),
    ]);
    if (!user.roles.some((r) => r.id === role.id)) return;
    if (role.name === ADMIN_ROLE) {
      const admins = await this.usersRepository.count({
        where: { roles: { id: role.id } },
      });
      if (admins <= 1) {
        throw new ConflictException('Cannot remove the last admin');
      }
    }
    user.roles = user.roles.filter((r) => r.id !== role.id);
    await this.usersRepository.save(user);
  }

  private async seedSystemRoles(): Promise<void> {
    // Re-applied every boot so new Permission values reach the admin role.
    await this.rolesRepository.upsert(
      {
        name: ADMIN_ROLE,
        description: 'Full access; permissions are managed in code',
        permissions: ALL_PERMISSIONS,
      },
      ['name'],
    );
    if (await this.findByName(DEFAULT_ROLE)) return;

    await this.rolesRepository
      .createQueryBuilder()
      .insert()
      .values({
        name: DEFAULT_ROLE,
        description: 'Default role for new users',
        permissions: [],
      })
      .orIgnore()
      .execute();
    // First boot with roles: accounts created before now get the default role.
    await this.rolesRepository.query(
      `INSERT INTO "user_roles" ("userId", "roleId")
       SELECT u.id, r.id FROM "users" u CROSS JOIN "roles" r WHERE r.name = $1
       ON CONFLICT DO NOTHING`,
      [DEFAULT_ROLE],
    );
    this.logger.log(`Created the "${DEFAULT_ROLE}" role`);
  }

  // Only promotes an account that already exists; it never creates one.
  private async promoteConfiguredAdmin(): Promise<void> {
    const email = this.config.get('adminEmail', { infer: true });
    if (!email) return;
    const [admin, user] = await Promise.all([
      this.findByName(ADMIN_ROLE),
      this.usersRepository.findOneBy({ email: email.toLowerCase() }),
    ]);
    if (!admin) return;
    if (!user) {
      this.logger.warn(
        `ADMIN_EMAIL ${email} has no account yet; register it and restart`,
      );
      return;
    }
    if (user.roles.some((r) => r.id === admin.id)) return;
    user.roles.push(admin);
    await this.usersRepository.save(user);
    this.logger.log(`Granted the "${ADMIN_ROLE}" role to ${email}`);
  }

  private async findUser(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  private async assertNameAvailable(name: string): Promise<void> {
    if (await this.findByName(name)) {
      throw new ConflictException(`Role ${name} already exists`);
    }
  }

  // The pre-check above is racy; the unique index is the real guarantee.
  private async persist(role: Role): Promise<Role> {
    try {
      return await this.rolesRepository.save(role);
    } catch (error) {
      const code =
        (error as { code?: string }).code ??
        (error as { driverError?: { code?: string } }).driverError?.code;
      if (code === PG_UNIQUE_VIOLATION) {
        throw new ConflictException(`Role ${role.name} already exists`);
      }
      throw error;
    }
  }
}
