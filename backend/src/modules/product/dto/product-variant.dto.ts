import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ProductVariantDto {
  @IsString()
  size: string;

  @IsString()
  color: string;

  @IsOptional()
  @IsString()
  colorHex?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock: number;

  @IsOptional()
  @IsString()
  sku?: string;
}
