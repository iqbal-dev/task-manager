import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../roles/decorators/require-permissions.decorator.js';
import { hasPermission, Permission } from '../roles/permission.enum.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from './entities/user.entity.js';
import { UsersService } from './users.service.js';

/** Users may always act on their own account; anyone else's needs `permission`. */
function assertSelfOr(caller: User, id: string, permission: Permission) {
  if (caller.id !== id && !hasPermission(caller, permission)) {
    throw new ForbiddenException('Insufficient permissions');
  }
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Self-service sign-up is POST /auth/register; this is for admins.
  @Post()
  @RequirePermissions(Permission.UsersWrite)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @RequirePermissions(Permission.UsersRead)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    assertSelfOr(user, id, Permission.UsersRead);
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    assertSelfOr(user, id, Permission.UsersWrite);
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    assertSelfOr(user, id, Permission.UsersDelete);
    return this.usersService.remove(id);
  }
}
