import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, {
    message: 'name must be at least 3 characters long',
  })
  @MaxLength(20, {
    message: 'name must be at most 20 characters long',
  })
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
