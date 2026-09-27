import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from './decorators/require-permissions.decorator.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { ALL_PERMISSIONS, Permission } from './permission.enum.js';
import { RolesService } from './roles.service.js';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // Declared before ':id' so "permissions" isn't parsed as a uuid.
  @Get('permissions')
  @RequirePermissions(Permission.RolesRead)
  listPermissions() {
    return ALL_PERMISSIONS;
  }

  @Post()
  @RequirePermissions(Permission.RolesManage)
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Get()
  @RequirePermissions(Permission.RolesRead)
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermissions(Permission.RolesRead)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.RolesManage)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.RolesManage)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.remove(id);
  }

  @Put(':id/users/:userId')
  @RequirePermissions(Permission.RolesManage)
  @HttpCode(HttpStatus.NO_CONTENT)
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.rolesService.assign(id, userId);
  }

  @Delete(':id/users/:userId')
  @RequirePermissions(Permission.RolesManage)
  @HttpCode(HttpStatus.NO_CONTENT)
  unassign(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.rolesService.unassign(id, userId);
  }
}
