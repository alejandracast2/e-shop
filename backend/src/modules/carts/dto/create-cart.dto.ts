import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class CartItemInputDto {
  @IsString()
  variantId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateCartDto {
  @IsOptional()
  @IsString()
  cartId?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemInputDto)
  items?: CartItemInputDto[];
}
