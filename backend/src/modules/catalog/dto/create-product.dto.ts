import { Type } from 'class-transformer';
import {
  Allow,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import type { ProductStatus } from '../entities/product.entity';

export class ProductAttributeInputDto {
  @IsString()
  attributeDefinitionId: string;

  @IsOptional()
  @IsString()
  valueOptionId?: string;

  @IsOptional()
  @IsString()
  valueText?: string;

  @IsOptional()
  @IsNumber()
  valueNumber?: number;

  @IsOptional()
  @IsBoolean()
  valueBool?: boolean;

  @IsOptional()
  @IsDateString()
  valueDate?: string;
}

export class VariantAttributeInputDto {
  @IsString()
  attributeDefinitionId: string;

  @IsOptional()
  @IsString()
  valueOptionId?: string;

  @IsOptional()
  @IsString()
  valueText?: string;
}

export class CreateVariantDto {
  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsObject()
  dimensionsJson?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantAttributeInputDto)
  attributes?: VariantAttributeInputDto[];
}

export class ProductImageFileInputDto {
  @IsOptional()
  @IsString()
  id?: string;

  @Allow()
  tenantId?: unknown;

  @Allow()
  storeId?: unknown;

  @Allow()
  provider?: unknown;

  @Allow()
  path?: unknown;

  @IsOptional()
  @IsString()
  url?: string;

  @Allow()
  mimeType?: unknown;

  @Allow()
  sizeBytes?: unknown;

  @Allow()
  createdAt?: unknown;

  @Allow()
  updatedAt?: unknown;

  @Allow()
  deletedAt?: unknown;
}

export class ProductImageInputDto {
  @Allow()
  id?: unknown;

  @Allow()
  productId?: unknown;

  @IsOptional()
  @IsString()
  fileId?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProductImageFileInputDto)
  file?: ProductImageFileInputDto;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isCover?: boolean;

  @Allow()
  createdAt?: unknown;

  @Allow()
  updatedAt?: unknown;

  @Allow()
  deletedAt?: unknown;
}

export class CreateProductDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  status?: ProductStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  productTypeId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeInputDto)
  attributes?: ProductAttributeInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageInputDto)
  images?: ProductImageInputDto[];
}
