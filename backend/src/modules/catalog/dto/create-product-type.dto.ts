import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CreateProductTypeAttributeDto {
  @IsString()
  attributeDefinitionId: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  isVariantAxis?: boolean;
}

export class CreateProductTypeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductTypeAttributeDto)
  attributes?: CreateProductTypeAttributeDto[];
}
