import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import type { AttributeType } from '../entities/attribute-definition.entity';

export class CreateAttributeOptionDto {
  @IsString()
  value: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class CreateAttributeDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsString()
  @IsIn(['text', 'number', 'boolean', 'date', 'select', 'multiselect'])
  type: AttributeType;

  @IsOptional()
  @IsBoolean()
  isVariantAxis?: boolean;

  @IsOptional()
  @IsBoolean()
  isFilterable?: boolean;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAttributeOptionDto)
  options?: CreateAttributeOptionDto[];
}
