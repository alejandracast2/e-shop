import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  roleName?: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
