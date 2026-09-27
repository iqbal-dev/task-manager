import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { Permission } from '../permission.enum.js';

export class CreateRoleDto {
  @ApiProperty({ example: 'moderator', maxLength: 50 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[a-z0-9_-]+$/, {
    message: 'name may only contain a-z, 0-9, "_" and "-"',
  })
  name: string;

  @ApiPropertyOptional({ example: 'Can read all users', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ enum: Permission, isArray: true, example: ['users:read'] })
  @IsArray()
  @ArrayUnique()
  @IsEnum(Permission, { each: true })
  permissions: Permission[];
}
