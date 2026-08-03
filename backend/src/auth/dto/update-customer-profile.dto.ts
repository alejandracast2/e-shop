import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCustomerProfileDto {
  @IsDateString()
  birthDate: string;

  @IsString()
  @MinLength(5)
  documentId: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
