import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutConfirmDto } from './dto/checkout-confirm.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('storefront/checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  confirm(@Body() dto: CheckoutConfirmDto) {
    return this.checkoutService.confirmCheckout(dto);
  }
}
