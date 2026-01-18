import { Type } from 'class-transformer';
import { IsArray, IsInt, IsString, Min, ValidateNested } from 'class-validator';

export class CartItemUpdateDto {
  @IsString()
  variantId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class UpsertCartItemsDto {
  @IsString()
  cartId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemUpdateDto)
  items: CartItemUpdateDto[];
}
