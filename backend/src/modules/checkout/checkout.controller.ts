import { Body, Controller, Post } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutConfirmDto } from './dto/checkout-confirm.dto';

@Controller('storefront/checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('confirm')
  confirm(@Body() dto: CheckoutConfirmDto) {
    return this.checkoutService.confirmCheckout(dto);
  }
}
