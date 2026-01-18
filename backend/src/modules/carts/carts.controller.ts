import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CartsService } from './carts.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpsertCartItemsDto } from './dto/upsert-cart-items.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('storefront/cart')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Post()
  createCart(@Body() dto: CreateCartDto) {
    return this.cartsService.createCart(dto);
  }

  @Get(':id')
  getCart(@Param('id') id: string) {
    return this.cartsService.getCart(id);
  }

  @Post('items')
  upsertItems(@Body() dto: UpsertCartItemsDto) {
    return this.cartsService.upsertItems(dto);
  }

  @Patch('items/:id')
  updateItem(@Param('id') id: string, @Body() dto: UpdateCartItemDto) {
    return this.cartsService.updateCartItem(id, dto.quantity);
  }
}
