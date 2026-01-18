import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  addressJson?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}
